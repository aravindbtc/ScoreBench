import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function AppLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/icon.svg"
        alt="HackEval Logo"
        width={32}
        height={32}
        className="rounded-md"
      />
      <h1 className="text-xl font-bold tracking-tighter text-primary">
        HackEval
      </h1>
    </Link>
  );
}
