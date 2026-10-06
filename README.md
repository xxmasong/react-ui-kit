# react-ui-kit

Accessible React primitives where the keyboard and ARIA behaviour is the feature,
and the test suite is what proves it.

Most component libraries put `role="dialog"` on a div and call it accessible. The
behaviour that actually matters — focus trapped and then *restored*, Tab cycling
that cannot escape, `aria-activedescendant` instead of moving DOM focus, disabled
options that the arrow keys step over — is where these widgets usually break.
Each of those is asserted here: **31 tests** across two components.

## Install

```bash
npm install @xxmasong/react-ui-kit
```

```tsx
import { Dialog, Combobox } from '@xxmasong/react-ui-kit'
import '@xxmasong/react-ui-kit/styles.css' // optional
```

## Dialog

Implements the [WAI-ARIA dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

```tsx
const [open, setOpen] = useState(false)

<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Delete project"
  description="This cannot be undone."
  dismissOnBackdrop={false}   // sensible for destructive confirmations
>
  <button onClick={confirm}>Delete</button>
</Dialog>
```

- Focus moves inside on open and returns to the trigger on close. Without the
  restore step a closing dialog drops focus to `<body>`, which sends keyboard and
  screen-reader users back to the top of the page.
- Tab and Shift+Tab cycle within the panel.
- `aria-labelledby` / `aria-describedby` are wired with generated ids;
  `aria-describedby` is omitted entirely when there is no description, rather than
  pointing at an empty node.
- Background scroll is locked and the page's previous `overflow` is restored, not
  assumed to have been `visible`.
- Backdrop dismissal keys off `mousedown` target identity, so a drag that ends
  outside the panel does not close it.

## Combobox

Implements the [ARIA 1.2 combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

```tsx
<Combobox
  label="Country"
  options={[
    { value: 'ph', label: 'Philippines' },
    { value: 'sg', label: 'Singapore' },
    { value: 'kr', label: 'Korea', disabled: true },
  ]}
  value={value}
  onChange={setValue}
/>
```

| Key | Behaviour |
| --- | --- |
| `ArrowDown` | Open, or move to the next enabled option |
| `ArrowUp` | Previous enabled option |
| `Enter` | Select the active option |
| `Escape` | Close without selecting |
| `Home` / `End` | First / last option |
| `Tab` | Close and move on |

DOM focus stays in the text input throughout; the active option is conveyed with
`aria-activedescendant`. That is what the pattern requires — moving real focus
into the list would stop typing from working.

## Development

```bash
npm install
npm test          # 31 tests, jsdom
npm run typecheck
npm run build
```

### Two bugs the tests caught

Worth recording, because both are easy to ship:

1. **jsdom reports `offsetParent === null` for every element**, having no layout
   engine. A focusable-element filter written as `el.offsetParent !== null` therefore
   matches nothing, the trap silently falls back to focusing its container, and the
   same filter would misbehave under SSR or happy-dom. `isVisible()` now only
   consults `offsetParent` when the element actually has layout.
2. **Clicking an already-focused input fires no focus event**, so a combobox opened
   on `onFocus` alone stays shut when clicked again after a selection. It now opens
   on click as well.

## Known limits

- Two components. This is a focused demonstration of getting a11y right, not a
  complete design system.
- No virtualisation, so a combobox with thousands of options will render them all.
- Single-select only; no multi-select or tags.
- No animation. Any transition added should respect `prefers-reduced-motion`.

## Licence

MIT
