import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Job Autofill',
  version: '0.1.0',
  description: 'Personal, local-only job application autofill',
  permissions: ['activeTab', 'scripting', 'storage'],
  action: {
    default_popup: 'src/popup/index.html',
  },
  options_page: 'src/options/index.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  commands: {
    'fill-page': {
      suggested_key: { default: 'Alt+Shift+F' },
      description: 'Fill this page',
    },
  },
})