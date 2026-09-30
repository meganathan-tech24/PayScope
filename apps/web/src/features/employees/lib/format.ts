const EMPLOYMENT_TYPE_LABEL: Record<string, string> = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
};

export function employmentTypeLabel(type: string): string {
  return EMPLOYMENT_TYPE_LABEL[type] ?? type;
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

/** "Germany" for "DE"; the code itself when the runtime does not know it. */
export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

const dateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' });

/** Hire dates are calendar dates stored at midnight UTC, so format them in UTC too. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : dateFormat.format(date);
}

const SORT_LABEL: Record<string, string> = {
  fullName: 'Name',
  jobTitle: 'Job title',
  department: 'Department',
  country: 'Country',
  hireDate: 'Hire date',
  salary: 'Salary',
};

export function sortLabel(field: string): string {
  return SORT_LABEL[field] ?? field;
}
