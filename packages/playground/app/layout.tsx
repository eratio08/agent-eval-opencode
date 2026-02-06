import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Eval Playground",
  description: "Browse experiment results, inspect agent transcripts, and compare runs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${figtree.variable}`}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 z-50 bg-background">
            <div className="flex h-14 items-center justify-between px-4 gap-6">
              <div className="flex items-center gap-2">
                <Link href="https://vercel.com" title="Made with love by Vercel">
                  <svg
                    data-testid="geist-icon"
                    height="18"
                    strokeLinejoin="round"
                    viewBox="0 0 16 16"
                    width="18"
                    style={{ color: "currentcolor" }}
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8 1L16 15H0L8 1Z"
                      fill="currentColor"
                    />
                  </svg>
                </Link>
                <span className="text-(--ds-gray-500)">
                  <svg
                    data-testid="geist-icon"
                    height="16"
                    strokeLinejoin="round"
                    viewBox="0 0 16 16"
                    width="16"
                    style={{ color: "currentcolor" }}
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M4.01526 15.3939L4.3107 14.7046L10.3107 0.704556L10.6061 0.0151978L11.9849 0.606077L11.6894 1.29544L5.68942 15.2954L5.39398 15.9848L4.01526 15.3939Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <Link href="/">
                  <span className="font-medium tracking-tight text-lg">agent-eval</span>
                </Link>
              </div>
              <nav className="flex items-baseline gap-4">
                <Link
                  href="/experiments"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Experiments
                </Link>
                <Link
                  href="/compare"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Compare
                </Link>
                <Link
                  href="/evals"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Evals
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-6 py-8 text-sm">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
