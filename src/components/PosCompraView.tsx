import React, { useState, useEffect, useRef } from 'react';
import { FexLogo } from './FexLogo';
import { checkPurchaseStatus, saveUserSession, NormalizedPurchaseResult } from '../services/purchaseApi';
import { PRODUCT_IDS } from '../config/products';
import { trackEvent } from '../services/analytics';
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  RefreshCw,
  Sparkles,
  Lock
} from 'lucide-react';

interface PosCompraViewProps {
  initialEmail?: string;
  initialPedido?: string;
  onConfirmSuccess: (result: NormalizedPurchaseResult) => void;
  onNavigateToHub: () => void;
  onNavigateToLogin: () => void;
}

type PollingState = 
  | 'missing_params'
  | 'checking'
  | 'confirmed_main'
  | 'confirmed_all'
  | 'pending'
  | 'error';

export const PosCompraView: React.FC<PosCompraViewProps> = ({
  initialEmail = '',
  initialPedido = '',
  onConfirmSuccess,
  onNavigateToHub,
  onNavigateToLogin
}) => {
  const [email, setEmail] = useState<string>(initialEmail);
  const [pedido, setPedido] = useState<string>(initialPedido);
  const [statusState, setStatusState] = useState<PollingState>('checking');
  const [result, setResult] = useState<NormalizedPurchaseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(10);
  const [attempts, setAttempts] = useState<number>(0);

  // References to guarantee single interval and no concurrency
  const isPollingRef = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Extract from URL if not passed via props
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const queryEmail = urlParams.get('email') || urlParams.get('customer_email') || initialEmail;
      const queryPedido = urlParams.get('pedido') || urlParams.get('order_id') || urlParams.get('transaction_id') || initialPedido;

      if (queryEmail) setEmail(queryEmail.trim());
      if (queryPedido) setPedido(queryPedido.trim());

      if (!queryEmail && !queryPedido) {
        setStatusState('missing_params');
      }
    } catch (e) {
      console.warn('[PosCompra] Erro ao extrair query parameters:', e);
    }
  }, [initialEmail, initialPedido]);

  // Main purchase check function
  const executeCheck = async (targetEmail: string, targetPedido: string) => {
    if (!targetEmail && !targetPedido) {
      setStatusState('missing_params');
      return;
    }

    if (isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      setAttempts(prev => prev + 1);
      const purchaseResult = await checkPurchaseStatus(targetEmail, targetPedido);

      if (!isMountedRef.current) return;

      if (purchaseResult.success && purchaseResult.products.length > 0) {
        setResult(purchaseResult);

        // Save session locally
        saveUserSession({
          email: purchaseResult.email || targetEmail,
          orderId: purchaseResult.orderId || targetPedido,
          customerName: purchaseResult.customerName,
          products: purchaseResult.products,
          authenticatedAt: new Date().toISOString()
        });

        // Track purchase confirmation
        trackEvent('purchase_confirmed_n8n', {
          email: purchaseResult.email || targetEmail,
          orderId: purchaseResult.orderId || targetPedido,
          products: purchaseResult.products,
          hasOrderBump: purchaseResult.hasOrderBump
        });

        // Notify parent state
        onConfirmSuccess(purchaseResult);

        // Check whether both main and order bump were confirmed
        if (purchaseResult.hasOrderBump && purchaseResult.products.includes(PRODUCT_IDS.PLANO_SUCESSAO)) {
          setStatusState('confirmed_all');
        } else {
          setStatusState('confirmed_main');
        }

        // Stop polling timers
        stopTimers();
        return;
      }

      // Not yet approved or pending
      setStatusState('pending');
      setCountdown(10);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.error('[PosCompra] Erro ao consultar API:', err);
      setStatusState('error');
      setErrorMessage(err?.message || 'Falha temporária ao comunicar com o servidor de pagamentos.');
      setCountdown(10);
    } finally {
      isPollingRef.current = false;
    }
  };

  const stopTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  // Setup 10-second polling lifecycle
  useEffect(() => {
    isMountedRef.current = true;

    if (!email && !pedido) {
      setStatusState('missing_params');
      return;
    }

    // 1. Initial immediate check
    executeCheck(email, pedido);

    // 2. Countdown tick interval (every 1 second)
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // When countdown reaches 0, trigger polling check if not already confirmed
          executeCheck(email, pedido);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      isMountedRef.current = false;
      stopTimers();
    };
  }, [email, pedido]);

  const handleManualRetry = () => {
    setCountdown(10);
    setStatusState('checking');
    executeCheck(email, pedido);
  };

  return (
    <div className="w-full max-w-xl mx-auto py-8 sm:py-16 px-4 animate-fadeIn">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-block mb-3">
          <FexLogo variant="dark" size="md" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#00D84F] bg-white/10 px-3 py-1 rounded-full border border-white/15">
            Ambiente Seguro • Faculdade FEX Educação
          </span>
        </div>
      </div>

      {/* Main Status Container */}
      <div className="bg-[#111111] border border-white/15 rounded-3xl p-6 sm:p-10 shadow-2xl text-center text-white">
        
        {/* STATE 1: MISSING PARAMETERS */}
        {statusState === 'missing_params' && (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-tight text-white mb-2">
                Identificação da Compra
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
                Não localizamos os parâmetros do seu pedido na URL. Se você acabou de pagar no checkout, informe seu e-mail para consultarmos a liberação:
              </p>
            </div>

            <div className="space-y-3 max-w-md mx-auto text-left">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  E-mail da Compra
                </label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[#00D84F]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Código do Pedido (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: ch_Mm2ez4kkI9S7AGPq"
                  value={pedido}
                  onChange={(e) => setPedido(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[#00D84F]"
                />
              </div>

              <button
                onClick={() => {
                  if (email) {
                    setStatusState('checking');
                    executeCheck(email, pedido);
                  }
                }}
                disabled={!email}
                className="w-full mt-2 py-3.5 px-6 rounded-full bg-[#00D84F] hover:bg-[#25eb69] disabled:opacity-50 text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#00D84F]/20"
              >
                Consultar Liberação
              </button>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button
                onClick={onNavigateToLogin}
                className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
              >
                Já possui conta? Ir para a tela de Login
              </button>
            </div>
          </div>
        )}

        {/* STATE 2 & 3: CHECKING & PENDING (POLLING ACTIVE) */}
        {(statusState === 'checking' || statusState === 'pending') && (
          <div className="space-y-6">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#00D84F]/20 animate-ping"></div>
              <div className="w-16 h-16 rounded-full bg-[#00D84F]/10 border border-[#00D84F]/30 flex items-center justify-center text-[#00D84F]">
                <Loader2 className="w-8 h-8 animate-spin text-[#00D84F]" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
                Estamos confirmando sua compra...
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
                Isso pode levar alguns segundos.
              </p>
              <p className="text-xs font-semibold text-[#00D84F] mt-1">
                Não feche esta página.
              </p>
            </div>

            {/* Live Polling Details */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-md mx-auto text-left space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>E-mail verificado:</span>
                <span className="font-bold text-white truncate max-w-[200px]">{email || 'Aguardando...'}</span>
              </div>
              {pedido && (
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Pedido:</span>
                  <span className="font-mono text-[11px] text-white/80">{pedido}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <Clock className="w-3.5 h-3.5 text-[#00D84F]" />
                  <span>Próxima checagem em:</span>
                </span>
                <span className="font-bold text-[#00D84F] bg-[#00D84F]/10 px-2 py-0.5 rounded-full text-[11px]">
                  {countdown}s
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-neutral-400">
              <button
                onClick={handleManualRetry}
                className="inline-flex items-center gap-1.5 hover:text-[#00D84F] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Checar agora</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 4: CONFIRMED - MAIN PRODUCT (DIAGNÓSTICO + MINI-CURSO) */}
        {statusState === 'confirmed_main' && (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#00D84F]/20 border border-[#00D84F] flex items-center justify-center mx-auto text-[#00D84F]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#00D84F] bg-[#00D84F]/10 px-3 py-1 rounded-full border border-[#00D84F]/30 inline-block mb-2">
                Pagamento Aprovado
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
                Compra confirmada!
              </h2>
              <p className="text-sm sm:text-base text-neutral-200 max-w-md mx-auto font-medium">
                Seu acesso foi liberado com sucesso.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-md mx-auto space-y-2.5 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1">
                Soluções Ativadas:
              </span>
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-[#00D84F] shrink-0" />
                <span>Diagnóstico Completo de Custo da Pessoa-Chave</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-[#00D84F] shrink-0" />
                <span>Mini-Curso: Gestão de Pessoas-Chave (4 Aulas)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400 pt-1 border-t border-white/10">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Plano de Sucessão: Aguardando ou disponível no Order Bump</span>
              </div>
            </div>

            <button
              onClick={onNavigateToHub}
              className="w-full max-w-md mx-auto py-4 px-8 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-[#00D84F]/25 active:scale-98"
            >
              <span>Entrar na Área de Membros</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </div>
        )}

        {/* STATE 5: CONFIRMED - ALL PRODUCTS (MAIN + ORDER BUMP PLANO DE SUCESSÃO) */}
        {statusState === 'confirmed_all' && (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#00D84F]/20 border border-[#00D84F] flex items-center justify-center mx-auto text-[#00D84F]">
              <Sparkles className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#00D84F] bg-[#00D84F]/10 px-3 py-1 rounded-full border border-[#00D84F]/30 inline-block mb-2">
                Acesso Total Liberado
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
                Compra confirmada!
              </h2>
              <p className="text-sm sm:text-base text-neutral-200 max-w-md mx-auto font-medium">
                Todos os seus produtos foram liberados com sucesso.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-md mx-auto space-y-2.5 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1">
                Todas as Soluções Liberadas:
              </span>
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-[#00D84F] shrink-0" />
                <span>Diagnóstico Completo de Custo da Pessoa-Chave</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-[#00D84F] shrink-0" />
                <span>Mini-Curso: Gestão de Pessoas-Chave (4 Aulas)</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#00D84F]">
                <CheckCircle2 className="w-4 h-4 text-[#00D84F] shrink-0" />
                <span>Plano de Sucessão de 90 Dias (Order Bump Aprovado)</span>
              </div>
            </div>

            <button
              onClick={onNavigateToHub}
              className="w-full max-w-md mx-auto py-4 px-8 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-[#00D84F]/25 active:scale-98"
            >
              <span>Entrar na Área de Membros</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </div>
        )}

        {/* STATE 6: ERROR OR RETRY */}
        {statusState === 'error' && (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-tight text-white mb-2">
                Aguardando Confirmação
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
                {errorMessage || 'O gateway de pagamento ainda está processando a transação.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                onClick={handleManualRetry}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#00D84F]/20"
              >
                Tentar Novamente Agora
              </button>

              <button
                onClick={onNavigateToLogin}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Acessar com E-mail
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Security Guarantee Note */}
      <div className="text-center mt-6 text-xs text-neutral-400 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#00D84F]" />
        <span>Autenticação direta com o servidor oficial da Faculdade FEX Educação</span>
      </div>
    </div>
  );
};
