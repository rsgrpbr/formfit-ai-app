'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Mode = 'login' | 'signup' | 'reset';

export default function LoginPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [mode,     setMode]     = useState<Mode>('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [message,  setMessage]  = useState<string | null>(null);

  const clearMessages = () => { setError(null); setMessage(null); };

  const switchMode = (next: Mode) => {
    clearMessages();
    setMode(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return; }
        router.push('/analyze');

      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/analyze`,
            data: { full_name: name.trim() || null },
          },
        });
        if (error) { setError(error.message); return; }
        setMessage('Verifique seu e-mail para confirmar o cadastro.');

      } else {
        // reset
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/analyze`,
        });
        if (error) { setError(error.message); return; }
        setMessage('Link de redefinição enviado para seu e-mail.');
      }
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Recuperar senha';

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">FormFit AI</Link>
        <Link href="/analyze" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          Treinar sem conta →
        </Link>
      </header>

      {/* Formulário */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-black mb-2">{title}</h1>
          <p className="text-gray-400 text-sm mb-8">
            {mode === 'login'  && 'Acesse sua conta para salvar seu progresso.'}
            {mode === 'signup' && 'Crie sua conta gratuitamente.'}
            {mode === 'reset'  && 'Informe seu e-mail para redefinir a senha.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* E-mail */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs text-gray-400 uppercase tracking-wider">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600
                  focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Nome (apenas no cadastro) */}
            {mode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-xs text-gray-400 uppercase tracking-wider">
                  Seu nome
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como você quer ser chamado"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600
                    focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            )}

            {/* Senha */}
            {mode !== 'reset' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs text-gray-400 uppercase tracking-wider">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600
                    focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            )}

            {/* Feedback */}
            {error && (
              <p className="text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-xl px-4 py-3">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm text-green-400 bg-green-900/30 border border-green-800 rounded-xl px-4 py-3">
                {message}
              </p>
            )}

            {/* Botão principal */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-sm
                transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Aguarde…' : title}
            </button>
          </form>

          {/* Ações secundárias */}
          <div className="mt-6 flex flex-col gap-3 text-center text-sm">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => switchMode('signup')}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Não tem conta? Criar conta grátis
                </button>
                <button
                  onClick={() => switchMode('reset')}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Esqueci a senha
                </button>
              </>
            )}

            {mode === 'signup' && (
              <button
                onClick={() => switchMode('login')}
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Já tem conta? Entrar
              </button>
            )}

            {mode === 'reset' && (
              <button
                onClick={() => switchMode('login')}
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                ← Voltar ao login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
