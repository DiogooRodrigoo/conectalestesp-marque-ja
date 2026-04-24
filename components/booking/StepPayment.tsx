"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styled, { keyframes } from "styled-components";
import {
  QrCode,
  Copy,
  CheckCircle,
  Timer,
  Warning,
  ArrowCounterClockwise,
  Spinner,
} from "@phosphor-icons/react";
import { formatPrice } from "@/lib/utils/formatters";
import { fetchWithRetry } from "@/lib/utils/fetchWithRetry";

interface Props {
  appointmentId: string;
  amountCents: number;
  businessId: string;
  onSuccess: () => void;
  onRetry: () => void;
  onGoHome?: () => void;
}

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  padding: 24px 20px 28px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.4px;
  margin-bottom: 4px;
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
`;

const AmountBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(var(--color-primary-rgb), 0.1);
  border: 1px solid rgba(var(--color-primary-rgb), 0.25);
  border-radius: 99px;
  padding: 6px 16px;
  font-size: 18px;
  font-weight: 800;
  color: var(--color-primary);
  margin: 12px auto 0;
`;

const QrBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const QrImageWrapper = styled.div`
  width: 200px;
  height: 200px;
  border-radius: 16px;
  border: 2px solid var(--color-border);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
`;

const QrImage = styled.img`
  width: 180px;
  height: 180px;
`;

const CopySection = styled.div`
  width: 100%;
`;

const CopyLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  text-align: center;
`;

const CopyRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: stretch;
`;

const CopyInput = styled.input`
  flex: 1;
  height: 44px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 0 12px;
  font-size: 11px;
  color: var(--color-text-muted);
  background: var(--color-surface-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  font-family: monospace;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

const CopyBtn = styled.button<{ $copied: boolean }>`
  height: 44px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid ${({ $copied }) => ($copied ? "rgba(34,197,94,0.4)" : "var(--color-border)")};
  background: ${({ $copied }) => ($copied ? "rgba(34,197,94,0.1)" : "var(--color-surface-2)")};
  color: ${({ $copied }) => ($copied ? "#16a34a" : "var(--color-text)")};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
`;

// Timer
const timerPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

const TimerRow = styled.div<{ $warning: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  background: ${({ $warning }) =>
    $warning ? "rgba(239,68,68,0.08)" : "rgba(var(--color-primary-rgb), 0.06)"};
  border: 1px solid ${({ $warning }) =>
    $warning ? "rgba(239,68,68,0.3)" : "rgba(var(--color-primary-rgb), 0.15)"};
  font-size: 14px;
  font-weight: 700;
  color: ${({ $warning }) => ($warning ? "#dc2626" : "var(--color-primary)")};
  animation: ${({ $warning }) => ($warning ? timerPulse : "none")} 1s ease-in-out infinite;
`;

const StatusCard = styled.div<{ $type: "success" | "expired" | "loading" }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 20px;
  border-radius: 16px;
  text-align: center;
  background: ${({ $type }) =>
    $type === "success"
      ? "rgba(34,197,94,0.08)"
      : $type === "expired"
      ? "rgba(239,68,68,0.08)"
      : "var(--color-surface-2)"};
  border: 1px solid ${({ $type }) =>
    $type === "success"
      ? "rgba(34,197,94,0.3)"
      : $type === "expired"
      ? "rgba(239,68,68,0.3)"
      : "var(--color-border)"};
`;

const StatusTitle = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
`;

const StatusDesc = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.5;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SpinnerIcon = styled.div`
  animation: ${spin} 0.8s linear infinite;
  display: flex;
  align-items: center;
`;

const RetryButton = styled.button`
  width: 100%;
  height: 48px;
  border-radius: 12px;
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
  transition: opacity 0.2s;

  &:hover { opacity: 0.88; }
`;

const ExitLink = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 4px 8px;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.2s;
  margin-top: 4px;
  &:hover { color: var(--color-text); }
`;

const InstructionList = styled.ol`
  margin: 0;
  padding: 0 0 0 18px;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.8;
  text-align: left;
  width: 100%;
`;

const dotPulse = keyframes`
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%            { transform: scale(1);   opacity: 1; }
`;

const AwaitingCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(var(--color-primary-rgb), 0.06);
  border: 1px solid rgba(var(--color-primary-rgb), 0.18);
  text-align: center;
  width: 100%;
`;

