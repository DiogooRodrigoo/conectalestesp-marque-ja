"use client";

import styled, { keyframes } from "styled-components";
import { CalendarPlus, ClockCounterClockwise } from "@phosphor-icons/react";
import { Business } from "@/types/database";

interface Props {
  business: Business;
  onBook: () => void;
  onViewAppointments: () => void;
}

// ─── Styled Components ────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { transform: translateY(10px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;

const Container = styled.div`
  padding: 32px 20px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const Greeting = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
  animation: ${fadeUp} 0.3s ease both;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.4px;
  margin-bottom: 28px;
  line-height: 1.3;
  animation: ${fadeUp} 0.3s 0.05s ease both;
`;

const ButtonsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: ${fadeUp} 0.3s 0.1s ease both;
`;

const PrimaryButton = styled.button`
  width: 100%;
  height: 56px;
  border-radius: 14px;
  background: var(--color-primary);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: opacity 0.2s;

  &:hover { opacity: 0.88; }
  &:active { opacity: 0.75; }
`;

const SecondaryButton = styled.button`
  width: 100%;
  height: 52px;
  border-radius: 14px;
  background: var(--color-surface-2);
  border: 1.5px solid var(--color-border);
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: var(--color-text-muted);
  }
  &:active { opacity: 0.75; }
`;

const ButtonLabel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
`;

const ButtonTitle = styled.span`
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
`;

const ButtonSub = styled.span`
  font-size: 11px;
  font-weight: 400;
  opacity: 0.75;
  line-height: 1;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepLanding({ business, onBook, onViewAppointments }: Props) {
  return (
    <Container>
      <Greeting>Bem-vindo a</Greeting>
      <Title>{business.name}</Title>

      <ButtonsWrapper>
        <PrimaryButton onClick={onBook}>
          <CalendarPlus size={22} weight="fill" />
          <ButtonLabel>
            <ButtonTitle>Agendar serviço</ButtonTitle>
            <ButtonSub>Escolha data, horário e profissional</ButtonSub>
          </ButtonLabel>
        </PrimaryButton>

        <SecondaryButton onClick={onViewAppointments}>
          <ClockCounterClockwise size={20} weight="bold" />
          <ButtonLabel>
            <ButtonTitle>Meus agendamentos</ButtonTitle>
            <ButtonSub>Ver histórico e próximos horários</ButtonSub>
          </ButtonLabel>
        </SecondaryButton>
      </ButtonsWrapper>
    </Container>
  );
}
