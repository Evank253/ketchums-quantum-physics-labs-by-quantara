import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "@tanstack/react-router";

export function MarkdownDoc({ source, title, back = "/legal" }: { source: string; title: string; back?: string }) {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Link to={back} className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
          ← Legal
        </Link>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.02em] md:text-4xl">{title}</h1>
        <article className="prose prose-invert mt-8 max-w-none prose-headings:tracking-tight prose-h1:hidden prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/10 prose-code:text-accent prose-a:text-accent">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
        </article>
        <div className="mt-12 border-t border-white/10 pt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          © 2026 Evan Ketchum · Quantara Platform · Evan.ketchum2026@outlook.com
        </div>
      </div>
    </main>
  );
}
