import React from 'react'
import { BottomNav } from '@/components/shared/BottomNav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* 
        The pb-24 is to ensure content doesn't hide behind the bottom navigation.
        It uses the safe-area padding for mobile devices.
      */}
      <main className="flex-1 w-full max-w-md mx-auto relative px-4 pt-6">
        {children}
      </main>
      
      <div className="w-full max-w-md mx-auto">
        <BottomNav />
      </div>
    </div>
  )
}
