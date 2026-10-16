import type { Profile, Skills, Snippet } from './types'

export const emptyProfile: Profile = {
  personal: {
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', gender: '', nationality: '',
    address: '', city: '', postalCode: '', country: '',
  },
  links: { linkedin: '', github: '', portfolio: '', leetcode: '' },
  education: {
    university: '', degree: '', major: '', cgpa: '', cgpaScale: '',
    startYear: '', graduationYear: '',
    hsc: { board: '', year: '', gpa: '' },
    ssc: { board: '', year: '', gpa: '' },
  },
  experience: {
    currentCompany: '', currentTitle: '', totalYears: '',
    previous: [],
  },
  preferences: {
    expectedSalary: '', currentSalary: '', noticePeriod: '',
    workMode: '', jobType: '',
    willingToRelocate: false, needSponsorship: false,
  },
}

export async function getProfile(): Promise<Profile> {
  const { profile } = await chrome.storage.local.get('profile')
  return { ...emptyProfile, ...(profile as Partial<Profile> | undefined) }
}

export async function saveProfile(profile: Profile): Promise<void> {
  await chrome.storage.local.set({ profile })
}

export async function getSkills(): Promise<Skills> {
  const { skills } = await chrome.storage.local.get('skills')
  return (skills as Skills | undefined) ?? {}
}

export async function saveSkills(skills: Skills): Promise<void> {
  await chrome.storage.local.set({ skills })
}

export async function getSnippets(): Promise<Snippet[]> {
  const { snippets } = await chrome.storage.local.get('snippets')
  return (snippets as Snippet[] | undefined) ?? []
}

export async function saveSnippets(snippets: Snippet[]): Promise<void> {
  await chrome.storage.local.set({ snippets })
}