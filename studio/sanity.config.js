import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'

export default defineConfig({
  name: 'default',
  title: 'Dr. Lohith J.J. Portfolio Admin',

  // MANUAL CONFIGURATION REQUIRED: Replace with your actual Sanity Project ID
  projectId: '12ok6v8i',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Portfolio Content')
          .items([
            // Singleton: Profile
            S.listItem()
              .title('Profile & Bio (Hero)')
              .id('profile')
              .child(
                S.document()
                  .schemaType('profile')
                  .documentId('profile')
              ),
            // Singleton: Scholar Stats
            S.listItem()
              .title('Google Scholar Statistics')
              .id('scholarStats')
              .child(
                S.document()
                  .schemaType('scholarStats')
                  .documentId('scholarStats')
              ),
            S.divider(),
            // Regular document collections
            S.documentTypeListItem('experience').title('Employment Experience'),
            S.documentTypeListItem('education').title('Education & Qualifications'),
            S.documentTypeListItem('publication').title('Publications & Papers'),
            S.documentTypeListItem('talk').title('Invited Talks & Workshops'),
            S.documentTypeListItem('award').title('Achievements & Awards'),
            S.documentTypeListItem('skillCategory').title('Skills & Categories'),
          ])
    }),
    visionTool()
  ],

  schema: {
    types: schemaTypes,
  },
})
