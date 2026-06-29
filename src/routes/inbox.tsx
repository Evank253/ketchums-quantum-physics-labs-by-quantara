import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { listInbox, sendInboxMessage, markInboxRead } from "@/lib/inbox.functions";

export const Route = createFileRoute("/inbox")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Inbox · Quantara" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InboxPage,
});

type Row = {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
};

function InboxPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [subj, setSubj] = useState("");
  const [body, setBody] = useState("");

  const callList = useServerFn(listInbox);
  const callSend = useServerFn(sendInboxMessage);
  const callRead = useServerFn(markInboxRead);

  const reload = useCallback(() => {
    callList({} as any)
      .then((r: any) => {
        setRows(r.rows ?? []);
        setMe(r.me ?? null);
      })
      .catch((e) => setErr(e?.message ?? String(e)));
  }, [callList]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      reload();
    });
  }, [navigate, reload]);

  const send = async () => {
    setBusy(true);
    setErr(null);
    try {
      await callSend({ data: { recipient_email: to, subject: subj, body } } as any);
      setTo("");
      setSubj("");
      setBody("");
      reload();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const onRead = async (id: string) => {
    try {
      await callRead({ data: { id } } as any);
      reload();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  };

  return (
    <main className="min-h-screen bg-[oklch(0.06_0.01_280)] px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-black md:text-4xl">Inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Direct messages between Quantara users. RLS-scoped — only you and the
          recipient can read.
        </p>

        <section className="mt-6 rounded border border-white/10 bg-card/40 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            New message
          </h2>
          <div className="mt-3 grid gap-2">
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient email"
              className="rounded border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
            <input
              value={subj}
              onChange={(e) => setSubj(e.target.value)}
              placeholder="subject (optional)"
              className="rounded border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="message"
              rows={4}
              className="rounded border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
            <button
              onClick={send}
              disabled={busy || !to || !body}
              className="self-start rounded border border-accent/40 bg-accent/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-accent hover:bg-accent/20 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send"}
            </button>
          </div>
        </section>

        {err && (
          <div className="mt-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
            {err}
          </div>
        )}

        <section className="mt-6 space-y-2">
          {rows.length === 0 && (
            <div className="rounded border border-white/10 bg-card/40 p-6 text-sm text-muted-foreground">
              No messages yet.
            </div>
          )}
          {rows.map((r) => {
            const incoming = r.recipient_id === me;
            const unread = incoming && !r.read_at;
            return (
              <div
                key={r.id}
                className={`rounded border p-3 ${
                  unread
                    ? "border-accent/40 bg-accent/5"
                    : "border-white/10 bg-card/30"
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.2em] text-chrome">
                  <span>
                    {incoming ? "← received" : "→ sent"} ·{" "}
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                  {unread && (
                    <button
                      onClick={() => onRead(r.id)}
                      className="text-accent hover:underline"
                    >
                      mark read
                    </button>
                  )}
                </div>
                {r.subject && (
                  <div className="mt-1 text-sm font-semibold">{r.subject}</div>
                )}
                <div className="mt-1 whitespace-pre-wrap text-sm text-white/90">
                  {r.body}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
