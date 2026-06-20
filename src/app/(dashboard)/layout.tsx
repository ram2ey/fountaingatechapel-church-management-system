'use client';

import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import Sidebar from '../../components/Sidebar';
import OnboardingFlow from '../../components/OnboardingFlow';
import AuthPrompt from '../../components/AuthPrompt';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-church-cream">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-church-burgundy"></div>
      </div>
    );
  }

  // If user is not onboarded, block page and show Onboarding flow
  if (user && profile && profile.onboarded !== true) {
    return <OnboardingFlow />;
  }

  // If user is not logged in, prompt for auth except for dashboard or giving
  const isPublicPage = pathname === '/' || pathname === '/giving' || pathname === '/login';
  if (!user && !isPublicPage) {
    const viewName = pathname.replace('/', '') || 'dashboard';
    return <AuthPrompt view={viewName} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-church-cream selection:bg-church-burgundy selection:text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative">
        <div className="max-w-5xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
