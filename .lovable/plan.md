## Plan

1. **Stop blank screens from anonymous ledger writes**
   - Update the protected ledger server functions so missing/invalid auth returns a structured `{ ok: false, code: "AUTH_REQUIRED", status: 401 }` result instead of throwing through the global 500 boundary.
   - Log safe missing-auth details server-side: function name, request path/method, user-agent presence, and request id. Do not log tokens or secrets.

2. **Guard all client ledger call sites**
   - Centralize the “has active session” check in a small browser-safe helper.
   - Use it before `recordSolveServer`, `recordAchievementServer`, and `enqueueDispatchServer`, including the direct call in `qed-computer.tsx`.
   - Keep anonymous behavior local-only with clear UI/local return state instead of invoking protected RPCs.

3. **Add anonymous-call regression tests**
   - Add an integration test that calls each ledger write without auth and verifies a structured 401-style response, not an uncaught error/blank-screen path.
   - Add client-side regression coverage for anonymous save/dispatch paths so they skip protected server calls.

4. **Run security checks and address actionable findings**
   - Run the project security scan.
   - Fix any relevant findings tied to these ledger/webhook/auth surfaces.
   - If a finding is false-positive, document the rationale in security memory instead of suppressing silently.

5. **Validate**
   - Run the targeted Vitest tests and reproduce the anonymous preview flow to confirm no runtime 500/blank screen remains.