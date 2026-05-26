'use client';

import Reveal from '../ui/Reveal';
import { features } from '../../data/landing';
import { staggerContainer } from '../../animations/variants';
import { motion } from 'framer-motion';

const Features = () => {
  return (
    <section className="py-24 bg-code-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
              ¿Por qué Verso?
            </h2>
            <p className="text-lg text-secondary-400 max-w-2xl mx-auto">
              No es solo un traductor. Es un motor de transformación inteligente.
            </p>
          </div>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.05}>
              <div className="group relative bg-code-800 border border-code-700 rounded-2xl p-8 hover:border-primary-600 transition-all duration-300">
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-secondary-400 leading-relaxed">{feature.description}</p>
              </div>
            </Reveal>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
