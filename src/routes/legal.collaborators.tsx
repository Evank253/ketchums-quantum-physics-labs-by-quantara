import { createFileRoute } from "@tanstack/react-router";
import { MarkdownDoc } from "@/components/markdown-doc";
import source from "../../docs/legal/FOR_COLLABORATORS.md?raw";

export const Route = createFileRoute("/legal/collaborators")({
  component: () => <MarkdownDoc title="For Collaborators" source={source} />,
  head: () => ({
    meta: [
      { title: "For Collaborators — Quantara" },
      { name: "description", content: "How research teams integrate QED, lattice, and SMEFT codes with Quantara." },
      { property: "og:title", content: "Quantara — For Collaborators" },
      { property: "og:description", content: "Run cards, creator records, and integration guidance for external groups." },
    ],
  }),
});
