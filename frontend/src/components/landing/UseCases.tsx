'use client';

import Reveal from '../ui/Reveal';
import { useCases } from '../../data/landing';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const UseCases = () => {
  return (
    <section id="casos-de-uso" className="py-24 bg-code-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
              Casos de Uso
            </h2>
            <p className="text-lg text-secondary-400 max-w-2xl mx-auto">
              Migraciones reales que Verso puede hacer en minutos.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((useCase, index) => (
            <Reveal key={useCase.title} delay={index * 0.1}>
              <div className="group bg-code-900 border border-code-700 rounded-2xl p-8 hover:border-primary-600 transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-primary-600/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <useCase.icon className="w-7 h-7 text-primary-400" />
                  </div>
                  <span className="text-[11px] font-semibold text-primary-300 bg-primary-600/10 px-3 py-1 rounded-full">
                    {useCase.industry}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{useCase.title}</h3>
                <p className="text-sm text-secondary-400 leading-relaxed mb-6">{useCase.description}</p>
                <Link
                  href="/translator"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors group/link"
                >
                  Probar esta migración
                  <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
