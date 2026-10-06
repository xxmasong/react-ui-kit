import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { useFocusTrap } from '../hooks/useFocusTrap'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  /** Close when the backdrop is clicked. Disable for destructive confirmations. */
  dismissOnBackdrop?: boolean
  /** Close on Escape. Disable only with a deliberate reason; it is an expected affordance. */
  dismissOnEscape?: boolean
}

/**
 * A modal dialog that follows the WAI-ARIA dialog pattern.
 *
 * Focus is trapped while open and restored on close, the title and description
 * are wired to the dialog with generated ids, and background scrolling is locked
 * so the page behind cannot move under the overlay.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  dismissOnBackdrop = true,
  dismissOnEscape = true,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open || !dismissOnEscape) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, dismissOnEscape, onClose])

  useEffect(() => {
    if (!open) return
    // Preserve whatever overflow the page had rather than assuming 'visible'.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const onBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      // Only a click that both started and ended on the backdrop should close;
      // otherwise a drag that ends outside the panel dismisses unintentionally.
      if (dismissOnBackdrop && event.target === event.currentTarget) onClose()
    },
    [dismissOnBackdrop, onClose],
  )

  if (!open) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="uik-dialog-backdrop" onMouseDown={onBackdropClick} data-testid="dialog-backdrop">
      <div
        ref={panelRef}
        className="uik-dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <h2 id={titleId} className="uik-dialog-title">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="uik-dialog-description">
            {description}
          </p>
        )}
        {children}
        <button type="button" className="uik-dialog-close" onClick={onClose} aria-label="Close dialog">
          &times;
        </button>
      </div>
    </div>,
    document.body,
  )
}
