# MathLesson v4.9.22

Current app file: `mathlesson.v4.9.22.html`.

This is a narrow MathLive dismissal hotfix after v4.9.21.

## What changed

- The real native MathLive keyboard behavior from v4.9.21 is preserved.
- The keyboard still opens only after explicit interaction with a MathLive math field.
- The keyboard now dismisses when the user taps/clicks outside both the math field and the native MathLive keyboard panel.
- Taps inside the MathLive keyboard panel should not dismiss it.
- The existing `Check` / quiz-submit dismissal behavior is preserved.
- The iPhone bottom safe-area keyboard sizing is preserved.
- The JSXGraph mobile layout fix is preserved.

## Test target

Test on iPhone portrait and landscape. Tap a math answer field, confirm the native MathLive keyboard opens, tap outside the field and outside the keyboard, and confirm the keyboard dismisses.
