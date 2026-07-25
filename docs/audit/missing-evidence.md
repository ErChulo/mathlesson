# Missing Evidence

Phase 0 preserved all files found in the supplied v4.9.22 package directory. The following expected materials were not present in that directory when the audit was created.

| Missing material | Expected role | Current impact | Action |
| --- | --- | --- | --- |
| `Briefing.txt` | Additional baseline/project instructions | Cannot cite briefing-specific behavior | Add later under `legacy/mathlesson-v4.9.22/` only if authentic v4.9.22 artifact is available, then update `SHA256SUMS` and `BASELINE.md` |
| `mathlesson-v4.9.22-current-package.zip` | Original package archive | Cannot verify ZIP integrity inside repo | Preserve if provided; record hash |
| v4.9.22 lesson JSON samples | Schema fixtures | Schema inventory relies on built-in lessons and observed import/export code | Add as fixtures after provenance is confirmed |
| v4.9.22 stress-test lessons | Renderer and export stress fixtures | Stress risks remain unexecuted | Add under `legacy` or `tests/fixtures` per policy |
| `prompt-for-json-lesson` v4.9.22-specific file | Prompt library evidence | Prompt button behavior observed, exact source prompt file not preserved | Preserve if supplied; otherwise use in-app prompt text as source |
| Screenshots | Visual parity evidence | No visual baseline comparison possible | Capture baseline screenshots while executing `docs/testing/manual-checklists/mathlesson-v4.9.22-parity.md` |
| Recordings | Interaction/mobile evidence | No video evidence for MathLive/renderer behavior | Capture iPhone and desktop recordings while executing the parity checklist |
| Full manual test report | Acceptance status | The Phase 0 checklist exists, but no checklist item has been executed or accepted | Execute `docs/testing/manual-checklists/mathlesson-v4.9.22-parity.md` before claiming runtime parity |

Nearby historical materials exist under `/home/herick/Documents/mathlesson-development/`, but they are not treated as authoritative v4.9.22 evidence unless explicitly copied and identified by provenance.
