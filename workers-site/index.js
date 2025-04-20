import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  try {
    return await getAssetFromKV(event);
  } catch (err) {
    console.error('Error occurred:', err);
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/_next') || url.pathname === '/') {
      return await getAssetFromKV(event, { mapRequestToAsset: req => new Request(req.url.replace(url.pathname, '/index.html'), req) });
    }
    return new Response('Not found', { status: 404 });
  }
}
