import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Wine, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Email ou senha inválidos.');
        }
        throw error;
      }

      if (data.user) {
        const role = data.user.user_metadata?.role;
        if (from !== '/') {
          navigate(from, { replace: true });
        } else if (role === 'vendor') {
          navigate('/vendedor/dashboard', { replace: true });
        } else {
          navigate('/cliente/home', { replace: true });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link to="/" className="flex items-center space-x-3 mb-8 group">
        <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold-dark rounded-xl shadow-lg shadow-gold/20 flex items-center justify-center group-hover:scale-105 transition-transform">
          <Wine className="w-6 h-6 text-background" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">AdegaHub</h1>
      </Link>

      <Card className="w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Entrar na sua conta</h2>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-500">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="email">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email || ""}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-text-secondary" htmlFor="password">
                Senha
              </label>
              <Link to="/recuperar-senha" className="text-xs text-gold hover:text-gold-light transition-colors">
                Esqueceu a senha?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password || ""}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-text-secondary">
          Não tem uma conta?{' '}
          <Link to="/cadastro" className="text-gold font-medium hover:text-gold-light transition-colors">
            Cadastre-se
          </Link>
        </div>
      </Card>
    </div>
  );
};
