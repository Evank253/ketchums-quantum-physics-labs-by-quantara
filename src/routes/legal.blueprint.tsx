import { createFileRoute } from "@tanstack/react-router";
import { MarkdownDoc } from "@/components/markdown-doc";
import source from "../../docs/legal/ARCHITECTURAL_BLUEPRINT.md?raw";

export const Route = createFileRoute("/legal/blueprint")({
  component: () => <MarkdownDoc title="Architectural Blueprint & Breakthrough Registry" source={source} />,
  head: () => ({
    meta: [
      { title: "Architectural Blueprint — Quantara" },
      { name: "description", content: "Quantara's three-layer architecture: 3D World, Core, and 4D Atlas — plus the documented breakthrough registry." },
      { property: "og:title", content: "Quantara — Architectural Blueprint" },
      { property: "og:description", content: "System overview and documented breakthroughs across the Quantara ecosystem." },
    ],
  }),
});
