'use client';

import { useRef, useEffect } from 'react';
import { motion, useInView, useAnimation, Variants } from 'framer-motion';
import { slideUp } from '../../animations/variants';

interface RevealProps {
  children: React.ReactNode;
  width?: 'fit-content' | '100%';
  variants?: Variants;
  delay?: number;
  className?: string;
  threshold?: number;
}

const Reveal = ({
  children,
  width = '100%',
  variants = slideUp,
  delay = 0,
  className = "",
  threshold = 0.1
}: RevealProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: threshold });
  const mainControls = useAnimation();

  useEffect(() => {
    if (isInView) {
      mainControls.start("visible");
    }
  }, [isInView, mainControls]);

  return (
    <div ref={ref} style={{ width }} className={className}>
      <motion.div
        variants={{
          hidden: { ...variants.hidden },
          visible: {
            ...variants.visible,
            transition: {
              ...(variants.visible as any).transition,
              delay: delay
            }
          },
        }}
        initial="hidden"
        animate={mainControls}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default Reveal;
