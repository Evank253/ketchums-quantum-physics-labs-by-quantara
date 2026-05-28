import { createFileRoute } from "@tanstack/react-router";
import { MarkdownDoc } from "@/components/markdown-doc";
import source from "../../docs/legal/LICENSE_RESEARCH.md?raw";

export const Route = createFileRoute("/legal/research-license")({
  component: () => <MarkdownDoc title="Research License (Non-Commercial)" source={source} />,
  head: () => ({
    meta: [
      { title: "Research License — Quantara" },
      { name: "description", content: "Free non-commercial license for researchers and students using Quantara." },
      { property: "og:title", content: "Quantara — Research License" },
      { property: "og:description", content: "Academic / personal-use license with attribution requirements." },
    ],
  }),
});
