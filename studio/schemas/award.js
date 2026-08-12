export default {
  name: 'award',
  title: 'Achievements & Awards',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Award / Honor Title',
      type: 'string',
      description: 'e.g. Excellence in Research Award or Best Resource Person — Golden Award 2024',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'organization',
      title: 'Issuing Organization / Event',
      type: 'string',
      description: 'e.g. National Education Brilliance 2024, New Delhi',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'year',
      title: 'Year',
      type: 'string',
      description: 'e.g. 2024',
    },
    {
      name: 'description',
      title: 'Brief Details / Context',
      type: 'text',
      rows: 2,
    },
    {
      name: 'certificateFile',
      title: 'Upload Certificate PDF / Image File',
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
