// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    optimizeDeps: {
      // WalletConnect's ESM bundle pulls in heavy node-ish chunks Rollup can't
      // pre-bundle for the Worker SSR pass. We only ever load it via dynamic
      // import() in the browser (see src/lib/wallet-connect.ts), so exclude
      // it from optimizeDeps entirely.
      exclude: ["@walletconnect/ethereum-provider"],
    },
  },
});
