import { createFileRoute } from "@tanstack/react-router";
import { MarkdownDoc } from "@/components/markdown-doc";
import source from "../../docs/legal/CREATOR_POLICY.md?raw";

export const Route = createFileRoute("/legal/creator-policy")({
  component: () => <MarkdownDoc title="Creator & Breakthrough Logging Policy" source={source} />,
  head: () => ({
    meta: [
      { title: "Creator Policy — Quantara" },
      { name: "description", content: "How Quantara logs simulation vs external-research breakthroughs and handles creator credit." },
      { property: "og:title", content: "Quantara — Creator Policy" },
      { property: "og:description", content: "Simulation vs external_research, run cards, and creator records." },
    ],
  }),
});
