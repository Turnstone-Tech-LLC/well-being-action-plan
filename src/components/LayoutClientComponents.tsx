'use client';

import dynamic from 'next/dynamic';

const OfflineIndicator = dynamic(
  () => import('@/components/OfflineIndicator').then((mod) => mod.OfflineIndicator),
  { ssr: false }
);

const InstallPrompt = dynamic(
  () => import('@/components/InstallPrompt').then((mod) => mod.InstallPrompt),
  { ssr: false }
);

export function LayoutClientComponents() {
  return (
    <>
      <OfflineIndicator />
      <InstallPrompt />
    </>
  );
}
