export async function POST(request: Request) {
  const formData = await request.formData();
  const apiKey = process.env.NEXT_PUBLIC_REMOVE_BG_API_KEY;

  if (!apiKey) {
    return Response.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return Response.json(error, { status: response.status });
    }

    const blob = await response.blob();
    return new Response(blob, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="bg-removed.png"',
      },
    });
  } catch (error) {
    return Response.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
