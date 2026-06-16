// @lovable.dev/vite-tanstack-config already includes the base plugins — do NOT add them manually
// or the app will break with duplicate plugins.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Harden the production client bundle: no sourcemaps, drop console/debugger,
  // aggressive minify. Keeps internal logic out of the shipped JS.
  build: {
    sourcemap: false,
    minify: "esbuild",
  },
  esbuild: {
    drop: ["console", "debugger"],
    legalComments: "none",
  },
});
