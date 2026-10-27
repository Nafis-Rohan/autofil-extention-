import {
  getProfile, saveProfile, getSkills, saveSkills,
  getSnippets, saveSnippets, getRules, saveRules,
  getApplications, saveApplications,
} from '../storage'
import type {
  Application, ApplicationStatus, Rule, Snippet, SnippetCategory, SnippetVariant,
} from '../types'

type Field = HTMLInputElement | HTMLSelectElement

function getByPath(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce<any>((o, k) => o?.[k], obj)
}

function setByPath(obj: Record<string, any>, path: string, value: string | boolean) {
  const keys = path.split('.')
  const last = keys.pop()!
  const target = keys.reduce<any>((o, k) => o[k], obj)
  target[last] = value
}

const fields = document.querySelectorAll<Field>('[data-path]')
const status = document.getElementById('status')!

function isCheckbox(f: Field): f is HTMLInputElement {
  return f instanceof HTMLInputElement && f.type === 'checkbox'
}

async function load() {
  const profile = await getProfile()
  fields.forEach((f) => {
    const value = getByPath(profile, f.dataset.path!)
    if (isCheckbox(f)) f.checked = Boolean(value)
    else f.value = value ?? ''
  })
}

document.getElementById('save')!.addEventListener('click', async () => {
  const profile = await getProfile()
  fields.forEach((f) => {
    const path = f.dataset.path!
    if (isCheckbox(f)) setByPath(profile, path, f.checked)
    else setByPath(profile, path, f.value.trim())
  })
  await saveProfile(profile)
  await saveSkills(skills)
  status.textContent = 'Saved ✅'
  setTimeout(() => (status.textContent = ''), 2000)
})

// ---- Skills ----
let skills: Record<string, number> = {}
const skillsDiv = document.getElementById('skills')!

function renderSkills() {
  skillsDiv.innerHTML = ''
  Object.entries(skills).forEach(([name, years]) => {
    const row = document.createElement('div')
    row.style.cssText = 'display:flex;gap:8px;align-items:center;margin:4px 0'
    row.innerHTML = `<span style="flex:1"></span><span>${years} yr</span><button type="button" style="margin:0">Remove</button>`
    row.querySelector('span')!.textContent = name
    row.querySelector('button')!.addEventListener('click', () => {
      delete skills[name]
      renderSkills()
    })
    skillsDiv.appendChild(row)
  })
}

document.getElementById('add-skill')!.addEventListener('click', () => {
  const nameEl = document.getElementById('new-skill') as HTMLInputElement
  const yearsEl = document.getElementById('new-years') as HTMLInputElement
  const name = nameEl.value.trim()
  if (!name) return
  skills[name] = Number(yearsEl.value) || 0
  nameEl.value = ''
  yearsEl.value = ''
  renderSkills()
})

async function loadSkills() {
  skills = await getSkills()
  renderSkills()
}

// ---- Snippets ----
const CATEGORY_LABELS: Record<SnippetCategory, string> = {
  coverLetter: 'Cover letter',
  selfIntro: 'Self introduction',
  biggestBugFixed: 'Biggest bug I fixed',
  bestProject: 'Best project',
  whyThisCompany: 'Why this company',
  custom: 'Custom',
}

const VARIANT_LABELS: Record<SnippetVariant, string> = {
  springBoot: 'Spring Boot',
  django: 'Django',
  ai: 'AI',
  generic: 'Generic',
}

let snippets: Snippet[] = []
let editingId: string | null = null

const snipList = document.getElementById('snippet-list')!
const snipHeading = document.getElementById('snip-heading')!
const snipCategory = document.getElementById('snip-category') as HTMLSelectElement
const snipVariant = document.getElementById('snip-variant') as HTMLSelectElement
const snipTitle = document.getElementById('snip-title') as HTMLInputElement
const snipText = document.getElementById('snip-text') as HTMLTextAreaElement
const snipSave = document.getElementById('snip-save')!
const snipCancel = document.getElementById('snip-cancel')!
const snipStatus = document.getElementById('snip-status')!

for (const [value, label] of Object.entries(CATEGORY_LABELS)) {
  snipCategory.add(new Option(label, value))
}
for (const [value, label] of Object.entries(VARIANT_LABELS)) {
  snipVariant.add(new Option(label, value))
}

function resetSnippetForm() {
  editingId = null
  snipHeading.textContent = 'Add snippet'
  snipTitle.value = ''
  snipText.value = ''
  snipCancel.hidden = true
}

