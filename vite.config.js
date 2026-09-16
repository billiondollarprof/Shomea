// vite.config.js
//
// Build configuration for Shomea.
//
// Why base is './': the app is deployed to Cloudflare Pages, and preview
// deployments live on a branch subdomain. Relative paths work on every one
// of them without a rebuild.
//
// Never add a proxy or a dev server rewrite that the production build does
// not also have. Anthony has no laptop, so he only ever sees the built
// deployment. A thing that works in dev and not in the build would be
// invisible until it reached him, and that is the failure this file exists
// to avoid.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    // Cloudflare Pages refuses any single file over 25 MiB. Warn early and
    // loudly, long before a speech model is added to this build.
    chunkSizeWarningLimit: 2000,
  },
});
