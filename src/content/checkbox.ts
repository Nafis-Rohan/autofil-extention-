import type { Profile } from '../types'
import { getLabelText, matchKey } from './detect'
import { valueFor, tokens } from './fill'

// Never auto-tick anything that looks like consent, a legal declaration, or marketing.
const BLOCKED = [
  'agree', 'terms', 'privacy', 'policy', 'consent', 'confirm', 'accurate',
  'certify', 'declare', 'acknowledge', 'authorize', 'accept',
  'subscribe', 'newsletter', 'marketing', 'alert', 'notify', 'contact me',
]

// Negations flip the meaning ("I do NOT require sponsorship"), so leave those alone.
const NEGATIONS = [' not ', "n't", ' no ', 'without', 'never']

function legendOf(el: HTMLInputElement): string {
  return el.closest('fieldset')?.querySelector('legend')?.textContent ?? ''
}

export function fillCheckboxes(profile: Profile): number {
  const boxes = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
  ).filter((c) => !c.disabled && !c.checked && c.offsetParent !== null)

  let filled = 0
  for (const cb of boxes) {
    const own = getLabelText(cb) || cb.value
    const hint = `${legendOf(cb)} ${own} ${cb.name} ${cb.id}`.replace(/[_-]/g, ' ').toLowerCase()
    const padded = ` ${hint} `

    if (BLOCKED.some((w) => padded.includes(w))) continue
    if (NEGATIONS.some((w) => padded.includes(w))) continue

    const key = matchKey(hint)
    if (key !== 'relocate' && key !== 'sponsorship' && key !== 'jobType') continue

    const value = valueFor(key, profile)
    if (!value) continue

    let shouldTick = false
    if (key === 'jobType') {
      const want = tokens(value)
      const have = tokens(own)
      shouldTick = have.length > 0 && want.every((t) => have.includes(t))
    } else {
      shouldTick = value === 'Yes'
    }
    if (!shouldTick) continue

    cb.click() // click() fires the right events, so React forms update too
    filled++
  }
  return filled
}