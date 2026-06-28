// Email subsystem health endpoint.
// Returns queue depths, recent send counts by status, DLQ counts, last send timestamp,
// and a list of registered transactional templates. Intended for the admin dashboard
// and uptime probes. Public read-only — does not expose recipient addresses.

import { createFileRoute } from '@tanstack/react-router'
import { TEMPLATES } from '@/lib/email-templates/registry'

export const Route = createFileRoute('/lovable/email/health')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Auth gate: accept either the service-role key (apikey header) for
        // server-to-server probes, or a Supabase admin JWT (Authorization).
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
        const sentApiKey = request.headers.get('apikey') ?? ''
        let authorized = Boolean(serviceKey) && sentApiKey === serviceKey

        if (!authorized) {
          const authHeader = request.headers.get('authorization') ?? ''
          if (authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice('Bearer '.length).trim()
            const url = process.env.SUPABASE_URL
            const anon = process.env.SUPABASE_PUBLISHABLE_KEY
            if (token && url && anon) {
              try {
                const { createClient } = await import('@supabase/supabase-js')
                const client = createClient(url, anon, {
                  auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
                })
                const { data, error } = await client.auth.getClaims(token)
                const uid = data?.claims?.sub as string | undefined
                if (!error && uid) {
                  const { data: isAdmin } = await client.rpc('has_role', {
                    _user_id: uid,
                    _role: 'admin',
                  })
                  if (isAdmin) authorized = true
                }
              } catch {
                authorized = false
              }
            }
          }
        }

        if (!authorized) {
          return new Response(JSON.stringify({ error: 'unauthorized' }), {
            status: 401,
            headers: { 'content-type': 'application/json' },
          })
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        const [logs24h, dlqAuth, dlqTrans, state, lastSent, suppressed] = await Promise.all([
          supabaseAdmin
            .from('email_send_log')
            .select('status,message_id,created_at')
            .gte('created_at', since)
            .limit(2000),
          supabaseAdmin.rpc('read_email_batch', { queue_name: 'auth_emails_dlq', batch_size: 1, vt: 0 }).then(
            (r) => ({ ok: !r.error, sample: r.data ?? [] }),
            () => ({ ok: false, sample: [] }),
          ),
          supabaseAdmin.rpc('read_email_batch', { queue_name: 'transactional_emails_dlq', batch_size: 1, vt: 0 }).then(
            (r) => ({ ok: !r.error, sample: r.data ?? [] }),
            () => ({ ok: false, sample: [] }),
          ),
          supabaseAdmin.from('email_send_state').select('*').limit(1).maybeSingle(),
          supabaseAdmin
            .from('email_send_log')
            .select('created_at,status,template_name')
            .eq('status', 'sent')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabaseAdmin.from('suppressed_emails').select('email', { count: 'exact', head: true }),
        ])

        // Dedupe by message_id (latest status wins)
        const latest = new Map<string, string>()
        for (const row of (logs24h.data ?? []) as Array<{ status: string; message_id: string | null; created_at: string }>) {
          if (!row.message_id) continue
          if (!latest.has(row.message_id)) latest.set(row.message_id, row.status)
        }
        const counts: Record<string, number> = {}
        for (const s of latest.values()) counts[s] = (counts[s] ?? 0) + 1

        const ok =
          !logs24h.error &&
          dlqAuth.ok &&
          dlqTrans.ok &&
          (counts.dlq ?? 0) === 0

        return Response.json({
          ok,
          checked_at: new Date().toISOString(),
          last_24h: {
            unique_emails: latest.size,
            by_status: counts,
          },
          dlq: {
            auth_has_messages: (dlqAuth.sample as unknown[]).length > 0,
            transactional_has_messages: (dlqTrans.sample as unknown[]).length > 0,
          },
          last_sent: lastSent.data ?? null,
          send_state: state.data ?? null,
          suppressed_total: suppressed.count ?? 0,
          templates: Object.keys(TEMPLATES),
          errors: {
            log: logs24h.error?.message ?? null,
            send_state: state.error?.message ?? null,
            suppressed: suppressed.error?.message ?? null,
          },
        })
      },
    },
  },
})
