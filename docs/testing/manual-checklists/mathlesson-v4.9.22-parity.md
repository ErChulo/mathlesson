# MathLesson v4.9.22 Manual Parity Checklist

Status: checklist prepared during Phase 0. No item is claimed as passed until a tester records a result, date, browser, device, and evidence link.

Evidence basis: `legacy/mathlesson-v4.9.22/README.md`, `legacy/mathlesson-v4.9.22/START_HERE.md`, `legacy/mathlesson-v4.9.22/read.txt`, `legacy/mathlesson-v4.9.22/next-shit.txt`, and the Phase 0 audit inventories under `docs/audit/`.

## Test Record

| Field | Value |
| --- | --- |
| Tester |  |
| Date |  |
| Baseline file | `legacy/mathlesson-v4.9.22/mathlesson.v4.9.22.html` |
| Baseline SHA-256 | `9d10d5cceb55fafc173c742bf03324f9b851a58b66dfb7dbc42b304ff723c9b1` |
| Desktop browser/OS |  |
| iPhone model/iOS/Safari |  |
| Network mode | Online with CDN access required |
| localStorage state | Fresh / Existing / Corrupt-fixture |
| Screenshots/recordings |  |
| Overall result | Not run |

Result values: `Pass`, `Fail`, `Blocked`, `Not run`, or `N/A`. Failures must include a reproduction note and link to screenshot, recording, console output, or generated file.

## Baseline Setup

| ID | Check | Expected result | Result | Evidence/notes |
| --- | --- | --- | --- | --- |
| SET-001 | Run `sha256sum -c legacy/mathlesson-v4.9.22/SHA256SUMS` before testing | All preserved files return `OK` | Not run |  |
| SET-002 | Open `mathlesson.v4.9.22.html` without editing files under `legacy/` | App loads without syntax errors | Not run |  |
| SET-003 | Confirm CDN access for KaTeX, GSAP, Plotly, Arquero, MathLive, CodeMirror, Mermaid, JSXGraph, math.js, Nerdamer, simple-statistics, and jStat | Network dependencies load or any blocked dependency is recorded | Not run |  |
| SET-004 | Capture browser console after initial load | No unexpected fatal errors before interaction | Not run |  |

## Navigation And Shell

| ID | Check | Expected result | Result | Evidence/notes |
| --- | --- | --- | --- | --- |
| NAV-001 | Select each built-in lesson from the lesson selector | Sidebar and first panel update for each lesson | Not run |  |
| NAV-002 | Click sidebar section links and table-of-contents cards | Active panel, breadcrumb, visited state, and content update once per click | Not run |  |
| NAV-003 | Use previous/next arrow-key navigation outside input fields | Section changes; keys are ignored inside inputs, textareas, selects, math fields, and editors | Not run |  |
| NAV-004 | Reload after visiting a non-first section | Last lesson and section restore from localStorage | Not run |  |
| NAV-005 | Toggle advanced navigation open/closed and reload | Advanced group state persists | Not run |  |
| NAV-006 | Toggle theme and wide/sidebar layout controls | App classes update, preference persists, and renderers remain usable | Not run |  |

## Mobile Shell And Orientation

| ID | Check | Expected result | Result | Evidence/notes |
| --- | --- | --- | --- | --- |
| MOB-001 | Open on iPhone portrait | No horizontal page overflow; primary content remains usable | Not run |  |
| MOB-002 | Open and close mobile sidebar with hamburger and backdrop | Sidebar opens, closes, locks body scroll only while open, and closes after nav tap | Not run |  |
| MOB-003 | Rotate iPhone portrait to landscape and back | Sidebar, active panel, MathLive hint, and renderer sizes recover | Not run |  |
| MOB-004 | Dismiss the mobile orientation hint while focused in a math answer field | Hint hides and dismissed state persists across reload | Not run |  |

## MathLive Keyboard Hotfix

| ID | Check | Expected result | Result | Evidence/notes |
| --- | --- | --- | --- | --- |
| ML-001 | Load the app on desktop and iPhone without focusing a math field | Native MathLive keyboard does not open automatically | Not run |  |
| ML-002 | Tap a quiz or inline exercise `math-field` | Native MathLive keyboard opens only after explicit field interaction | Not run |  |
| ML-003 | Tap keys inside the native MathLive keyboard | Keyboard remains open while entering LaTeX | Not run |  |
| ML-004 | Tap outside both the active `math-field` and keyboard panel | Keyboard dismisses and active field blurs | Not run |  |
| ML-005 | Tap outside on desktop with pointer/mouse and on iPhone with touch | Dismissal works for pointer, mouse, touch, and click paths | Not run |  |
| ML-006 | Reopen keyboard, enter an answer, and press inline exercise `Check` | Keyboard dismisses and does not immediately reopen | Not run |  |
| ML-007 | Reopen keyboard, enter a quiz math answer, and press quiz submit/reset/review controls | Keyboard dismisses and does not leave stale active field state | Not run |  |
| ML-008 | Repeat ML-002 through ML-007 in iPhone portrait and landscape | Bottom keyboard row remains visible and safe-area spacing is preserved | Not run |  |
| ML-009 | Navigate away while a math field was active, then return | Keyboard does not reopen unexpectedly; new fields still work | Not run |  |

## Quiz And Inline Exercises

