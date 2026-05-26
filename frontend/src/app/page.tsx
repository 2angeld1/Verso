import Hero from '../components/landing/Hero';
import ProcessSteps from '../components/landing/ProcessSteps';
import SupportedLanguages from '../components/landing/SupportedLanguages';
import Features from '../components/landing/Features';
import UseCases from '../components/landing/UseCases';
import CTA from '../components/landing/CTA';

export default function Home() {
  return (
    <div className="overflow-hidden">
      <Hero />
      <ProcessSteps />
      <SupportedLanguages />
      <Features />
      <UseCases />
      <CTA />
    </div>
  );
}
