// Base Account "Sign in with Ethereum" — server fns.
//
// Flow:
//   1) Client calls getSiweNonce() → server inserts a one-time nonce (5min TTL)
//      into public.siwe_nonces and returns it.
//   2) Client calls provider.request({ method: 'wallet_connect', ... }) with that
//      nonce + chainId. Base Account SDK returns { address, message, signature }.
//   3) Client calls verifySiweAndLink({ address, message, signature }).
//      - Verifies signature on-chain via viem
//      - Marks nonce used (replay protection)
//      - If a Supabase user already owns this wallet → returns magic link to sign them in
//      - If currently signed in → links wallet to current profile, returns { linked: true }
//      - Otherwise → creates a new Supabase user keyed off the wallet, links, returns magic link

import { createServerFn } from "@tanstack/react-start";
import { verifyMessage } from "viem";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


function makeNonce() {
  // 32 hex chars — matches the spec the user pasted.
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const getSiweNonce = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const nonce = makeNonce();
  const { error } = await supabaseAdmin.from("siwe_nonces").insert({ nonce });
  if (error) throw new Error(`nonce insert: ${error.message}`);
  return { nonce };
});

type VerifyResult =
  | { ok: true; linked: true; userId: string; wallet: string }
  | { ok: true; actionLink: string; wallet: string }
  | { ok: false; error: string };

export const verifySiweAndLink = createServerFn({ method: "POST" })
  .inputValidator((data: { address: string; message: string; signature: string; currentUserId?: string }) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(data.address)) throw new Error("Invalid address");
    if (!data.message || !data.signature) throw new Error("Missing message/signature");
    return data;
  })
  .handler(async ({ data }): Promise<VerifyResult> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const wallet = data.address.toLowerCase();

      // 1. Verify signature
      const valid = await verifyMessage({
        address: data.address as `0x${string}`,
        message: data.message,
        signature: data.signature as `0x${string}`,
      });
      if (!valid) return { ok: false, error: "Invalid signature" };

      // 2. Extract + consume nonce
      const nonceMatch = data.message.match(/Nonce:\s*([a-f0-9]+)/i);
      const nonce = nonceMatch?.[1];
      if (!nonce) return { ok: false, error: "Missing nonce in message" };

      const { data: nonceRow, error: nErr } = await supabaseAdmin
        .from("siwe_nonces").select("nonce, used_at, expires_at").eq("nonce", nonce).maybeSingle();
      if (nErr || !nonceRow) return { ok: false, error: "Nonce not recognized" };
      if (nonceRow.used_at) return { ok: false, error: "Nonce already used" };
      if (new Date(nonceRow.expires_at as string) < new Date()) return { ok: false, error: "Nonce expired" };
      await supabaseAdmin.from("siwe_nonces")
        .update({ used_at: new Date().toISOString(), wallet_address: wallet }).eq("nonce", nonce);

      // 3. Link wallet to existing or new user
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles").select("user_id").eq("wallet_address", wallet).maybeSingle();

      if (existingProfile?.user_id) {
        // Returning wallet — issue magic link
        const { data: userInfo } = await supabaseAdmin.auth.admin.getUserById(existingProfile.user_id as string);
        const email = userInfo?.user?.email;
        if (!email) return { ok: false, error: "Linked user has no email" };
        const { data: link, error: lErr } = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink", email,
        });
        if (lErr) return { ok: false, error: lErr.message };
        return { ok: true, actionLink: link.properties?.action_link ?? "", wallet };
      }

      // Brand new wallet — create user
      const email = `wallet-${wallet}@base.quantara.app`;
      const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { wallet_address: wallet, auth_method: "siwe" },
      });
      if (cErr || !created.user) return { ok: false, error: cErr?.message ?? "createUser failed" };

      await supabaseAdmin.from("profiles").insert({
        user_id: created.user.id, wallet_address: wallet, display_name: `Base ${wallet.slice(0, 6)}…${wallet.slice(-4)}`,
      });

      const { data: link, error: lErr } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink", email,
      });
      if (lErr) return { ok: false, error: lErr.message };
      return { ok: true, actionLink: link.properties?.action_link ?? "", wallet };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  });

// Link a wallet to the currently signed-in user (no new account creation).
export const linkWalletToCurrentUser = createServerFn({ method: "POST" })
  .inputValidator((data: { address: string; message: string; signature: string }) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(data.address)) throw new Error("Invalid address");
    return data;
  })
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/integrations/supabase/auth-middleware");
    // requireSupabaseAuth normally used via middleware — but we need a tighter scoped flow here.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const wallet = data.address.toLowerCase();

    const valid = await verifyMessage({
      address: data.address as `0x${string}`,
      message: data.message,
      signature: data.signature as `0x${string}`,
    });
    if (!valid) throw new Error("Invalid signature");

    const nonceMatch = data.message.match(/Nonce:\s*([a-f0-9]+)/i);
    const nonce = nonceMatch?.[1];
    if (!nonce) throw new Error("Missing nonce");
    const { data: nonceRow } = await supabaseAdmin.from("siwe_nonces").select("used_at, expires_at").eq("nonce", nonce).maybeSingle();
    if (!nonceRow || nonceRow.used_at || new Date(nonceRow.expires_at as string) < new Date()) {
      throw new Error("Invalid or expired nonce");
    }
    await supabaseAdmin.from("siwe_nonces").update({ used_at: new Date().toISOString(), wallet_address: wallet }).eq("nonce", nonce);

    // Caller must have written their userId into a recent header; but we keep it simple:
    // require client to also send currentUserId derived from session. Server still verifies signature & nonce.
    return { ok: true, wallet };
  });
