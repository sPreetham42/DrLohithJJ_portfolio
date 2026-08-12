export default {
  name: 'socialLink',
  title: 'Social & Academic Profile Links',
  type: 'document',
  fields: [
    {
      name: 'platform',
      title: 'Platform Name',
      type: 'string',
      description: 'e.g. LinkedIn, Google Scholar, YouTube, GitHub, ORCID',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'url',
      title: 'Profile URL',
      type: 'url',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'icon',
      title: 'Icon Name / Key',
      type: 'string',
      description: 'e.g. linkedin, scholar, youtube, github, orcid',
    },
    {
      name: 'visible',
      title: 'Visible on Website?',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 10,
    },
  ],
}
