import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CAITLYN_URL = process.env.CAITLYN_URL || 'http://localhost:8001'

export async function POST(request: Request) {
  const body = await request.json()
  const { sourceLang, sourceVersion, targetLang, targetVersion, code, repoUrl } = body

  const translation = await prisma.translation.create({
    data: {
      sourceLang,
      sourceVersion,
      targetLang,
      targetVersion,
      status: 'processing',
    },
  })

  try {
    let data: any

    if (repoUrl) {
      // Repo translation
      const repoRes = await fetch(`${CAITLYN_URL}/api/translator/translate-repo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url: repoUrl,
          source_lang: sourceLang,
          target_lang: targetLang,
          target_version: targetVersion,
        }),
      })

      if (!repoRes.ok) {
        throw new Error(`Caitlyn repo error: ${repoRes.status}`)
      }

      data = await repoRes.json()

      await prisma.translation.update({
        where: { id: translation.id },
        data: {
          status: 'completed',
          filesDone: data.translated,
          filesTotal: data.total_files,
          result: data.files?.map((f: any) =>
            `// === ${f.path} ===\n${f.translated}`
          ).join('\n\n') || '',
        },
      })

      return NextResponse.json({
        ...translation,
        status: 'completed',
        result: data,
        method: 'repo',
      })
    }

    // Code snippet translation
    const res = await fetch(`${CAITLYN_URL}/api/translator/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: code || '',
        source_lang: sourceLang,
        target_lang: targetLang,
        source_version: sourceVersion || '',
        target_version: targetVersion || '',
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Caitlyn error (${res.status}): ${errBody}`)
    }

    data = await res.json()

    const updated = await prisma.translation.update({
      where: { id: translation.id },
      data: {
        status: 'completed',
        filesDone: data.lines_output,
        filesTotal: data.lines_input,
      },
    })

    return NextResponse.json({ ...updated, result: data.result, method: data.method })
  } catch (e) {
    await prisma.translation.update({
      where: { id: translation.id },
      data: { status: 'failed' },
    })

    return NextResponse.json(
      { error: 'Translation failed', details: String(e) },
      { status: 502 }
    )
  }
}

export async function GET() {
  const translations = await prisma.translation.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json(translations)
}
