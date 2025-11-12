
'use client';

import Image from "next/image";

export function CurrentLoginBackground({ imageUrl }: { imageUrl: string }) {
    return (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            <Image
                src={imageUrl}
                alt="Current login background"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 33vw"
            />
        </div>
    );
}
