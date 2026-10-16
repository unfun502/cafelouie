/**
 * Serves the Vite build from Workers Static Assets (binding ASSETS), adding
 * security headers, HTML no-cache and Umami injection. Every request runs
 * through here (run_worker_first in wrangler.toml); unknown paths get
 * index.html from not_found_handling (the old SPA fallback). Asset reads are
 * not KV operations.
 */

function addSecurityHeaders(headers) {
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' analytics.devlab502.net",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self' analytics.devlab502.net https://*.ingest.us.sentry.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
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

function isHtml(path, response) {
  return (
    !path.includes('.') ||
    path.endsWith('.html') ||
    (response.headers.get('content-type') || '').includes('text/html')
  )
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname
    const asset = await env.ASSETS.fetch(request)
    const headers = new Headers(asset.headers)
    addSecurityHeaders(headers)
    if (isHtml(path, asset)) headers.set('Cache-Control', 'no-cache')
    // Vite's content-hashed bundles never change under the same name.
    else if (path.startsWith('/assets/') && asset.ok) headers.set('Cache-Control', 'public, max-age=31536000')
    const response = new Response(asset.body, {
      status: asset.status,
      statusText: asset.statusText,
      headers,
    })
    return injectAnalytics(response, env)
  }
}
