import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const translation = await prisma.translation.findUnique({ where: { id } })

  if (!translation) {
    return NextResponse.json({ error: 'Translation not found' }, { status: 404 })
  }

  return NextResponse.json(translation)
}
