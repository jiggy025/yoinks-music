export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const reqUrl = new URL(req.url);
  let targetUrl = '';

  const rawUrl = reqUrl.searchParams.get('url');
  const endpoint = reqUrl.searchParams.get('endpoint');

  if (rawUrl) {
    // If a full URL is supplied
    if (!rawUrl.startsWith('https://api.deezer.com')) {
      return new Response(JSON.stringify({ error: 'Invalid target host' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    targetUrl = rawUrl;
  } else if (endpoint) {
    // Reconstruct with any remaining query parameters
    const params = new URLSearchParams(reqUrl.searchParams);
    params.delete('endpoint');
    const qs = params.toString();
    const cleanEndpoint = endpoint.replace(/^\//, '');
    targetUrl = `https://api.deezer.com/${cleanEndpoint}${qs ? '?' + qs : ''}`;
  } else {
    return new Response(JSON.stringify({ error: 'Missing endpoint or url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 's-maxage=120, stale-while-revalidate=600',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Fetch error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
