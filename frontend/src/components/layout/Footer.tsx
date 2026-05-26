import Link from 'next/link';
import { Code2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-code-800 border-t border-code-700 text-secondary-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading text-xl font-bold text-white">Verso</span>
            </Link>
            <p className="text-sm text-secondary-500 max-w-md leading-relaxed">
              Traductor universal de código. Migra proyectos entre lenguajes y versiones
              de forma natural, inteligente y eficiente.
            </p>
          </div>

          <div>
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider mb-4">Producto</h4>
            <ul className="space-y-3">
              {['Inicio', 'Lenguajes', 'Casos de Uso'].map((item) => (
                <li key={item}>
                  <Link href="/" className="text-sm hover:text-primary-400 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-3">
              {['Privacidad', 'Términos', 'Contacto'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-secondary-600 cursor-default">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-code-700 text-center">
          <p className="text-sm text-secondary-600">
            &copy; {new Date().getFullYear()} Verso. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
