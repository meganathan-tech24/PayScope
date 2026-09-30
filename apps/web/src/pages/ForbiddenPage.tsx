import { Link } from 'react-router';

import { buttonClass } from '../components/ui/button-styles';

export function ForbiddenPage() {
  return (
    <div className="container-page flex flex-col items-start gap-4 py-16">
      <p className="eyebrow">Error 403</p>
      <h1 className="display text-4xl font-semibold">You do not have access to this page</h1>
      <p className="max-w-prose text-neutral-600">
        Your account type does not include this area. If you need it, ask an HR Manager.
      </p>
      <Link to="/app" className={buttonClass('primary')}>
        Back to the app
      </Link>
    </div>
  );
}
