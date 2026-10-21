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
  }
}

// Returns true if the field was filled.
export function fillText(el: FillableEl, key: FieldKey, profile: Profile): boolean {
  if (el instanceof HTMLSelectElement) return false // selects come in Phase 5
  if (el instanceof HTMLInputElement && ['checkbox', 'radio'].includes(el.type)) return false
  if (el.value.trim() !== '') return false // never overwrite what's already there

  const value = valueFor(key, profile)
  if (!value) return false

  setValue(el, value)
  return true
}