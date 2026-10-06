import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { Combobox, type ComboboxOption } from '../src/components/Combobox'

const OPTIONS: ComboboxOption[] = [
  { value: 'ph', label: 'Philippines' },
  { value: 'sg', label: 'Singapore' },
  { value: 'jp', label: 'Japan' },
  { value: 'kr', label: 'Korea', disabled: true },
  { value: 'vn', label: 'Vietnam' },
]

function Harness({ filterable = true }: { filterable?: boolean } = {}) {
  const [value, setValue] = useState<string | null>(null)
  return (
    <Combobox
      options={OPTIONS}
      value={value}
      onChange={setValue}
      label="Country"
      placeholder="Pick one"
      filterable={filterable}
    />
  )
}

const input = () => screen.getByRole('combobox')

describe('Combobox', () => {
  it('starts collapsed with the listbox absent', () => {
    render(<Harness />)
    expect(input()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('associates the label with the input', () => {
    render(<Harness />)
    expect(input()).toHaveAccessibleName('Country')
  })

  it('opens on ArrowDown and marks the first option active', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(input())
    await user.keyboard('{Escape}')
    await user.keyboard('{ArrowDown}')

    expect(input()).toHaveAttribute('aria-expanded', 'true')
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('data-active', 'true')
    expect(input()).toHaveAttribute('aria-activedescendant', options[0].id)
  })

  it('keeps DOM focus on the input while navigating', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(input())
    await user.keyboard('{ArrowDown}{ArrowDown}')

    // The ARIA pattern requires activedescendant, not focus movement, so typing
    // keeps working while the arrows walk the list.
    expect(input()).toHaveFocus()
  })

  it('selects the active option on Enter', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(input())
    await user.keyboard('{ArrowDown}{Enter}')

    expect(input()).toHaveValue('Philippines')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('skips disabled options when stepping', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(input())
    // Philippines, Singapore, Japan, [Korea disabled], Vietnam
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}')

    const active = screen.getAllByRole('option').find((o) => o.hasAttribute('data-active'))
    expect(active).toHaveTextContent('Vietnam')
  })

  it('marks disabled options with aria-disabled', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(input())
    expect(screen.getByRole('option', { name: 'Korea' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('does not select a disabled option', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(input())
    await user.click(screen.getByRole('option', { name: 'Korea' }))

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(input()).not.toHaveValue('Korea')
  })

  it('filters the list as the user types', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(input())
    await user.type(input(), 'ja')

    const labels = screen.getAllByRole('option').map((o) => o.textContent)
    expect(labels).toEqual(['Japan'])
  })

  it('filters case-insensitively', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(input())
    await user.type(input(), 'SINGA')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Singapore'])
  })

  it('shows the empty message when nothing matches', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(input())
    await user.type(input(), 'zzzz')

    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByText('No matches')).toBeInTheDocument()
  })

  it('does not filter when filterable is off', async () => {
    const user = userEvent.setup()
    render(<Harness filterable={false} />)
    await user.click(input())
    await user.type(input(), 'ja')

    expect(screen.getAllByRole('option')).toHaveLength(OPTIONS.length)
    expect(input()).toHaveAttribute('aria-autocomplete', 'none')
  })

  it('selects on click', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(input())
    await user.click(screen.getByRole('option', { name: 'Japan' }))

    expect(input()).toHaveValue('Japan')
  })

  it('reflects the selection with aria-selected', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(input())
    await user.click(screen.getByRole('option', { name: 'Japan' }))
    await user.click(input())

    expect(screen.getByRole('option', { name: 'Japan' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: 'Singapore' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('closes on Escape without selecting', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(input())
    await user.keyboard('{ArrowDown}{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(input()).toHaveValue('')
  })

  it('supports Home and End', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(input())
    await user.keyboard('{End}')
    let active = screen.getAllByRole('option').find((o) => o.hasAttribute('data-active'))
    expect(active).toHaveTextContent('Vietnam')

    await user.keyboard('{Home}')
    active = screen.getAllByRole('option').find((o) => o.hasAttribute('data-active'))
    expect(active).toHaveTextContent('Philippines')
  })

  it('closes when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Harness />
        <button>Outside</button>
      </>,
    )
    await user.click(input())
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.click(screen.getByText('Outside'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('wires aria-controls to the listbox id', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(input())
    expect(input().getAttribute('aria-controls')).toBe(screen.getByRole('listbox').id)
  })
})
