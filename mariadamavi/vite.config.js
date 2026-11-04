import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// Libera os links temporários do túnel (cloudflared) para testar no celular fora de casa
const tunnelHosts = [".trycloudflare.com"];

function upgradeRedirect(server) {
  server.middlewares.use((request, response, next) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/simular-upgrade') {
      response.writeHead(302, { Location: `/simular-upgrade/${url.search}` });
      response.end();
      return;
    }
    next();
  });
}

export default defineConfig({
  plugins: [{ name: 'upgrade-directory-route', configureServer: upgradeRedirect, configurePreviewServer: upgradeRedirect }],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        v2: fileURLToPath(new URL("./v2/index.html", import.meta.url)),
        upgrade: fileURLToPath(new URL("./simular-upgrade/index.html", import.meta.url)),
      },
    },
  },
  server: { allowedHosts: tunnelHosts },
  preview: { allowedHosts: tunnelHosts },
});
