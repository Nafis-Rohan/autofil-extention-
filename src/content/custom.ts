import type { Rule } from '../types'
import { getFields, getHint, getLabelText } from './detect'
import { setValue, tokens } from './fill'
import { mark } from './highlight'
import { groupQuestion } from './radio'

const norm = (s: string) => ` ${tokens(s).join(' ')} `

// The rule with the longest phrase wins, so specific rules beat vague ones.
function findRule(rules: Rule[], question: string): Rule | null {
  const hay = norm(question)
  const byLength = [...rules].sort((a, b) => tokens(b.match).length - tokens(a.match).length)
  return byLength.find((r) => tokens(r.match).length > 0 && hay.includes(norm(r.match))) ?? null
}

// Whole-word matching, so "no" never matches "not applicable".
function bestMatch<T>(items: T[], textOf: (item: T) => string, answer: string): T | null {
  const want = tokens(answer)
  if (want.length === 0) return null
  const list = items.filter((i) => tokens(textOf(i)).length > 0)
  const has = (a: string[], b: string[]) => b.every((t) => a.includes(t))
  return (
    list.find((i) => tokens(textOf(i)).join(' ') === want.join(' ')) ??
    list.find((i) => has(tokens(textOf(i)), want)) ??
    list.find((i) => has(want, tokens(textOf(i)))) ??
    null
  )
}

export interface CustomResult {
  filled: number
  handled: Set<Element> // text boxes and dropdowns this step filled
  radioGroups: Set<string> // radio groups this step answered
}

const TEXT_TYPES = ['text', 'number', 'tel', 'email', 'url', 'search']

// `skip` = fields that belong to the snippet picker (long text), never touched here.
export function applyCustomRules(rules: Rule[], skip: Set<Element>): CustomResult {
  const handled = new Set<Element>()
  const radioGroups = new Set<string>()
  let filled = 0
  if (rules.length === 0) return { filled, handled, radioGroups }

  // ---- text boxes and dropdowns ----
  for (const el of getFields()) {
    if (skip.has(el)) continue
    if (el instanceof HTMLInputElement && !TEXT_TYPES.includes(el.type)) continue // no checkboxes, ever

    const rule = findRule(rules, getHint(el))
    if (!rule) continue

    if (el instanceof HTMLSelectElement) {
      if (el.value !== '' && el.selectedIndex > 0) continue // already chosen
      const options = Array.from(el.options).filter((o) => o.value !== '')
      const option = bestMatch(options, (o) => o.text, rule.answer)
      if (!option) continue
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!
      setter.call(el, option.value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    } else {
      if (el.value.trim() !== '') continue // never overwrite
      setValue(el, rule.answer)
      if (el.value.trim() === '') continue // the box refused it (e.g. text in a number field)
    }

    handled.add(el)
    mark(el, 'yellow')
    filled++
  }

  // ---- radio groups ----
  const groups = new Map<string, HTMLInputElement[]>()
  document.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((r) => {
    if (r.disabled || r.offsetParent === null || !r.name) return
    groups.set(r.name, [...(groups.get(r.name) ?? []), r])
  })

  for (const [name, list] of groups) {
    if (list.some((r) => r.checked)) continue
    const rule = findRule(rules, `${groupQuestion(list[0])} ${name}`.replace(/[_-]/g, ' '))
    if (!rule) continue

    const pick = bestMatch(list, (r) => getLabelText(r) || r.value, rule.answer)
    if (!pick) continue

    pick.click() // click() fires the right events, so React forms update too
    radioGroups.add(name)
    mark(pick, 'yellow')
    filled++
  }

  return { filled, handled, radioGroups }
}