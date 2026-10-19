import { getProfile, saveProfile } from '../storage'

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
  status.textContent = 'Saved ✅'
  setTimeout(() => (status.textContent = ''), 2000)
})

load()