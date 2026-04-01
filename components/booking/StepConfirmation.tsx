"use client";

import { useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  ArrowLeft,
  CalendarCheck,
  Clock,
  Scissors,
  User,
  Phone,
  Spinner,
} from "@phosphor-icons/react";
import { Business, Service, Professional } from "@/types/database";
import { BookingState, CreatedAppointment } from "./BookingShell";

interface Props {
  booking: BookingState;
  business: Business;
  service: Service;
  professional: Professional | null;
  onBack: () => void;
  onSuccess: (appointment: CreatedAppointment) => void;
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
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0;
  &:hover {
    color: var(--color-text);
  }
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
  letter-spacing: -0.4px;
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 22px;
`;

const SummaryCard = styled.div`
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const SummaryRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const RowIcon = styled.div`
  color: var(--color-primary);
  display: flex;
  align-items: center;
  margin-top: 2px;
  flex-shrink: 0;
`;

const RowContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const RowLabel = styled.span`
  font-size: 10px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`;

const RowValue = styled.span`
  font-size: 14px;
  color: var(--color-text);
  font-weight: 500;
`;

const Divider = styled.div`
  height: 1px;
  background: var(--color-border);
`;

const PriceLine = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PriceLabel = styled.span`
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 500;
`;

const PriceValue = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
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

const ErrorBanner = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 13px;
  color: var(--color-danger);
  margin-bottom: 14px;
`;

const ConfirmButton = styled.button<{ $loading: boolean }>`
  width: 100%;
  height: 52px;
  border-radius: 12px;
  background: var(--color-primary);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  border: none;
  cursor: ${({ $loading }) => ($loading ? "not-allowed" : "pointer")};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: ${({ $loading }) => ($loading ? 0.7 : 1)};
  transition: opacity 0.2s;

  &:hover {
    opacity: ${({ $loading }) => ($loading ? 0.7 : 0.88)};
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  if (cents === 0) return "Gratuito";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100
  );
}

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepConfirmation({
  booking,
  business,
  service,
  professional,
  onBack,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id,
          service_id: booking.serviceId,
          professional_id: booking.professionalId,
          client_name: booking.clientName,
          client_phone: booking.clientPhone,
          date: booking.date,
          time: booking.time,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao confirmar agendamento");
      }

      const data = await res.json();

      // API returns { success: true, appointment: { id, start_at, ... } }
      onSuccess({
        id: data.appointment.id,
        start_at: data.appointment.start_at,
        service,
        professional: professional ?? null,
        business,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <BackButton onClick={onBack} type="button" disabled={loading}>
        <ArrowLeft size={16} />
        Voltar
      </BackButton>

      <Title>Confirmar agendamento</Title>
      <Subtitle>Revise os detalhes</Subtitle>

      <SummaryCard>
        <SummaryRow>
          <RowIcon>
            <Scissors size={16} />
          </RowIcon>
          <RowContent>
            <RowLabel>Serviço</RowLabel>
            <RowValue>
              {service.name} · {formatDuration(service.duration_min)}
            </RowValue>
          </RowContent>
        </SummaryRow>

        <SummaryRow>
          <RowIcon>
            <User size={16} />
          </RowIcon>
          <RowContent>
            <RowLabel>Profissional</RowLabel>
            <RowValue>{professional?.name ?? "Sem preferência"}</RowValue>
          </RowContent>
        </SummaryRow>

        <SummaryRow>
          <RowIcon>
            <CalendarCheck size={16} />
          </RowIcon>
          <RowContent>
            <RowLabel>Data</RowLabel>
            <RowValue style={{ textTransform: "capitalize" }}>
              {booking.date ? formatDate(booking.date) : "—"}
            </RowValue>
          </RowContent>
        </SummaryRow>

        <SummaryRow>
          <RowIcon>
            <Clock size={16} />
          </RowIcon>
          <RowContent>
            <RowLabel>Horário</RowLabel>
            <RowValue>{booking.time ?? "—"}</RowValue>
          </RowContent>
        </SummaryRow>

        <SummaryRow>
          <RowIcon>
            <Phone size={16} />
          </RowIcon>
          <RowContent>
            <RowLabel>WhatsApp</RowLabel>
            <RowValue>
              {booking.clientName} · {booking.clientPhone}
            </RowValue>
          </RowContent>
        </SummaryRow>

        <Divider />

        <PriceLine>
          <PriceLabel>Total</PriceLabel>
          <PriceValue>{formatPrice(service.price_cents)}</PriceValue>
        </PriceLine>
      </SummaryCard>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <ConfirmButton
        type="button"
        $loading={loading}
        onClick={handleConfirm}
        disabled={loading}
      >
        {loading ? (
          <>
            <SpinnerIcon>
              <Spinner size={18} />
            </SpinnerIcon>
            Confirmando...
          </>
        ) : (
          <>
            <CalendarCheck size={18} weight="bold" />
            Confirmar agendamento
          </>
        )}
      </ConfirmButton>
    </Container>
  );
}
