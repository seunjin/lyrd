# Lyrd integration test prompt

Use this prompt in a target React application repository.

---

Integrate and evaluate Lyrd as the application's modal interaction runtime.

Before editing, read completely:

- https://seunjin.github.io/lyrd/llms.txt
- https://seunjin.github.io/lyrd/llms-full.txt

Goals:

1. Inspect the framework, package manager, root Provider tree, UI primitives, styling conventions, and existing modal components.
2. Run `pnpm dlx @lyrd/cli add overlay --verbose` from the app root, using the equivalent package executor when needed.
3. Review every generated file. Preserve existing app behavior and never overwrite customized files.
4. Mount the generated Provider once. Use the generated scope's typed `useOverlay` hook.
5. Add a removable evaluation route demonstrating:
   - Alert action and its optional synchronous `onAction`
   - Confirm cancel and confirm boolean results
   - async Confirm pending, failure, visible error, and retry
   - one custom JSX overlay opened with `open<Result>(<Component />)`
   - resolved and closed `OverlayOutcome` branches
   - a nested Confirm above the custom overlay, preserving the lower component's state
   - `overlay.close()`, exact `handle.close()`, and `overlay.closeAll()` targets
6. In custom JSX, connect `useOverlaySession<Result>()`, `requestClose()` for ESC/outside attempts, and `completeClose()` after exit animation.
7. Verify the LIFO order, topmost protection while closing, and the configured Escape/outside policies.
8. Verify the JSX props are treated as a call-time snapshot and changing form state is owned inside the open component.
9. Re-run the CLI command and verify generated files are not overwritten.
10. Run formatter, lint, typecheck, tests, and production build, then perform desktop and mobile browser verification.

Constraints:

- Generated renderers and styles belong to the application and may be adapted to its design system.
- Lyrd Core owns modal session flow, not visual primitives or app-specific request fields.
- Use `alert()` and `confirm()` only for their limited common UX.
- Use `open(<Component />)` for Dialog, Sheet, BottomSheet, Drawer, and fullscreen modal UI.
- Keep changing state inside the custom overlay or a store/query addressed by a stable ID.
- Keep Core usage to the five documented application methods and their published types.
- Evaluate Toast separately with the application's notification system; it is outside Lyrd Core and CLI.
- Do not commit secrets, publish packages, or change production behavior outside the evaluation scope.

Deliverables:

- a concise architecture fit summary
- exact files created and edited
- a table of each evaluated API, expected behavior, and observed result
- desktop and mobile browser evidence for Alert, Confirm, retry, custom overlay, and nesting
- commands and results for lint, typecheck, tests, and build
- problems found in Core, CLI templates, or documentation
- an adoption recommendation with concrete reasons

Do not stop after installation. Complete the interaction tests and report evidence.

---
