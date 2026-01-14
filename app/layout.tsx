import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Analytics } from '@/components/analytics';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DevTools Hub',
  description: 'A collection of essential developer tools',
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.jpg',
    apple: '/favicon.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <div className="flex flex-col min-h-screen bg-background">
              <Navigation />
              <main className="flex-1 container mx-auto px-4 py-6">
                {children}
              </main>
              <Footer />
            </div>
          </I18nProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
