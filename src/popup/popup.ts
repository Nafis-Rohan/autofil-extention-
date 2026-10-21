import contentScript from '../content/index?script'

const status = document.getElementById('status')!

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'fillResult') {
    status.textContent = `Filled ${msg.filled} of ${msg.total} fields`
  }
})

document.getElementById('fill')!.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return
  status.textContent = 'Filling...'
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: [contentScript] })
  } catch (e) {
    status.textContent = 'Cannot run on this page'
    console.error(e)
  }
})