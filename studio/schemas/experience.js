export default {
  name: 'experience',
  title: 'Employment Experience',
  type: 'document',
  fields: [
    {
      name: 'role',
      title: 'Job Position / Role',
      type: 'string',
      description: 'e.g. Professor & Head, Dept. of IoT & CyberSecurity including Blockchain Technology',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'organization',
      title: 'College / Organization',
      type: 'string',
      description: 'e.g. Nagarjuna College of Engineering & Technology, Bengaluru',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'startYear',
      title: 'Start Date / Year',
      type: 'string',
      description: 'e.g. June 2026 or Aug 2009',
    },
    {
      name: 'endYear',
      title: 'End Date / Year',
      type: 'string',
      description: 'e.g. Present or May 2024',
    },
    {
      name: 'isCurrent',
      title: 'Currently Working Here?',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers display first (1 = latest position at the top)',
      initialValue: 10,
    },
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
}
