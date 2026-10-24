import { getProfile } from '../storage'
import { getFields, getHint, matchKey } from './detect'
import type { FillableEl } from './detect'
import { fillText, fillSelect } from './fill'
import { fillRadios } from './radio'
import { fillCheckboxes } from './checkbox'
import { clearMarks, mark } from './highlight'

function isEmpty(el: FillableEl): boolean {
  if (el instanceof HTMLSelectElement) return el.value === '' || el.selectedIndex === 0
  return el.value.trim() === ''
}

async function run() {
  clearMarks()
  const profile = await getProfile()
  const fields = getFields()
  let filled = 0
  let red = 0

  for (const el of fields) {
    // radios and checkboxes are handled separately below
    if (el instanceof HTMLInputElement && ['radio', 'checkbox'].includes(el.type)) continue

    const key = matchKey(getHint(el))
    const isSelect = el instanceof HTMLSelectElement
    const ok = key ? (isSelect ? fillSelect(el, key, profile) : fillText(el, key, profile)) : false

    if (ok) {
      filled++
      mark(el, isSelect ? 'yellow' : 'green')
    } else if (isEmpty(el) && (key || el.required)) {
      mark(el, 'red')
      red++
    }
  }

  for (const r of fillRadios(profile)) {
    filled++
    mark(r, 'yellow')
  }
  for (const c of fillCheckboxes(profile)) {
    filled++
    mark(c, 'yellow')
  }

  chrome.runtime.sendMessage({ type: 'fillResult', filled, total: fields.length, red })
}

run()