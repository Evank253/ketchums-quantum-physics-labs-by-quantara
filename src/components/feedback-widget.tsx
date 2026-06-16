// Floating feedback widget — visible on every page via __root.tsx.
// Click bubble → opens a small modal that posts into public.feedback.
// Anon submissions allowed (user_id null); admins moderate via SQL/dashboard.

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState("idea");
  const [isPublic, setIsPublic] = useState(true);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    if (!body.trim()) return;
    setBusy(true);
    setMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("feedback").insert({
      user_id: user?.id ?? null,
      display_name: (name || user?.email?.split("@")[0] || "anonymous").slice(0, 60),
      rating, category, body: body.trim(), is_public: isPublic,
    });
    setBusy(false);
    if (error) setMsg(error.message);
    else {
      setMsg("Thanks!");
      setBody("");
      setTimeout(() => { setOpen(false); setMsg(null); }, 1200);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Send feedback"
        className="fixed bottom-3 left-3 z-40 rounded-full border border-primary/40 bg-background/80 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary shadow-lg backdrop-blur-md hover:bg-primary/10"
      >
        ✦ feedback
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-end p-3 sm:place-items-center"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md space-y-3 rounded-xl border border-border bg-card p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Send feedback</h3>
              <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground">close</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-sm">
                <option value="idea">Idea</option>
                <option value="bug">Bug</option>
                <option value="praise">Praise</option>
                <option value="other">Other</option>
              </select>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded border border-border bg-background px-2 py-1 text-sm">
                {[5,4,3,2,1].map((r) => <option key={r} value={r}>{"★".repeat(r)}</option>)}
              </select>
            </div>
            <input
              value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name (optional)"
              maxLength={60} className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
            />
            <textarea
              value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000}
              placeholder="What's on your mind?"
              className="min-h-[110px] w-full rounded border border-border bg-background p-2 text-sm"
            />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              Show on the public board (after review)
            </label>
            {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
            <div className="flex justify-end gap-2">
              <a href="/feedback" className="rounded border border-border px-3 py-1.5 text-xs">View board</a>
              <button onClick={submit} disabled={busy || !body.trim()} className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-50">
                {busy ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
