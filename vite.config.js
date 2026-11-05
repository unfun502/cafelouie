import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: 'devlab502',
      project: 'devlab502-workers',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        // Maps are for Sentry only. Delete them so wrangler does not deploy them
        // as public assets; an explicit build.sourcemap turns off the automatic delete.
        filesToDeleteAfterUpload: ['dist/**/*.map'],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: 'hidden',
  }
})
