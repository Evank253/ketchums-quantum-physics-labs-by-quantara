import { createFileRoute } from "@tanstack/react-router";
import { MarkdownDoc } from "@/components/markdown-doc";
import source from "../../docs/legal/LICENSE.md?raw";

export const Route = createFileRoute("/legal/license")({
  component: () => <MarkdownDoc title="License — All Rights Reserved" source={source} />,
  head: () => ({
    meta: [
      { title: "License — All Rights Reserved · Ketchum's Quantum Physics Labs" },
      { name: "description", content: "© Evan Ketchum. No copying, redistribution, derivative works, or AI training without prior signed written permission." },
      { name: "robots", content: "noai, noimageai" },
      { property: "og:title", content: "Ketchum's Quantum Physics Labs — License (All Rights Reserved)" },
      { property: "og:description", content: "Binding license: viewing this site grants no rights. All use requires written permission from Evan Ketchum." },
    ],
    links: [
      { rel: "license", href: "/legal/license" },
    ],
  }),
});
