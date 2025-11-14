
import { NextResponse } from 'next/server';
import ImageKit from 'imagekit';

export async function GET(request: Request) {
  // Initialize ImageKit inside the handler to ensure it has access to 
  // environment variables in the Vercel serverless environment.
  const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
  });

  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    return NextResponse.json({
        ...authenticationParameters,
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
    });
  } catch (error) {
    console.error('[IMAGEKIT_AUTH_ERROR]', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `ImageKit authentication failed: ${message}` }, { status: 500 });
  }
}
