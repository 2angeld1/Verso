'use client';

import Reveal from '../ui/Reveal';
import { languages } from '../../data/landing';
import { motion } from 'framer-motion';
import { staggerContainer } from '../../animations/variants';

const SupportedLanguages = () => {
  return (
    <section id="lenguajes" className="py-24 bg-code-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
              Lenguajes Soportados
            </h2>
            <p className="text-lg text-secondary-400 max-w-2xl mx-auto">
              Más de 305 lenguajes vía Tree-sitter. Estos son los más usados para traducción.
            </p>
          </div>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          {languages.map((lang, index) => (
            <Reveal key={lang.name} delay={index * 0.05}>
              <div className="bg-code-900 border border-code-700 rounded-xl p-6 hover:border-primary-600 transition-all duration-300 group">
                <div className={`w-12 h-12 ${lang.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <lang.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{lang.name}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {lang.versions.map((v) => (
                    <span key={v} className="text-[10px] font-mono font-medium text-secondary-500 bg-code-800 px-1.5 py-0.5 rounded">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </motion.div>

        <Reveal delay={0.3}>
          <p className="text-center text-sm text-secondary-500 mt-10">
            + Java, Kotlin, Ruby, Go, Rust, C#, Swift, y 295+ lenguajes más con gramática Tree-sitter.
          </p>
        </Reveal>
      </div>
    </section>
  );
};

export default SupportedLanguages;
