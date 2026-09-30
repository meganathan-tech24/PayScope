import { ROLE_COLUMNS } from '../content';

export function WhoSeesWhat() {
  return (
    <section id="roles" aria-labelledby="roles-title" className="scroll-mt-16 bg-neutral-50">
      <div className="container-page py-16 sm:py-20">
        <p className="eyebrow">Who sees what</p>
        <h2
          id="roles-title"
          className="display mt-3 max-w-2xl text-3xl font-semibold text-neutral-900 sm:text-4xl"
        >
          Two account types, one clear line around individual pay
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {ROLE_COLUMNS.map((column) => (
            <article
              key={column.role}
              className="rounded-lg border border-neutral-200 bg-white p-6 sm:p-8"
            >
              <h3 className="display text-2xl font-semibold text-neutral-900">{column.role}</h3>
              <p className="mt-1 text-neutral-600">{column.lead}</p>
              <ul className="mt-5 flex flex-col gap-3">
                {column.items.map((item) => (
                  <li key={item} className="flex gap-3 text-neutral-800">
                    <svg
                      viewBox="0 0 24 24"
                      className="mt-0.5 h-5 w-5 shrink-0 text-brand-700"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
