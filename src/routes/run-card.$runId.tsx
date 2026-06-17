import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { getPublicRunCard } from "@/lib/compare.functions";

export const Route = createFileRoute("/run-card/$runId")({
  loader: async ({ params }) => {
    const res = await getPublicRunCard({ data: { runId: params.runId } });
    if (!res.ok) throw notFound();
    return res;
  },
  head: ({ params }) => ({
    meta: [
      { title: `Run Card ${params.runId} · Quantara Provenance` },
      { name: "description", content: `Append-only provenance card ${params.runId}: engine, CODATA, residual, σ, backend version, on-chain mint hash.` },
      { property: "og:title", content: `Quantara Run Card ${params.runId}` },
      { property: "og:description", content: "Reproducible run-card provenance from Ketchum's Quantum Physics Labs." },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Dataset",
          identifier: params.runId,
          name: `Quantara Run Card ${params.runId}`,
          creator: { "@type": "Organization", name: "Ketchum's Quantum Physics Labs" },
        }),
      },
    ],
  }),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <main className="p-10 text-red-300">
        <p>Failed to load run card: {error.message}</p>
        <button onClick={() => { reset(); router.invalidate(); }} className="mt-2 rounded border border-white/20 px-3 py-1">Retry</button>
      </main>
    );
  },
  notFoundComponent: () => {
    const { runId } = Route.useParams();
    return (
      <main className="p-10 text-white/60">
        Run card <span className="font-mono text-cyan-200">{runId}</span> not found.
      </main>
    );
  },
  component: RunCardPage,
});

function RunCardPage() {
  const data = Route.useLoaderData();
  if (!data.ok) return null;
  const { card, job, mint } = data;
  const txHash = (mint?.result as any)?.tx_hash as string | undefined;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-white">
      <Link to="/compare" className="font-mono text-[10px] uppercase tracking-widest text-cyan-300/70 hover:text-cyan-200">
        ← All comparisons
      </Link>
      <h1 className="mt-3 text-2xl font-light text-cyan-100">Run Card</h1>
      <div className="mt-1 font-mono text-xs text-cyan-300">{card.runId}</div>

      <section className="mt-6 grid grid-cols-2 gap-3 text-xs">
        <Field label="Backend">{card.backendVersion}</Field>
        <Field label="Created">{new Date(card.createdAt).toLocaleString()}</Field>
        <Field label="Model">{job?.model ?? "—"}</Field>
        <Field label="Verdict">{job?.verdict ?? "—"}</Field>
        <Field label="σ-deviation">{job?.sigma != null ? Number(job.sigma).toFixed(3) : "—"}</Field>
        <Field label="Seed">{card.seed ?? "—"}</Field>
        <Field label="Input hash">{card.inputHash.slice(0, 16)}…</Field>
        <Field label="Output hash">{card.outputHash.slice(0, 16)}…</Field>
      </section>

      {txHash && (
        <section className="mt-6 rounded border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs">
          <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-300/80">On-chain mint</div>
          <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer"
             className="mt-1 block break-all font-mono text-emerald-200 hover:underline">{txHash}</a>
        </section>
      )}

      <section className="mt-6 rounded border border-white/10 bg-black/40 p-4">
        <h2 className="mb-2 text-sm font-semibold">Raw provenance payload</h2>
        <pre className="max-h-96 overflow-auto text-[10px] text-white/70">
          {JSON.stringify({ card, job, mint }, null, 2)}
        </pre>
      </section>

      <section className="mt-6 text-[11px] text-white/55">
        Cite as: <span className="font-mono text-white/80">KQPL Run Card {card.runId}, backend {card.backendVersion}, {new Date(card.createdAt).toISOString()}.</span>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-white/10 bg-black/30 p-3">
      <div className="font-mono text-[9px] uppercase tracking-widest text-white/45">{label}</div>
      <div className="mt-1 break-all text-white/85">{children}</div>
    </div>
  );
}
