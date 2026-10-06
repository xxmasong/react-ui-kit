import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { Combobox, Dialog, type ComboboxOption } from '@kit/index'
import '@kit/styles.css'
import './demo.css'

const COUNTRIES: ComboboxOption[] = [
  { value: 'ph', label: 'Philippines' },
  { value: 'sg', label: 'Singapore' },
  { value: 'jp', label: 'Japan' },
  { value: 'kr', label: 'Korea', disabled: true },
  { value: 'vn', label: 'Vietnam' },
  { value: 'th', label: 'Thailand' },
  { value: 'my', label: 'Malaysia' },
  { value: 'id', label: 'Indonesia' },
]

function Section({
  title,
  children,
  notes,
}: {
  title: string
  children: React.ReactNode
  notes: string[]
}) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <div className="stage">{children}</div>
      <h3>Try it with the keyboard</h3>
      <ul className="notes">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  )
}

function DialogDemo() {
  const [open, setOpen] = useState(false)
  const [destructive, setDestructive] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const record = (entry: string) => setLog((prior) => [entry, ...prior].slice(0, 4))

  return (
    <>
      <div className="row">
        <button className="btn" onClick={() => { setDestructive(false); setOpen(true) }}>
          Open dialog
        </button>
        <button
          className="btn btn-danger"
          onClick={() => { setDestructive(true); setOpen(true) }}
        >
          Open destructive dialog
        </button>
      </div>

      <p className="hint">
        Focus returns to whichever button opened it — the detail most
        implementations miss.
      </p>

      {log.length > 0 && (
        <ul className="log">
          {log.map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ul>
      )}

      <Dialog
        open={open}
        onClose={() => { setOpen(false); record('closed') }}
        title={destructive ? 'Delete this project?' : 'Invite a teammate'}
        description={
          destructive
            ? 'This cannot be undone. Backdrop and Escape dismissal are disabled here.'
            : 'They will receive an email with a join link.'
        }
        dismissOnBackdrop={!destructive}
        dismissOnEscape={!destructive}
      >
        {destructive ? (
          <div className="row">
            <button className="btn" onClick={() => { setOpen(false); record('cancelled') }}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={() => { setOpen(false); record('confirmed the delete') }}
            >
              Delete
            </button>
          </div>
        ) : (
          <div className="stack">
            <label className="field">
              <span>Email</span>
              <input type="email" placeholder="name@example.com" />
            </label>
            <div className="row">
              <button className="btn" onClick={() => { setOpen(false); record('cancelled') }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => { setOpen(false); record('sent the invite') }}
              >
                Send invite
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  )
}

function ComboboxDemo() {
  const [country, setCountry] = useState<string | null>(null)
  const [plain, setPlain] = useState<string | null>('sg')

  return (
    <div className="grid">
      <div>
        <Combobox
          label="Country (type to filter)"
          options={COUNTRIES}
          value={country}
          onChange={setCountry}
          placeholder="Start typing…"
        />
        <p className="hint">
          Selected: <code>{country ?? 'none'}</code>
        </p>
      </div>
      <div>
        <Combobox
          label="Country (no filtering)"
          options={COUNTRIES}
          value={plain}
          onChange={setPlain}
          filterable={false}
        />
        <p className="hint">
          Selected: <code>{plain ?? 'none'}</code>
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <main>
      <header className="masthead">
        <h1>react-ui-kit</h1>
        <p className="tagline">
          Accessible React primitives where the keyboard and ARIA behaviour is the
          feature — and the test suite is what proves it.
        </p>
        <p className="meta">
          <strong>31 tests</strong> covering focus restoration, Tab cycling,
          <code>aria-activedescendant</code> and disabled-option skipping.
        </p>
        <nav className="links">
          <a href="https://github.com/xxmasong/react-ui-kit">Source on GitHub</a>
          <a href="https://github.com/xxmasong/react-ui-kit#tests">What the tests assert</a>
        </nav>
      </header>

      <Section
        title="Dialog"
        notes={[
          'Tab and Shift+Tab cycle inside the panel and cannot escape it.',
          'Escape closes it, and focus returns to the button that opened it.',
          'The destructive variant ignores Escape and backdrop clicks on purpose.',
          'A drag that starts inside the panel and ends outside does not dismiss it.',
        ]}
      >
        <DialogDemo />
      </Section>

      <Section
        title="Combobox"
        notes={[
          'Arrow keys move the active option; focus stays in the text input.',
          'Korea is disabled — the arrow keys step over it rather than stalling.',
          'Home and End jump to the first and last option.',
          'Escape closes without selecting; clicking outside closes too.',
        ]}
      >
        <ComboboxDemo />
      </Section>

      <section className="card">
        <h2>Two bugs the tests caught</h2>
        <ol className="notes">
          <li>
            <strong>jsdom reports <code>offsetParent === null</code> for every
            element</strong>, having no layout engine. A focusable-element filter
            written as <code>el.offsetParent !== null</code> therefore matches
            nothing, so the focus trap silently fell back to focusing its own
            container — and the same filter would misbehave under SSR.
          </li>
          <li>
            <strong>Clicking an already-focused input fires no focus event</strong>,
            so a combobox opened on <code>onFocus</code> alone stayed shut when
            clicked again after a selection.
          </li>
        </ol>
      </section>

      <footer className="foot">
        Built by Xeno Xerxes Masong · MIT licensed
      </footer>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
