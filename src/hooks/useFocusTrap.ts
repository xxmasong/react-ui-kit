import { useEffect, type RefObject } from 'react'

/** Elements that can hold focus, excluding anything explicitly removed from the tab order. */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function isVisible(el: HTMLElement): boolean {
  if (el.hasAttribute('hidden')) return false
  if (el.getAttribute('aria-hidden') === 'true') return false

  const style = getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden') return false

  // `offsetParent` is the cheap way to catch an ancestor with display:none, but
  // environments without a layout engine (jsdom, happy-dom, SSR snapshots) report
  // null for everything. Trusting it there would empty the list and break the
  // trap, so only consult it where layout is actually computed.
  const hasLayout =
    el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0
  if (hasLayout && el.offsetParent === null && style.position !== 'fixed') return false

  return true
}

function focusableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isVisible)
}

/**
 * Confine Tab cycling to `containerRef` while `active`.
 *
 * On activation focus moves inside the container, and on deactivation it returns
 * to whatever was focused beforehand — without this a closing dialog drops focus
 * to `<body>`, which silently sends screen-reader and keyboard users back to the
 * top of the page.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    const initial = focusableWithin(container)
    if (initial.length > 0) {
      initial[0].focus()
    } else {
      // Nothing focusable inside: make the container itself the focus target so
      // the trap still has somewhere to hold focus.
      container.setAttribute('tabindex', '-1')
      container.focus()
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab') return

      const items = focusableWithin(container!)
      if (items.length === 0) {
        event.preventDefault()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement

      if (event.shiftKey && (current === first || !container!.contains(current))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && current === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      previouslyFocused?.focus?.()
    }
  }, [containerRef, active])
}
