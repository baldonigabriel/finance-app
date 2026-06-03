'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import api from '@/services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? 'Erro ao enviar o e-mail')
          : 'Erro ao enviar o e-mail',
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Verifique seu e-mail</h1>
        <p className="text-slate-500 text-sm mb-6">
          Se esse endereço estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
        </p>
        <Link
          href="/login"
          className="text-primary-600 text-sm font-medium hover:underline"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Esqueceu a senha?</h1>
      <p className="text-slate-500 text-sm mb-8">
        Digite seu e-mail e enviaremos um link para você criar uma nova senha.
      </p>

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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors duration-150 disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Enviando...' : 'Enviar link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Lembrou a senha?{' '}
        <Link href="/login" className="text-primary-600 font-medium hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
