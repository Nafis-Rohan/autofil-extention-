import type { Profile } from '../types'

export interface PageInfo {
  company: string
  role: string
}

const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim()

function pretty(slug: string): string {
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim()
}

function companyFromUrl(): string {
  const host = location.hostname
  const forParam = new URLSearchParams(location.search).get('for') // greenhouse embeds
  if (forParam) return pretty(forParam)
  const slug = location.pathname.split('/').filter(Boolean)[0] ?? ''
  const ats = ['greenhouse.io', 'lever.co', 'ashbyhq.com', 'workable.com', 'smartrecruiters.com']
  if (slug && slug !== 'embed' && ats.some((d) => host === d || host.endsWith('.' + d))) {
    return pretty(slug)
  }
  return ''
}

function companyFromTitle(): string {
  const m = document.title.match(/\bat\s+(.+?)\s*(?:[-|–—]|$)/i)
  return m ? clean(m[1]) : ''
}

function companyFromMeta(): string {
  return clean(document.querySelector<HTMLMetaElement>('meta[property="og:site_name"]')?.content)
}

function companyFromHost(): string {
  const parts = location.hostname.split('.').filter(Boolean)
  if (parts.length < 2) return ''
  let i = parts.length - 2
  if (['co', 'com', 'org', 'net', 'gov', 'edu'].includes(parts[i]) && parts.length >= 3) i--
  return pretty(parts[i])
}

function roleFromPage(): string {
  const h1 = clean(document.querySelector('h1')?.textContent)
  if (h1) return h1
  const og = clean(document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content)
  const title = og || clean(document.title)
  return clean(title.split(/\s+(?:at|[-|–—])\s+/i)[0])
}

export function getPageInfo(): PageInfo {
  return {
    company: companyFromUrl() || companyFromTitle() || companyFromMeta() || companyFromHost(),
    role: roleFromPage(),
  }
}

// If a value can't be found, the {{placeholder}} stays in the text so you notice it.
export function applyPlaceholders(text: string, info: PageInfo, profile: Profile): string {
  const values: Record<string, string> = {
    company: info.company,
    role: info.role,
    name: `${profile.personal.firstName} ${profile.personal.lastName}`.trim(),
  }
  return text.replace(/\{\{\s*(company|role|name)\s*\}\}/gi, (match, key: string) => {
    return values[key.toLowerCase()] || match
  })
}