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
})