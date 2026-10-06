import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value: string | null
  onChange: (value: string) => void
  label: string
  placeholder?: string
  /** Narrow the list as the user types. Off means the list is always complete. */
  filterable?: boolean
  emptyMessage?: string
}

/**
 * An editable single-select combobox following the ARIA 1.2 pattern.
 *
 * The active option is tracked with `aria-activedescendant` rather than by moving
 * DOM focus, which is what the pattern requires: focus stays in the text input so
 * typing keeps working while the arrow keys walk the list.
 */
export function Combobox({
  options,
  value,
  onChange,
  label,
  placeholder,
  filterable = true,
  emptyMessage = 'No matches',
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)

  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const labelId = useId()

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value])

  const visible = useMemo(() => {
    if (!filterable || query.trim() === '') return options
    const needle = query.trim().toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(needle))
  }, [options, query, filterable])

  // The active index must stay within the filtered list, or arrow keys point at
  // an option that is no longer rendered.
  useEffect(() => {
    setActiveIndex((current) => (current >= visible.length ? visible.length - 1 : current))
  }, [visible.length])

  const close = useCallback(() => {
    setOpen(false)
    setActiveIndex(-1)
    setQuery('')
  }, [])

  const commit = useCallback(
    (option: ComboboxOption) => {
      if (option.disabled) return
      onChange(option.value)
      close()
      inputRef.current?.focus()
    },
    [onChange, close],
  )

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, close])

  function step(delta: number) {
    if (visible.length === 0) return
    setActiveIndex((current) => {
      let next = current
      // Skip disabled options rather than letting the cursor stall on one.
      for (let i = 0; i < visible.length; i += 1) {
        next = (next + delta + visible.length) % visible.length
        if (!visible[next].disabled) return next
      }
      return current
    })
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!open) {
          setOpen(true)
          setActiveIndex(0)
        } else {
          step(1)
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (open) step(-1)
        break
      case 'Enter':
        if (open && activeIndex >= 0 && visible[activeIndex]) {
          event.preventDefault()
          commit(visible[activeIndex])
        }
        break
      case 'Escape':
        if (open) {
          event.preventDefault()
          close()
        }
        break
      case 'Home':
        if (open) {
          event.preventDefault()
          setActiveIndex(0)
        }
        break
      case 'End':
        if (open) {
          event.preventDefault()
          setActiveIndex(visible.length - 1)
        }
        break
      case 'Tab':
        if (open) close()
        break
      default:
        break
    }
  }

  const activeId = activeIndex >= 0 && visible[activeIndex] ? `${listId}-${activeIndex}` : undefined

  return (
    <div className="uik-combobox" ref={rootRef}>
      <label id={labelId} className="uik-combobox-label" htmlFor={`${listId}-input`}>
        {label}
      </label>
      <input
        id={`${listId}-input`}
        ref={inputRef}
        className="uik-combobox-input"
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete={filterable ? 'list' : 'none'}
        aria-activedescendant={activeId}
        placeholder={placeholder}
        value={open ? query : (selected?.label ?? '')}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          setActiveIndex(0)
        }}
        onFocus={() => setOpen(true)}
        // Focus alone is not enough: clicking an input that is already focused
        // fires no focus event, so after a selection the list would stay shut.
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul className="uik-combobox-list" id={listId} role="listbox" aria-labelledby={labelId}>
          {visible.length === 0 && (
            <li className="uik-combobox-empty" role="presentation">
              {emptyMessage}
            </li>
          )}
          {visible.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              className="uik-combobox-option"
              data-active={index === activeIndex || undefined}
              onMouseEnter={() => !option.disabled && setActiveIndex(index)}
              onMouseDown={(event) => {
                // Prevent the input losing focus before the click resolves.
                event.preventDefault()
                commit(option)
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
