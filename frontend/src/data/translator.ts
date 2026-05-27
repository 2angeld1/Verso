import { Database, Puzzle, Brain, Zap, Github, type LucideIcon } from 'lucide-react'

export interface Language {
  name: string
  label: string
  versions: string[]
  sourceVersions: string[]
  canTranslateTo: string[]
  targetLang: string
}

export interface Translation {
  id: string
  sourceLang: string
  sourceVersion: string
  targetLang: string
  targetVersion: string
  status: string
  filesTotal: number
  filesDone: number
  createdAt: string
  result?: string
  method?: string
}

export interface RepoFile {
  path: string
  language: string
  original: string
  translated: string
  method: string
}

export interface RepoResult {
  repo_url: string
  total_files: number
  translated: number
  skipped: number
  errors: number
  files: RepoFile[]
}

export const PHP_CODE = `<?php
mysql_connect("localhost", "root", "pass");
mysql_select_db("test");

$result = mysql_query("SELECT * FROM users");
while ($row = mysql_fetch_assoc($result)) {
    echo $row['name'] . "<br>";
}

eregi("hello", $text);
split(",", $csv);
?>`

export const JS_CODE = `var x = 1;
var name = "Mundo";

function hello(name) {
    return "Hola " + name;
}

function add(a, b) {
    return a + b;
}

module.exports = { hello, add };`

interface MethodConfig {
  label: string
  icon: LucideIcon
  color: string
}

export const METHOD_CONFIG: Record<string, MethodConfig> = {
  cache: { label: 'Caché', icon: Database, color: 'text-cyan-400 bg-cyan-900/20 border-cyan-800' },
  rules: { label: 'Reglas', icon: Puzzle, color: 'text-amber-400 bg-amber-900/20 border-amber-800' },
  rules_fallback: { label: 'Reglas (fallback)', icon: Puzzle, color: 'text-amber-400 bg-amber-900/20 border-amber-800' },
  repo: { label: 'Repo', icon: Github, color: 'text-purple-400 bg-purple-900/20 border-purple-800' },
}

export function getMethodConfig(method: string | undefined): MethodConfig | null {
  if (!method) return null
  if (METHOD_CONFIG[method]) return METHOD_CONFIG[method]
  if (method.startsWith('gemini:')) return { label: `Gemini ${method.split(':')[1]}`, icon: Brain, color: 'text-emerald-400 bg-emerald-900/20 border-emerald-800' }
  if (method.startsWith('cohere:')) return { label: `Cohere ${method.split(':')[1]}`, icon: Brain, color: 'text-blue-400 bg-blue-900/20 border-blue-800' }
  return { label: method, icon: Zap, color: 'text-secondary-400 bg-code-700 border-code-600' }
}
