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
  const qParam = reqUrl.searchParams.get('q');
  const title = reqUrl.searchParams.get('title') || '';
  const artist = reqUrl.searchParams.get('artist') || '';

  const query = qParam || `${artist} ${title} audio`.trim();
  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing search query' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const ytRes = await fetch(ytUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!ytRes.ok) {
      return new Response(JSON.stringify({ error: `YouTube returned ${ytRes.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const html = await ytRes.text();

    // Strategy 1: Match "videoId":"[11 chars]"
    const videoIdRegex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    const ids: string[] = [];
    let match;
    while ((match = videoIdRegex.exec(html)) !== null) {
      const vid = match[1];
      if (vid && !ids.includes(vid)) {
        ids.push(vid);
      }
      if (ids.length >= 5) break;
    }

    // Strategy 2: Match /watch?v=[11 chars]
    if (ids.length === 0) {
      const watchRegex = /\/watch\?v=([a-zA-Z0-9_-]{11})/g;
      while ((match = watchRegex.exec(html)) !== null) {
        const vid = match[1];
        if (vid && !ids.includes(vid)) {
          ids.push(vid);
        }
        if (ids.length >= 5) break;
      }
    }

    if (ids.length > 0) {
      return new Response(
        JSON.stringify({
          videoId: ids[0],
          videoIds: ids,
          query,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        }
      );
    }

    return new Response(JSON.stringify({ error: 'No videoId extracted' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Resolution failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