function renderSnippets() {
  snipList.innerHTML = ''
  if (snippets.length === 0) {
    snipList.textContent = 'No snippets yet.'
    return
  }
  snippets.forEach((s) => {
    const row = document.createElement('div')
    row.style.cssText = 'display:flex;gap:8px;align-items:center;margin:6px 0'
    row.innerHTML =
      '<span style="flex:1"><b></b><br /><small></small></span>' +
      '<button type="button" style="margin:0">Edit</button>' +
      '<button type="button" style="margin:0">Delete</button>'
    row.querySelector('b')!.textContent = s.title
    row.querySelector('small')!.textContent =
      `${CATEGORY_LABELS[s.category]} · ${VARIANT_LABELS[s.variant]}`

    const [editBtn, deleteBtn] = Array.from(row.querySelectorAll('button'))
    editBtn.addEventListener('click', () => {
      editingId = s.id
      snipHeading.textContent = 'Edit snippet'
      snipCategory.value = s.category
      snipVariant.value = s.variant
      snipTitle.value = s.title
      snipText.value = s.text
      snipCancel.hidden = false
      snipText.focus()
    })
    deleteBtn.addEventListener('click', async () => {
      if (!confirm(`Delete "${s.title}"?`)) return
      snippets = snippets.filter((x) => x.id !== s.id)
      await saveSnippets(snippets)
      if (editingId === s.id) resetSnippetForm()
      renderSnippets()
    })
    snipList.appendChild(row)
  })
}

snipSave.addEventListener('click', async () => {
  const text = snipText.value.trim()
  if (!text) {
    snipStatus.textContent = 'Write the text first'
    return
  }
  const category = snipCategory.value as SnippetCategory
  const variant = snipVariant.value as SnippetVariant
  const title = snipTitle.value.trim() || `${CATEGORY_LABELS[category]} - ${VARIANT_LABELS[variant]}`

  if (editingId) {
    snippets = snippets.map((s) => (s.id === editingId ? { ...s, category, variant, title, text } : s))
  } else {
    snippets.push({ id: crypto.randomUUID(), category, variant, title, text })
  }
  await saveSnippets(snippets)
  resetSnippetForm()
  renderSnippets()
  snipStatus.textContent = 'Snippet saved ✅'
  setTimeout(() => (snipStatus.textContent = ''), 2000)
})

snipCancel.addEventListener('click', resetSnippetForm)

async function loadSnippets() {
  snippets = await getSnippets()
  renderSnippets()
}

// ---- Rules ----
let rules: Rule[] = []

const ruleList = document.getElementById('rule-list')!
const ruleMatch = document.getElementById('rule-match') as HTMLInputElement
const ruleAnswer = document.getElementById('rule-answer') as HTMLInputElement
const ruleStatus = document.getElementById('rule-status')!

const normKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function renderRules() {
  ruleList.innerHTML = ''
  if (rules.length === 0) {
    ruleList.textContent = 'No rules yet.'
    return
  }
  rules.forEach((r) => {
    const row = document.createElement('div')
    row.style.cssText = 'display:flex;gap:8px;align-items:center;margin:6px 0'
    row.innerHTML = '<span style="flex:1"></span><button type="button" style="margin:0">Delete</button>'
    row.querySelector('span')!.textContent = `"${r.match}" → ${r.answer}`
    row.querySelector('button')!.addEventListener('click', async () => {
      rules = rules.filter((x) => x.id !== r.id)
      await saveRules(rules)
      renderRules()
    })
    ruleList.appendChild(row)
  })
}

document.getElementById('rule-add')!.addEventListener('click', async () => {
  const match = ruleMatch.value.trim()
  const answer = ruleAnswer.value.trim()
  if (!normKey(match) || !answer) {
    ruleStatus.textContent = 'Fill both boxes'
    return
  }
  // same phrase = replace the old rule
  rules = rules.filter((r) => normKey(r.match) !== normKey(match))
  rules.push({ id: crypto.randomUUID(), match, answer })
  await saveRules(rules)
  ruleMatch.value = ''
  ruleAnswer.value = ''
  renderRules()
  ruleStatus.textContent = 'Rule saved ✅'
  setTimeout(() => (ruleStatus.textContent = ''), 2000)
})

async function loadRules() {
  rules = await getRules()
  renderRules()
}

