import type { Profile, Snippet, SnippetCategory } from '../types'
import { setValue } from './fill'
import { mark } from './highlight'
import { CATEGORY_LABELS } from './longtext'
import { applyPlaceholders, getPageInfo } from './pageInfo'

const HOST_ATTR = 'data-ja-picker'
const w = window as unknown as { __jaCleanups?: Array<() => void> }

// Removes pickers from a previous run so buttons never pile up.
export function removePickers() {
  w.__jaCleanups?.forEach((fn) => fn())
  w.__jaCleanups = []
  document.querySelectorAll(`[${HOST_ATTR}]`).forEach((n) => n.remove())
}

const STYLE = `
  button { cursor: pointer; }
  .main { font: 12px/1 system-ui, sans-serif; padding: 5px 9px; border: 1px solid #2563eb;
    border-radius: 6px; background: #eff6ff; color: #1d4ed8; }
  .main:hover { background: #dbeafe; }
  .menu { position: absolute; right: 0; top: calc(100% + 4px); min-width: 260px; max-height: 260px;
    overflow: auto; background: #fff; color: #111; border: 1px solid #cbd5e1; border-radius: 8px;
    box-shadow: 0 6px 20px rgba(0,0,0,.18); padding: 4px; font: 13px system-ui, sans-serif; }
  .menu[hidden] { display: none; }
  .group { padding: 6px 8px 2px; font-size: 11px; color: #64748b; text-transform: uppercase; }
  .item { display: block; width: 100%; text-align: left; padding: 7px 8px; border: 0;
    background: none; color: #111; border-radius: 6px; font: 13px system-ui, sans-serif; }
  .item:hover { background: #eff6ff; }
  .empty { padding: 8px; color: #475569; }
`

export function addPicker(
  target: HTMLElement,
  suggested: SnippetCategory,
  snippets: Snippet[],
  profile: Profile,
) {
  // Lives on <html> in a shadow root: the site's CSS and React can't touch it.
  const host = document.createElement('div')
  host.setAttribute(HOST_ATTR, '')
  host.style.cssText = 'position:absolute;z-index:2147483647;transform:translateX(-100%);'
  const root = host.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = STYLE

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'main'
  button.textContent = suggested === 'custom' ? '✨ Snippets' : `✨ ${CATEGORY_LABELS[suggested]}`

  const menu = document.createElement('div')
  menu.className = 'menu'
  menu.hidden = true

  root.append(style, button, menu)

  function choose(s: Snippet) {
    menu.hidden = true
    const text = applyPlaceholders(s.text, getPageInfo(), profile)
    const existing = target instanceof HTMLTextAreaElement ? target.value : (target.textContent ?? '')
    if (existing.trim() && !confirm('Replace the text already in this field?')) return

    if (target instanceof HTMLTextAreaElement) {
      setValue(target, text)
    } else {
      target.focus()
      target.textContent = text
      target.dispatchEvent(new Event('input', { bubbles: true }))
    }
    mark(target, 'yellow')
  }

  function addGroup(label: string, list: Snippet[]) {
    if (list.length === 0) return
    const heading = document.createElement('div')
    heading.className = 'group'
    heading.textContent = label
    menu.append(heading)
    for (const s of list) {
      const item = document.createElement('button')
      item.type = 'button'
      item.className = 'item'
      item.textContent = s.title
      item.addEventListener('click', () => choose(s))
      menu.append(item)
    }
  }

  function buildMenu() {
    menu.replaceChildren()
    if (snippets.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'empty'
      empty.textContent = 'No snippets yet. Add some in the extension Options.'
      menu.append(empty)
      return
    }
    if (suggested === 'custom') {
      addGroup('All snippets', snippets)
    } else {
      addGroup(`Suggested: ${CATEGORY_LABELS[suggested]}`, snippets.filter((s) => s.category === suggested))
      addGroup('Other snippets', snippets.filter((s) => s.category !== suggested))
    }
  }

  button.addEventListener('click', () => {
    if (menu.hidden) buildMenu()
    menu.hidden = !menu.hidden
  })

  const place = () => {
    const r = target.getBoundingClientRect()
    host.style.top = `${Math.max(window.scrollY + r.top - 30, 0)}px`
    host.style.left = `${window.scrollX + r.right}px`
  }
  place()
  document.documentElement.appendChild(host)

  const onDocClick = (e: MouseEvent) => {
    if (!e.composedPath().includes(host)) menu.hidden = true
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') menu.hidden = true
  }
  const ro = new ResizeObserver(place)
  ro.observe(target)

  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
  window.addEventListener('resize', place)

  w.__jaCleanups ??= []
  w.__jaCleanups.push(() => {
    document.removeEventListener('click', onDocClick)
    document.removeEventListener('keydown', onKey)
    window.removeEventListener('resize', place)
    ro.disconnect()
  })
}