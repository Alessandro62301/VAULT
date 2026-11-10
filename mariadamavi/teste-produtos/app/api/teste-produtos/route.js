const endpoint = 'https://ekldegvacrfqcmxaavzm.supabase.co/rest/v1/daily_listings';
const pageSize = 1000;
const select = [
  'id,supplier_id,storage,color,region,wholesale_price,listed_at,listing_date,condition,battery_health,is_as_is',
  'products!inner(name,category,image_url)',
  'suppliers!inner(name,location,city,whatsapp,is_active,profile_pic_url)',
].join(',');

const respond = (body, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET(request) {
  const host = request.headers.get('host') ?? '';
  const site = request.headers.get('sec-fetch-site');
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host) || site === 'cross-site') {
    return respond({ error: 'Rota disponível apenas para teste local.' }, 403);
  }

  const date = new URL(request.url).searchParams.get('date') ?? '2026-11-09';
  const parsedDate = new Date(`${date}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(+parsedDate)
      || parsedDate.toISOString().slice(0, 10) !== date) {
    return respond({ error: 'Informe uma data válida.' }, 400);
  }

  const apikey = process.env.PXT_SUPABASE_API_KEY?.trim();
  const token = process.env.PXT_SUPABASE_ACCESS_TOKEN?.trim();
  if (!apikey || !token) {
    return respond({ error: 'Configure as credenciais do Supabase no .env.local do servidor.' }, 503);
  }

  const url = new URL(endpoint);
  url.search = new URLSearchParams({
    select,
    listing_date: `eq.${date}`,
    order: 'wholesale_price.asc,id.asc',
    limit: String(pageSize),
  });

  const listings = [];
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(45_000)]);

  try {
    while (true) {
      url.searchParams.set('offset', String(listings.length));
      const response = await fetch(url, {
        headers: { apikey, Authorization: `Bearer ${token}`, Prefer: 'count=exact' },
        cache: 'no-store',
        redirect: 'error',
        signal,
      });
      if (!response.ok) {
        const authError = response.status === 401 || response.status === 403;
        return respond({
          error: authError
            ? `O Supabase recusou as credenciais (${response.status}). Confira o acesso e a validade do token.`
            : `O Supabase respondeu com erro (${response.status}).`,
        }, 502);
      }

      const batch = await response.json();
      if (!Array.isArray(batch)) {
        return respond({ error: 'Resposta inesperada do Supabase.' }, 502);
      }
      listings.push(...batch);

      const total = response.headers.get('content-range')?.match(/\/(\d+)$/)?.[1];
      if (batch.length === 0 || (total !== undefined && listings.length >= Number(total))) {
        return respond(listings);
      }
    }
  } catch {
    return respond({ error: 'A consulta ao Supabase falhou ou excedeu o tempo limite.' }, 502);
  }
}
