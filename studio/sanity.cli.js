import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    // MANUAL CONFIGURATION REQUIRED: Replace with your actual Sanity Project ID
    projectId: 'YOUR_SANITY_PROJECT_ID',
    dataset: 'production'
  }
})
