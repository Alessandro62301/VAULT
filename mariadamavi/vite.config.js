import { defineConfig } from "vite";

// Libera os links temporários do túnel (cloudflared) para testar no celular fora de casa
const tunnelHosts = [".trycloudflare.com"];

export default defineConfig({
  server: { allowedHosts: tunnelHosts },
  preview: { allowedHosts: tunnelHosts },
});
