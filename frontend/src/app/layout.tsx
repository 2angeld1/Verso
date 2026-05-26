import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Verso - Traductor Universal de Código",
  description: "Traduce código entre lenguajes y versiones de forma natural e inteligente.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#09090b',
              color: '#f4f4f5',
              border: '1px solid #27272a',
              borderRadius: '1rem',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-inter), sans-serif',
            },
          }}
        />
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