| ID | Check | Expected result | Result | Evidence/notes |
| --- | --- | --- | --- | --- |
| QUIZ-001 | Answer MC and TF questions, reload before submit | Selections persist from legacy `ml_mc_*` and `ml_tf_*` keys | Not run |  |
| QUIZ-002 | Answer math and free-response questions, reload before submit | Saved answer text persists where baseline supports it | Not run |  |
| QUIZ-003 | Submit quiz with a mix of correct and incorrect answers | Score, feedback, and graded styling match baseline behavior | Not run |  |
| QUIZ-004 | Use review/back, reset, and retake flows | Stale graded classes, score, and saved answers clear or restore according to baseline | Not run |  |
| EX-001 | Check a correct inline exercise answer | Correct result displays, answer locks if baseline locks it, and MathLive dismisses | Not run |  |
| EX-002 | Check incorrect inline exercise answers until hints appear | Attempts and hints behave as baseline | Not run |  |
| EX-003 | Exercise answer variants, regex answers, and symbolic/numeric equivalence examples | Accepted and rejected answers match v4.9.22 | Not run |  |

## Renderer Blocks

| ID | Check | Expected result | Result | Evidence/notes |
| --- | --- | --- | --- | --- |
| RND-001 | Visit sections with KaTeX formulas in lesson content, quiz stems, hints, calculator/statistics output | Math renders without corrupting Mermaid, JSXGraph, code, or source blocks | Not run |  |
| RND-002 | Visit Plotly legacy plots and Explore widgets | Plots render at visible size; sliders update 2D/3D plots after navigation | Not run |  |
| RND-003 | Visit Mermaid diagrams, change theme, and navigate away/back | Diagrams render and rerender from source text, not saved SVG | Not run |  |
| RND-004 | Visit Framework Demo section 5 Diagrams & Geometry | JSXGraph boards render at usable size on desktop and iPhone | Not run |  |
| RND-005 | Rotate iPhone while a JSXGraph board is visible | Board resizes and does not collapse | Not run |  |
| RND-006 | Visit Arquero table blocks | Tables render, overflow remains usable on mobile, and source script is not lost | Not run |  |
| RND-007 | Visit SVG and video/media blocks | SVG scales legibly; video controls/load errors behave as baseline | Not run |  |
| RND-008 | Visit statistics blocks with plots | Results and Plotly charts render; heavy sample caps do not freeze the page | Not run |  |

## Persistence

| ID | Check | Expected result | Result | Evidence/notes |
| --- | --- | --- | --- | --- |
| PER-001 | Mark sections done, add notes, answer quiz, change theme/layout, reload | All supported durable state restores from legacy localStorage keys | Not run |  |
| PER-002 | Clear/reset available state through baseline controls | State clears only for intended keys and UI updates | Not run |  |
| PER-003 | Seed malformed JSON into known JSON-backed keys and reload | App handles corrupt values without fatal boot failure | Not run |  |
| PER-004 | Load existing user lessons from `ml_user_index` and `ml_user_lesson_*` | User lessons appear in selector and can be opened | Not run |  |

## Authoring, Import, And Schema

| ID | Check | Expected result | Result | Evidence/notes |
| --- | --- | --- | --- | --- |
| AUTH-001 | Open Lesson Editor and switch tabs/sections/questions | CodeMirror/editor fields initialize once and retain draft state | Not run |  |
| AUTH-002 | Create or edit a lesson, save it, reload, and select it | Saved lesson persists and boots correctly | Not run |  |
| AUTH-003 | Import valid lesson JSON | Lesson normalizes, saves, appears in selector, and diagnostics are usable | Not run |  |
| AUTH-004 | Import malformed JSON | User-visible error appears without corrupting existing lessons | Not run |  |
| AUTH-005 | Import duplicate lesson JSON | Duplicate handling matches baseline and does not overwrite unexpectedly | Not run |  |
| AUTH-006 | Preserve unknown block/source content through import, save, export, and re-import | Unknown blocks and source HTML are not dropped | Not run |  |
| AUTH-007 | Edit Mermaid, JSXGraph, Plotly/Explore, Arquero, grid, and structured blocks in workspace/structured tools | Source ranges and fallback records remain intact | Not run |  |
| AUTH-008 | Use calculator/statistics insert controls with an editor target | Snippet inserts into intended section and preview refreshes | Not run |  |
| AUTH-009 | Copy prompt-library content | Clipboard succeeds or fallback status appears | Not run |  |

## Export And Print Pipelines

| ID | Check | Expected result | Result | Evidence/notes |
| --- | --- | --- | --- | --- |
| EXP-001 | Export built-in and user lessons as JSON | JSON includes schema metadata, sections, quiz, plots/tables, adapters, and diagnostics | Not run |  |
| EXP-002 | Re-import exported JSON and export again | Content round-trips except normalized timestamps/metadata | Not run |  |
| EXP-003 | Generate student standalone export and open it on desktop | Navigation, quiz, inline exercises, notes, MathLive, and renderers work | Not run |  |
| EXP-004 | Open generated student export on iPhone portrait and landscape | MathLive keyboard policy and renderer sizing match baseline expectations | Not run |  |
| EXP-005 | Generate Reveal export and open deck | Slides load, renderers initialize on ready/load/slide change, and overflow is usable | Not run |  |
| EXP-006 | Run print/PDF planner and browser print preview | Hidden panels are prepared, author UI is excluded, and visuals/tables are not cut off unexpectedly | Not run |  |
| EXP-007 | Verify generated export filenames | Filenames match user-facing baseline labels or any drift is recorded | Not run |  |

## Completion Notes

| Item | Notes |
| --- | --- |
| Blocking failures |  |
| Accepted baseline quirks |  |
| Required migration tests |  |
| Screenshots captured |  |
| Recordings captured |  |
| Generated files archived |  |
