# tpl-availability-checker

`check.js` logs in to tpl:map (ePASS) and lists which attractions still have passes.
An attraction is available if "All passes for this attraction have been reserved." is not shown under it.

Credentials come from env vars `EPASS_USER` and `EPASS_PASS` (never commit them). Notification CCs use `epass_cc1`, `epass_cc2`, ...
