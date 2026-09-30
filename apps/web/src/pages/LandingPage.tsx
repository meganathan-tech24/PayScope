import { ClosingCta } from '../features/landing/components/ClosingCta';
import { Features } from '../features/landing/components/Features';
import { Hero } from '../features/landing/components/Hero';
import { HowItWorks } from '../features/landing/components/HowItWorks';
import { WhatItDoes } from '../features/landing/components/WhatItDoes';
import { WhoSeesWhat } from '../features/landing/components/WhoSeesWhat';

export function LandingPage() {
  return (
    <>
      <Hero />
      <WhatItDoes />
      <Features />
      <HowItWorks />
      <WhoSeesWhat />
      <ClosingCta />
    </>
  );
}
