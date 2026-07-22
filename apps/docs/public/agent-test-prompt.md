# Lyrd integration test prompt

Use this prompt in the target React application repository.

---

Integrate and evaluate Lyrd in this application as a real product-level overlay system.

Before editing anything, read these documents completely:

- https://seunjin.github.io/lyrd/llms.txt
- https://seunjin.github.io/lyrd/llms-full.txt

Use the exact CLI version documented for this evaluation when one is provided, and run `--help` before installation to verify that `add toast` exists. Do not invent APIs that are not documented. In particular, there is no built-in `overlay.toast()` API; Toast is an app-owned CLI-generated adapter.

Goals:

1. Inspect this repository's framework, package manager, application entry point, existing Provider tree, UI primitives, styling conventions, and existing Dialog or Toast components.
2. Run `pnpm dlx @lyrd/cli add overlay --verbose` from the application root. If this repository does not use pnpm, use the equivalent package executor.
3. Review every generated file before changing the application. Preserve existing files and product-specific behavior.
4. Mount the generated overlay Provider exactly once. For Next App Router, keep the client bridge separate from the Server Component layout. For Vite, compose it in the existing root render tree.
5. Add a small, removable evaluation screen or development-only route that demonstrates:
   - Alert acknowledgement
   - Confirm cancel and confirm outcomes
   - asynchronous Confirm pending, failure, and retry
   - one typed custom overlay created with `defineOverlay()` and opened with `overlay.open()`
   - both resolved and dismissed `OverlayOutcome` branches
6. Run `pnpm dlx @lyrd/cli add toast --verbose`. Render `AppToastProvider` next to `OverlayProvider` once. Keep the generated global manager connection intact, and demonstrate a simple `notify()`, actionable `notifyWithUndo()`, at least two simultaneous Toasts, and six Toasts to verify the generated `data-limited` styling.
7. If this application has a progress-like operation, retain the awaitable handle returned by `open()` or `openOrUpdate()`, update that exact session with `handle.update()`, and await its final outcome. Use `openOrUpdate()` only if the application has an honest stable operation identity shared by multiple call sites.
8. Verify the default modal queue does not overlap, parallel Toasts do not block modal overlays, and route cleanup can call `dismissAll('route-change')` when appropriate.
9. Re-run the CLI commands and verify customized generated files are not overwritten.
10. Run the repository's formatter, lint, typecheck, tests, and production build. Perform browser verification for every added interaction.

Constraints:

- Generated renderers and CSS belong to this application and may be adapted to its design system.
- Lyrd core owns lifecycle and scheduling policy, not visual primitives.
- Reuse the application's existing Base UI, Radix, shadcn, or custom components when appropriate, but do not move application-specific UI into Lyrd core.
- Use `alert()` and `confirm()` for the safe common paths.
- Use `defineOverlay()` for reusable custom overlays.
- Use `overlay.dialog()` only as a migration or one-off escape hatch.
- Use a retained Handle for local session updates and `openOrUpdate()` only for a stable identity shared across call sites.
- Use a parallel group only for overlays that genuinely must not queue.
- Do not commit secrets, publish packages, or change production behavior outside the evaluation scope.

Deliverables:

- a concise summary of how Lyrd fits this application's architecture
- the exact files created and edited
- a table of each evaluated API, expected behavior, and observed result
- screenshots or browser evidence for Alert, Confirm, custom overlay, and parallel Toast
- commands and results for lint, typecheck, tests, and build
- problems found in Lyrd, generated templates, or documentation
- a recommendation: adopt, adopt with changes, or do not adopt, with concrete reasons

Do not stop after installation. Complete the interaction tests and report evidence.

---
