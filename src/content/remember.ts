import { getRules, saveRules } from '../storage'
import { getLabelText } from './detect'
import { tokens } from './fill'
import { mark } from './highlight'
import { groupQuestion } from './radio'

// Same attribute as the snippet picker, so removePickers() cleans these up too.
const HOST_ATTR = 'data-ja-picker'
const w = window as unknown as { __jaCleanups?: Array<() => void> }

// crypto.randomUUID() only exists on secure (https) pages, and this runs on any page.
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

const clean = (s: string) =>
  s.replace(/\(required\)/gi, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim()

function radiosOf(target: HTMLElement): HTMLInputElement[] {
  if (target instanceof HTMLInputElement && target.type === 'radio') {
    if (!target.name) return [target]
    return Array.from(document.querySelectorAll<HTMLInputElement>('input[type="radio"]')).filter(
      (r) => r.name === target.name,
    )
  }
  if (target instanceof HTMLFieldSetElement) {
    return Array.from(target.querySelectorAll<HTMLInputElement>('input[type="radio"]'))
  }
  return []
}

function questionOf(target: HTMLElement): string {
  const radios = radiosOf(target)
  if (radios.length > 0) return clean(groupQuestion(radios[0]))
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return clean(
      getLabelText(target) ||
        target.getAttribute('aria-label') ||
        target.getAttribute('placeholder') ||
        target.name ||
        '',
    )
  }
  return ''
}

function answerOf(target: HTMLElement): string {
  const radios = radiosOf(target)
  if (radios.length > 0) {
    const on = radios.find((r) => r.checked)
    return on ? clean(getLabelText(on) || on.value) : ''
  }
  if (target instanceof HTMLSelectElement) {
    return target.value !== '' && target.selectedIndex > 0
      ? clean(target.selectedOptions[0]?.text ?? '')
      : ''
  }
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return target.value.trim()
  }
  return ''
}

const STYLE = `
  button { font: 11px/1 system-ui, sans-serif; padding: 4px 8px; border: 1px solid #dc2626;
    border-radius: 6px; background: #fef2f2; color: #b91c1c; cursor: pointer; }
  button:hover { background: #fee2e2; }
`

// Adds a small "Remember" button above a red field.
export function addRemember(target: HTMLElement) {
  const host = document.createElement('div')
  host.setAttribute(HOST_ATTR, '')
  host.style.cssText = 'position:absolute;z-index:2147483647;transform:translateX(-100%);'
  const root = host.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = STYLE

  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = '💾 Remember'
  button.title = 'Fill this field yourself, then click to save the answer for next time'
  root.append(style, button)

  const flash = (text: string) => {
    button.textContent = text
    setTimeout(() => (button.textContent = '💾 Remember'), 1800)
  }

  button.addEventListener('click', async () => {
    const question = questionOf(target)
    if (!question) return flash('No label found')
    const answer = answerOf(target)
    if (!answer) return flash('Fill it first')

    const key = tokens(question).join(' ')
    const rules = (await getRules()).filter((r) => tokens(r.match).join(' ') !== key)
    rules.push({ id: newId(), match: question, answer })
    await saveRules(rules)

    mark(target, 'yellow')
    flash('Saved ✅')
  })

  const place = () => {
    const r = target.getBoundingClientRect()
    host.style.top = `${Math.max(window.scrollY + r.top - 24, 0)}px`
    host.style.left = `${window.scrollX + r.right}px`
  }
  place()
  document.documentElement.appendChild(host)

  const ro = new ResizeObserver(place)
  ro.observe(target)
  window.addEventListener('resize', place)

  w.__jaCleanups ??= []
  w.__jaCleanups.push(() => {
    window.removeEventListener('resize', place)
    ro.disconnect()
  })
}