import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Wine, AlertCircle, Store, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CadastroPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('Este e-mail já está em uso.');
        }
        if (error.message.includes('Password should be')) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }
        throw error;
      }

      if (data.user) {
        if (role === 'vendor') {
          navigate('/vendedor/dashboard', { replace: true });
        } else {
          navigate('/cliente/home', { replace: true });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro.');
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
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Criar conta</h2>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-500">{error}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="fullName">
              Nome Completo
            </label>
            <Input
              id="fullName"
              type="text"
              placeholder="Seu nome"
              value={fullName || ""}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

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
            <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="password">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password || ""}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Qual é o seu perfil?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-xl border transition-all',
                  role === 'customer' 
                    ? 'bg-gold/10 border-gold shadow-[0_0_15px_rgba(212,175,55,0.15)] text-gold' 
                    : 'bg-surface border-zinc-800 text-text-secondary hover:bg-zinc-800'
                )}
              >
                <User className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Cliente</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('vendor')}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-xl border transition-all',
                  role === 'vendor' 
                    ? 'bg-gold/10 border-gold shadow-[0_0_15px_rgba(212,175,55,0.15)] text-gold' 
                    : 'bg-surface border-zinc-800 text-text-secondary hover:bg-zinc-800'
                )}
              >
                <Store className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Vendedor</span>
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-text-secondary">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-gold font-medium hover:text-gold-light transition-colors">
            Fazer login
          </Link>
        </div>
      </Card>
    </div>
  );
};
