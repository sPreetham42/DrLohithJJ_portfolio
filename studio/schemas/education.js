export default {
  name: 'education',
  title: 'Education',
  type: 'document',
  fields: [
    {
      name: 'degree',
      title: 'Degree / Qualification',
      type: 'string',
      description: 'e.g. Ph.D. in Computer Science',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'institution',
      title: 'University / Institution',
      type: 'string',
      description: 'e.g. National Institute of Technology (NIT), Tiruchirappalli',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'year',
      title: 'Year Range',
      type: 'string',
      description: 'e.g. 2017 — 2024',
    },
    {
      name: 'thesis',
      title: 'Thesis / Specialization Details',
      type: 'text',
      rows: 2,
      description: 'Thesis title or grade details (e.g. Thesis: "Blockchain-Based Smart Contract Security...")',
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers display first (1 = top)',
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
