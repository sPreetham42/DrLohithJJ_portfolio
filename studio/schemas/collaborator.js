export default {
  name: 'collaborator',
  title: 'Collaborators',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'designation',
      title: 'Designation / Title',
      type: 'string',
    },
    {
      name: 'institution',
      title: 'Institution / Organization',
      type: 'string',
    },
    {
      name: 'profileImage',
      title: 'Profile Photo',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'profileLink',
      title: 'Website / Profile URL',
      type: 'url',
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
    },
    {
      name: 'researchAreas',
      title: 'Research Focus Areas',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 10,
    },
  ],
}
