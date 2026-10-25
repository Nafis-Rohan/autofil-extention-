import { getProfile, getSkills, getSnippets } from '../storage'
import { getFields, getHint, matchKey } from './detect'
import type { FillableEl } from './detect'
import { fillText, fillSelect } from './fill'
import { fillRadios } from './radio'
import { fillCheckboxes } from './checkbox'
import { clearMarks, mark } from './highlight'
import { findLongTextFields, suggestCategory } from './longtext'
import { addPicker, removePickers } from './picker'
import { applySkillRules } from './rules'

function isEmpty(el: FillableEl): boolean {
  if (el instanceof HTMLSelectElement) return el.value === '' || el.selectedIndex === 0
  return el.value.trim() === ''
}

async function run() {
  clearMarks()
  removePickers()
  const profile = await getProfile()
  const skills = await getSkills()
  const snippets = await getSnippets()
  const fields = getFields()

  // Long-text fields get a snippet picker instead of keyword filling.
  const longFields = findLongTextFields().filter(
    ({ hint }) => suggestCategory(hint) !== null || matchKey(hint) === null,
  )
  const longEls = new Set<Element>(longFields.map((f) => f.el))

  // "X+ years of Y?" questions are answered from your skills list.
  const rules = applySkillRules(skills)
  let filled = rules.filled
  let red = rules.red

  for (const el of fields) {
    // radios and checkboxes are handled separately below
    if (el instanceof HTMLInputElement && ['radio', 'checkbox'].includes(el.type)) continue
    if (longEls.has(el) || rules.handled.has(el)) continue

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

  for (const r of fillRadios(profile, rules.radioGroups)) {
    filled++
    mark(r, 'yellow')
  }
  for (const c of fillCheckboxes(profile)) {
    filled++
    mark(c, 'yellow')
  }

  for (const { el, hint } of longFields) {
    addPicker(el, suggestCategory(hint) ?? 'custom', snippets, profile)
  }

  chrome.runtime.sendMessage({ type: 'fillResult', filled, total: fields.length, red })
}

run()