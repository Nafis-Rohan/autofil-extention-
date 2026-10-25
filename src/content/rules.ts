import type { Skills } from '../types'
import { getFields, getHint, getLabelText } from './detect'
import { setValue, tokens } from './fill'
import { mark } from './highlight'
import { groupQuestion } from './radio'

const norm = (s: string) => ` ${tokens(s).join(' ')} `

// "2+ years", "at least 3 years", "3-5 years" -> the first number
export function requiredYears(q: string): number | null {
  const m = q
    .toLowerCase()
    .match(/(\d+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*\d+(?:\.\d+)?)?\s*\+?\s*(?:or more\s+)?(?:years?|yrs?)\b/)
  return m ? Number(m[1]) : null
}

function isYearsQuestion(q: string): boolean {
  return (
    requiredYears(q) !== null ||
    (/\b(years?|yrs?)\b/i.test(q) && /\bexperience\b|\bexp\b/i.test(q))
  )
}

// Exactly one skill must be named in the question, otherwise we don't guess.
function findSkill(q: string, skills: Skills): { name: string; years: number } | null {
  const text = norm(q)
  const hits = Object.keys(skills).filter((name) => {
    const n = norm(name)
    return n.trim().length >= 2 && text.includes(n)
  })
  // "Spring Boot" beats "Spring" when both match
  const top = hits.filter((a) => !hits.some((b) => b !== a && norm(b).includes(norm(a))))
  if (top.length !== 1) return null
  return { name: top[0], years: skills[top[0]] }
}

// Does an option like "1-3 years", "5+", "Less than 1 year" or "2" fit this many years?
function optionFits(text: string, y: number, strict: boolean): boolean {
  const t = text.toLowerCase().replace(/,/g, '')
  const range = t.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)/)
  if (range) {
    const lo = Number(range[1])
    const hi = Number(range[2])
    return strict ? y >= lo && y < hi : y >= lo && y <= hi
  }
  const less = t.match(/(?:less than|under|below|<)\s*(\d+(?:\.\d+)?)/)
  if (less) return y < Number(less[1])
  const plus = t.match(/(\d+(?:\.\d+)?)\s*\+|(?:more than|over|at least|above)\s*(\d+(?:\.\d+)?)/)
  if (plus) return y >= Number(plus[1] ?? plus[2])
  const exact = t.trim().match(/^(\d+(?:\.\d+)?)(?:\s*years?)?$/)
  if (exact) return y === Number(exact[1])
  return false
}

function yesNoOption(options: HTMLOptionElement[], yes: boolean): HTMLOptionElement | null {
  const want = yes ? 'yes' : 'no'
  return options.find((o) => tokens(o.text).join(' ') === want) ?? null
}

function pickYears(select: HTMLSelectElement, y: number): HTMLOptionElement | null {
  const opts = Array.from(select.options).filter((o) => o.value !== '' && tokens(o.text).length > 0)
  return (
    opts.find((o) => optionFits(o.text, y, true)) ??
    opts.find((o) => optionFits(o.text, y, false)) ??
    null
  )
}

function chooseOption(el: HTMLSelectElement, option: HTMLOptionElement) {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!
  setter.call(el, option.value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

export interface RuleResult {
  filled: number
  red: number
  handled: Set<Element> // fields this step already dealt with
  radioGroups: Set<string> // radio group names this step already dealt with
}

export function applySkillRules(skills: Skills): RuleResult {
  const handled = new Set<Element>()
  const radioGroups = new Set<string>()
  let filled = 0
  let red = 0

  // ---- text inputs and dropdowns ----
  for (const el of getFields()) {
    if (el instanceof HTMLTextAreaElement) continue
    if (el instanceof HTMLInputElement && !['text', 'number'].includes(el.type)) continue

    const q = getHint(el)
    if (!isYearsQuestion(q)) continue
    const skill = findSkill(q, skills)
    const need = requiredYears(q)

    if (el instanceof HTMLSelectElement) {
      if (el.value !== '' && el.selectedIndex > 0) continue // already chosen
      let option: HTMLOptionElement | null = null
      if (skill) {
        option =
          need !== null
            ? yesNoOption(Array.from(el.options), skill.years >= need)
            : pickYears(el, skill.years)
      }
      handled.add(el)
      if (option) {
        chooseOption(el, option)
        mark(el, 'yellow')
        filled++
      } else {
        mark(el, 'red')
        red++
      }
      continue
    }

    if (el.value.trim() !== '') continue // never overwrite
    handled.add(el)
    // a number box can't hold "Yes"/"No"
    const canFill = skill !== null && !(el.type === 'number' && need !== null)
    if (skill && canFill) {
      const value = need !== null ? (skill.years >= need ? 'Yes' : 'No') : String(skill.years)
      setValue(el, value)
      mark(el, 'yellow')
      filled++
    } else {
      mark(el, 'red')
      red++
    }
  }

  // ---- radio groups ----
  const groups = new Map<string, HTMLInputElement[]>()
  document.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((r) => {
    if (r.disabled || r.offsetParent === null || !r.name) return
    groups.set(r.name, [...(groups.get(r.name) ?? []), r])
  })

  for (const [name, list] of groups) {
    if (list.some((r) => r.checked)) continue
    const q = `${groupQuestion(list[0])} ${name}`.replace(/[_-]/g, ' ')
    if (!isYearsQuestion(q)) continue

    const skill = findSkill(q, skills)
    const need = requiredYears(q)
    radioGroups.add(name)

    let pick: HTMLInputElement | null = null
    if (skill) {
      const text = (r: HTMLInputElement) => getLabelText(r) || r.value
      if (need !== null) {
        const want = skill.years >= need ? 'yes' : 'no'
        pick = list.find((r) => tokens(text(r)).join(' ') === want) ?? null
      } else {
        pick =
          list.find((r) => optionFits(text(r), skill.years, true)) ??
          list.find((r) => optionFits(text(r), skill.years, false)) ??
          null
      }
    }

    if (pick) {
      pick.click() // click() fires the right events, so React forms update too
      mark(pick, 'yellow')
      filled++
    } else {
      mark(list[0].closest('fieldset') ?? list[0], 'red')
      red++
    }
  }

  return { filled, red, handled, radioGroups }
}