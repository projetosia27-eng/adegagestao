import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';
import { PWAInstallPrompt } from '../ui/PWAInstallPrompt';

export const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-[100dvh] bg-background text-text-primary font-sans overflow-hidden">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <PWAInstallPrompt />
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto min-h-full pb-32 md:pb-12">
          {children}
        </div>
      </main>
      <BottomNavigation />
    </div>
  </div>
);
