import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shop Counter",
  description: "Catalogue, staff desk, and checkout counter",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
          <nav className="max-w-4xl mx-auto px-8 py-4 flex items-center justify-between">
            <Link href="/shop" className="font-bold text-lg tracking-tight">
              Shop Counter
            </Link>
            <div className="flex gap-6 text-sm font-medium">
              <Link href="/shop" className="hover:text-blue-400 transition-colors">
                Shop
              </Link>
              <Link href="/desk" className="hover:text-blue-400 transition-colors">
                Staff Desk
              </Link>
              <Link href="/checkout" className="hover:text-blue-400 transition-colors">
                Checkout
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}