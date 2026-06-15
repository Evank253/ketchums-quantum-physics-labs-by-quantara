import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { TREASURY_WALLET } from "./treasury";

// Allowed preset claims — server is the source of truth, not the client.
// `key` set => one-time per wallet. `cooldownMs` set => repeatable with rate limit.
export const CLAIM_PRESETS = {
  small: {
    amount: 5,
    reason: "Cleaned bad data · small batch",
    cooldownMs: 60 * 60 * 1000, // 1h
  },
  medium: {
    amount: 25,
    reason: "Verified dataset · medium batch",
    cooldownMs: 6 * 60 * 60 * 1000, // 6h
  },
  large: {
    amount: 100,
    reason: "Sovereign archive · large batch",
    cooldownMs: 24 * 60 * 60 * 1000, // 24h
  },
  genesis: {
    amount: 500,
    reason: "Genesis claim · sovereign architect",
    key: "genesis-v1", // one-time
  },
} as const;

export type ClaimPresetId = keyof typeof CLAIM_PRESETS;

const ClaimInput = z.object({
  wallet: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  preset: z.enum(["small", "medium", "large", "genesis"]),
});

const BalanceInput = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

const ListInput = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  limit: z.number().int().min(1).max(100).optional(),
});

export const claimDat = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ClaimInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const mint = await import("./dat-mint.server");

    const wallet = mint.normalizeAddress(data.wallet);
    if (!wallet) throw new Error("Invalid wallet address");

    const preset = CLAIM_PRESETS[data.preset];
    const reasonKey = "key" in preset ? preset.key : null;

    let ip: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) || null;
    } catch {}

    const auditBase = {
      wallet,
      action: `claim:${data.preset}`,
      payload: { preset: data.preset, amount: preset.amount, reasonKey },
      ip,
    };

    // 1. Double-claim guard (one-time presets)
    if (reasonKey) {
      const { data: existing } = await supabaseAdmin
        .from("dat_claims")
        .select("id,status,tx_hash")
        .eq("wallet", wallet)
        .eq("reason_key", reasonKey)
        .maybeSingle();
      if (existing) {
        await supabaseAdmin.from("dat_mint_audit").insert({
          ...auditBase,
          status: "rejected",
          error: "already_claimed",
          result: existing,
        });
        throw new Error("This one-time claim has already been used by this wallet.");
      }
    } else if ("cooldownMs" in preset && preset.cooldownMs) {
      // 2. Cooldown guard (repeatable presets)
      const since = new Date(Date.now() - preset.cooldownMs).toISOString();
      const { data: recent } = await supabaseAdmin
        .from("dat_claims")
        .select("id,created_at")
        .eq("wallet", wallet)
        .eq("reason", preset.reason)
        .gte("created_at", since)
        .limit(1);
      if (recent && recent.length > 0) {
        const mins = Math.ceil(preset.cooldownMs / 60000);
        await supabaseAdmin.from("dat_mint_audit").insert({
          ...auditBase,
          status: "rejected",
          error: "cooldown",
        });
        throw new Error(`Cooldown active. Try again later (window: ${mins}m).`);
      }
    }

    // 3. Insert pending row (reserves the unique slot for one-time claims via UQ index)
    const { data: pending, error: insertErr } = await supabaseAdmin
      .from("dat_claims")
      .insert({
        wallet,
        amount: preset.amount,
        reason: preset.reason,
        reason_key: reasonKey,
        status: "pending",
      })
      .select()
      .single();
    if (insertErr) {
      // Unique violation = race condition on one-time claim
      if (insertErr.code === "23505") {
        await supabaseAdmin.from("dat_mint_audit").insert({
          ...auditBase,
          status: "rejected",
          error: "race_already_claimed",
        });
        throw new Error("This one-time claim has already been used by this wallet.");
      }
      await supabaseAdmin.from("dat_mint_audit").insert({
        ...auditBase,
        status: "error",
        error: `insert_failed: ${insertErr.message}`,
      });
      throw new Error("Failed to record claim.");
    }

    // 4. Try to mint on-chain. If the minter isn't configured yet, mark the row
    //    as "pending" with an explanatory error and surface a clear message —
    //    the row is preserved, double-claim guards already engaged.
    const cfgRes = mint.loadMintConfig();
    if (!cfgRes.ok) {
      await supabaseAdmin
        .from("dat_claims")
        .update({
          status: "failed",
          error: `Minter not configured: missing ${cfgRes.missing.join(", ")}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pending.id);
      await supabaseAdmin.from("dat_mint_audit").insert({
        ...auditBase,
        status: "config_missing",
        error: `missing: ${cfgRes.missing.join(", ")}`,
        result: { claim_id: pending.id },
      });
      throw new Error(
        `On-chain minter not configured yet. Missing: ${cfgRes.missing.join(", ")}. Ledger entry saved (id ${pending.id}).`,
      );
    }

    try {
      const { txHash, blockNumber } = await mint.mintOnChain(
        cfgRes.cfg,
        wallet as `0x${string}`,
        preset.amount,
      );
      const { data: confirmed } = await supabaseAdmin
        .from("dat_claims")
        .update({
          status: "confirmed",
          tx_hash: txHash,
          block_number: Number(blockNumber),
          updated_at: new Date().toISOString(),
        })
        .eq("id", pending.id)
        .select()
        .single();

      await supabaseAdmin.from("dat_mint_audit").insert({
        ...auditBase,
        status: "confirmed",
        result: { claim_id: pending.id, tx_hash: txHash, block_number: Number(blockNumber) },
      });

      // 5. Creator Royalty — 10% to TREASURY_WALLET. Best-effort: if this leg
      //    fails we still return success to the user (their mint already
      //    confirmed) but we log the failure for retry.
      const royalty = Math.max(1, Math.round(preset.amount * 0.10));
      try {
        const treasury = mint.normalizeAddress(TREASURY_WALLET);
        if (treasury && treasury !== wallet) {
          const { data: royaltyRow } = await supabaseAdmin
            .from("dat_claims")
            .insert({
              wallet: treasury,
              amount: royalty,
              reason: `Creator royalty · 10% of ${preset.amount} $DAT to ${data.preset}`,
              reason_key: null,
              status: "pending",
            })
            .select()
            .single();
          const r = await mint.mintOnChain(cfgRes.cfg, treasury as `0x${string}`, royalty);
          if (royaltyRow) {
            await supabaseAdmin
              .from("dat_claims")
              .update({
                status: "confirmed",
                tx_hash: r.txHash,
                block_number: Number(r.blockNumber),
                updated_at: new Date().toISOString(),
              })
              .eq("id", royaltyRow.id);
          }
          await supabaseAdmin.from("dat_mint_audit").insert({
            wallet: treasury,
            action: "royalty",
            payload: { from_claim: pending.id, amount: royalty },
            ip,
            status: "confirmed",
            result: { tx_hash: r.txHash, block_number: Number(r.blockNumber) },
          });
        }
      } catch (royErr: any) {
        await supabaseAdmin.from("dat_mint_audit").insert({
          wallet: TREASURY_WALLET,
          action: "royalty",
          payload: { from_claim: pending.id, amount: royalty },
          ip,
          status: "royalty_failed",
          error: (royErr?.shortMessage || royErr?.message || String(royErr)).slice(0, 1000),
        });
      }

      return {
        ok: true as const,
        claim: confirmed ?? pending,
        txHash,
        blockNumber: Number(blockNumber),
      };
    } catch (e: any) {
      const message = e?.shortMessage || e?.message || String(e);
      await supabaseAdmin
        .from("dat_claims")
        .update({
          status: "failed",
          error: message.slice(0, 500),
          updated_at: new Date().toISOString(),
        })
        .eq("id", pending.id);
      await supabaseAdmin.from("dat_mint_audit").insert({
        ...auditBase,
        status: "mint_failed",
        error: message.slice(0, 1000),
        result: { claim_id: pending.id },
      });
      throw new Error(`On-chain mint failed: ${message}`);
    }
  });

export const getTreasuryBalance = createServerFn({ method: "GET" })
  .handler(async () => {
    const mint = await import("./dat-mint.server");
    const cfgRes = mint.loadMintConfig();
    if (!cfgRes.ok) {
      return {
        ok: false as const,
        configured: false as const,
        missing: cfgRes.missing,
        treasury: TREASURY_WALLET,
        balance: "0",
        decimals: 18,
      };
    }
    try {
      const raw = await mint.readBalance(cfgRes.cfg, TREASURY_WALLET as `0x${string}`);
      return {
        ok: true as const,
        configured: true as const,
        treasury: TREASURY_WALLET,
        balance: raw.toString(),
        decimals: mint.DAT_DECIMALS,
        contract: cfgRes.cfg.contractAddress,
      };
    } catch (e: any) {
      return {
        ok: false as const,
        configured: true as const,
        treasury: TREASURY_WALLET,
        balance: "0",
        decimals: 18,
        error: e?.shortMessage || e?.message || String(e),
      };
    }
  });

export const getOnChainBalance = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => BalanceInput.parse(d))
  .handler(async ({ data }) => {
    const mint = await import("./dat-mint.server");
    const wallet = mint.normalizeAddress(data.wallet);
    if (!wallet) throw new Error("Invalid wallet address");
    const cfgRes = mint.loadMintConfig();
    if (!cfgRes.ok) {
      return {
        ok: false as const,
        configured: false as const,
        missing: cfgRes.missing,
        balance: "0",
      };
    }
    try {
      const raw = await mint.readBalance(cfgRes.cfg, wallet as `0x${string}`);
      return {
        ok: true as const,
        configured: true as const,
        balance: raw.toString(),
        decimals: mint.DAT_DECIMALS,
        contract: cfgRes.cfg.contractAddress,
      };
    } catch (e: any) {
      return {
        ok: false as const,
        configured: true as const,
        balance: "0",
        error: e?.shortMessage || e?.message || String(e),
      };
    }
  });

export const listClaims = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ListInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const mint = await import("./dat-mint.server");
    const wallet = mint.normalizeAddress(data.wallet);
    if (!wallet) throw new Error("Invalid wallet address");
    const { data: rows, error } = await supabaseAdmin
      .from("dat_claims")
      .select("id,amount,reason,reason_key,status,tx_hash,block_number,error,created_at")
      .eq("wallet", wallet)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (error) throw new Error(error.message);
    return { claims: rows ?? [] };
  });
