---
'@lyrd/core': minor
---

Return an awaitable `OverlayHandle` from `open()` and `openOrUpdate()` so callers can update or dismiss one exact active session without losing the existing Promise-first API. Rename the identity-based `upsert()` API to `openOrUpdate()` to make its create-or-update behavior explicit.
