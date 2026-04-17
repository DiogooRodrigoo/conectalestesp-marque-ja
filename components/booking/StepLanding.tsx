"use client";

import styled, { keyframes } from "styled-components";
import { CalendarBlank, Clock, SignOut } from "@phosphor-icons/react";
import { Business, BusinessHours } from "@/types/database";

interface Props {
  business: Business & { business_hours?: BusinessHours[] };
  onBook: () => void;
  onViewAppointments: () => void;
  welcomeName?: string | null;
  onLogout?: () => void;
}

// ─── Styled Components ────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { transform: translateY(10px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;

const Container = styled.div`
  padding: 20px 18px 28px;
  display: flex;
  flex-direction: column;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 11px;
  animation: ${fadeUp} 0.3s 0.05s ease both;
`;

const PrimaryButton = styled.button`
  width: 100%;
  height: 64px;
  border-radius: 18px;
  background: var(--gradient-primary);
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 18px;
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: var(--shadow-btn);
  position: relative;
  overflow: hidden;
  letter-spacing: -0.2px;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.13) 0%, transparent 60%);
    pointer-events: none;
  }

  &:hover { opacity: 0.92; transform: translateY(-1px); }
  &:active { opacity: 0.88; transform: translateY(0); }
`;

const SecondaryButton = styled.button`
  width: 100%;
  height: 58px;
  border-radius: 18px;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  color: var(--color-text);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 18px;
  transition: border-color 0.2s, transform 0.15s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);

  &:hover {
    border-color: var(--color-text-muted);
    transform: translateY(-1px);
  }
  &:active { transform: translateY(0); }
`;

const IconBox = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
  line-height: 1;
`;

const IconBoxMuted = styled(IconBox)`
  background: var(--color-surface-2);
`;

const ButtonLabel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  flex: 1;
`;

const ButtonTitle = styled.span`
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
`;

const ButtonSub = styled.span`
  font-size: 11px;
  font-weight: 500;
  opacity: 0.7;
  line-height: 1;
`;

const WelcomeBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(var(--color-primary-rgb), 0.07);
  border: 1px solid rgba(var(--color-primary-rgb), 0.18);
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 14px;
  animation: ${fadeUp} 0.3s ease both;
`;

const WelcomeText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const WelcomeGreeting = styled.span`
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 500;
`;

const WelcomeName = styled.span`
  font-size: 15px;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.2px;
`;

const LogoutBtn = styled.button`
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  border-radius: 8px;
  transition: color 0.2s, background 0.2s;

  &:hover {
    color: var(--color-danger, #ef4444);
    background: rgba(239, 68, 68, 0.08);
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepLanding({ onBook, onViewAppointments, welcomeName, onLogout }: Props) {
  const handleBook = () => {
    navigator.vibrate?.(40);
    onBook();
  };

  const handleView = () => {
    navigator.vibrate?.(40);
    onViewAppointments();
  };

  return (
    <Container>
      {welcomeName && (
        <WelcomeBanner>
          <WelcomeText>
            <WelcomeGreeting>Bem-vindo de volta 👋</WelcomeGreeting>
            <WelcomeName>{welcomeName.split(" ")[0]}</WelcomeName>
          </WelcomeText>
          {onLogout && (
            <LogoutBtn type="button" onClick={onLogout} title="Sair da conta">
              <SignOut size={18} weight="bold" />
            </LogoutBtn>
          )}
        </WelcomeBanner>
      )}

      <ButtonsWrapper>
        <PrimaryButton onClick={handleBook}>
          <IconBox><CalendarBlank size={20} weight="fill" /></IconBox>
          <ButtonLabel>
            <ButtonTitle>Agendar serviço</ButtonTitle>
            <ButtonSub>Escolha data, horário e profissional</ButtonSub>
          </ButtonLabel>
        </PrimaryButton>

        <SecondaryButton onClick={handleView}>
          <IconBoxMuted><Clock size={20} weight="fill" /></IconBoxMuted>
          <ButtonLabel>
            <ButtonTitle>Meus agendamentos</ButtonTitle>
            <ButtonSub>Ver histórico e próximos horários</ButtonSub>
          </ButtonLabel>
        </SecondaryButton>
      </ButtonsWrapper>
    </Container>
  );
}
