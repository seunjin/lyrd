---
'@lyrd/core': minor
'@lyrd/cli': minor
---

Clarify the stable renderer contract by renaming external close requests to `requestDismiss`, exit completion to `completeExit`, and the application option to `dismissPolicy`. Store parallel sessions by overlay group identity so groups are real coordination boundaries rather than strategy wrappers.
