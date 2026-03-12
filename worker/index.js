import { getAssetFromKV, NotFoundError } from '@cloudflare/kv-asset-handler'
import manifestJSON from '__STATIC_CONTENT_MANIFEST'

const assetManifest = JSON.parse(manifestJSON)

export default {
  async fetch(request, env, ctx) {
    try {
      return await getAssetFromKV(
        { request, waitUntil: ctx.waitUntil.bind(ctx) },
        { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: assetManifest }
      )
    } catch (e) {
      if (e instanceof NotFoundError) {
        const url = new URL(request.url)
        url.pathname = '/index.html'
        return await getAssetFromKV(
          { request: new Request(url.toString(), request), waitUntil: ctx.waitUntil.bind(ctx) },
          { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: assetManifest }
        )
      }
      return new Response('Server Error', { status: 500 })
    }
  }
}
