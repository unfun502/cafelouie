import { getAssetFromKV, NotFoundError } from '@cloudflare/kv-asset-handler'
import manifestJSON from '__STATIC_CONTENT_MANIFEST'

const assetManifest = JSON.parse(manifestJSON)

function addSecurityHeaders(headers) {
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
  ].join('; '))
}

export default {
  async fetch(request, env, ctx) {
    try {
      const response = await getAssetFromKV(
        { request, waitUntil: ctx.waitUntil.bind(ctx) },
        { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: assetManifest }
      )
      const headers = new Headers(response.headers)
      addSecurityHeaders(headers)
      return new Response(response.body, { status: response.status, headers })
    } catch (e) {
      if (e instanceof NotFoundError) {
        const url = new URL(request.url)
        url.pathname = '/index.html'
        const fallback = await getAssetFromKV(
          { request: new Request(url.toString(), request), waitUntil: ctx.waitUntil.bind(ctx) },
          { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: assetManifest }
        )
        const headers = new Headers(fallback.headers)
        addSecurityHeaders(headers)
        return new Response(fallback.body, { status: 200, headers })
      }
      return new Response('Server Error', { status: 500 })
    }
  }
}
