export default {
  name: 'certification',
  title: 'Certifications',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Certification Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'issuingOrganization',
      title: 'Issuing Organization',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'year',
      title: 'Year / Date Issued',
      type: 'string',
    },
    {
      name: 'credentialId',
      title: 'Credential ID',
      type: 'string',
    },
    {
      name: 'credentialLink',
      title: 'Verification Link URL',
      type: 'url',
    },
    {
      name: 'certificateFile',
      title: 'Upload Certificate Document (PDF/File)',
      type: 'file',
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 10,
    },
  ],
}
