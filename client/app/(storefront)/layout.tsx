import type { Metadata } from 'next';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'ShopMERN - Your Online Store',
  description: 'Shop the best products at great prices',
};

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
