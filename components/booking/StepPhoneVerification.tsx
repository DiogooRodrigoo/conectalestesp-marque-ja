"use client";

import { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { ArrowLeft, WhatsappLogo, ArrowClockwise } from "@phosphor-icons/react";

interface Props {
  clientPhone: string;
  businessId: string;
  onVerified: (token: string) => void;
  onBack: () => void;
}

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  padding: 24px 20px 28px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 20px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
  &:hover { color: var(--color-text); }
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.4px;
  margin-bottom: 6px;
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 28px;
  line-height: 1.5;
`;

const PhoneHighlight = styled.span`
  color: var(--color-text);
  font-weight: 600;
`;

const OtpRow = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 24px;
`;

const OtpInput = styled.input<{ $hasError: boolean }>`
  width: 48px;
  height: 56px;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  border-radius: 12px;
  background: var(--color-surface-2);
  border: 1.5px solid ${({ $hasError }) =>
    $hasError ? "var(--color-danger)" : "var(--color-border)"};
  color: var(--color-text);
  outline: none;
  caret-color: var(--color-primary);
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    border-color: ${({ $hasError }) =>
      $hasError ? "var(--color-danger)" : "var(--color-primary)"};
    box-shadow: ${({ $hasError }) =>
      $hasError
        ? "0 0 0 3px rgba(239,68,68,0.12)"
        : "0 0 0 3px rgba(249,115,22,0.12)"};
  }
`;

const ErrorText = styled.p`
  font-size: 13px;
  color: var(--color-danger);
  text-align: center;
  margin-bottom: 16px;
  min-height: 18px;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const ConfirmButton = styled.button<{ $loading: boolean }>`
  width: 100%;
  height: 52px;
  background: var(--color-primary);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  border-radius: 12px;
  border: none;
  cursor: ${({ $loading }) => ($loading ? "not-allowed" : "pointer")};
  opacity: ${({ $loading }) => ($loading ? 0.7 : 1)};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.2s;
  margin-bottom: 16px;

  &:hover {
    opacity: ${({ $loading }) => ($loading ? 0.7 : 0.88)};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const SpinIcon = styled.div`
  animation: ${spin} 0.8s linear infinite;
  display: flex;
  align-items: center;
`;

const ResendRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-muted);
`;

const ResendButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: opacity 0.2s;

  &:hover { opacity: 0.8; }
  &:disabled {
    color: var(--color-text-muted);
    cursor: not-allowed;
  }
`;

const WhatsAppBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #25D366;
  margin-top: 20px;
  font-weight: 500;
`;

// ─── Component ────────────────────────────────────────────────────────────────

const CODE_LENGTH = 6;

export default function StepPhoneVerification({
  clientPhone,
  businessId,
  onVerified,
  onBack,
}: Props) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [sending, setSending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown para reenvio
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const code = digits.join("");
  const isComplete = code.length === CODE_LENGTH;

  const handleDigitChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError(null);

    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  };

  const handleConfirm = async () => {
    if (!isComplete || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: clientPhone,
          business_id: businessId,
          code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Código inválido");
        return;
      }

      onVerified(data.token);
    } catch {
      setError("Erro ao verificar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || sending) return;
    setSending(true);
    setError(null);
    setDigits(Array(CODE_LENGTH).fill(""));
    inputRefs.current[0]?.focus();

    try {
      const res = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clientPhone, business_id: businessId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao reenviar");
        return;
      }

      setCountdown(60);
    } catch {
      setError("Erro ao reenviar o código.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Container>
      <BackButton onClick={onBack} type="button" disabled={loading}>
        <ArrowLeft size={16} />
        Voltar
      </BackButton>

      <Title>Verificar WhatsApp</Title>
      <Subtitle>
        Enviamos um código de 6 dígitos para{" "}
        <PhoneHighlight>{clientPhone}</PhoneHighlight>
      </Subtitle>

      <OtpRow onPaste={handlePaste}>
        {digits.map((d, i) => (
          <OtpInput
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            $hasError={!!error}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            autoFocus={i === 0}
          />
        ))}
      </OtpRow>

      <ErrorText>{error ?? ""}</ErrorText>

      <ConfirmButton
        type="button"
        $loading={loading}
        disabled={!isComplete || loading}
        onClick={handleConfirm}
      >
        {loading ? (
          <>
            <SpinIcon>
              <ArrowClockwise size={18} />
            </SpinIcon>
            Verificando...
          </>
        ) : (
          "Confirmar código"
        )}
      </ConfirmButton>

      <ResendRow>
        {countdown > 0 ? (
          <span>Reenviar em {countdown}s</span>
        ) : (
          <ResendButton onClick={handleResend} disabled={sending}>
            <ArrowClockwise size={14} />
            {sending ? "Enviando..." : "Reenviar código"}
          </ResendButton>
        )}
      </ResendRow>

      <WhatsAppBadge>
        <WhatsappLogo size={14} weight="fill" />
        Código enviado via WhatsApp
      </WhatsAppBadge>
    </Container>
  );
}
