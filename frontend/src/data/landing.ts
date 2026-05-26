import {
  ArrowLeftRight,
  Zap,
  Shield,
  GitBranch,
  Puzzle,
  Sparkles,
  Code2,
  Database,
  Globe,
  Server,
  Smartphone,
  Brain,
  FileCode2,
  Workflow,
  RefreshCw,
} from 'lucide-react';

export const processSteps = [
  {
    icon: FileCode2,
    title: '1. Sube tu Proyecto',
    description: 'Arrastra tu repositorio o selecciona la carpeta con el código fuente. Verso analiza la estructura completa del proyecto.',
  },
  {
    icon: Workflow,
    title: '2. Configura la Traducción',
    description: 'Elige lenguaje origen y destino. Verso detecta automáticamente el framework y las dependencias.',
  },
  {
    icon: RefreshCw,
    title: '3. Traducción Inteligente',
    description: 'El motor transforma el AST respetando la lógica de negocio. Caitlyn AI resuelve ambigüedades contextuales.',
  },
  {
    icon: Sparkles,
    title: '4. Proyecto Listo',
    description: 'Descarga el proyecto traducido con estructura, dependencias y configuraciones actualizadas.',
  },
];

export const languages = [
  { name: 'PHP', icon: Code2, versions: ['5.6', '7.x', '8.0', '8.2', '8.4'], color: 'bg-indigo-100 text-indigo-600' },
  { name: 'JavaScript', icon: Code2, versions: ['ES5', 'ES6+', 'ES2025'], color: 'bg-amber-100 text-amber-600' },
  { name: 'TypeScript', icon: Code2, versions: ['3.x', '4.x', '5.x'], color: 'bg-blue-100 text-blue-600' },
  { name: 'Python', icon: Code2, versions: ['2.7', '3.6', '3.8', '3.10', '3.13'], color: 'bg-emerald-100 text-emerald-600' },
  { name: 'Java', icon: Code2, versions: ['8', '11', '17', '21'], color: 'bg-red-100 text-red-600' },
  { name: 'C#', icon: Code2, versions: ['6', '7.x', '8', '9', '10', '11', '12'], color: 'bg-purple-100 text-purple-600' },
  { name: 'Go', icon: Code2, versions: ['1.16', '1.18', '1.21', '1.22'], color: 'bg-cyan-100 text-cyan-600' },
  { name: 'Rust', icon: Code2, versions: ['2015', '2018', '2021', '2024'], color: 'bg-orange-100 text-orange-600' },
  { name: 'Ruby', icon: Code2, versions: ['2.7', '3.0', '3.1', '3.2', '3.3'], color: 'bg-rose-100 text-rose-600' },
  { name: 'Kotlin', icon: Code2, versions: ['1.6', '1.8', '2.0'], color: 'bg-violet-100 text-violet-600' },
];

export const features = [
  {
    icon: ArrowLeftRight,
    title: 'Traducción Multi-Lenguaje',
    description: 'No solo PHP. Verso entiende cualquier lenguaje con gramática Tree-sitter: JS, Python, Java, Go, Rust, C# y más.',
    color: 'bg-primary-100 text-primary-600',
  },
  {
    icon: Zap,
    title: 'Velocidad Natural',
    description: 'El core en Rust procesa proyectos enteros en segundos. Las transformaciones AST son precisas y rápidas.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: Brain,
    title: 'IA Contextual (Caitlyn)',
    description: 'Cuando hay ambigüedad, Caitlyn AI entiende el contexto y decide la mejor traducción. Aprende de cada proyecto.',
    color: 'bg-rose-100 text-rose-600',
  },
  {
    icon: GitBranch,
    title: 'Proyecto Completo',
    description: 'No solo archivos. Verso traduce la estructura, dependencias, configuraciones y build systems completos.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Shield,
    title: 'Validación Automática',
    description: 'El código traducido se valida con compilación, linting y tests. Garantía de que funciona antes de descargar.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Puzzle,
    title: 'Reglas Personalizables',
    description: 'Define tus propias reglas de transformación. Ideal para migraciones de frameworks privados o legacy específico.',
    color: 'bg-violet-100 text-violet-600',
  },
];

export const useCases = [
  {
    icon: Server,
    title: 'PHP 5 → 8.2',
    description: 'Migra aplicaciones legacy de PHP 5.6/6 a PHP 8.2+ con tipos, match expressions, readonly properties y PDO.',
    industry: 'Legacy Enterprise',
  },
  {
    icon: Globe,
    title: 'JavaScript → TypeScript',
    description: 'Convierte cualquier proyecto JS a TS con tipos inferidos, interfaces y config tsconfig automática.',
    industry: 'Frontend Modernization',
  },
  {
    icon: Smartphone,
    title: 'Python 2 → 3',
    description: 'Migra código Python 2 legacy a 3.13 con f-strings, type hints, async/await y paquetes actualizados.',
    industry: 'Data Science',
  },
  {
    icon: Database,
    title: 'Java 8 → 21',
    description: 'Actualiza proyectos Java 8 a 21 con records, pattern matching, sealed classes y streams modernos.',
    industry: 'Backend Enterprise',
  },
];
