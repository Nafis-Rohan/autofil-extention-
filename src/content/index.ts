import { getProfile } from '../storage'
import { getFields, getHint, matchKey } from './detect'
import { fillText, fillSelect } from './fill'
import { fillRadios } from './radio'
import { fillCheckboxes } from './checkbox'

async function run() {
  const profile = await getProfile()
  const fields = getFields()
  let filled = 0

  for (const el of fields) {
    const key = matchKey(getHint(el))
    if (!key) continue
    const ok = el instanceof HTMLSelectElement ? fillSelect(el, key, profile) : fillText(el, key, profile)
    if (ok) filled++
  }

  filled += fillRadios(profile)
  filled += fillCheckboxes(profile)

  chrome.runtime.sendMessage({ type: 'fillResult', filled, total: fields.length })
}

run()