'use client';

import Link from 'next/link';
import { ArrowRight, Code2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-code-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-code-800 border border-code-700 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-xs font-semibold text-primary-300 tracking-widest uppercase">
              Impulsado por Caitlyn AI
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.95] mb-6 text-white"
          >
            Traduce código
            <br />
            <span className="text-primary-400">
              entre lenguajes.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-secondary-400 mb-10 max-w-2xl leading-relaxed"
          >
            Migra proyectos enteros de PHP 6 a 8.2, de JavaScript a TypeScript, de Python 2 a 3,
            o entre cualquier lenguaje con gramática Tree-sitter. Rápido, preciso, inteligente.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/translator"
              className="h-14 px-8 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              Empezar Traducción
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/#lenguajes"
              className="h-14 px-8 bg-code-800 border border-code-700 text-secondary-300 hover:text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Code2 className="w-4 h-4" />
              Ver Lenguajes Soportados
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 flex items-center gap-8 text-sm text-secondary-500"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              305+ lenguajes
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Proyecto completo
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              IA contextual
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
