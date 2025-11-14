
import { NextResponse } from 'next/server';
import ImageKit from 'imagekit';

// Force this route to be re-evaluated on every request.
// This is crucial for serverless environments like Vercel to ensure
// environment variables are read correctly.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Initialize ImageKit inside the handler to ensure it has access to
  // the latest environment variables in the Vercel serverless environment.
  const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
  });

  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    
    // Explicitly return the public key and URL endpoint with the signature.
    // This is a robust pattern that ensures the client has everything it needs
    // directly from the authentication source.
    return NextResponse.json({
        ...authenticationParameters,
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
    });
  } catch (error) {
    console.error('[IMAGEKIT_AUTH_ERROR]', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    // Provide a more specific error message for easier debugging.
    return NextResponse.json({ error: `ImageKit authentication failed: ${message}` }, { status: 500 });
  }
}
