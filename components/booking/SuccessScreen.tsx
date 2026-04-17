"use client";

import { useRef } from "react";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";
import {
  CheckCircle, CalendarBlank, CalendarCheck,
  Clock, Scissors, User, WhatsappLogo, Warning,
} from "@phosphor-icons/react";
import { Business } from "@/types/database";
import { formatPrice } from "@/lib/utils/formatters";
import { CreatedAppointment } from "./BookingShell";

interface Props {
  appointment: CreatedAppointment;
  business: Business;
  onViewAppointments: () => void;
}

// ─── Confetti particles ───────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  "var(--color-primary)",
  "#22C55E",
  "#3B82F6",
  "#A855F7",
  "#F59E0B",
  "#EC4899",
];

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
  rotation: number;
  duration: number;
}

// Generated once at module level (stable across renders)
const PARTICLES: Particle[] = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: (i / 28) * 100 + ((i % 3) - 1) * 4,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: (i % 7) * 0.07,
  size: 6 + (i % 4) * 2,
  rotation: (i * 47) % 360,
  duration: 2.2 + (i % 4) * 0.3,
}));

// ─── Styled Components ────────────────────────────────────────────────────────

const popIn = keyframes`
  0%   { transform: scale(0.5); opacity: 0; }
  70%  { transform: scale(1.08); opacity: 1; }
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
  position: relative;
  overflow: hidden;
`;

const ConfettiLayer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
`;

const CheckWrapper = styled.div`
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.1);
  border: 2px solid var(--color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  animation: ${popIn} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  position: relative;
  z-index: 1;
`;

const SuccessTitle = styled.h2`
  font-size: 20px;
  font-weight: 800;
  color: var(--color-success);
  letter-spacing: -0.4px;
  margin-bottom: 4px;
  animation: ${fadeUp} 0.4s 0.15s ease both;
  position: relative;
  z-index: 1;
`;

const SuccessSubtitle = styled.p`
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 24px;
  line-height: 1.5;
  animation: ${fadeUp} 0.4s 0.2s ease both;
  position: relative;
  z-index: 1;
`;

// ── Ticket Card ───────────────────────────────────────────────────────────────

const TicketCard = styled.div`
  width: 100%;
  position: relative;
  margin-bottom: 16px;
  animation: ${fadeUp} 0.4s 0.25s ease both;
  z-index: 1;
`;

const TicketMain = styled.div`
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 16px 16px 0 0;
  padding: 16px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
`;

const TicketDivider = styled.div`
  position: relative;
  height: 1px;
  background: transparent;
  border-top: 2px dashed var(--color-border);
  margin: 0;

  /* Notch circles on sides */
  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
  }
  &::before { left: -9px; }
  &::after  { right: -9px; }
`;

const TicketStub = styled.div`
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 16px 16px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StubLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StubPrice = styled.span`
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

// ── Summary Items ─────────────────────────────────────────────────────────────

const SummaryItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const SummaryIcon = styled.div`
  font-size: 15px;
  flex-shrink: 0;
  margin-top: 2px;
  line-height: 1;
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

// ── Action buttons ────────────────────────────────────────────────────────────

const WhatsAppNote = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(37, 211, 102, 0.07);
  border: 1px solid rgba(37, 211, 102, 0.22);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  margin-bottom: 16px;
  text-align: left;
  animation: ${fadeUp} 0.4s 0.3s ease both;
  position: relative;
  z-index: 1;
`;

const WhatsAppIcon = styled.div`
  font-size: 22px;
  flex-shrink: 0;
  line-height: 1;
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
  position: relative;
  z-index: 1;
`;

const CancelPolicyIcon = styled.div`
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 1px;
  line-height: 1;
`;

const CancelPolicyText = styled.p`
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.45;

  strong { color: var(--color-text); font-weight: 600; }
  a {
    color: var(--color-primary);
    text-decoration: underline;
    text-underline-offset: 2px;
    font-weight: 500;
  }
`;

const ActionsColumn = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: ${fadeUp} 0.4s 0.35s ease both;
  position: relative;
  z-index: 1;
`;

const WhatsAppConfirmBtn = styled.a`
  width: 100%;
  height: 48px;
  border-radius: 12px;
  background: #25d366;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.88; }
`;

const SecondaryBtn = styled.a`
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
  transition: border-color 0.2s;
  &:hover { border-color: var(--color-text-muted); }
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
  &:hover { color: var(--color-text); }
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


function buildWhatsAppUrl(appointment: CreatedAppointment, business: Business, date: string, time: string): string | null {
  if (!business.phone_whatsapp) return null;
  const phone = business.phone_whatsapp.replace(/\D/g, "");
  const msg = encodeURIComponent(
    `Olá, ${business.name}! Acabei de agendar *${appointment.services.map((s) => s.name).join(" + ")}* para *${date} às ${time}*. Confirmo minha presença! 😊`
  );
  return `https://wa.me/55${phone}?text=${msg}`;
}

