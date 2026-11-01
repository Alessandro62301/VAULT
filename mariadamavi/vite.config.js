import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// Libera os links temporários do túnel (cloudflared) para testar no celular fora de casa
const tunnelHosts = [".trycloudflare.com"];

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        v2: fileURLToPath(new URL("./v2/index.html", import.meta.url)),
      },
    },
  },
  server: { allowedHosts: tunnelHosts },
  preview: { allowedHosts: tunnelHosts },
});
