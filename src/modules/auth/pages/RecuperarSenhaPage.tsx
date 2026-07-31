import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Wine, AlertCircle, CheckCircle2 } from 'lucide-react';

export const RecuperarSenhaPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail de recuperação.');
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
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Recuperar senha</h2>
        <p className="text-text-secondary text-sm text-center mb-6">
          Digite seu e-mail para receber um link de redefinição de senha.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-500">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-500">
              Link de recuperação enviado! Verifique sua caixa de entrada e spam.
            </p>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
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

          <Button type="submit" className="w-full mt-2" disabled={loading || success}>
            {loading ? 'Enviando...' : 'Enviar link'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-gold font-medium hover:text-gold-light transition-colors">
            Voltar para o login
          </Link>
        </div>
      </Card>
    </div>
  );
};
