'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import api from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; name: string | null };
      }>('/auth/login', { email, password });
      setAuth(data.accessToken, data.refreshToken, data.user);
      router.push('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(
        axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Erro ao entrar') : 'Erro ao entrar',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Entrar</h1>
      <p className="text-slate-500 text-sm mb-8">Acesse sua conta para gerenciar suas finanças</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">Senha</label>
            <Link href="/forgot-password" className="text-xs text-primary-600 hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
            placeholder="••••••••"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors duration-150 disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Não tem conta?{' '}
        <Link href="/register" className="text-primary-600 font-medium hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
