'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import api from '@/services/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    if (!token) {
      setError('Link inválido. Solicite um novo.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      router.push('/login?reset=true');
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? 'Erro ao redefinir a senha')
          : 'Erro ao redefinir a senha',
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
        <p className="text-slate-900 font-semibold mb-2">Link inválido</p>
        <p className="text-slate-500 text-sm mb-6">Este link de redefinição é inválido ou já expirou.</p>
        <Link href="/forgot-password" className="text-primary-600 text-sm font-medium hover:underline">
          Solicitar novo link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Nova senha</h1>
      <p className="text-slate-500 text-sm mb-8">
        Escolha uma senha forte com pelo menos 8 caracteres.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nova senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
            placeholder="••••••••"
            minLength={8}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar nova senha</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
            placeholder="••••••••"
            minLength={8}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors duration-150 disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className="text-primary-600 font-medium hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
