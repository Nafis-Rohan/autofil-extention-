export type FieldKey =
  | 'firstName' | 'lastName' | 'fullName' | 'email' | 'phone'
  | 'linkedin' | 'github' | 'portfolio' | 'leetcode'
  | 'city' | 'address' | 'postalCode' | 'country'
  | 'university' | 'degree' | 'major' | 'cgpa'
  | 'currentCompany' | 'currentTitle'

// Order matters: more specific keys come first.
export const KEYWORDS: Record<FieldKey, string[]> = {
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
}

export function matchKey(hint: string): FieldKey | null {
  const text = hint.toLowerCase()
  for (const key of Object.keys(KEYWORDS) as FieldKey[]) {
    if (KEYWORDS[key].some((kw) => text.includes(kw))) return key
  }
  return null
}