import contentScript from '../content/index?script'
import { getApplications, saveApplications } from '../storage'

async function fill(tabId: number) {
  await chrome.action.setBadgeText({ tabId, text: '' })
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: [contentScript],
    })
  } catch {
    // restricted page (chrome://, web store, file:// without permission)
    await chrome.action.setBadgeText({ tabId, text: '!' })
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#6b7280' })
  }
}

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'fill-page') return
  let tabId = tab?.id
  if (tabId === undefined) {
    const [active] = await chrome.tabs.query({ active: true, currentWindow: true })
    tabId = active?.id
  }
  if (tabId !== undefined) await fill(tabId)
})

// ---- Application tracker ----
interface PageMsg {
  company: string
  role: string
  url: string
}

function cleanUrl(raw: string): string {
  try {
    const u = new URL(raw)
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_.*|gh_src|fbclid|gclid)$/i.test(key)) u.searchParams.delete(key)
    }
    u.hash = ''
    return u.toString()
  } catch {
    return raw
  }
}

// Messages from several frames can arrive at once, so writes go through one queue.
let queue: Promise<void> = Promise.resolve()

function track(page: PageMsg) {
  queue = queue
    .then(async () => {
      const url = cleanUrl(page.url)
      const apps = await getApplications()
      const now = new Date().toISOString()
      const existing = apps.find((a) => a.url === url)

      if (existing) {
        existing.date = now // keep the status you set
      } else {
        let host = ''
        try {
          host = new URL(url).hostname
        } catch {
          // ignore
        }
        apps.unshift({
          id: crypto.randomUUID(),
          company: page.company || host || 'Unknown company',
          role: page.role || 'Unknown role',
          url,
          date: now,
          status: 'filled',
        })
      }
      await saveApplications(apps.slice(0, 500))
    })
    .catch(() => {})
}

// Every frame (main page + iframes) reports separately, so add the reports up.
interface Run {
  filled: number
  red: number
  at: number
  page?: PageMsg
}
const runs = new Map<number, Run>()

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type !== 'fillResult' || sender.tab?.id === undefined) return
  const tabId = sender.tab.id
  const now = Date.now()
  const prev = runs.get(tabId)
  const run: Run = prev && now - prev.at < 3000 ? prev : { filled: 0, red: 0, at: now }
  run.filled += msg.filled
  run.red += msg.red ?? 0
  run.at = now
  if (msg.page) run.page = msg.page
  runs.set(tabId, run)

  const needsYou = run.red > 0
  chrome.action.setBadgeText({ tabId, text: String(needsYou ? run.red : run.filled) })
  chrome.action.setBadgeBackgroundColor({ tabId, color: needsYou ? '#dc2626' : '#16a34a' })

  // Log it once something was actually filled (works whichever frame reports first).
  if (run.page && run.filled > 0) track(run.page)
})