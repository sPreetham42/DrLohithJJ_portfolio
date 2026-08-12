export default {
  name: 'scholarStats',
  title: 'Google Scholar Statistics',
  type: 'document',
  fields: [
    {
      name: 'citations',
      title: 'Total Citations',
      type: 'number',
      description: 'Automatically updated daily by GitHub Actions workflow (or edit manually)',
      initialValue: 168,
    },
    {
      name: 'hIndex',
      title: 'h-index',
      type: 'number',
      initialValue: 7,
    },
    {
      name: 'i10Index',
      title: 'i10-index',
      type: 'number',
      initialValue: 5,
    },
    {
      name: 'sciePapersCount',
      title: 'SCIE Papers Count',
      type: 'number',
      initialValue: 4,
    },
    {
      name: 'ieeeConferencesCount',
      title: 'IEEE Conferences Count',
      type: 'number',
      initialValue: 6,
    },
    {
      name: 'lastUpdated',
      title: 'Last Updated Date / Time',
      type: 'datetime',
    },
    {
      name: 'source',
      title: 'Data Source',
      type: 'string',
      description: 'e.g. google_scholar, openalex, baseline',
    },
  ],
}
