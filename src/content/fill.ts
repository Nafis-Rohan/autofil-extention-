import type { Profile } from '../types'
import type { FieldKey, FillableEl } from './detect'

// Works on React-controlled inputs too: set via the native setter, then fire events.
export function setValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto =
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')!.set!
  setter.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

export function valueFor(key: FieldKey, p: Profile): string {
  switch (key) {
    case 'firstName': return p.personal.firstName
    case 'lastName': return p.personal.lastName
    case 'fullName': return `${p.personal.firstName} ${p.personal.lastName}`.trim()
    case 'email': return p.personal.email
    case 'phone': return p.personal.phone
    case 'linkedin': return p.links.linkedin
    case 'github': return p.links.github
    case 'portfolio': return p.links.portfolio
    case 'leetcode': return p.links.leetcode
    case 'city': return p.personal.city
    case 'address': return p.personal.address
    case 'postalCode': return p.personal.postalCode
    case 'country': return p.personal.country
    case 'university': return p.education.university
    case 'degree': return p.education.degree
    case 'major': return p.education.major
    case 'cgpa': return p.education.cgpa
    case 'currentCompany': return p.experience.currentCompany
    case 'currentTitle': return p.experience.currentTitle
    case 'gender': return p.personal.gender
    case 'nationality': return p.personal.nationality
    case 'workMode': return p.preferences.workMode
    case 'jobType': return p.preferences.jobType
    case 'relocate': return p.preferences.willingToRelocate ? 'Yes' : 'No'
    case 'sponsorship': return p.preferences.needSponsorship ? 'Yes' : 'No'
  }
}

// Returns true if the field was filled.
export function fillText(el: FillableEl, key: FieldKey, profile: Profile): boolean {
  if (el instanceof HTMLSelectElement) return false // selects are handled by fillSelect
  if (el instanceof HTMLInputElement && ['checkbox', 'radio'].includes(el.type)) return false
  if (el.value.trim() !== '') return false // never overwrite what's already there

  const value = valueFor(key, profile)
  if (!value) return false

  setValue(el, value)
  return true
}

export function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean)
}

// Whole-word matching, so "male" never matches "female".
function fuzzyOption(select: HTMLSelectElement, value: string): HTMLOptionElement | null {
  const want = tokens(value)
  if (want.length === 0) return null
  const options = Array.from(select.options).filter((o) => o.value !== '' && tokens(o.text).length > 0)

  const exact = options.find((o) => tokens(o.text).join(' ') === want.join(' '))
  if (exact) return exact

  const has = (a: string[], b: string[]) => b.every((t) => a.includes(t))
  return (
    options.find((o) => has(tokens(o.text), want)) ??
    options.find((o) => has(want, tokens(o.text))) ??
    null
  )
}

export function fillSelect(el: HTMLSelectElement, key: FieldKey, profile: Profile): boolean {
  if (el.value !== '' && el.selectedIndex > 0) return false // already chosen

  const value = valueFor(key, profile)
  if (!value) return false

  const option = fuzzyOption(el, value)
  if (!option) return false

  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!
  setter.call(el, option.value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  return true
}