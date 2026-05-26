'use client';

import Link from 'next/link';
import { ArrowRight, Code2 } from 'lucide-react';
import Reveal from '../ui/Reveal';

const CTA = () => {
  return (
    <section className="py-24 bg-code-800 border-t border-code-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Reveal>
          <div className="w-16 h-16 bg-primary-600/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Code2 className="w-8 h-8 text-primary-400" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
            ¿Listo para migrar
            <br />
            <span className="text-primary-400">tu proyecto?</span>
          </h2>
          <p className="text-lg text-secondary-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Olvídate de las migraciones manuales. Sube tu proyecto y deja que Verso + Caitlyn
            hagan el trabajo pesado.
          </p>
          <Link
            href="/translator"
            className="inline-flex h-14 px-10 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-sm transition-all items-center justify-center gap-2"
          >
            Comenzar Traducción Gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
};

export default CTA;
