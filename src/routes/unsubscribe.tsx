import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/unsubscribe')({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === 'string' ? s.token : '',
  }),
  component: UnsubscribePage,
})

type State =
  | { kind: 'loading' }
  | { kind: 'confirm' }
  | { kind: 'already' }
  | { kind: 'invalid' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

function UnsubscribePage() {
  const { token } = Route.useSearch()
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    if (!token) {
      setState({ kind: 'invalid' })
      return
    }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) return setState({ kind: 'invalid' })
        if (data.valid === false && data.reason === 'already_unsubscribed')
          return setState({ kind: 'already' })
        if (data.valid) return setState({ kind: 'confirm' })
        setState({ kind: 'invalid' })
      })
      .catch((e) => setState({ kind: 'error', message: String(e) }))
  }, [token])

  const confirm = async () => {
    setState({ kind: 'loading' })
    try {
      const r = await fetch('/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await r.json().catch(() => ({}))
      if (data.success) return setState({ kind: 'success' })
      if (data.reason === 'already_unsubscribed')
        return setState({ kind: 'already' })
      setState({ kind: 'error', message: data.error ?? 'Unsubscribe failed' })
    } catch (e) {
      setState({ kind: 'error', message: String(e) })
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full border border-border rounded-lg p-8 bg-card text-card-foreground">
        <h1 className="text-2xl font-semibold mb-4">Email preferences</h1>
        {state.kind === 'loading' && <p className="text-muted-foreground">Loading…</p>}
        {state.kind === 'confirm' && (
          <>
            <p className="text-muted-foreground mb-6">
              Confirm you want to unsubscribe from these emails.
            </p>
            <Button onClick={confirm}>Confirm unsubscribe</Button>
          </>
        )}
        {state.kind === 'already' && (
          <p className="text-muted-foreground">You're already unsubscribed.</p>
        )}
        {state.kind === 'success' && (
          <p className="text-muted-foreground">You've been unsubscribed.</p>
        )}
        {state.kind === 'invalid' && (
          <p className="text-destructive">This unsubscribe link is invalid or expired.</p>
        )}
        {state.kind === 'error' && (
          <p className="text-destructive">{state.message}</p>
        )}
      </div>
    </main>
  )
}
