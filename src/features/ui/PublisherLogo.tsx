import Image from 'next/image';
import { NEX_MAXX_LOGO } from '../../domain/brand';

export function PublisherLogo({ className = '' }: { className?: string }) {
  return <Image src={NEX_MAXX_LOGO.src} width={NEX_MAXX_LOGO.width} height={NEX_MAXX_LOGO.height}
    alt={NEX_MAXX_LOGO.alt} unoptimized priority draggable={false}
    className={`block shrink-0 object-contain rounded ${className}`} />;
}
