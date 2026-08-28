import React from 'react';
import { SiteHeader } from '../components/sections/SiteHeader';
import { Hero } from '../components/sections/Hero';
import { SeeItWork } from '../components/sections/SeeItWork';
import { LogoStrip } from '../components/sections/LogoStrip';
import { ProductTour } from '../components/sections/ProductTour';
import { Features } from '../components/sections/Features';
import { HowItWorks } from '../components/sections/HowItWorks';
import { TableMatching } from '../components/sections/TableMatching';
import { ForOrganizers } from '../components/sections/ForOrganizers';
import { BecomeOrganizer } from '../components/sections/BecomeOrganizer';
import { Pricing } from '../components/sections/Pricing';
import { Faq } from '../components/sections/Faq';
import { FinalCta } from '../components/sections/FinalCta';
import { SiteFooter } from '../components/sections/SiteFooter';
import { ScrollProgress } from '../components/motion/effects';

interface LandingProps {
  heroLayout: 'split' | 'centered';
  showPricing: boolean;
}

export function Landing({ heroLayout, showPricing }: LandingProps) {
  return (
    <div className="min-h-screen w-full bg-ink-900">
      <ScrollProgress />
      <SiteHeader />
      <main>
        <Hero layout={heroLayout} />
        <LogoStrip />
        <SeeItWork />
        <ProductTour />
        <Features />
        <TableMatching />
        <ForOrganizers />
        <BecomeOrganizer />
        <HowItWorks />
        {showPricing && <Pricing />}
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>);

}