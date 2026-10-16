import { getProfile, saveProfile } from '../storage'

function getByPath(obj: Record<string, any>, path: string): string {
  const value = path.split('.').reduce<any>((o, k) => o?.[k], obj)
  return value ?? ''
}

function setByPath(obj: Record<string, any>, path: string, value: string) {
  const keys = path.split('.')
  const last = keys.pop()!
  const target = keys.reduce((o, k) => o[k], obj)
  target[last] = value
}

const inputs = document.querySelectorAll<HTMLInputElement>('[data-path]')
const status = document.getElementById('status')!

async function load() {
  const profile = await getProfile()
  inputs.forEach((i) => {
    i.value = getByPath(profile, i.dataset.path!)
  })
}

document.getElementById('save')!.addEventListener('click', async () => {
  const profile = await getProfile()
  inputs.forEach((i) => setByPath(profile, i.dataset.path!, i.value.trim()))
  await saveProfile(profile)
  status.textContent = 'Saved ✅'
  setTimeout(() => (status.textContent = ''), 2000)
})

load()