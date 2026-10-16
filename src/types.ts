export interface Profile {
  personal: {
    firstName: string
    lastName: string
    email: string
    phone: string
    dateOfBirth: string
    gender: string
    nationality: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  links: {
    linkedin: string
    github: string
    portfolio: string
    leetcode: string
  }
  education: {
    university: string
    degree: string
    major: string
    cgpa: string
    cgpaScale: string
    startYear: string
    graduationYear: string
    hsc: { board: string; year: string; gpa: string }
    ssc: { board: string; year: string; gpa: string }
  }
  experience: {
    currentCompany: string
    currentTitle: string
    totalYears: string
    previous: { company: string; title: string; start: string; end: string; description: string }[]
  }
  preferences: {
    expectedSalary: string
    currentSalary: string
    noticePeriod: string
    workMode: string
    jobType: string
    willingToRelocate: boolean
    needSponsorship: boolean
  }
}

// Years of experience per skill, e.g. { springBoot: 1, django: 1, go: 0 }
export type Skills = Record<string, number>

export type SnippetCategory =
  | 'coverLetter'
  | 'selfIntro'
  | 'biggestBugFixed'
  | 'bestProject'
  | 'whyThisCompany'
  | 'custom'

export type SnippetVariant = 'springBoot' | 'django' | 'ai' | 'generic'

export interface Snippet {
  id: string
  category: SnippetCategory
  variant: SnippetVariant
  title: string
  text: string // may contain {{company}}, {{role}}, {{name}}
}