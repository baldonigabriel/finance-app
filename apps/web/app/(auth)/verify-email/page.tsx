'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import api from '@/services/api';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const setAuth = useAuthStore((s) => s.setAuth);

  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const inputRefs = [ref0, ref1, ref2, ref3];

  useEffect(() => { ref0.current?.focus(); }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function submit(code: string) {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; name: string | null };
      }>('/auth/verify-email', { email, code });
      setAuth(data.accessToken, data.refreshToken, data.user);
      router.push('/dashboard');
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Código inválido')
        : 'Erro ao verificar';
      setError(msg);
      setDigits(['', '', '', '']);
      ref0.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (value && index < 3) inputRefs[index + 1].current?.focus();
    if (next.every((d) => d !== '')) submit(next.join(''));
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    const next = ['', '', '', ''];
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputRefs[Math.min(pasted.length, 3)].current?.focus();
    if (pasted.length === 4) submit(pasted);
  }

  async function handleResend() {
    setResendLoading(true);
    setError('');
    try {
      await api.post('/auth/resend-code', { email });
      setCooldown(60);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? 'Erro ao reenviar')
          : 'Erro ao reenviar',
      );
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-zinc-200">
      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
        <Mail size={19} className="text-blue-600" strokeWidth={2} />
      </div>

      <h1 className="text-2xl font-semibold text-zinc-900 mb-1">Verifique seu e-mail</h1>
      <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
        Enviamos um código de 4 dígitos para{' '}
        <span className="font-medium text-zinc-700">{email}</span>.
        Verifique também a caixa de spam.
      </p>

      {/* Inputs */}
      <div className="flex gap-3 mb-5" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={inputRefs[i]}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={loading}
            className="flex-1 h-14 text-center text-2xl font-semibold text-zinc-900 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow tabular-nums disabled:opacity-50 cursor-text"
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading && (
        <p className="text-[13px] text-zinc-400 text-center mb-4">Verificando...</p>
      )}

      {/* Resend */}
      <button
        onClick={handleResend}
        disabled={resendLoading || cooldown > 0 || loading}
        className="w-full text-[13px] text-zinc-400 hover:text-zinc-700 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed py-1"
      >
        {cooldown > 0
          ? `Reenviar código em ${cooldown}s`
          : resendLoading
          ? 'Reenviando...'
          : 'Não recebi o código — reenviar'}
      </button>

      <div className="mt-6 pt-5 border-t border-zinc-100 text-center">
        <Link
          href="/login"
          className="text-[13px] text-zinc-400 hover:text-zinc-700 transition-colors duration-150"
        >
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
