export default {
  name: 'publication',
  title: 'Publications & Papers',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Paper Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'authors',
      title: 'Authors List',
      type: 'string',
      description: 'e.g. L. J.J. and K. Singh',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'venue',
      title: 'Journal / Conference Name & Volume',
      type: 'string',
      description: 'e.g. International Journal of Information Technology, vol. 16(6), pp. 3389–3399',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'publicationType',
      title: 'Publication Type',
      type: 'string',
      options: {
        list: [
          { title: 'SCIE / Scopus Journal', value: 'journal' },
          { title: 'IEEE Conference Proceeding', value: 'conference' },
          { title: 'Book Chapter / Textbook', value: 'book' },
        ],
        layout: 'radio',
      },
      initialValue: 'journal',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'year',
      title: 'Year of Publication',
      type: 'number',
      description: 'e.g. 2024',
    },
    {
      name: 'doi',
      title: 'DOI URL or Number',
      type: 'string',
      description: 'e.g. https://doi.org/10.1007/s41870-024-01909-8',
    },
    {
      name: 'pdfFile',
      title: 'Upload Full Paper PDF',
      type: 'file',
      description: 'Single-click PDF upload directly from your computer',
      options: {
        accept: '.pdf',
      },
    },
    {
      name: 'externalLink',
      title: 'External Link / Publisher URL',
      type: 'url',
    },
    {
      name: 'codeNumber',
      title: 'Paper Code Number',
      type: 'string',
      description: 'e.g. J1, J2, C1, C2',
    },
    {
      name: 'featured',
      title: 'Featured Paper',
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
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
    {
      title: 'Year (Newest First)',
      name: 'yearDesc',
      by: [{ field: 'year', direction: 'desc' }],
    },
  ],
}
