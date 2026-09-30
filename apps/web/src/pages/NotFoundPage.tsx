import { Link } from 'react-router';

import { buttonClass } from '../components/ui/button-styles';

export function NotFoundPage() {
  return (
    <div className="container-page flex flex-col items-start gap-4 py-16">
      <p className="eyebrow">Error 404</p>
      <h1 className="display text-4xl font-semibold">We could not find that page</h1>
      <p className="max-w-prose text-neutral-600">
        The address may be mistyped, or the page may have moved.
      </p>
      <Link to="/" className={buttonClass('primary')}>
        Go to the home page
      </Link>
    </div>
  );
}
