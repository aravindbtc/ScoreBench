import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none"><path d="M2.46154 2.46154H29.5385V14.7692H14.7692V29.5385H2.46154V2.46154Z" fill="%231967D2"/><path d="M14.7692 14.7692H29.5385V29.5385H14.7692V14.7692Z" fill="%2334A853"/></svg>`;
const iconDataUri = `data:image/svg+xml,${iconSvg}`;

export const metadata: Metadata = {
  title: 'HackEval - Jury Evaluation System',
  description: 'A modern, real-time evaluation system for hackathons.',
  icons: {
    icon: iconDataUri,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href={iconDataUri} sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
