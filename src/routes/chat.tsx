// Public site-wide chat room with realtime updates.
// Cold-compute aware: pushes load while subscribed (heavier on busy rooms),
// so the thermal governor automatically dials down ambient FX across the app.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { sendChatMessage } from "@/lib/chat.functions";
import { pushLoad, popLoad } from "@/lib/thermal-governor";


export const Route = createFileRoute("/chat")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Live Chat · KQPL" },
      { name: "description", content: "Public site-wide chat room for visitors of Ketchum's Quantum Physics Labs." },
    ],
  }),
  component: ChatPage,
});

type Msg = {
  id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
};

const RATE_LIMIT_MS = 1500;

function ChatPage() {
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const lastSentRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Initial load + realtime
  useEffect(() => {
    let cancelled = false;
    pushLoad("chat-room", 0.15);

    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id,user_id,display_name,body,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (cancelled) return;
      if (error) setErr(error.message);
      else setMessages((data ?? []).reverse() as Msg[]);
    })();

    const channel = supabase
      .channel("chat_messages_room")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          setMessages((prev) => {
            const next = [...prev, payload.new as Msg];
            // Bump cold-compute when the room is busy
            if (next.length > 60) pushLoad("chat-room", 0.35);
            return next.slice(-200);
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== (payload.old as Msg).id));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      popLoad("chat-room");
    };
  }, []);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const sendFn = useServerFn(sendChatMessage);

  const send = useCallback(async () => {
    setErr(null);
    if (!user) { setErr("Sign in to post."); return; }
    const body = text.trim();
    if (!body) return;
    if (body.length > 600) { setErr("Max 600 chars."); return; }
    const now = Date.now();
    if (now - lastSentRef.current < RATE_LIMIT_MS) {
      setErr("Slow down a second."); return;
    }
    lastSentRef.current = now;
    setSending(true);
    try {
      // Server function sets display_name authoritatively from the
      // authenticated session — caller cannot impersonate other users.
      await sendFn({ data: { body } });
      setText("");
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setSending(false);
    }
  }, [text, user, sendFn]);


  return (
    <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col gap-3 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Live chat</h1>
          <p className="text-xs text-muted-foreground">
            Public room. Be civil. Cold-compute mode kicks in automatically when the room gets busy.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Link to="/feedback" className="rounded border border-border px-2 py-1">Feedback</Link>
          {!user && <Link to="/auth" className="rounded bg-primary px-2 py-1 text-primary-foreground">Sign in</Link>}
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-lg border border-border bg-card p-3"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground">No messages yet — be the first.</p>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => (
              <li key={m.id} className="rounded-md bg-muted/40 px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-primary">{m.display_name}</span>
                  <time className="text-[10px] text-muted-foreground">
                    {new Date(m.created_at).toLocaleTimeString()}
                  </time>
                </div>
                <p className="mt-0.5 break-words text-sm">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {err && <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">{err}</div>}

      <form
        onSubmit={(e) => { e.preventDefault(); void send(); }}
        className="flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={600}
          placeholder={user ? "Say something…" : "Sign in to chat"}
          disabled={!user || sending}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!user || sending || !text.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </main>
  );
}
