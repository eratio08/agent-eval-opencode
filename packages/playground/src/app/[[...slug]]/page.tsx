import { ClientRouter } from "@/components/ClientRouter";

/**
 * Generate static params for known routes.
 * Dynamic routes (experiments, transcripts) are handled via SPA fallback
 * served by the CLI's HTTP server.
 */
export function generateStaticParams() {
  return [
    { slug: [] },           // /
    { slug: ["compare"] },  // /compare
    { slug: ["evals"] },    // /evals
  ];
}

export default function CatchAllPage() {
  return <ClientRouter />;
}
