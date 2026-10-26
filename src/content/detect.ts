export type FieldKey =
  | 'firstName' | 'lastName' | 'fullName' | 'email' | 'phone'
  | 'linkedin' | 'github' | 'portfolio' | 'leetcode'
  | 'city' | 'address' | 'postalCode' | 'country'
  | 'university' | 'degree' | 'major' | 'cgpa' | 'graduationYear'
  | 'currentCompany' | 'currentTitle'
  | 'gender' | 'nationality' | 'workMode' | 'jobType'
  | 'relocate' | 'sponsorship'
  | 'sscBoard' | 'sscYear' | 'sscGpa'
  | 'hscBoard' | 'hscYear' | 'hscGpa'

// Words that point at an exam level. A leading/trailing space means "whole word only".
const SSC = [' ssc ', 'secondary school', 'dakhil']
const HSC = [' hsc ', 'higher secondary', ' alim ']

const BOARD = ['board']
const YEAR = ['passing year', 'year of passing', 'pass year', 'year']
const GPA = ['gpa', 'cgpa', 'grade', 'result', 'marks', 'score']

// "a&b" means both parts must be present in the hint.
const combo = (levels: string[], parts: string[]) =>
  levels.flatMap((l) => parts.map((p) => `${l}&${p}`))

// Order matters: more specific keys come first.
export const KEYWORDS: Record<FieldKey, string[]> = {
  relocate: ['relocate', 'relocation'],
  sponsorship: ['sponsorship', 'sponsor'],
  // HSC must come before SSC: "higher secondary school" also contains "secondary school".
  hscBoard: combo(HSC, BOARD),
  hscYear: combo(HSC, YEAR),
  hscGpa: combo(HSC, GPA),
  sscBoard: combo(SSC, BOARD),
  sscYear: combo(SSC, YEAR),
  sscGpa: combo(SSC, GPA),
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
  graduationYear: ['graduation year', 'year of graduation', 'graduating year', 'expected graduation'],
  currentCompany: ['current company', 'current employer', 'employer', 'company name'],
  currentTitle: ['current title', 'job title', 'current position', 'designation'],
  gender: ['gender'],
  nationality: ['nationality', 'citizenship'],
  workMode: ['work mode', 'work arrangement', 'work preference', 'work type'],
  jobType: ['job type', 'employment type', 'type of employment'],
}

function hit(kw: string, text: string, words: string): boolean {
  if (kw.includes('&')) return kw.split('&').every((part) => hit(part, text, words))
  return kw.startsWith(' ') ? words.includes(kw) : text.includes(kw)
}

export function matchKey(hint: string): FieldKey | null {
  const text = hint.toLowerCase()
  const words = ` ${text.replace(/[^a-z0-9]+/g, ' ').trim()} ` // for whole-word matching
  for (const key of Object.keys(KEYWORDS) as FieldKey[]) {
    if (KEYWORDS[key].some((kw) => hit(kw, text, words))) return key
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

// In table layouts the question is the row's first cell plus the column header, not a label.
function tableContext(el: FillableEl): string {
  const cell = el.closest<HTMLTableCellElement>('td, th')
  const row = el.closest<HTMLTableRowElement>('tr')
  const table = el.closest('table')
  if (!cell || !row || !table || row.cells.length < 2) return ''

  const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim().slice(0, 60)
  const rowHead = row.cells[0] !== cell ? clean(row.cells[0].textContent) : ''

  const head = table.rows[0]
  const hasHeader = head !== row && head.querySelector('th') !== null
  const colHead = hasHeader ? clean(head.cells[cell.cellIndex]?.textContent) : ''

  return `${rowHead} ${colHead}`.trim()
}

export function getHint(el: FillableEl): string {
  return [
    getLabelText(el),
    el.getAttribute('name'),
    el.id,
    el.getAttribute('placeholder'),
    el.getAttribute('aria-label'),
    el.getAttribute('autocomplete'),
    tableContext(el),
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