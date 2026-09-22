import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage & { query?: Record<string, string> }, res: ServerResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Parse URL query
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const email = (
    url.searchParams.get('email') ||
    url.searchParams.get('e-mail') ||
    url.searchParams.get('customer_email') ||
    url.searchParams.get('buyer_email') ||
    ''
  ).toLowerCase().trim();

  const txId = (
    url.searchParams.get('transaction_id') ||
    url.searchParams.get('order_id') ||
    url.searchParams.get('pedido') ||
    url.searchParams.get('pedido_id') ||
    url.searchParams.get('id') ||
    ''
  ).trim();

  if (!email && !txId) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ hasAccess: false }));
    return;
  }

  try {
    const queryParams = new URLSearchParams();
    if (email) queryParams.set('email', email);
    if (txId) queryParams.set('pedido', txId);

    const n8nWebhookUrl = `https://n8n.fexeducacao.com/webhook/j2gYOp1tOyw0ZhOn-low-ticket-b2b-aprovado-redirecionamento?${queryParams.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

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

    if (parsedData && (parsedData.sucesso === true || parsedData.success === true || parsedData.podutos || parsedData.produtos)) {
      const rawProducts = (parsedData.podutos || parsedData.produtos || parsedData.products || '').toString().toLowerCase();
      const is97 = rawProducts.includes('sucessao') || rawProducts.includes('order bump') || rawProducts.includes('97');
      const productType = is97 ? 'succession_97' : 'diagnostic_67';

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        hasAccess: true,
        productType,
        productName: productType === 'succession_97' ? 'Plano de Sucessão Completo (R$ 97)' : 'Diagnóstico + Mini-Curso (R$ 67)',
        status: 'approved',
        customerName: parsedData.nome || parsedData.customerName || '',
        email: email || parsedData.email || '',
        transactionId: txId || parsedData.pedido || ''
      }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ hasAccess: false }));
  } catch (err: any) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ hasAccess: false, error: err?.message }));
  }
}
