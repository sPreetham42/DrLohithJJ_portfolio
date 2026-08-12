import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    // MANUAL CONFIGURATION REQUIRED: Replace with your actual Sanity Project ID
    projectId: '12ok6v8i',
    dataset: 'production'
  }
})
