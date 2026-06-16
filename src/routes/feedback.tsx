// Public feedback board + submission form.
// Anyone (incl. anon) can submit; only entries marked public AND approved
// (by an admin) are visible to other visitors. Submitters always see their own.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/feedback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Feedback · KQPL" },
      { name: "description", content: "Share feedback, ideas and bug reports for Ketchum's Quantum Physics Labs." },
    ],
  }),
  component: FeedbackPage,
});

type Entry = {
  id: string;
  display_name: string | null;
  rating: number | null;
  category: string | null;
  body: string;
  created_at: string;
};

function FeedbackPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("feedback")
      .select("id,display_name,rating,category,body,created_at")
      .eq("is_public", true)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) setErr(error.message);
    else setEntries((data ?? []) as Entry[]);
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4">
      <header className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Community feedback</h1>
          <p className="text-xs text-muted-foreground">Approved, public entries. Use the widget on any page to submit.</p>
        </div>
        <Link to="/chat" className="rounded border border-border px-2 py-1 text-xs">Live chat →</Link>
      </header>

      <FeedbackForm onSubmitted={load} />

      {err && <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">{err}</div>}

      <section className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public feedback yet.</p>
        ) : entries.map((e) => (
          <article key={e.id} className="rounded-lg border border-border bg-card p-4">
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="font-semibold text-primary">{e.display_name ?? "anonymous"}</span>
              <span className="text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</span>
            </div>
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              {e.category && <span className="rounded bg-muted px-1.5 py-0.5">{e.category}</span>}
              {e.rating != null && <span>{"★".repeat(e.rating)}{"☆".repeat(5 - e.rating)}</span>}
            </div>
            <p className="whitespace-pre-wrap text-sm">{e.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

function FeedbackForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("idea");
  const [rating, setRating] = useState(5);
  const [isPublic, setIsPublic] = useState(true);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!body.trim()) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("feedback").insert({
      user_id: user?.id ?? null,
      display_name: (name || user?.email?.split("@")[0] || "anonymous").slice(0, 60),
      rating, category, body: body.trim(), is_public: isPublic,
    });
    setBusy(false);
    if (error) setMsg(error.message);
    else {
      setBody(""); setMsg("Thanks — submitted. Public entries appear after review.");
      onSubmitted();
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Send feedback</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-sm">
          <option value="idea">Idea</option>
          <option value="bug">Bug</option>
          <option value="praise">Praise</option>
          <option value="other">Other</option>
        </select>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded border border-border bg-background px-2 py-1 text-sm">
          {[5,4,3,2,1].map((r) => <option key={r} value={r}>{"★".repeat(r)}</option>)}
        </select>
        <input
          value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name (optional)"
          maxLength={60} className="col-span-2 rounded border border-border bg-background px-2 py-1 text-sm"
        />
      </div>
      <textarea
        value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} required
        placeholder="What's on your mind?"
        className="min-h-[120px] w-full rounded border border-border bg-background p-2 text-sm"
      />
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        Show on the public board (after review)
      </label>
      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
      <button type="submit" disabled={busy || !body.trim()} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
        {busy ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}
