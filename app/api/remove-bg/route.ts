import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('image') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported format. Use JPG, PNG, or WebP.' }, { status: 400 });
  }

  // Forward to Remove.bg API
  const bgForm = new FormData();
  bgForm.append('image_file', file);
  bgForm.append('size', 'auto');

  const bgRes = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: bgForm,
  });

  if (!bgRes.ok) {
    const errText = await bgRes.text();
    console.error('Remove.bg error:', errText);
    return NextResponse.json(
      { error: 'Background removal failed. Please try again.' },
      { status: bgRes.status }
    );
  }

  const resultBuffer = await bgRes.arrayBuffer();

  return new NextResponse(resultBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    },
  });
}
