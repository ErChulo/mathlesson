# Event-Handler Inventory

Static audit detected 145 `addEventListener` registrations in `_inline.v4.9.22.mjs`.

Event type counts from `analysis/baseline-audit-v4.9.22.json`: click 82, input 18, change 9, resize 4, orientationchange 3, keydown 3, pointerdown 3, mousedown 2, touchstart 2, visibilitychange 2, focus 2, blur 1, focusin 1, focusout 1, pointermove 1, pointerup 1, geometrychange 1, beforeprint 1, afterprint 1, hashchange 1, load 2, DOMContentLoaded 1, timeupdate 1, error 2.

| Event type | Target | Registration location | Delegated/direct | Handler | State effects | DOM effects | Persistence effects | Renderer effects | Cleanup status | React migration risk | Required regression test | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `DOMContentLoaded` | `document` | `_inline.v4.9.22.mjs:7688-7863` | Direct bootstrap | Large inline setup closure | Initializes app, editor, theme/layout, restored lesson/section | Wires many controls | Reads `ml_lesson`, `ml_section_*`, `ml_advanced_nav_open` | Calls `boot`, renderer setup through navigation | No explicit cleanup | High: React must split boot from UI event wiring | Initial load restores last lesson/section once, no duplicate listeners | High |
| `click` | Sidebar dynamic nav items | `boot` `900-918` | Direct per nav item | `goPanel(s.id)` | Active panel, visited set | Nav/panel classes | `ml_visited_*`, `ml_section_*` | Initializes renderers for target panel | Rebuilt on boot after panels removed | High: avoid duplicate handlers after import/boot | Switch lessons repeatedly, nav still single-fires | High |
| `click` | Static sidebar and advanced nav | `7703-7713` | Direct | `goPanel`, `setAdvancedOpen` | Panel and advanced group state | Sidebar/body classes | `ml_advanced_nav_open` | Indirect via `goPanel` | No cleanup | Medium | Advanced group persists open state across reload | High |
| `click` | Mobile hamburger/backdrop/nav | `7735-7761` | Direct | `openSidebar`, `closeSidebar` | Sidebar open state | `.mobile-open`, body overflow | None | None | No cleanup | Medium | Mobile sidebar opens/closes and closes after nav tap | High |
| `keydown` | `document` | `7763-7771`, `7780-7782` | Direct global | Section arrow nav and Escape editor close | Active section/editor open | Panel/modal classes | Section persistence via `goPanel` | Indirect renderer init | No cleanup | High: global keyboard conflicts with editors and MathLive | Arrow keys ignored in inputs, textareas, selects, math-field, editor | High |
| `focusin`/`focusout` | `document` | `166-176` | Capturing global | Orientation hint update | `activeLatexInput` closure | Body orientation hint class | Reads dismissed key | MathLive UX only | No cleanup | High: singleton duplicated if mounted twice | Hint appears only during math-answer entry on small portrait | High |
| `click` | Orientation dismiss button | `177-182` | Delegated document | Dismiss orientation hint | Closure state | Hides hint | `mathlesson.mobile.orientationHint.dismissed.v2` | None | No cleanup | Medium | Dismiss survives reload | High |
| `resize`/`orientationchange` | `window` | `183-184` | Direct global | Orientation hint update | Closure state | Hint classes | Reads dismissed key | None | No cleanup | High | Rotate with focused math field; hint visibility correct | High |
| `pointerdown`/`mousedown`/`touchstart`/`click` | `math-field` | `227-236` | Direct per math field | `mlShowRealMathLiveKeyboard` | `window.__mlActiveMathLiveField`, suppression check | Opens native MathLive keyboard | None | MathLive keyboard show | No per-field cleanup | Critical | Keyboard opens only after deliberate math-field interaction | High |
| `pointerdown`/`mousedown`/`touchstart`/`click` | `document` | `264-274` | Capturing delegated | Apply MathLive options and show keyboard | Active math field | Field attrs/classes | None | MathLive keyboard show | No cleanup | Critical | Imported/newly-rendered math fields still open native keyboard | High |
| `pointerdown`/`mousedown`/`touchstart`/`click` | `document` | `293-307` | Capturing delegated | Outside tap dismissal | Clears `window.__mlActiveMathLiveField` | Blurs active field, hides keyboard | None | MathLive keyboard hide | No cleanup | Critical | Outside tap dismisses; keyboard tap does not dismiss | High |
| `pointerdown`/`mousedown`/`touchstart`/`click` | `document` | `308-319` | Capturing delegated | Dismiss on Check/submit/reset/review controls | Suppression window | Hides keyboard | None | MathLive keyboard hide | No cleanup | Critical | Check and quiz submit dismiss keyboard and do not reopen | High |
| `geometrychange` | `window.mathVirtualKeyboard` | `320-329` | Direct | Update CSS variable | None | Sets `--ml-mathlive-keyboard-height` | None | MathLive layout | No cleanup | Critical | iPhone bottom row visible, safe-area preserved | High |
| `focus`/`blur` | Inputs/math fields | `126-131`, student `4756` | Direct per input | Scroll and Done button | Done button state | Scrolls field, toggles button | None | MathLive/mobile UX | No cleanup | High | Focus math field scrolls into view; blur hides Done button | High |
| `click` | Inline exercise Check | `1510-1528`, duplicate path `6523-6543`, student `5403-5419` | Direct per widget | Answer check | Attempts, disabled/readOnly | Result/hint classes/text | None in main | MathLive hide, KaTeX hint | No explicit cleanup; guarded by dataset | Critical | Exercise checks once, hint after attempts, no duplicate checking | High |
| `click` | Quiz MC/TF options | `1633-1655`; student `5519-5531` | Delegated in main; direct in student | Save selections | `mcSel`, `tfSel`; student saved maps | Selection classes | `ml_mc_*`, `ml_tf_*`, student `quiz_mc`, `quiz_tf` | None | Main guard `dataset.quizDelegateBound`; student rerenders clean | High | Reset/rerender does not duplicate option handlers | High |
| `input` | Free-response quiz textarea | `1623-1631`; student `5551-5555` | Direct per textarea | Save free answer | Text value | None | `ml_free_*`, student `quiz_free` | None | No cleanup; rerender removes nodes | Medium | Free response persists after reload before submit | High |
| `click` | Quiz submit/reset/review buttons | `7792-7797`; student `5556-5567` | Direct | `submitQuiz`, `resetQuiz`, review mode | Score/graded state | Score panel/review UI | `ml_score_*`, clear score; student `quiz_score` | MathLive hide | No cleanup | Critical | Submit, reset, retake, review/back flows | High |
| `timeupdate` | Audio element | `1175-1180` | Direct | Progress bar update | Audio progress | Width of `#audio-fill` | None | Audio | No cleanup | Low | Audio progress updates when audio plays | High |
| `click` | Audio play | `1181-1186` | Direct | Play/pause | Audio paused state | Button text | None | Browser audio | No cleanup | Low | No-audio alert and play/pause toggle | High |
| `click` | Demo audio controls | `1275-1291` | Direct guarded by `_wired` | Start/stop WebAudio | AudioContext/source globals | Button text/progress | None | Canvas/audio animation | Partial cleanup in `stopAudio`; canvas frame persists | Medium | Demo panel re-entry does not double-wire; stop cleans audio | Medium |
| `input`/`change`/`click` | Statistics panel | `2210-2232` | Direct | Compute/clear/load/insert | `statLastResult`, initialized flag | Status/output/plot | Insert saves via editor | Plotly stat plots | No cleanup | Medium | Stats examples run and insert into editor | High |
| `click`/`keydown` | Calculator panel | `2306` | Direct | Run/clear/load/insert | `calcLastResult`, editor target | Status/output/preview | `ml_calc_editor_target_v1`; editor save | KaTeX preview | No cleanup | Medium | Ctrl+Enter runs calculator; insert refreshes active lesson | High |
| `pointerdown`/`pointermove`/`pointerup`/`resize` | Editor window | `1979-2030` | Direct | Drag/resize editor modal | Editor window state/timer | Modal position/size | `ml_editor_window_v1` | CodeMirror refresh likely | Move listeners removed on pointerup; resize global remains | Medium | Drag/resize, fullscreen, mobile constraints | High |
| `click`/`input`/`change` | Editor controls | `2477-2560` | Direct | Many editor operations | `edLesson`, `edSecIdx`, `edQIdx`, dirty flag | Lists/forms/preview | `ml_user_*`, draft only on save | CodeMirror refresh, preview renderers | No cleanup; modal lifetime global | High | Create/edit/save/import/export without duplicate handlers | High |
| `change` | File import inputs | `2551-2552`, `5906-5929` | Direct | `editorImport` | `edLesson`, existing map | Dropdown/status/diagnostics | Saves imported lessons | Boot imported lesson | Input reset in finally | High | Import valid, duplicate, bad JSON; navigation after import | High |
| `beforeprint`/`afterprint` | `window` | `4230-4231` | Direct global | Prepare/cleanup print | Print preparing state | Body class, render all panels | None | Plotly/JSXGraph resize/render | No cleanup | High | Print preview renders hidden panels/visuals | High |
| `hashchange` | `window` student export | `4782-4785` | Direct | Student panel navigation | `studentActivePanel` | Panel/nav classes | Visited saving | Runtime block init | No cleanup in standalone | Medium | Student export hash navigation works | High |
| `resize`/`orientationchange`/`visualViewport.resize`/`visibilitychange` | Window/document | `7558-7562`; student `5758` | Direct global | Schedule JSXGraph resize | Board resize timer | Board container sizes | None | JSXGraph resize | No cleanup | Critical | Orientation changes do not collapse JSXGraph boards | High |
| `input` | Plotly Explore sliders | `6422-6428`; Reveal runtime `4343`; student `5152-5156` | Direct per slider | Parameter state closure | Plot redraw | None | `Plotly.react` | No cleanup; container teardown removes nodes | High | Sliders update 2D/3D plots after navigation/export | High |
| `load` | Reveal generated deck | `4391-4392` | Direct | `renderDeck` | Deck rendered state | Slides render | None | All deck renderers | Export-only | High | Generated Reveal deck renders on ready/load/slide change | High |
| `error` | Video | `1028-1035` | Direct per video | None | Appends video-load note | None | Video placeholder | No cleanup; guarded by dataset | Low | Missing video displays actionable note | High |

## Missing Or Weak Cleanup Areas

| Area | Risk | Evidence |
| --- | --- | --- |
| Global MathLive document listeners | Duplicate listeners if React mounts service more than once | `264-319` |
| Global resize/orientation listeners | Multiple services could compete if not centralized | `183-184`, `7558-7562` |
| CodeMirror instances | Need explicit `toTextArea`/dispose equivalent during component unmount | `2405-2475` |
| Plotly canvases | Baseline purges inactive canvases but only under specific selectors | `847-857` |
| JSXGraph boards | Baseline has explicit destroy path; React must call it on unmount/lesson change | `7548-7556` |
| Demo canvas animation | `requestAnimationFrame` restarts on panel entry; cleanup only cancels previous frame before drawing | `1191-1233` |

## React Migration Rules From Event Evidence

1. Centralize global event listeners in one lifecycle module per concern.
2. Keep MathLive keyboard listeners outside JSX and behind an idempotent service.
3. Use event delegation only when preserving dynamic legacy behavior or reducing per-node wiring.
4. Renderer adapters own resize/orientation handling and cleanup.
5. Add regression tests before moving quiz/exercise handlers because they combine DOM, persistence, and MathLive side effects.
