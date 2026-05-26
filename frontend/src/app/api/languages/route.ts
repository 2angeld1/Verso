import { NextResponse } from 'next/server'

const CAITLYN_URL = process.env.CAITLYN_URL || 'http://localhost:8001'

export async function GET() {
  try {
    const res = await fetch(`${CAITLYN_URL}/api/translator/languages`)
    if (res.ok) {
      const data = await res.json()
      const languages = Object.entries(data).map(([key, val]: [string, any]) => ({
        name: key,
        label: val.label,
        versions: val.target_versions,
        sourceVersions: val.source_versions,
        canTranslateTo: val.can_translate_to || [],
        targetLang: val.target_lang,
      }))
      return NextResponse.json(languages)
    }
  } catch {
    // Fallback if Caitlyn unavailable
  }

  const languages = [
    { name: 'PHP', label: 'PHP', versions: ['8.0', '8.1', '8.2', '8.3', '8.4'], sourceVersions: ['5.6', '7.0', '7.1', '7.2', '7.3', '7.4'], canTranslateTo: ['Python', 'JavaScript', 'Go', 'Java', 'Rust', 'C#', 'Ruby', 'TypeScript'], targetLang: 'PHP' },
    { name: 'JavaScript', label: 'JavaScript', versions: ['TS 5.x'], sourceVersions: ['ES5', 'ES6', 'ES2016+'], canTranslateTo: ['Python', 'Go', 'Java', 'Rust', 'TypeScript', 'PHP', 'C#', 'Ruby'], targetLang: 'TypeScript' },
    { name: 'Python', label: 'Python', versions: ['3.11', '3.12', '3.13'], sourceVersions: ['2.7', '3.6', '3.7', '3.8', '3.9', '3.10', '3.11', '3.12', '3.13'], canTranslateTo: ['Go', 'JavaScript', 'Rust', 'Java', 'C#', 'Ruby', 'PHP', 'TypeScript'], targetLang: 'Python' },
    { name: 'Java', label: 'Java', versions: ['17', '21'], sourceVersions: ['8', '11', '17', '21'], canTranslateTo: ['Python', 'JavaScript', 'Go', 'Rust', 'Kotlin', 'C#', 'PHP'], targetLang: 'Java' },
    { name: 'Go', label: 'Go', versions: ['1.22', '1.23'], sourceVersions: ['1.16', '1.17', '1.18', '1.19', '1.20', '1.21', '1.22'], canTranslateTo: ['Python', 'JavaScript', 'Java', 'Rust', 'C#', 'PHP', 'TypeScript'], targetLang: 'Go' },
    { name: 'Rust', label: 'Rust', versions: ['2021', '2024'], sourceVersions: ['2015', '2018', '2021', '2024'], canTranslateTo: ['Python', 'JavaScript', 'Go', 'Java', 'C#', 'PHP', 'TypeScript'], targetLang: 'Rust' },
    { name: 'C#', label: 'C#', versions: ['10', '11', '12'], sourceVersions: ['7.x', '8', '9', '10', '11', '12'], canTranslateTo: ['Python', 'JavaScript', 'Go', 'Java', 'Rust', 'PHP', 'TypeScript'], targetLang: 'C#' },
    { name: 'Ruby', label: 'Ruby', versions: ['3.0', '3.1', '3.2', '3.3'], sourceVersions: ['2.7', '3.0', '3.1', '3.2', '3.3'], canTranslateTo: ['Python', 'JavaScript', 'Go', 'Java', 'Rust', 'PHP'], targetLang: 'Ruby' },
    { name: 'Kotlin', label: 'Kotlin', versions: ['1.8', '2.0'], sourceVersions: ['1.6', '1.8', '2.0'], canTranslateTo: ['Java', 'Python', 'JavaScript', 'Go'], targetLang: 'Kotlin' },
  ]

  return NextResponse.json(languages)
}
