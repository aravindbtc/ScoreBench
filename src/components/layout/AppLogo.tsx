import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function AppLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2.5', className)}>
      <img src="/icon.svg" alt="ScoreBench Logo" width="32" height="32" />
      <h1 className="text-2xl font-bold tracking-tighter text-primary">
        ScoreBench
      </h1>
    </Link>
  );
}
