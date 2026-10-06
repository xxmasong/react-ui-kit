import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Dialog } from '../src/components/Dialog'

function Harness({ dismissOnBackdrop = true, dismissOnEscape = true } = {}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Confirm deletion"
        description="This cannot be undone."
        dismissOnBackdrop={dismissOnBackdrop}
        dismissOnEscape={dismissOnEscape}
      >
        <button>First</button>
        <button>Second</button>
      </Dialog>
    </>
  )
}

describe('Dialog', () => {
  it('renders nothing while closed', () => {
    render(<Harness />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('exposes the ARIA dialog contract', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByText('Open'))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Confirm deletion')
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
  })

  it('moves focus into the dialog on open', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByText('Open'))
    expect(screen.getByText('First')).toHaveFocus()
  })

  it('restores focus to the trigger on close', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const trigger = screen.getByText('Open')

    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(trigger).toHaveFocus()
  })

  it('cycles Tab within the dialog', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByText('Open'))

    const first = screen.getByText('First')
    const close = screen.getByLabelText('Close dialog')

    expect(first).toHaveFocus()
    await user.tab()
    expect(screen.getByText('Second')).toHaveFocus()
    await user.tab()
    expect(close).toHaveFocus()
    // Past the last element, focus wraps rather than escaping to the page.
    await user.tab()
    expect(first).toHaveFocus()
  })

  it('cycles Shift+Tab backwards from the first element', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByText('Open'))

    expect(screen.getByText('First')).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByLabelText('Close dialog')).toHaveFocus()
  })

  it('closes on Escape when enabled', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByText('Open'))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('ignores Escape when disabled', async () => {
    const user = userEvent.setup()
    render(<Harness dismissOnEscape={false} />)
    await user.click(screen.getByText('Open'))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes on a backdrop click when enabled', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByText('Open'))
    await user.click(screen.getByTestId('dialog-backdrop'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('ignores a backdrop click when disabled', async () => {
    const user = userEvent.setup()
    render(<Harness dismissOnBackdrop={false} />)
    await user.click(screen.getByText('Open'))
    await user.click(screen.getByTestId('dialog-backdrop'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not close when the click originates inside the panel', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByText('Open'))
    await user.click(screen.getByText('Second'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('locks and restores background scrolling', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByText('Open'))
    expect(document.body.style.overflow).toBe('hidden')

    await user.keyboard('{Escape}')
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('omits aria-describedby when no description is given', () => {
    const onClose = vi.fn()
    render(
      <Dialog open onClose={onClose} title="Bare">
        <button>Only</button>
      </Dialog>,
    )
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby')
  })
})