const AwaitingTitle = styled.p`
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
`;

const AwaitingDesc = styled.p`
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
`;

const DotsRow = styled.div`
  display: flex;
  gap: 5px;
  align-items: center;
`;

const Dot = styled.div<{ $delay: string }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: ${dotPulse} 1.2s ease-in-out ${({ $delay }) => $delay} infinite;
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const PIX_DURATION_SECONDS = 30 * 60; // 30 minutos
const POLLING_INTERVAL_MS = 2000;

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepPayment({
  appointmentId,
  amountCents,
  businessId,
  onSuccess,
  onRetry,
  onGoHome,
}: Props) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeText, setQrCodeText] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null); // A-05: necessário para o polling
  const [loadingQr, setLoadingQr] = useState(true);
  const [qrError, setQrError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(PIX_DURATION_SECONDS);
  const [paymentStatus, setPaymentStatus] = useState<"awaiting" | "paid" | "expired">("awaiting");

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // BUG-04
  const pollErrorCountRef = useRef(0);

  // BUG-04: cleanup all timers on unmount
  useEffect(() => {
    return () => {
      clearInterval(pollingRef.current ?? undefined);
      clearInterval(timerRef.current ?? undefined);
      clearTimeout(successTimeoutRef.current ?? undefined);
    };
  }, []);

  // Carrega QR Code via API
  const fetchQrCode = useCallback(async () => {
    setLoadingQr(true);
    setQrError(null);
    try {
      const res = await fetchWithRetry("/api/payments/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_id: appointmentId,
          business_id: businessId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar PIX");
      setQrCode(data.qr_code);
      setQrCodeText(data.qr_code_text);
      setPaymentId(data.payment_id);
      // A-04: sync timer with actual backend expiry, not a hardcoded constant
      if (data.expires_at) {
        const remaining = Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000);
        setTimeLeft(Math.max(0, remaining));
      }
    } catch (err) {
      setQrError(err instanceof Error ? err.message : "Erro ao gerar PIX");
    } finally {
      setLoadingQr(false);
    }
  }, [appointmentId, businessId]);

  // Polling de status — A-05: passa payment_id para validar ownership
  const checkStatus = useCallback(async () => {
    if (!paymentId) return;
    try {
      const res = await fetch(`/api/payments/pix/status?appointment_id=${appointmentId}&payment_id=${paymentId}`);
      const data = await res.json();
      pollErrorCountRef.current = 0;
      if (data.status === "paid") {
        setPaymentStatus("paid");
        clearInterval(pollingRef.current!);
        clearInterval(timerRef.current!);
        successTimeoutRef.current = setTimeout(onSuccess, 1500); // BUG-04: tracked for cleanup
      } else if (data.status === "expired") {
        setPaymentStatus("expired");
        clearInterval(pollingRef.current!);
        clearInterval(timerRef.current!);
      }
    } catch (err) {
      pollErrorCountRef.current += 1;
      if (pollErrorCountRef.current >= 5) {
        console.error("[StepPayment] polling falhou 5x consecutivas:", err);
      }
    }
  }, [appointmentId, paymentId, onSuccess]);

  useEffect(() => {
    fetchQrCode();
  }, [fetchQrCode]);

  useEffect(() => {
    if (loadingQr || qrError || paymentStatus !== "awaiting") return;

    // Timer regressivo
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setPaymentStatus("expired");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // Polling de pagamento — checa imediatamente e depois a cada intervalo
    checkStatus();
    pollingRef.current = setInterval(checkStatus, POLLING_INTERVAL_MS);

    return () => {
      clearInterval(timerRef.current!);
      clearInterval(pollingRef.current!);
    };
  }, [loadingQr, qrError, paymentStatus, checkStatus]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  // ── Loading QR ─────────────────────────────────────────────────────────────
  if (loadingQr) {
    return (
      <Container>
        <Header>
          <Title>Pagamento via PIX</Title>
          <Subtitle>Gerando seu QR Code...</Subtitle>
        </Header>
        <StatusCard $type="loading">
          <SpinnerIcon>
            <Spinner size={36} color="var(--color-primary)" />
          </SpinnerIcon>
          <StatusDesc>Aguarde enquanto geramos sua cobrança PIX</StatusDesc>
        </StatusCard>
      </Container>
    );
  }

  // ── Erro ao gerar QR ───────────────────────────────────────────────────────
  if (qrError) {
    return (
      <Container>
        <Header>
          <Title>Pagamento via PIX</Title>
        </Header>
        <StatusCard $type="expired">
          <Warning size={40} color="#dc2626" weight="fill" />
          <StatusTitle>Erro ao gerar PIX</StatusTitle>
          <StatusDesc>{qrError}</StatusDesc>
        </StatusCard>
        <RetryButton type="button" onClick={onRetry}>
          <ArrowCounterClockwise size={16} weight="bold" />
          Tentar novamente
        </RetryButton>
      </Container>
    );
  }

  // ── Pagamento confirmado ───────────────────────────────────────────────────
  if (paymentStatus === "paid") {
    return (
      <Container>
        <StatusCard $type="success">
          <CheckCircle size={56} color="#16a34a" weight="fill" />
          <StatusTitle>Pagamento confirmado! 🎉</StatusTitle>
          <StatusDesc>Seu agendamento está confirmado.</StatusDesc>
        </StatusCard>
        {onGoHome && (
          <RetryButton
            type="button"
            onClick={onGoHome}
            style={{ marginTop: 16, background: "var(--color-primary)" }}
          >
            Voltar ao início
          </RetryButton>
        )}
      </Container>
    );
  }

  // ── PIX expirado ───────────────────────────────────────────────────────────
  if (paymentStatus === "expired") {
    return (
      <Container>
        <StatusCard $type="expired">
          <Timer size={40} color="#dc2626" weight="fill" />
          <StatusTitle>Tempo esgotado</StatusTitle>
          <StatusDesc>
            O tempo para pagamento expirou. Seu horário foi liberado.
          </StatusDesc>
        </StatusCard>
        <RetryButton type="button" onClick={onRetry}>
          <ArrowCounterClockwise size={16} weight="bold" />
          Tentar novamente
        </RetryButton>
      </Container>
    );
  }

  // ── QR Code ativo ──────────────────────────────────────────────────────────
  const isWarning = timeLeft <= 120; // últimos 2 minutos

  return (
    <Container>
      <Header>
        <Title>Pagamento via PIX</Title>
        <Subtitle>Escaneie o QR Code ou use o código copia-e-cola</Subtitle>
        <AmountBadge>
          {formatPrice(amountCents)}
        </AmountBadge>
      </Header>

      <QrBox>
        <QrImageWrapper>
          {qrCode ? (
            <QrImage
              src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
              alt="QR Code PIX"
            />
          ) : (
            <QrCode size={120} color="var(--color-border)" />
          )}
        </QrImageWrapper>

        <TimerRow $warning={isWarning}>
          <Timer size={16} weight="fill" />
          Expira em {formatTimer(timeLeft)}
        </TimerRow>

        <CopySection>
          <CopyLabel>Copia e cola</CopyLabel>
          <CopyRow>
            <CopyInput
              readOnly
              value={qrCodeText}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <CopyBtn type="button" $copied={copied} onClick={handleCopy}>
              {copied ? (
                <>
                  <CheckCircle size={14} weight="fill" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy size={14} weight="bold" />
                  Copiar
                </>
              )}
            </CopyBtn>
          </CopyRow>
        </CopySection>

        <InstructionList>
          <li>Abra o app do seu banco e acesse <strong>PIX</strong></li>
          <li>Escolha <strong>Pix Copia e Cola</strong> (não use &quot;Transferir&quot;)</li>
          <li>Cole o código copiado e confirme o valor de <strong>{formatPrice(amountCents)}</strong></li>
          <li>Aguarde a confirmação do estabelecimento nesta tela</li>
        </InstructionList>

        <AwaitingCard>
          <DotsRow>
            <Dot $delay="0s" />
            <Dot $delay="0.2s" />
            <Dot $delay="0.4s" />
          </DotsRow>
          <AwaitingTitle>Aguardando confirmação do estabelecimento</AwaitingTitle>
          <AwaitingDesc>
            Após seu pagamento, o estabelecimento confirma o recebimento e seu agendamento é garantido automaticamente.
          </AwaitingDesc>
        </AwaitingCard>

        {onGoHome && (
          <ExitLink type="button" onClick={onGoHome}>
            Pagar depois · voltar ao início
          </ExitLink>
        )}
      </QrBox>
    </Container>
  );
}
