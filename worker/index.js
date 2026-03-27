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
    "script-src 'self' 'unsafe-inline' analytics.devlab502.net",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self' analytics.devlab502.net https://*.ingest.us.sentry.io",
  ].join('; '))
}

function injectAnalytics(response, env) {
  const ct = response.headers.get('content-type') || ''
  if (ct.includes('text/html') && env.UMAMI_SITE_ID) {
    return new HTMLRewriter()
      .on('head', {
        element(el) {
          el.append(`<script defer src="https://analytics.devlab502.net/script.js" data-website-id="${env.UMAMI_SITE_ID}"></script>`, { html: true })
        }
      })
      .transform(response)
  }
  return response
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
      return injectAnalytics(new Response(response.body, { status: response.status, headers }), env)
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
        return injectAnalytics(new Response(fallback.body, { status: 200, headers }), env)
      }
      return new Response('Server Error', { status: 500 })
    }
  }
}
