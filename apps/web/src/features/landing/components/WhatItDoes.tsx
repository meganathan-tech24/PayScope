const PILLARS = [
  {
    number: '01',
    title: 'Manage',
    body: 'Find, add, edit and remove employees and their pay quickly, even at ten thousand rows.',
  },
  {
    number: '02',
    title: 'Understand',
    body: 'See how the organisation pays by country, job title, department and tenure, in the right currency.',
  },
  {
    number: '03',
    title: 'Act',
    body: 'Notice people paid far from their peers, and export exactly the data you need.',
  },
] as const;

export function WhatItDoes() {
  return (
    <section aria-labelledby="what-title" className="bg-white">
      <div className="container-page py-16 sm:py-20">
        <p className="eyebrow">What PayScope does</p>
        <h2
          id="what-title"
          className="display mt-3 max-w-2xl text-3xl font-semibold text-neutral-900 sm:text-4xl"
        >
          One place for pay data that used to live in a spreadsheet
        </h2>
        <ul className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {PILLARS.map((pillar) => (
            <li key={pillar.number} className="border-t-2 border-neutral-900 pt-5">
              <p
                className="display text-4xl font-semibold tabular-nums text-brand-700"
                aria-hidden="true"
              >
                {pillar.number}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-neutral-900">{pillar.title}</h3>
              <p className="mt-2 text-neutral-600">{pillar.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
