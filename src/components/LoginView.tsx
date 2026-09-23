import React, { useState } from 'react';
import { FexLogo } from './FexLogo';
import { loginWithEmail, saveUserSession, NormalizedPurchaseResult } from '../services/purchaseApi';
import { trackEvent } from '../services/analytics';
import { 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Mail, 
  GraduationCap,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (result: NormalizedPurchaseResult) => void;
  onNavigateToCalculator: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onNavigateToCalculator
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Por favor, informe um endereço de e-mail corporativo válido.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      trackEvent('login_attempt', { email: cleanEmail });
      const result = await loginWithEmail(cleanEmail);

      // Verify that this email has an approved purchase confirmed by the API
      if (result.success && result.products.length > 0) {
        saveUserSession({
          email: result.email || cleanEmail,
          orderId: result.orderId,
          customerName: result.customerName,
          products: result.products,
          authenticatedAt: new Date().toISOString()
        });

        trackEvent('login_success', {
          email: cleanEmail,
          products: result.products
        });

        onLoginSuccess(result);
      } else {
        trackEvent('login_failed_no_purchase', { email: cleanEmail });
        setError(
          'Nenhuma compra confirmada encontrada para este e-mail. Por favor, certifique-se de usar o mesmo e-mail informado no checkout da compra.'
        );
      }
    } catch (err: any) {
      console.error('[Login] Erro ao autenticar:', err);
      setError('Ocorreu uma instabilidade momentânea na verificação. Tente novamente em alguns segundos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-10 sm:py-16 px-4 animate-fadeIn">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-block mb-3 cursor-pointer" onClick={onNavigateToCalculator}>
          <FexLogo variant="dark" size="md" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#00D84F] bg-white/10 px-3 py-1 rounded-full border border-white/15">
            Portal do Aluno & Gestor
          </span>
        </div>
      </div>

      {/* Login Card */}
      <div className="bg-[#111111] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-left text-white">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Área de Membros
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 mt-2 leading-relaxed">
            Digite o e-mail utilizado na sua compra para acessar seus produtos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="seu.email@empresa.com.br"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isLoading}
                required
                className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[#00D84F] transition-all disabled:opacity-50"
              />
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full py-4 px-6 rounded-full bg-[#00D84F] hover:bg-[#25eb69] disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#00D84F]/20 active:scale-98"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Verificando compra...</span>
              </>
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
          <button
            onClick={onNavigateToCalculator}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar à Calculadora</span>
          </button>

          <span className="flex items-center gap-1 text-[11px] text-[#00D84F]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Acesso Seguro</span>
          </span>
        </div>
      </div>

      <div className="text-center mt-6 text-xs text-neutral-500 flex items-center justify-center gap-1.5">
        <GraduationCap className="w-4 h-4 text-[#00D84F]" />
        <span>Faculdade FEX Educação • Todos os direitos reservados</span>
      </div>
    </div>
  );
};
