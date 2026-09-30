export const FEATURES = [
  {
    icon: 'directory',
    title: 'A directory that stays fast at 10,000 people',
    body: 'Search, filter by country, department and job title, sort and page through every employee without waiting on a spreadsheet to recalculate.',
  },
  {
    icon: 'insights',
    title: 'Pay statistics that answer real questions',
    body: 'Minimum, quartiles, median, average and maximum by country, job title and department, plus salary bands and pay against tenure.',
  },
  {
    icon: 'outliers',
    title: 'Outliers found like for like',
    body: 'People paid far from their peers are flagged against the same country, job title and employment type, so interns are not mistaken for anomalies. HR Managers only.',
  },
  {
    icon: 'currency',
    title: 'Currencies are never mixed by accident',
    body: 'Every figure stays in its own currency. An optional USD view uses a fixed, documented rate table and always says it is approximate.',
  },
  {
    icon: 'privacy',
    title: 'Private by role, enforced by the server',
    body: 'Viewers never receive an individual salary, in the list, the detail or the export. The API decides what leaves the server, not the screen.',
  },
  {
    icon: 'export',
    title: 'Export exactly what you filtered',
    body: 'Download the current view as CSV. Viewers get the same rows without the salary column.',
  },
] as const;

export const STEPS = [
  {
    title: 'Create your account',
    body: 'Choose HR Manager if you manage pay, or Viewer if you only need to look things up. Sign in with an email and a password.',
  },
  {
    title: 'Explore your organisation',
    body: 'Browse the directory and open the pay statistics by country, job title and department, each in its own currency.',
  },
  {
    title: 'Act on what you find',
    body: 'HR Managers review outliers, edit records and export data. Viewers share the aggregated picture without exposing anyone.',
  },
] as const;

export const ROLE_COLUMNS = [
  {
    role: 'HR Manager',
    lead: 'Everything, including individual pay.',
    items: [
      'Individual salaries in the list, detail and export',
      'All pay statistics, salary bands and the outliers table',
      'Add, edit and delete employees',
      'CSV export with every column',
    ],
  },
  {
    role: 'Viewer',
    lead: 'The directory and the aggregate picture.',
    items: [
      'Directory fields only: no individual salaries',
      'Aggregated pay statistics (small groups are hidden)',
      'No outliers table and no editing',
      'CSV export without the salary column',
    ],
  },
] as const;
