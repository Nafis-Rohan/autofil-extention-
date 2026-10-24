import type { Profile } from '../types'
import { getLabelText, matchKey } from './detect'
import { valueFor, tokens } from './fill'

function groupQuestion(first: HTMLInputElement): string {
  const legend = first.closest('fieldset')?.querySelector('legend')?.textContent
  if (legend) return legend
  const group = first.closest('[role="radiogroup"]')
  if (group) {
    const label = group.getAttribute('aria-label')
    if (label) return label
    const ids = group.getAttribute('aria-labelledby')
    if (ids) return ids.split(' ').map((id) => document.getElementById(id)?.textContent ?? '').join(' ')
  }
  return first.closest('div')?.previousElementSibling?.textContent ?? ''
}

export function fillRadios(profile: Profile): number {
  const radios = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
  ).filter((r) => !r.disabled && r.offsetParent !== null)

  const groups = new Map<string, HTMLInputElement[]>()
  for (const r of radios) {
    if (!r.name) continue
    groups.set(r.name, [...(groups.get(r.name) ?? []), r])
  }

  let filled = 0
  for (const [name, list] of groups) {
    if (list.some((r) => r.checked)) continue // already answered

    const key = matchKey(`${groupQuestion(list[0])} ${name}`.replace(/[_-]/g, ' '))
    if (!key) continue
    const value = valueFor(key, profile)
    if (!value) continue

    const want = tokens(value)
    const labelOf = (r: HTMLInputElement) => tokens(getLabelText(r) || r.value)
    const pick =
      list.find((r) => labelOf(r).join(' ') === want.join(' ')) ??
      list.find((r) => want.every((t) => labelOf(r).includes(t))) ??
      list.find((r) => labelOf(r).length > 0 && labelOf(r).every((t) => want.includes(t)))
    if (!pick) continue

    pick.click() // click() fires the right events, so React forms update too
    filled++
  }
  return filled
}