import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const { rows } = await sql`
      SELECT * FROM links 
      WHERE user_id = ${userId} 
      ORDER BY id DESC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching links:', error)
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { userId, encryptedTitle, encryptedUrl } = await request.json()

  if (!userId || !encryptedTitle || !encryptedUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const { rows } = await sql`
      INSERT INTO links (user_id, encrypted_title, encrypted_url)
      VALUES (${userId}, ${encryptedTitle}, ${encryptedUrl})
      RETURNING id
    `
    return NextResponse.json({ id: rows[0].id, message: 'Link added successfully' })
  } catch (error) {
    console.error('Error adding link:', error)
    return NextResponse.json({ error: 'Failed to add link' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const userId = searchParams.get('userId')

  if (!id || !userId) {
    return NextResponse.json({ error: 'Link ID and User ID are required' }, { status: 400 })
  }

  try {
    await sql`
      DELETE FROM links 
      WHERE id = ${id} AND user_id = ${userId}
    `
    return NextResponse.json({ message: 'Link deleted successfully' })
  } catch (error) {
    console.error('Error deleting link:', error)
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
  }
}