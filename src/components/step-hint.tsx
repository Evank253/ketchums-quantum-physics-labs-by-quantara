// Inline instruction blurb shown next to each interactive tool on the home
// page. Keeps the "how to use" directions co-located with the thing they
// describe instead of a single panel at the top.
export function StepHint({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mb-4 rounded-md border border-accent/30 bg-accent/5 px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
        Step {step} · {title}
      </div>
      <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}
