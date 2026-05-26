'use client';

import Reveal from '../ui/Reveal';
import { processSteps } from '../../data/landing';
import { staggerContainer } from '../../animations/variants';
import { motion } from 'framer-motion';

const ProcessSteps = () => {
  return (
    <section className="py-24 bg-code-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
              Cómo funciona
            </h2>
            <p className="text-lg text-secondary-400 max-w-2xl mx-auto">
              Cuatro pasos simples para migrar tu proyecto de un lenguaje a otro.
            </p>
          </div>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {processSteps.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.1}>
              <div className="relative group">
                <div className="relative bg-code-800 border border-code-700 rounded-2xl p-8 hover:border-primary-600 transition-colors duration-300">
                  <div className="w-14 h-14 bg-primary-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-7 h-7 text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-secondary-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ProcessSteps;
