export default {
  name: 'talk',
  title: 'Invited Talks & Workshops',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Topic / Talk Title',
      type: 'string',
      description: 'e.g. "Blockchain Technology in Education" or "Deploying Smart Contracts"',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'venue',
      title: 'Venue / Event / College',
      type: 'string',
      description: 'e.g. UGC Malaviya Mission Teacher Centre, Bengaluru University',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'dateString',
      title: 'Display Date Label',
      type: 'string',
      description: 'e.g. Jan 2026 or Dec 2024 — Jan 2025',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'year',
      title: 'Filter Year',
      type: 'number',
      description: 'Numeric year used for filter dropdown (e.g. 2026, 2025, 2024)',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'featured',
      title: 'Show in Featured Top Grid?',
      type: 'boolean',
      description: 'If checked, shows in main visible grid. If unchecked, shows under "Show All Talks" list.',
      initialValue: true,
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 10,
    },
  ],
  orderings: [
    {
      title: 'Year (Newest First)',
      name: 'yearDesc',
      by: [{ field: 'year', direction: 'desc' }, { field: 'order', direction: 'asc' }],
    },
  ],
}
