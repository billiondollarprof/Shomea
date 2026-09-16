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

// ---------------------------------------------------------------------------
// THE ONE LINE THAT MATTERS: onnxruntime-web-use-extern-wasm
// ---------------------------------------------------------------------------
//
// This will look like pointless machinery, so here is what it is for.
//
// The speech model runs on the ONNX runtime, which ships four builds of a
// large WebAssembly file:
//
//   ort-wasm-simd-threaded.wasm           13.6 MB
//   ort-wasm-simd-threaded.jspi.wasm      16.0 MB
//   ort-wasm-simd-threaded.asyncify.wasm  25.6 MB
//   ort-wasm-simd-threaded.jsep.wasm      27.0 MB
//
// By default the runtime points the bundler straight at one of them, and
// the bundler dutifully copies it into the build. The first build here
// produced a 26.8 MB asset.
//
// **Cloudflare Pages refuses any single file over 25 MiB.** That deployment
// would have been rejected outright, and the error would have arrived as a
// failed build rather than as anything explaining why.
//
// The copy was never needed. Transformers.js fetches the right build for
// whichever browser is running, from a CDN, at run time. It chooses between
// those four itself, and it pins the version to the one it was tested
// against. Second-guessing that means picking the wrong build on some
// device nobody tested on and finding out during a service.
//
// onnxruntime-web publishes a condition for exactly this case. Asking for
// it gives the same runtime with no file attached, which is what we want.
//
// If a build ever fails on Cloudflare with a file size error, look here
// first, and check the sizes above against what the runtime now ships.

export default defineConfig({
  base: "./",
  plugins: [react()],

  resolve: {
    // The first entry is the one that matters. The rest are the ordinary
    // browser defaults, repeated because naming any condition replaces the
    // list rather than adding to it.
    conditions: [
      "onnxruntime-web-use-extern-wasm",
      "module",
      "browser",
      "import",
      "default",
    ],
  },

  optimizeDeps: {
    // The dev server resolves separately from the build, so it has to be
    // told the same thing or the two behave differently.
    esbuildOptions: {
      conditions: [
        "onnxruntime-web-use-extern-wasm",
        "module",
        "browser",
        "import",
        "default",
      ],
    },
  },

  build: {
    // The worker carries the whole library, so it is large on purpose.
    // Raise this only when you know which chunk grew and why.
    chunkSizeWarningLimit: 2000,
  },
});
