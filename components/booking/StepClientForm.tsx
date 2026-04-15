"use client";

import { useState } from "react";
import styled from "styled-components";
import { CalendarBlank, Clock, Scissors } from "@phosphor-icons/react";

interface BookingSummary {
  serviceNames: string[];
  date: string | null;
  time: string | null;
}

interface Props {
  clientName: string;
  clientPhone: string;
  businessId: string;
  summary?: BookingSummary;
  onChange: (field: "clientName" | "clientPhone", value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  padding: 24px 20px 28px;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 20px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
  &:hover { color: var(--color-text); }
`;

// ── Mini summary ──────────────────────────────────────────────────────────────

const SummaryCard = styled.div`
  background: linear-gradient(135deg, rgba(var(--color-primary-rgb),0.07) 0%, rgba(var(--color-primary-rgb),0.02) 100%);
  border: 1px solid rgba(var(--color-primary-rgb),0.2);
  border-left: 4px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  margin-bottom: 22px;
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const SummaryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SummaryIcon = styled.div`
  font-size: 14px;
  flex-shrink: 0;
  line-height: 1;
`;

const SummaryText = styled.span`
  font-size: 13px;
  color: var(--color-text);
  font-weight: 500;
  line-height: 1.3;
`;

// ── Form ─────────────────────────────────────────────────────────────────────

const Title = styled.h2`
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.4px;
  margin-bottom: 4px;
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 22px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
`;

const StyledInput = styled.input<{ $hasError: boolean }>`
  width: 100%;
  height: 48px;
  background: var(--color-surface-2);
  border: 1px solid ${({ $hasError }) =>
    $hasError ? "var(--color-danger)" : "var(--color-border)"};
  border-radius: 12px;
  color: var(--color-text);
  font-size: 15px;
  padding: 0 16px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;

  &::placeholder {
    color: var(--color-text-muted);
    opacity: 0.5;
  }

  &:focus {
    border-color: ${({ $hasError }) =>
      $hasError ? "var(--color-danger)" : "var(--color-primary)"};
    box-shadow: ${({ $hasError }) =>
      $hasError
        ? "0 0 0 3px rgba(239,68,68,0.12)"
        : "0 0 0 3px rgba(var(--color-primary-rgb),0.12)"};
  }
`;

const ErrorText = styled.span`
  font-size: 12px;
  color: var(--color-danger);
`;

const PhoneHint = styled.p`
  font-size: 12px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
`;

const SubmitButton = styled.button`
  width: 100%;
  height: 54px;
  background: var(--gradient-primary);
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.2px;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  margin-top: 4px;
  transition: opacity 0.2s, transform 0.12s, box-shadow 0.2s;
  box-shadow: var(--shadow-btn);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.13) 0%, transparent 60%);
    pointer-events: none;
  }

  &:hover {
    opacity: 0.92;
    transform: translateY(-1px);
  }
  &:active { transform: translateY(0); }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function countDigits(v: string): number {
  return v.replace(/\D/g, "").length;
}

function formatDatePretty(ymd: string): string {
  return new Date(`${ymd}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepClientForm({
  clientName,
  clientPhone,
  businessId,
  summary,
  onChange,
  onNext,
  onBack,
}: Props) {
  const [touched, setTouched] = useState({ name: false, phone: false });

  const nameError =
    touched.name && clientName.trim().length < 3
      ? "Digite seu nome completo"
      : null;

  const phoneDigits = countDigits(clientPhone);
  const phoneError =
    touched.phone && (phoneDigits < 10 || phoneDigits > 11)
      ? "Digite um WhatsApp válido com DDD"
      : null;

  const isValid = clientName.trim().length >= 3 && phoneDigits >= 10;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange("clientPhone", maskPhone(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, phone: true });
    if (!isValid) return;

    const cleanPhone = clientPhone.replace(/\D/g, "");
    fetch("/api/verify/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: cleanPhone, business_id: businessId }),
    }).catch(() => {});

    onNext();
  };

  const hasSummary = summary && (summary.serviceNames.length > 0 || summary.date || summary.time);

  return (
    <Container>
      <BackButton onClick={onBack} type="button">
        ← Voltar
      </BackButton>

      {hasSummary && (
        <SummaryCard>
          {summary.serviceNames.length > 0 && (
            <SummaryRow>
              <SummaryIcon><Scissors size={14} weight="bold" /></SummaryIcon>
              <SummaryText>{summary.serviceNames.join(" + ")}</SummaryText>
            </SummaryRow>
          )}
          {summary.date && (
            <SummaryRow>
              <SummaryIcon><CalendarBlank size={14} weight="bold" /></SummaryIcon>
              <SummaryText style={{ textTransform: "capitalize" }}>
                {formatDatePretty(summary.date)}
              </SummaryText>
            </SummaryRow>
          )}
          {summary.time && (
            <SummaryRow>
              <SummaryIcon><Clock size={14} weight="bold" /></SummaryIcon>
              <SummaryText>{summary.time}</SummaryText>
            </SummaryRow>
          )}
        </SummaryCard>
      )}

      <Title>Seus dados</Title>
      <Subtitle>Preencha para confirmar seu agendamento</Subtitle>

      <Form onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          <Label htmlFor="clientName">Seu nome</Label>
          <StyledInput
            id="clientName"
            type="text"
            placeholder="Ex: Maria da Silva"
            value={clientName}
            $hasError={!!nameError}
            onChange={(e) => onChange("clientName", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            autoComplete="name"
          />
          {nameError && <ErrorText>{nameError}</ErrorText>}
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="clientPhone">WhatsApp</Label>
          <StyledInput
            id="clientPhone"
            type="tel"
            placeholder="(11) 9 9999-9999"
            value={clientPhone}
            $hasError={!!phoneError}
            inputMode="numeric"
            onChange={handlePhoneChange}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            autoComplete="tel"
          />
          {phoneError && <ErrorText>{phoneError}</ErrorText>}
          <PhoneHint>
            💬 Você receberá a confirmação no WhatsApp
          </PhoneHint>
        </FieldGroup>

        <SubmitButton type="submit" disabled={!isValid}>
          Continuar
        </SubmitButton>
      </Form>
    </Container>
  );
}
