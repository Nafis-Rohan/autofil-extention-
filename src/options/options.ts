import { getProfile, saveProfile, getSkills, saveSkills } from '../storage'

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

load()
loadSkills()