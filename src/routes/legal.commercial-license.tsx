import { createFileRoute } from "@tanstack/react-router";
import { MarkdownDoc } from "@/components/markdown-doc";
import source from "../../docs/legal/LICENSE_COMMERCIAL.md?raw";

export const Route = createFileRoute("/legal/commercial-license")({
  component: () => <MarkdownDoc title="Commercial & Institutional License" source={source} />,
  head: () => ({
    meta: [
      { title: "Commercial License — Quantara" },
      { name: "description", content: "Commercial and institutional licensing terms for Quantara deployments." },
      { property: "og:title", content: "Quantara — Commercial License" },
      { property: "og:description", content: "Fees, revenue share, and institutional use of the Quantara Platform." },
    ],
  }),
});
