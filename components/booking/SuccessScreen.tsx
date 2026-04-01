"use client";

import styled, { keyframes } from "styled-components";
import {
  CheckCircle,
  WhatsappLogo,
  CalendarPlus,
  Scissors,
  User,
  CalendarBlank,
  Clock,
  Warning,
} from "@phosphor-icons/react";
import { Business } from "@/types/database";
import { CreatedAppointment } from "./BookingShell";

interface Props {
  appointment: CreatedAppointment;
  business: Business;
}

// ─── Styled Components ────────────────────────────────────────────────────────

const popIn = keyframes`
  0%   { transform: scale(0.5); opacity: 0; }
  70%  { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const fadeUp = keyframes`
  from { transform: translateY(12px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;

const Container = styled.div`
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const CheckWrapper = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.1);
  border: 2px solid var(--color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  animation: ${popIn} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
`;

const SuccessTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: var(--color-success);
  letter-spacing: -0.4px;
  margin-bottom: 6px;
  animation: ${fadeUp} 0.4s 0.15s ease both;
`;

const SuccessSubtitle = styled.p`
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 24px;
  line-height: 1.5;
  animation: ${fadeUp} 0.4s 0.2s ease both;
`;

const SummaryBox = styled.div`
  width: 100%;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 16px 18px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
  animation: ${fadeUp} 0.4s 0.25s ease both;
`;

const SummaryItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const SummaryIcon = styled.div`
  color: var(--color-primary);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-top: 2px;
`;

const SummaryContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const SummaryLabel = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SummaryValue = styled.span`
  font-size: 14px;
  color: var(--color-text);
  font-weight: 500;
`;

const WhatsAppNote = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(37, 211, 102, 0.07);
  border: 1px solid rgba(37, 211, 102, 0.22);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  margin-bottom: 20px;
  text-align: left;
  animation: ${fadeUp} 0.4s 0.3s ease both;
`;

const WhatsAppIcon = styled.div`
  color: #25d366;
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const WhatsAppText = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.4;

  strong {
    color: var(--color-text);
    font-weight: 600;
  }
`;

const ActionsColumn = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: ${fadeUp} 0.4s 0.35s ease both;
`;

const CalendarButton = styled.a`
  width: 100%;
  height: 48px;
  border-radius: 12px;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: var(--color-text-muted);
    background: var(--color-surface-2);
  }
`;

const NewBookingLink = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-muted);
  padding: 4px 8px;
  transition: color 0.2s;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover {
    color: var(--color-text);
  }
`;

const CancelPolicyBox = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(245, 158, 11, 0.07);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  margin-bottom: 16px;
  text-align: left;
  animation: ${fadeUp} 0.4s 0.32s ease both;
`;

const CancelPolicyIcon = styled.div`
  color: #F59E0B;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-top: 1px;
`;

const CancelPolicyText = styled.p`
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.45;

  strong {
    color: var(--color-text);
    font-weight: 600;
  }

  a {
    color: var(--color-primary);
    text-decoration: underline;
    text-underline-offset: 2px;
    font-weight: 500;
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(isoString: string) {
  const d = new Date(isoString);
  const date = d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return {
    date: date.charAt(0).toUpperCase() + date.slice(1),
    time,
  };
}

function buildGoogleCalendarUrl(appointment: CreatedAppointment, business: Business): string {
  const start = new Date(appointment.start_at);
  const end = new Date(start.getTime() + appointment.service.duration_min * 60000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return (
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(appointment.service.name + " - " + business.name)}` +
    `&dates=${fmt(start)}/${fmt(end)}` +
    `&details=${encodeURIComponent("Agendamento via Marque Já")}` +
    `&location=${encodeURIComponent(
      typeof business.address === "object"
        ? (business.address as any).formatted ?? ""
        : ""
    )}`
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SuccessScreen({ appointment, business }: Props) {
  const { date, time } = formatDateTime(appointment.start_at);
  const calendarUrl = buildGoogleCalendarUrl(appointment, business);

  return (
    <Container>
      <CheckWrapper>
        <CheckCircle size={36} weight="fill" color="var(--color-success)" />
      </CheckWrapper>

      <SuccessTitle>Agendamento confirmado!</SuccessTitle>
      <SuccessSubtitle>Nos vemos em breve!</SuccessSubtitle>

      <SummaryBox>
        <SummaryItem>
          <SummaryIcon>
            <Scissors size={16} />
          </SummaryIcon>
          <SummaryContent>
            <SummaryLabel>Serviço</SummaryLabel>
            <SummaryValue>{appointment.service.name}</SummaryValue>
          </SummaryContent>
        </SummaryItem>

        {appointment.professional && (
          <SummaryItem>
            <SummaryIcon>
              <User size={16} />
            </SummaryIcon>
            <SummaryContent>
              <SummaryLabel>Profissional</SummaryLabel>
              <SummaryValue>{appointment.professional.name}</SummaryValue>
            </SummaryContent>
          </SummaryItem>
        )}

        <SummaryItem>
          <SummaryIcon>
            <CalendarBlank size={16} />
          </SummaryIcon>
          <SummaryContent>
            <SummaryLabel>Data</SummaryLabel>
            <SummaryValue style={{ textTransform: "capitalize" }}>{date}</SummaryValue>
          </SummaryContent>
        </SummaryItem>

        <SummaryItem>
          <SummaryIcon>
            <Clock size={16} />
          </SummaryIcon>
          <SummaryContent>
            <SummaryLabel>Horário</SummaryLabel>
            <SummaryValue>{time}</SummaryValue>
          </SummaryContent>
        </SummaryItem>
      </SummaryBox>

      <WhatsAppNote>
        <WhatsAppIcon>
          <WhatsappLogo size={22} weight="fill" />
        </WhatsAppIcon>
        <WhatsAppText>
          Você receberá a <strong>confirmação</strong> pelo WhatsApp.
        </WhatsAppText>
      </WhatsAppNote>

      <CancelPolicyBox>
        <CancelPolicyIcon>
          <Warning size={18} weight="fill" />
        </CancelPolicyIcon>
        <CancelPolicyText>
          <strong>Precisa cancelar?</strong> Cancelamentos devem ser feitos com no mínimo{" "}
          <strong>30 minutos de antecedência</strong>.{" "}
          <a href={`/${business.slug}/cancelar/${appointment.id}`}>
            Cancelar este agendamento
          </a>
        </CancelPolicyText>
      </CancelPolicyBox>

      <ActionsColumn>
        <CalendarButton href={calendarUrl} target="_blank" rel="noopener noreferrer">
          <CalendarPlus size={16} />
          Adicionar ao Calendário
        </CalendarButton>
        <NewBookingLink type="button" onClick={() => window.location.reload()}>
          Novo agendamento
        </NewBookingLink>
      </ActionsColumn>
    </Container>
  );
}
