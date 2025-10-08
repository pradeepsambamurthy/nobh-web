'use client';
import { useEffect } from 'react';

export default function LogoutPage() {
  useEffect(() => {
    document.cookie = 'access_token=; Max-Age=0; path=/';
    document.cookie = 'id_token=; Max-Age=0; path=/';
    document.cookie = 'logged_in=; Max-Age=0; path=/';
    window.location.href = '/';
  }, []);
  return <main className="p-6">Signing out…</main>;
}