import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { ThemeProvider } from '@/lib/theme-context';
import { GlobalSearch } from '@/components/GlobalSearch';

export const metadata: Metadata = {
  title: 'Ad Intelligence',
  description: 'Plataforma de marketing inteligente para marcas de ecommerce',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-base text-ink antialiased">
        <ThemeProvider>
          <GlobalSearch />
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 md:pl-0">
              <div className="pt-14 md:pt-0">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