function buildGoogleCalendarUrl(appointment: CreatedAppointment, business: Business): string {
  const start = new Date(appointment.start_at);
  const totalDuration = appointment.services.reduce((acc, s) => acc + s.duration_min, 0);
  const end = new Date(start.getTime() + totalDuration * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return (
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(appointment.services.map((s) => s.name).join(" + ") + " - " + business.name)}` +
    `&dates=${fmt(start)}/${fmt(end)}` +
    `&details=${encodeURIComponent("Agendamento via Marque Já")}` +
    `&location=${encodeURIComponent(
      typeof business.address === "object"
        ? ((business.address as { formatted?: string }).formatted ?? "")
        : ""
    )}`
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SuccessScreen({ appointment, business, onViewAppointments }: Props) {
  const { date, time } = formatDateTime(appointment.start_at);
  const calendarUrl = buildGoogleCalendarUrl(appointment, business);
  const whatsappUrl = buildWhatsAppUrl(appointment, business, date, time);
  const totalPrice = appointment.services.reduce((acc, s) => acc + s.price_cents, 0);

  return (
    <Container>
      {/* Confetti */}
      <ConfettiLayer>
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: -20,
              width: p.size,
              height: p.size * 0.55,
              background: p.color,
              borderRadius: 2,
              rotate: p.rotation,
            }}
            animate={{
              y: ["0px", "500px"],
              rotate: [p.rotation, p.rotation + (p.id % 2 === 0 ? 360 : -360)],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: "easeIn",
              times: [0, 0.1, 0.7, 1],
            }}
          />
        ))}
      </ConfettiLayer>

      <CheckWrapper>
        <CheckCircle size={40} weight="fill" color="var(--color-success)" />
      </CheckWrapper>

      <SuccessTitle>Agendamento confirmado!</SuccessTitle>
      <SuccessSubtitle>Nos vemos em breve! 🎉</SuccessSubtitle>

      {/* Ticket */}
      <TicketCard>
        <TicketMain>
          <SummaryItem>
            <SummaryIcon><Scissors size={15} weight="bold" /></SummaryIcon>
            <SummaryContent>
              <SummaryLabel>
                {appointment.services.length === 1 ? "Serviço" : `Serviços (${appointment.services.length})`}
              </SummaryLabel>
              <SummaryValue>{appointment.services.map((s) => s.name).join(" + ")}</SummaryValue>
            </SummaryContent>
          </SummaryItem>

          {appointment.professional && (
            <SummaryItem>
              <SummaryIcon><User size={15} weight="bold" /></SummaryIcon>
              <SummaryContent>
                <SummaryLabel>Profissional</SummaryLabel>
                <SummaryValue>{appointment.professional.name}</SummaryValue>
              </SummaryContent>
            </SummaryItem>
          )}

          <SummaryItem>
            <SummaryIcon><CalendarBlank size={15} weight="bold" /></SummaryIcon>
            <SummaryContent>
              <SummaryLabel>Data</SummaryLabel>
              <SummaryValue style={{ textTransform: "capitalize" }}>{date}</SummaryValue>
            </SummaryContent>
          </SummaryItem>

          <SummaryItem>
            <SummaryIcon><Clock size={15} weight="bold" /></SummaryIcon>
            <SummaryContent>
              <SummaryLabel>Horário</SummaryLabel>
              <SummaryValue>{time}</SummaryValue>
            </SummaryContent>
          </SummaryItem>
        </TicketMain>

        <TicketDivider />

        <TicketStub>
          <StubLabel>Total</StubLabel>
          <StubPrice>{formatPrice(totalPrice)}</StubPrice>
        </TicketStub>
      </TicketCard>

      <WhatsAppNote>
        <WhatsAppIcon><WhatsappLogo size={22} weight="fill" color="#25D366" /></WhatsAppIcon>
        <WhatsAppText>
          Você receberá a <strong>confirmação</strong> pelo WhatsApp.
        </WhatsAppText>
      </WhatsAppNote>

      <CancelPolicyBox>
        <CancelPolicyIcon><Warning size={18} weight="fill" color="var(--color-warning)" /></CancelPolicyIcon>
        <CancelPolicyText>
          <strong>Precisa cancelar?</strong> Cancelamentos devem ser feitos com no mínimo{" "}
          <strong>30 minutos de antecedência</strong>.{" "}
          <a href={`/${business.slug}/cancelar/${appointment.id}`}>
            Cancelar este agendamento
          </a>
        </CancelPolicyText>
      </CancelPolicyBox>

      <ActionsColumn>
        {whatsappUrl && (
          <WhatsAppConfirmBtn href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <WhatsappLogo size={16} weight="fill" /> Confirmar via WhatsApp
          </WhatsAppConfirmBtn>
        )}
        <SecondaryBtn href={calendarUrl} target="_blank" rel="noopener noreferrer">
          <CalendarBlank size={16} weight="bold" /> Adicionar ao Calendário
        </SecondaryBtn>
        <SecondaryBtn as="button" onClick={onViewAppointments}>
          <CalendarCheck size={16} weight="bold" /> Ver meus agendamentos
        </SecondaryBtn>
        <NewBookingLink type="button" onClick={() => window.location.reload()}>
          Novo agendamento
        </NewBookingLink>
      </ActionsColumn>
    </Container>
  );
}
