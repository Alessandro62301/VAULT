import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';

export const metadata = {
  title: 'Mavi · Catálogo de produtos',
  robots: { index: false, follow: false },
};

export default function Layout({ children }) {
  return (
    <html lang="pt-BR">
      <body><AppRouterCacheProvider options={{ enableCssLayer: true }}>{children}</AppRouterCacheProvider></body>
    </html>
  );
}
