import { STEPS } from '../content';

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-16 bg-white">
      <div className="container-page py-16 sm:py-20">
        <p className="eyebrow">How it works</p>
        <h2
          id="how-title"
          className="display mt-3 max-w-2xl text-3xl font-semibold text-neutral-900 sm:text-4xl"
        >
          From sign-up to insight in three steps
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4 md:flex-col">
              <span
                className="display flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-semibold text-signal"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">{step.title}</h3>
                <p className="mt-1 text-neutral-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
