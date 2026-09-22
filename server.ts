import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ConfirmedPurchase {
  id: string;
  email: string;
  productType: 'diagnostic_67' | 'succession_97';
  productName: string;
  status: string;
  amount?: number;
  customerName?: string;
  receivedAt: string;
  rawPayload?: any;
}

// In-memory store and optional file cache for confirmed purchases
const purchasesStore: Map<string, ConfirmedPurchase> = new Map();
const DATA_DIR = path.join(__dirname, 'data');
const PURCHASES_FILE = path.join(DATA_DIR, 'confirmed_purchases.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(PURCHASES_FILE)) {
    const raw = fs.readFileSync(PURCHASES_FILE, 'utf-8');
    const list: ConfirmedPurchase[] = JSON.parse(raw);
    for (const item of list) {
      if (item.email) purchasesStore.set(item.email.toLowerCase().trim(), item);
      if (item.id) purchasesStore.set(item.id, item);
    }
  }
} catch (e) {
  console.warn('[FEX Guru Server] Storage init note:', e);
}

function persistPurchases() {
  try {
    const unique = Array.from(new Set(purchasesStore.values()));
    fs.writeFileSync(PURCHASES_FILE, JSON.stringify(unique, null, 2), 'utf-8');
  } catch (err) {
    console.error('[FEX Guru Server] Error saving purchases file:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support both JSON and URL-encoded webhooks from Digital Manager Guru
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  /**
   * Endpoint /api/check-purchase
   * Proxies calls to the official n8n confirmation webhook:
   * https://n8n.fexeducacao.com/webhook/j2gYOp1tOyw0ZhOn-low-ticket-b2b-aprovado-redirecionamento?email=...&pedido=...
   * Handles CORS, prevents browser blocks and unifies responses.
   */
  app.get('/api/check-purchase', async (req: Request, res: Response) => {
    const email = (req.query.email as string || '').toLowerCase().trim();
    const pedido = (req.query.pedido as string || req.query.order_id as string || '').trim();

    if (!email && !pedido) {
      return res.status(400).json({ 
        success: false, 
        message: 'E-mail ou código do pedido é obrigatório para consulta.' 
      });
    }

    try {
      const queryParams = new URLSearchParams();
      if (email) queryParams.set('email', email);
      if (pedido) queryParams.set('pedido', pedido);

      const n8nWebhookUrl = `https://n8n.fexeducacao.com/webhook/j2gYOp1tOyw0ZhOn-low-ticket-b2b-aprovado-redirecionamento?${queryParams.toString()}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(n8nWebhookUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      let parsedData: any = null;
      try {
        parsedData = text && text.trim() ? JSON.parse(text) : null;
      } catch {
        parsedData = { raw: text };
      }

      // If n8n returned a confirmed payload
      if (parsedData && (parsedData.sucesso === true || parsedData.success === true || parsedData.podutos || parsedData.produtos)) {
        return res.json({
          success: true,
          email,
          orderId: pedido,
          data: parsedData
        });
      }

      // Fallback check against local purchase cache (e.g. Guru direct webhook)
      let localRecord: ConfirmedPurchase | undefined;
      if (email && purchasesStore.has(email)) {
        localRecord = purchasesStore.get(email);
      } else if (pedido && purchasesStore.has(pedido)) {
        localRecord = purchasesStore.get(pedido);
      }

      if (localRecord) {
        return res.json({
          success: true,
          email: localRecord.email,
          orderId: localRecord.id,
          data: {
            sucesso: true,
            podutos: localRecord.productType === 'succession_97' 
              ? 'Diagnóstico de Custo Pessoa Corporativo + Mini Curso,ORDER BUMP'
              : 'Diagnóstico de Custo Pessoa Corporativo + Mini Curso'
          }
        });
      }

      // Not yet confirmed (awaiting payment approval)
      return res.json({
        success: false,
        pending: true,
        email,
        orderId: pedido,
        message: 'Ainda não identificamos a confirmação deste pagamento.',
        data: parsedData
      });
    } catch (err: any) {
      console.error('[API check-purchase] Erro ao consultar confirmação:', err?.message);
      return res.status(500).json({
        success: false,
        error: true,
        message: 'Falha de comunicação temporária com a API de confirmação.',
        details: err?.message
      });
    }
  });

  /**
   * Official Digital Manager Guru Webhook / Postback Endpoint
   * URL to configure in Guru Webhooks (Vendas Aprovadas):
   * https://[SEU_DOMINIO]/api/webhook/guru
   */
  app.post('/api/webhook/guru', (req: Request, res: Response) => {
    try {
      const payload = req.body || {};
      console.log('[FEX Guru Webhook] Received payload:', JSON.stringify(payload).slice(0, 300));

      // Extract transaction status
      const rawStatus = (
        payload.status ||
        payload.transaction_status ||
        payload.payment_status ||
        payload.situacao ||
        payload.event ||
        ''
      ).toString().toLowerCase().trim();

      const isApproved = [
        'approved',
        'aprovada',
        'aprovado',
        'paid',
        'paga',
        'pago',
        'completed',
        'concluida',
        'concluido',
        'active',
        'sale_approved'
      ].some(term => rawStatus.includes(term));

      if (!isApproved && rawStatus) {
        console.log(`[FEX Guru Webhook] Ignored non-approved status: ${rawStatus}`);
        return res.status(200).json({ received: true, ignoredStatus: rawStatus });
      }

      // Extract buyer email
      const email = (
        payload.email ||
        payload.customer?.email ||
        payload.contact?.email ||
        payload.client?.email ||
        payload.buyer?.email ||
        payload.payer?.email ||
        ''
      ).toString().toLowerCase().trim();

      // Extract customer name
      const customerName = (
        payload.name ||
        payload.customer?.name ||
        payload.contact?.name ||
        payload.client?.name ||
        ''
      ).toString().trim();

      // Extract transaction or order ID
      const txId = (
        payload.id ||
        payload.transaction_id ||
        payload.order_id ||
        payload.pedido_id ||
        `guru_tx_${Date.now()}`
      ).toString().trim();

      // Extract product details to differentiate R$ 67 vs R$ 97
      const productInfo = [
        payload.product?.name,
        payload.product?.slug,
        payload.product_name,
        payload.product_slug,
        payload.item_name,
        payload.slug,
        payload.offer?.name,
        payload.name
      ].filter(Boolean).join(' ').toLowerCase();

      const rawAmount = parseFloat(
        payload.total ||
        payload.amount ||
        payload.price ||
        payload.product?.price ||
        payload.total_amount ||
        '0'
      );

      // Determine product type:
      // R$ 97 (Plano de Sucessão) vs R$ 67 (Diagnóstico + Mini-Curso)
      let productType: 'diagnostic_67' | 'succession_97' = 'diagnostic_67';
      if (
        productInfo.includes('sucessao') ||
        productInfo.includes('plano') ||
        productInfo.includes('97') ||
        rawAmount >= 90
      ) {
        productType = 'succession_97';
      }

      const purchaseRecord: ConfirmedPurchase = {
        id: txId,
        email: email || `unknown_${txId}`,
        productType,
        productName: productType === 'succession_97' ? 'Plano de Sucessão Completo (R$ 97)' : 'Diagnóstico + Mini-Curso (R$ 67)',
        status: rawStatus || 'approved',
        amount: rawAmount,
        customerName,
        receivedAt: new Date().toISOString(),
        rawPayload: payload
      };

      if (email) {
        purchasesStore.set(email, purchaseRecord);
      }
      purchasesStore.set(txId, purchaseRecord);
      persistPurchases();

      console.log(`[FEX Guru Webhook] Confirmed ${productType} for ${email || txId}`);

      return res.status(200).json({
        success: true,
        transactionId: txId,
        productType,
        status: 'approved'
      });
    } catch (err: any) {
      console.error('[FEX Guru Webhook] Processing error:', err);
      return res.status(500).json({ error: 'Internal processing error', message: err?.message });
    }
  });

  /**
   * Endpoint to verify confirmed access via email or transaction ID
   * Called by the application frontend on load or return
   */
  app.get('/api/access/check', async (req: Request, res: Response) => {
    const email = (
      req.query.email as string || 
      req.query['e-mail'] as string ||
      req.query.customer_email as string ||
      req.query.buyer_email as string ||
      ''
    ).toLowerCase().trim();

    const txId = (
      req.query.transaction_id as string || 
      req.query.order_id as string || 
      req.query.pedido as string || 
      req.query.pedido_id as string || 
      req.query.id as string || 
      ''
    ).trim();

    let record: ConfirmedPurchase | undefined;
    if (email && purchasesStore.has(email)) {
      record = purchasesStore.get(email);
    } else if (txId && purchasesStore.has(txId)) {
      record = purchasesStore.get(txId);
    }

    if (record) {
      return res.json({
        hasAccess: true,
        productType: record.productType,
        productName: record.productName,
        status: record.status,
        customerName: record.customerName,
        email: record.email,
        transactionId: record.id
      });
    }

    // Fallback para n8n webhook se ainda não registrado no webhook local
    if (email || txId) {
      try {
        const queryParams = new URLSearchParams();
        if (email) queryParams.set('email', email);
        if (txId) queryParams.set('pedido', txId);

        const n8nWebhookUrl = `https://n8n.fexeducacao.com/webhook/j2gYOp1tOyw0ZhOn-low-ticket-b2b-aprovado-redirecionamento?${queryParams.toString()}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const response = await fetch(n8nWebhookUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const text = await response.text();
          let parsedData: any = null;
          try {
            parsedData = text && text.trim() ? JSON.parse(text) : null;
          } catch {
            parsedData = { raw: text };
          }

          if (parsedData && (parsedData.sucesso === true || parsedData.success === true || parsedData.podutos || parsedData.produtos)) {
            const rawProducts = (parsedData.podutos || parsedData.produtos || parsedData.products || '').toString().toLowerCase();
            const is97 = rawProducts.includes('sucessao') || rawProducts.includes('order bump') || rawProducts.includes('97');
            const productType = is97 ? 'succession_97' : 'diagnostic_67';
            
            const n8nRecord: ConfirmedPurchase = {
              id: txId || `n8n_${Date.now()}`,
              email: email || parsedData.email || '',
              productType,
              productName: productType === 'succession_97' ? 'Plano de Sucessão Completo (R$ 97)' : 'Diagnóstico + Mini-Curso (R$ 67)',
              status: 'approved',
              customerName: parsedData.nome || parsedData.customerName || '',
              receivedAt: new Date().toISOString(),
              rawPayload: parsedData
            };
            if (n8nRecord.email) purchasesStore.set(n8nRecord.email, n8nRecord);
            if (n8nRecord.id) purchasesStore.set(n8nRecord.id, n8nRecord);
            persistPurchases();

            return res.json({
              hasAccess: true,
              productType,
              productName: n8nRecord.productName,
              status: 'approved',
              customerName: n8nRecord.customerName,
              email: n8nRecord.email,
              transactionId: n8nRecord.id
            });
          }
        }
      } catch (e) {
        // Fallback silently
      }
    }

    return res.json({ hasAccess: false });
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FEX Education Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