// ---- Applications ----
const STATUS_LABELS: Record<ApplicationStatus, string> = {
  filled: 'Filled',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}

let applications: Application[] = []
const appsList = document.getElementById('apps-list')!
const appsCount = document.getElementById('apps-count')!

// Always re-read before writing: the background worker adds entries while this page is open.
async function updateApplication(id: string, patch: Partial<Application>) {
  const all = await getApplications()
  const target = all.find((a) => a.id === id)
  if (!target) return
  Object.assign(target, patch)
  await saveApplications(all)
  applications = all
}

function renderApplications() {
  appsCount.textContent = String(applications.length)
  appsList.replaceChildren()
  if (applications.length === 0) {
    appsList.textContent = 'Nothing yet. Fill a job page and it shows up here.'
    return
  }

  for (const a of applications) {
    const row = document.createElement('div')
    row.style.cssText = 'border:1px solid #ddd;border-radius:6px;padding:8px;margin:8px 0'

    const company = document.createElement('input')
    company.value = a.company
    company.placeholder = 'Company'
    company.addEventListener('change', async () => {
      const v = company.value.trim() || a.company
      company.value = v
      a.company = v
      await updateApplication(a.id, { company: v })
    })

    const role = document.createElement('input')
    role.value = a.role
    role.placeholder = 'Role'
    role.style.marginTop = '4px'
    role.addEventListener('change', async () => {
      const v = role.value.trim() || a.role
      role.value = v
      a.role = v
      await updateApplication(a.id, { role: v })
    })

    const meta = document.createElement('div')
    meta.style.cssText = 'font-size:12px;color:#666;margin:6px 0'
    meta.append(`${new Date(a.date).toLocaleDateString()} · `)
    if (/^(https?|file):/i.test(a.url)) {
      const link = document.createElement('a')
      link.href = a.url
      link.textContent = 'Open page'
      link.target = '_blank'
      link.rel = 'noreferrer'
      meta.append(link)
    } else {
      meta.append('no link')
    }

    const statusSel = document.createElement('select')
    for (const [value, label] of Object.entries(STATUS_LABELS)) {
      statusSel.add(new Option(label, value))
    }
    statusSel.value = a.status
    statusSel.addEventListener('change', () => {
      a.status = statusSel.value as ApplicationStatus
      updateApplication(a.id, { status: a.status })
    })

    const del = document.createElement('button')
    del.type = 'button'
    del.textContent = 'Delete'
    del.style.marginTop = '8px'
    del.addEventListener('click', async () => {
      const rest = (await getApplications()).filter((x) => x.id !== a.id)
      await saveApplications(rest)
      applications = rest
      renderApplications()
    })

    row.append(company, role, meta, statusSel, del)
    appsList.appendChild(row)
  }
}

async function loadApplications() {
  applications = await getApplications()
  renderApplications()
}

// New entries from the background worker show up live. Plain edits keep the same ids, so
// they don't redraw the list (which would steal focus from the box you're typing in).
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.applications) return
  const next = (changes.applications.newValue as Application[] | undefined) ?? []
  const same = next.length === applications.length && next.every((a, i) => a.id === applications[i].id)
  applications = next
  if (!same) renderApplications()
})

// ---- Backup ----
document.getElementById('export')!.addEventListener('click', async () => {
  const data = {
    profile: await getProfile(),
    skills: await getSkills(),
    snippets: await getSnippets(),
    rules: await getRules(),
    applications: await getApplications(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'profile-backup.json'
  a.click()
  URL.revokeObjectURL(url)
})

const importFile = document.getElementById('import-file') as HTMLInputElement
document.getElementById('import')!.addEventListener('click', () => importFile.click())

importFile.addEventListener('change', async () => {
  const file = importFile.files?.[0]
  if (!file) return
  try {
    const data = JSON.parse(await file.text())
    if (!data.profile) throw new Error('No profile in file')
    await saveProfile(data.profile)
    await saveSkills(data.skills ?? {})
    await saveSnippets(data.snippets ?? [])
    await saveRules(data.rules ?? [])
    await saveApplications(data.applications ?? [])
    await load()
    await loadSkills()
    await loadSnippets()
    await loadRules()
    await loadApplications()
    resetSnippetForm()
    status.textContent = 'Imported ✅'
  } catch {
    status.textContent = 'Invalid file ❌'
  }
  importFile.value = ''
})

load()
loadSkills()
loadSnippets()
loadRules()
loadApplications()