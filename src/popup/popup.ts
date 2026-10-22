import contentScript from '../content/index?script'

const status = document.getElementById('status')!
let filled = 0
let total = 0

// Each frame (main page + iframes) reports separately, so add them up.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'fillResult') {
    filled += msg.filled
    total += msg.total
    status.textContent = `Filled ${filled} of ${total} fields`
  }
})

document.getElementById('fill')!.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return
  filled = 0
  total = 0
  status.textContent = 'Filling...'
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: [contentScript],
    })
  } catch (e) {
    status.textContent = 'Cannot run on this page'
    console.error(e)
  }
})