"use client";

import { useState } from "react";
import styled from "styled-components";
import { ArrowLeft, WhatsappLogo } from "@phosphor-icons/react";

interface Props {
  clientName: string;
  clientPhone: string;
  onChange: (field: "clientName" | "clientPhone", value: string) => void;
  onNext: () => void;
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

  &:hover {
    color: var(--color-text);
  }
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
        : "0 0 0 3px rgba(249,115,22,0.12)"};
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
  height: 52px;
  background: var(--color-primary);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  margin-top: 4px;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepClientForm({
  clientName,
  clientPhone,
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
    if (isValid) onNext();
  };

  return (
    <Container>
      <BackButton onClick={onBack} type="button">
        <ArrowLeft size={16} />
        Voltar
      </BackButton>

      <Title>Seus dados</Title>
      <Subtitle>Preencha para confirmar seu agendamento</Subtitle>

      <Form onSubmit={handleSubmit} noValidate>
        {/* Name field */}
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

        {/* Phone field */}
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
            <WhatsappLogo size={12} />
            Você receberá a confirmação no WhatsApp
          </PhoneHint>
        </FieldGroup>

        <SubmitButton type="submit" disabled={!isValid}>
          Continuar
        </SubmitButton>
      </Form>
    </Container>
  );
}
