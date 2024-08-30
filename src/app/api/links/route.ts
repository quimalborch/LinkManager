import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const dataFilePath = path.join(process.cwd(), 'data', 'links.json')

export async function GET() {
    try {
        const fileContents = await fs.readFile(dataFilePath, 'utf8')
        const links = JSON.parse(fileContents)
        return NextResponse.json(links)
    } catch (error) {
        console.error('Error reading links file:', error)
        return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const links = await request.json()
        await fs.writeFile(dataFilePath, JSON.stringify(links, null, 2))
        return NextResponse.json({ message: 'Links saved successfully' })
    } catch (error) {
        console.error('Error writing links file:', error)
        return NextResponse.json({ error: 'Failed to save links' }, { status: 500 })
    }
}