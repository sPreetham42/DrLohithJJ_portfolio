export default {
  name: 'researchInterest',
  title: 'Research Interests',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Topic / Research Area Title',
      type: 'string',
      description: 'e.g. Blockchain Architecture & Smart Contract Security',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 10,
    },
  ],
}
