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
  const email = (url.searchParams.get('email') || '').toLowerCase().trim();
  const pedido = (url.searchParams.get('pedido') || url.searchParams.get('order_id') || '').trim();

  if (!email && !pedido) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      success: false, 
      message: 'E-mail ou código do pedido é obrigatório para consulta.' 
    }));
    return;
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

    if (parsedData && (parsedData.sucesso === true || parsedData.success === true || parsedData.podutos || parsedData.produtos)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: true,
        email,
        orderId: pedido,
        data: parsedData
      }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      pending: true,
      email,
      orderId: pedido,
      message: 'Ainda não identificamos a confirmação deste pagamento.',
      data: parsedData
    }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: 'Erro de comunicação com o servidor de confirmação',
      details: err?.message
    }));
  }
}
