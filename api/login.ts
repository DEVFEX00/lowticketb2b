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

  if (!email) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      success: false, 
      message: 'E-mail é obrigatório para autenticação de login.' 
    }));
    return;
  }

  try {
    const queryParams = new URLSearchParams();
    queryParams.set('email', email);

    // Official n8n login webhook specified by user
    const n8nLoginWebhookUrl = `https://n8n.fexeducacao.com/webhook/j2gYOp1tOyw0ZhOn-login-with-email?${queryParams.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(n8nLoginWebhookUrl, {
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
        data: parsedData
      }));
      return;
    }

    // Se o webhook retornou status 200 com payload
    if (response.ok && parsedData) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: true,
        email,
        data: parsedData
      }));
      return;
    }

    // Se não encontrou compra ativa
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      email,
      message: 'Nenhuma compra confirmada encontrada para este e-mail no login.'
    }));
  } catch (error: any) {
    console.error('[API Login] Erro ao consultar webhook n8n de login:', error);
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      message: 'Falha momentânea na conexão com o serviço de autenticação.',
      error: error?.message || 'Gateway Timeout'
    }));
  }
}
