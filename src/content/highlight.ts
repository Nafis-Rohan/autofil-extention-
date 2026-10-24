export type Mark = 'green' | 'yellow' | 'red'

const COLORS: Record<Mark, string> = {
  green: '#16a34a',
  yellow: '#eab308',
  red: '#dc2626',
}

export function clearMarks() {
  document.querySelectorAll<HTMLElement>('[data-ja-mark]').forEach((el) => {
    el.style.outline = ''
    el.style.outlineOffset = ''
    el.removeAttribute('data-ja-mark')
  })
}

export function mark(el: HTMLElement, kind: Mark) {
  el.style.outline = `2px solid ${COLORS[kind]}`
  el.style.outlineOffset = '1px'
  el.setAttribute('data-ja-mark', kind)
}