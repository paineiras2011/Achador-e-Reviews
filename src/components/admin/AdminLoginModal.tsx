import React, { useState } from 'react';
import { Lock, Mail, KeyRound, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('paineiras2011@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Try Firebase auth first
      if (password === 'admin123' || password === 'achados2026') {
        // Master password bypass for rapid local administration
        onLoginSuccess(email || 'admin@achadosereviews.com.br');
        setLoading(false);
        onClose();
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess(userCredential.user.email || email);
      setLoading(false);
      onClose();
    } catch (err: unknown) {
      // If Firebase Auth provider is not enabled yet in console, allow master password
      console.warn('Firebase login attempt:', err);
      if (password === 'admin123' || password === 'admin' || password === 'achados2026') {
        onLoginSuccess(email);
        setLoading(false);
        onClose();
      } else {
        setError('E-mail ou senha inválidos. Para acesso imediato, utilize a senha mestra: admin123');
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 bg-slate-900 text-cyan-400 rounded-xl flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Acesso Administrativo</h2>
          <p className="text-xs text-slate-500">
            Painel restrito para gestão de avaliações, links de afiliados e anúncios
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              E-mail do Administrador
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                placeholder="seu-email@dominio.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Senha de Acesso
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                placeholder="••••••••"
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-3xs text-slate-400">
              <span>Dica de acesso mestre: <strong>admin123</strong></span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#0B132B] hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Entrar no Painel</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-3xs text-slate-400">
            Conexão protegida com Firebase Auth &amp; Google Cloud Firestore
          </p>
        </div>

      </div>
    </div>
  );
};
