import { FEATURES } from '../content';

import { FeatureIcon } from './icons';

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-16 bg-neutral-50">
      <div className="container-page py-16 sm:py-20">
        <p className="eyebrow">Key features</p>
        <h2
          id="features-title"
          className="display mt-3 max-w-2xl text-3xl font-semibold text-neutral-900 sm:text-4xl"
        >
          Built for the questions HR is actually asked
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-card motion-reduce:transition-none"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-ink text-signal">
                <FeatureIcon name={feature.icon} />
              </span>
              <h3 className="text-lg font-semibold text-neutral-900">{feature.title}</h3>
              <p className="text-neutral-600">{feature.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
