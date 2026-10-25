import type { SnippetCategory } from '../types'
import { getHint } from './detect'

export const CATEGORY_LABELS: Record<SnippetCategory, string> = {
  coverLetter: 'Cover letter',
  selfIntro: 'Self introduction',
  biggestBugFixed: 'Biggest bug fixed',
  bestProject: 'Best project',
  whyThisCompany: 'Why this company',
  custom: 'Custom',
}

// Order matters: the first rule that matches wins.
const RULES: Array<[SnippetCategory, string[]]> = [
  ['coverLetter', ['cover letter', 'covering letter', 'motivation letter', 'letter of motivation']],
  ['whyThisCompany', [
    'why do you want', 'why are you interested', 'why us', 'why this company',
    'why join', 'why would you like', 'what interests you', 'what attracts you',
  ]],
  ['biggestBugFixed', [
    'bug', 'technical challenge', 'challenging problem', 'difficult problem',
    'problem you solved', 'problem you have solved', 'overcame', 'troubleshoot', 'biggest challenge',
  ]],
  ['bestProject', ['project', 'proud of', 'accomplishment', 'achievement']],
  ['selfIntro', [
    'about yourself', 'tell us about you', 'introduce yourself', 'self introduction',
    'professional summary', 'about you', 'introduction', 'bio',
  ]],
]

export function suggestCategory(hint: string): SnippetCategory | null {
  const text = hint.toLowerCase()
  for (const [category, words] of RULES) {
    if (words.some((w) => text.includes(w))) return category
  }
  return null
}

export interface LongField {
  el: HTMLElement
  hint: string
}

function hintForEditable(el: HTMLElement): string {
  const ids = el.getAttribute('aria-labelledby')
  const labelled = ids
    ? ids.split(' ').map((id) => document.getElementById(id)?.textContent ?? '').join(' ')
    : ''
  return [
    el.getAttribute('aria-label'),
    labelled,
    el.getAttribute('data-placeholder'),
    el.getAttribute('placeholder'),
    el.closest('label')?.textContent,
    el.parentElement?.previousElementSibling?.textContent,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/[_-]/g, ' ')
}

// Big visible text areas (and rich-text editors) that deserve a snippet picker.
export function findLongTextFields(): LongField[] {
  const out: LongField[] = []

  document.querySelectorAll<HTMLTextAreaElement>('textarea').forEach((el) => {
    if (el.disabled || el.readOnly || el.offsetParent === null || el.offsetHeight < 60) return
    out.push({ el, hint: getHint(el) })
  })

  const editable = '[contenteditable="true"], [contenteditable=""]'
  document.querySelectorAll<HTMLElement>(editable).forEach((el) => {
    if (el.offsetParent === null || el.offsetHeight < 60) return
    if (el.parentElement?.closest(editable)) return // only the outermost editor
    out.push({ el, hint: hintForEditable(el) })
  })

  return out
}