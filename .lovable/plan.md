## Run the test suite

Execute `bun run test` (vitest, 3 suites):

1. `tests/unit/qed_engine.test.ts` — QED convergence < 1e-11.
2. `tests/integration/api.test.ts` — `/api/qed` + `/api/benchmark` handler logic.
3. `tests/integration/ledger.test.ts` — autosave + DAT credit (jsdom).
4. `tests/benchmarks/qed_perf.test.ts` — 6-loop perf budget < 5 ms.

If any test fails I'll read the failure, fix the source (not the assertion), and re-run until green. Approve to execute.