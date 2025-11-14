/**
 * Dynamic QR Code Component
 *
 * Lazy-loads the qrcode.react library to reduce initial bundle size.
 * Only loads when the component is rendered (e.g., when QR modal opens).
 */
'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Dynamically import QRCodeSVG to reduce bundle size
const QRCodeSVG = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), {
  loading: () => (
    <div className="flex h-[200px] w-[200px] items-center justify-center bg-gray-100">
      <p className="text-sm text-gray-500">Loading QR Code...</p>
    </div>
  ),
  ssr: false,
});

export type QRCodeProps = ComponentProps<typeof QRCodeSVG>;

export function QRCode(props: QRCodeProps) {
  return <QRCodeSVG {...props} />;
}
