import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LiveIndicator } from "@/components/LiveIndicator";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Agent Eval Playground",
  description: "Browse experiment results, inspect agent transcripts, and compare runs",
};

/** Injected at runtime by the CLI server via placeholder replacement */
declare global {
  interface Window {
    __AGENT_EVAL_CONFIG__: {
      apiPort: number;
      apiBase: string;
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__AGENT_EVAL_CONFIG__ = {
              apiPort: %%AGENT_EVAL_API_PORT%%,
              apiBase: "%%AGENT_EVAL_API_BASE%%"
            };`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center px-6">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
                <span className="font-semibold">Agent Eval</span>
              </div>
              <nav className="ml-8 flex items-center gap-6 text-sm">
                <a href="/" className="text-foreground/60 transition-colors hover:text-foreground">
                  Experiments
                </a>
                <a href="/compare" className="text-foreground/60 transition-colors hover:text-foreground">
                  Compare
                </a>
                <a href="/evals" className="text-foreground/60 transition-colors hover:text-foreground">
                  Evals
                </a>
              </nav>
              <div className="ml-auto">
                <LiveIndicator />
              </div>
            </div>
          </header>
          <main className="container px-6 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
