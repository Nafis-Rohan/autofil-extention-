export type FieldKey =
  | 'firstName' | 'lastName' | 'fullName' | 'email' | 'phone'
  | 'linkedin' | 'github' | 'portfolio' | 'leetcode'
  | 'city' | 'address' | 'postalCode' | 'country'
  | 'university' | 'degree' | 'major' | 'cgpa'
  | 'currentCompany' | 'currentTitle'
  | 'gender' | 'nationality' | 'workMode' | 'jobType'
  | 'relocate' | 'sponsorship'

// Order matters: more specific keys come first.
export const KEYWORDS: Record<FieldKey, string[]> = {
  relocate: ['relocate', 'relocation'],
  sponsorship: ['sponsorship', 'sponsor'],
  firstName: ['first name', 'firstname', 'first_name', 'given name', 'fname'],
  lastName: ['last name', 'lastname', 'last_name', 'surname', 'family name', 'lname'],
  fullName: ['full name', 'fullname', 'your name', 'candidate name'],
  email: ['email', 'e-mail', 'mail address'],
  phone: ['phone', 'mobile', 'contact number', 'telephone', 'cell'],
  linkedin: ['linkedin'],
  github: ['github'],
  portfolio: ['portfolio', 'personal website', 'website'],
  leetcode: ['leetcode'],
  city: ['city', 'current location', 'town'],
  address: ['street address', 'address line', 'address'],
  postalCode: ['postal', 'zip', 'post code', 'postcode'],
  country: ['country'],
  university: ['university', 'college', 'institution', 'school'],
  degree: ['degree', 'qualification'],
  major: ['major', 'field of study', 'subject', 'discipline'],
  cgpa: ['cgpa', 'gpa', 'grade point'],
  currentCompany: ['current company', 'current employer', 'employer', 'company name'],
  currentTitle: ['current title', 'job title', 'current position', 'designation'],
  gender: ['gender'],
  nationality: ['nationality', 'citizenship'],
  workMode: ['work mode', 'work arrangement', 'work preference', 'work type'],
  jobType: ['job type', 'employment type', 'type of employment'],
}

export function matchKey(hint: string): FieldKey | null {
  const text = hint.toLowerCase()
  for (const key of Object.keys(KEYWORDS) as FieldKey[]) {
    if (KEYWORDS[key].some((kw) => text.includes(kw))) return key
  }
  return null
}

export type FillableEl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

export function getLabelText(el: FillableEl): string {
  // 1. <label for="id">
  if (el.id) {
    const byFor = document.querySelector(`label[for="${CSS.escape(el.id)}"]`)
    if (byFor?.textContent) return byFor.textContent
  }
  // 2. wrapping <label>
  const wrap = el.closest('label')
  if (wrap?.textContent) return wrap.textContent
  // 3. aria-labelledby
  const ids = el.getAttribute('aria-labelledby')
  if (ids) {
    return ids
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent ?? '')
      .join(' ')
  }
  return ''
}

export function getHint(el: FillableEl): string {
  return [
    getLabelText(el),
    el.getAttribute('name'),
    el.id,
    el.getAttribute('placeholder'),
    el.getAttribute('aria-label'),
    el.getAttribute('autocomplete'),
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/[_-]/g, ' ')
}

export function getFields(root: ParentNode = document): FillableEl[] {
  const all = root.querySelectorAll<FillableEl>('input, textarea, select')
  return Array.from(all).filter((el) => {
    if (el instanceof HTMLInputElement) {
      const skip = ['hidden', 'submit', 'button', 'password', 'file', 'image', 'reset']
      if (skip.includes(el.type)) return false
    }
    return !el.disabled && el.offsetParent !== null // visible only
  })
}