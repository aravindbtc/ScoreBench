// /src/app/api/imagekit-auth/route.ts
import { NextResponse } from 'next/server';
import ImageKit from 'imagekit';

// This is a crucial setting for Vercel deployments.
// It ensures that this serverless function is treated as a dynamic one,
// forcing it to read the latest environment variables on each execution.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // IMPORTANT: Initialize the ImageKit SDK *inside* the handler.
    // This prevents the SDK from being cached without the environment variables
    // in a serverless environment.
    const imagekit = new ImageKit({
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
      urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
    });

    const result = imagekit.getAuthenticationParameters();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[IMAGEKIT_AUTH_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
