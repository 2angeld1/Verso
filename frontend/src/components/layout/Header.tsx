'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, Code2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  const links = [
    { name: 'Inicio', path: '/' },
    { name: 'Lenguajes', path: '/#lenguajes' },
    { name: 'Casos de Uso', path: '/#casos-de-uso' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerBg = isScrolled
    ? 'bg-code-800/95 backdrop-blur-md border-b border-code-700'
    : 'bg-code-900';

  if (pathname.startsWith('/admin')) return null;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-white transition-colors duration-300">
              Verso
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className="text-sm font-medium text-secondary-400 hover:text-white transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 h-0.5 bg-primary-500 transition-all duration-300 w-0 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href="/translator"
              className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 hover:shadow-lg bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-2"
            >
              Probar Ahora
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-secondary-400 hover:text-white hover:bg-code-800 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden border-t border-code-700 bg-code-800/95 backdrop-blur-md rounded-b-2xl"
            >
              <div className="flex flex-col space-y-2 p-4">
                {links.map((link) => (
                  <Link
                    key={link.name}
                    href={link.path}
                    className="block px-4 py-3 rounded-xl font-medium text-secondary-400 hover:text-white hover:bg-code-700 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-4 border-t border-code-700 mt-2">
                  <Link
                    href="/translator"
                    className="block w-full text-center bg-primary-600 text-white py-3 rounded-xl font-medium shadow-md active:scale-95 transition-transform"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Probar Ahora
                  </Link>
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
