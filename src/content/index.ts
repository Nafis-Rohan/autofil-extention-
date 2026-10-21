import { getProfile } from '../storage'
import { getFields, getHint, matchKey } from './detect'
import { fillText } from './fill'

async function run() {
  const profile = await getProfile()
  const fields = getFields()
  let filled = 0

  for (const el of fields) {
    const key = matchKey(getHint(el))
    if (key && fillText(el, key, profile)) filled++
  }

  chrome.runtime.sendMessage({ type: 'fillResult', filled, total: fields.length })
}

run()