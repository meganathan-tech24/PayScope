// The API hides groups smaller than this from a VIEWER (a statistic over one or two people
// is those people's salary). The number is shown to the user, so it is named here.
export const VIEWER_MIN_GROUP_SIZE = 5;

export function hiddenGroupsMessage(count: number): string {
  return `${count} ${count === 1 ? 'group' : 'groups'} hidden: fewer than ${VIEWER_MIN_GROUP_SIZE} employees`;
}

const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' });

/** "EUR – Euro"; the bare code when the runtime does not know it. */
export function currencyLabel(code: string): string {
  try {
    const name = currencyNames.of(code);
    return name && name !== code ? `${code} – ${name}` : code;
  } catch {
    return code;
  }
}
