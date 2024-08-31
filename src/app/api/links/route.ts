import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    const { rows } = await sql`SELECT * FROM links ORDER BY id DESC`
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching links:', error)
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 })
  }
}

export async function POST(request: Request) {
    try {
      const links = await request.json();
      await sql`DELETE FROM links`;
      for (const link of links) {
        if (link.encryptedTitle && link.encryptedUrl) { // Validación para evitar nulos
          await sql`
            INSERT INTO links (id, encrypted_title, encrypted_url)
            VALUES (${link.id}, ${link.encryptedTitle}, ${link.encryptedUrl})
          `;
        } else {
          throw new Error("encryptedTitle or encryptedUrl is missing.");
        }
      }
      return NextResponse.json({ message: 'Links saved successfully' });
    } catch (error) {
      console.error('Error saving links:', error);
      return NextResponse.json({ error: 'Failed to save links' }, { status: 500 });
    }
}  