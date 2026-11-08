/// <reference types="vitest/config" />
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// Copies settings.yml from the repo root into the build (the dev server serves it from the root)
const settingsYml: Plugin = {
  name: "settings-yml",
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "settings.yml",
      source: readFileSync(new URL("./settings.yml", import.meta.url)),
    });
  },
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [vue(), vueDevTools(), settingsYml],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    base: process.env.URL_BASE,
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const vendors: Record<string, string[]> = {
              vue: ["/vue/", "/@vue/", "/pinia/", "/vue-router/"],
              bootstrap: ["/bootstrap/", "/bootstrap-vue-next/", "/@floating-ui/"],
              "vue-cal": ["/vue-cal/"],
              icons: ["/lucide-vue-next/"],
            };
            if (!id.includes("/node_modules/")) {
              return undefined;
            }
            return Object.keys(vendors).find(name =>
              vendors[name]?.some(dir => id.includes(`/node_modules${dir}`))
            );
          },
        },
      },
    },
    test: {
      includeSource: ["src/**/*.{js,ts}"],
      coverage: {
        enabled: true,
      },
    },
    define: {
      "import.meta.vitest": "undefined",
    },
    server: {
      port: 8005,
      proxy: {
        [env.VITE_API_BASE_URL]: {
          target: "http://localhost:8004",
          changeOrigin: true,
          headers: {
            REMOTE_USER: env.VITE_SHIB_USERNAME,
          },
          rewrite: path => path.replace(/^\/stundenplan\/backend/, ""),
        },
      },
    },
  };
});
