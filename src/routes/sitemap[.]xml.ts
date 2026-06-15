import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://ketchums-quantum-physics-labs-by-quantara.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/world", changefreq: "weekly", priority: "0.9" },
          { path: "/atlas", changefreq: "weekly", priority: "0.8" },
          { path: "/ledger", changefreq: "daily", priority: "0.8" },
          { path: "/cern", changefreq: "weekly", priority: "0.8" },
          { path: "/kve", changefreq: "weekly", priority: "0.7" },
          { path: "/rg-running", changefreq: "weekly", priority: "0.7" },
          { path: "/synthesis", changefreq: "weekly", priority: "0.7" },
          { path: "/interstellar", changefreq: "weekly", priority: "0.7" },
          { path: "/benchmarks", changefreq: "weekly", priority: "0.6" },
          { path: "/annex", changefreq: "monthly", priority: "0.5" },
          { path: "/legal", changefreq: "monthly", priority: "0.4" },
          { path: "/legal/license", changefreq: "monthly", priority: "0.4" },
          { path: "/legal/terms", changefreq: "monthly", priority: "0.3" },
          { path: "/legal/research-license", changefreq: "monthly", priority: "0.3" },
          { path: "/legal/commercial-license", changefreq: "monthly", priority: "0.3" },
          { path: "/legal/creator-policy", changefreq: "monthly", priority: "0.3" },
          { path: "/legal/collaborators", changefreq: "monthly", priority: "0.3" },
          { path: "/legal/blueprint", changefreq: "monthly", priority: "0.4" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
