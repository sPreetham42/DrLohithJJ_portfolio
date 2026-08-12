export default {
  name: 'student',
  title: 'Mentored Students',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Student Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'program',
      title: 'Academic Program',
      type: 'string',
      description: 'e.g. Ph.D., M.Tech, B.Tech',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'researchArea',
      title: 'Research Area / Thesis Topic',
      type: 'string',
    },
    {
      name: 'year',
      title: 'Graduation Year / Batch',
      type: 'string',
    },
    {
      name: 'status',
      title: 'Current Status',
      type: 'string',
      options: {
        list: [
          { title: 'Ongoing', value: 'ongoing' },
          { title: 'Graduated / Completed', value: 'completed' },
        ],
      },
      initialValue: 'completed',
    },
    {
      name: 'profileLink',
      title: 'LinkedIn / Portfolio URL',
      type: 'url',
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 10,
    },
  ],
}
