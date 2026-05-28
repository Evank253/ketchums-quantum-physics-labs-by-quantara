import { createFileRoute } from "@tanstack/react-router";
import { MarkdownDoc } from "@/components/markdown-doc";
import source from "../../docs/legal/TERMS.md?raw";

export const Route = createFileRoute("/legal/terms")({
  component: () => <MarkdownDoc title="Terms of Use" source={source} />,
  head: () => ({
    meta: [
      { title: "Terms of Use — Quantara" },
      { name: "description", content: "Quantara Platform Terms of Use: ownership, scope, breakthrough logging, and liability." },
      { property: "og:title", content: "Quantara — Terms of Use" },
      { property: "og:description", content: "Platform terms governing use of the Quantara QED Engine and World." },
    ],
  }),
});
