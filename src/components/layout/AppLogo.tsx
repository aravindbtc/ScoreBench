import Link from 'next/link';
import { cn } from '@/lib/utils';

export function AppLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2.5', className)}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="HackEval Logo"
      >
        <path
          d="M2.46154 2.46154H29.5385V14.7692H14.7692V29.5385H2.46154V2.46154Z"
          fill="#1967D2"
        />
        <path d="M14.7692 14.7692H29.5385V29.5385H14.7692V14.7692Z" fill="#34A853" />
      </svg>
      <h1 className="text-2xl font-bold tracking-tighter text-primary">
        HackEval
      </h1>
    </Link>
  );
}
