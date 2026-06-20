'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import AuthPrompt from '../../components/AuthPrompt';

export default function LoginPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (profile && profile.onboarded !== true) {
        // Layout handles onboarding flow
      } else {
        router.push('/');
      }
    }
  }, [user, profile, router]);

  return (
    <div className="min-h-screen bg-church-cream flex items-center justify-center p-4">
      <AuthPrompt view="dashboard" />
    </div>
  );
}
