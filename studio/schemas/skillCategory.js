export default {
  name: 'skillCategory',
  title: 'Skills & Categories',
  type: 'document',
  fields: [
    {
      name: 'category',
      title: 'Category Name',
      type: 'string',
      description: 'e.g. Domain Expertise, Practical Tools, Administration, Languages & Misc.',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'skills',
      title: 'Skill Tags',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'List of individual skill pills (e.g. Blockchain, Cryptography, Solidity, Metamask)',
      validation: (Rule) => Rule.required(),
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
  ],
}
