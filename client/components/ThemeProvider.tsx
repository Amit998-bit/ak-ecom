'use client';
import { useEffect } from 'react';
import apiClient from '@/lib/api-client';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applyTheme = (theme: any) => {
      if (!theme?.colors) return;
      const root = document.documentElement;
      root.style.setProperty('--color-primary', theme.colors.primary || '#2563eb');
      root.style.setProperty('--color-secondary', theme.colors.secondary || '#7c3aed');
      root.style.setProperty('--color-accent', theme.colors.accent || '#f59e0b');
      root.style.setProperty('--color-background', theme.colors.background || '#ffffff');
      root.style.setProperty('--color-text', theme.colors.text || '#111827');
      root.style.setProperty('--color-muted', theme.colors.muted || '#6b7280');
      if (theme.fonts?.primary) {
        root.style.setProperty('--font-primary', theme.fonts.primary);
      }
    };

    // First apply from localStorage (instant)
    const cached = localStorage.getItem('store-theme');
    if (cached) {
      try { applyTheme(JSON.parse(cached)); } catch {}
    }

    // Then fetch from API (fresh)
    apiClient.get('/theme')
      .then(({ data }) => {
        if (data.data) {
          applyTheme(data.data);
          localStorage.setItem('store-theme', JSON.stringify(data.data));
        }
      })
      .catch(() => {});
  }, []);

  return <>{children}</>;
}
