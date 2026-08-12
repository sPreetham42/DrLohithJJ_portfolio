export default {
  name: 'project',
  title: 'Research Projects',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Project Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Short Summary',
      type: 'text',
      rows: 3,
    },
    {
      name: 'image',
      title: 'Project Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'technologies',
      title: 'Technologies Used',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'projectLink',
      title: 'Project Link / Demo URL',
      type: 'url',
    },
    {
      name: 'githubLink',
      title: 'GitHub Code Repository URL',
      type: 'url',
    },
    {
      name: 'collaborators',
      title: 'Collaborators',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'collaborator' }] }],
    },
    {
      name: 'year',
      title: 'Year',
      type: 'string',
    },
    {
      name: 'featured',
      title: 'Featured Project?',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 10,
    },
  ],
}
