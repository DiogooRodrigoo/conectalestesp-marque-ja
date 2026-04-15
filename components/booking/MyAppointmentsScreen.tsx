"use client";

import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import {
  ArrowLeft,
  CalendarBlank,
  Clock,
  Tag,
  User,
  CheckCircle,
  XCircle,
  Hourglass,
  SmileySad,
} from "@phosphor-icons/react";
import { Business } from "@/types/database";

interface AppointmentItem {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  notes: string | null;
  services: { name: string; duration_min: number; price_cents: number } | null;
  professionals: { name: string } | null;
}

interface Props {
  phone: string;
  businessId: string;
  token: string;
  business: Business;
  onBack: () => void;
}

// ─── Styled Components ────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { transform: translateY(10px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

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
  margin-bottom: 4px;
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 20px;
`;

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 0;
`;

const SpinIcon = styled.div`
  animation: ${spin} 0.8s linear infinite;
  color: var(--color-primary);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 0;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-size: 14px;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: ${fadeUp} 0.3s ease both;
`;

const AppointmentCard = styled.div<{ $status: string }>`
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-left: 3px solid ${({ $status }) => statusColor($status)};
  border-radius: 12px;
  padding: 14px 16px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
`;

const ServiceName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 99px;
  background: ${({ $status }) => statusBg($status)};
  color: ${({ $status }) => statusColor($status)};
  text-transform: uppercase;
  letter-spacing: 0.4px;
  white-space: nowrap;
`;

const CardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-muted);
`;

const DetailIcon = styled.span`
  color: var(--color-primary);
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const ErrorText = styled.p`
  font-size: 13px;
  color: var(--color-danger);
  text-align: center;
  padding: 20px 0;
`;

const SectionLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin: 16px 0 8px;

  &:first-child { margin-top: 0; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(status: string): string {
  switch (status) {
    case "confirmed": return "var(--color-primary)";
    case "completed": return "var(--color-success)";
    case "cancelled": return "var(--color-danger)";
    case "no_show":   return "#EF4444";
    default:          return "var(--color-text-muted)";
  }
}

function statusBg(status: string): string {
  switch (status) {
    case "confirmed": return "rgba(var(--color-primary-rgb),0.12)";
    case "completed": return "rgba(34,197,94,0.12)";
    case "cancelled": return "rgba(239,68,68,0.12)";
    case "no_show":   return "rgba(239,68,68,0.12)";
    default:          return "rgba(100,100,100,0.1)";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "confirmed": return "Confirmado";
    case "completed": return "Concluído";
    case "cancelled": return "Cancelado";
    case "no_show":   return "Não compareceu";
    default:          return status;
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "confirmed": return <Hourglass size={14} weight="fill" />;
    case "completed": return <CheckCircle size={14} weight="fill" />;
    case "cancelled": return <XCircle size={14} weight="fill" />;
    default:          return null;
  }
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" }),
    time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function isUpcoming(iso: string): boolean {
  return new Date(iso) >= new Date();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MyAppointmentsScreen({ phone, businessId, token, business, onBack }: Props) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cleanPhone = phone.replace(/\D/g, "");
    fetch(`/api/appointments/by-phone?phone=${cleanPhone}&business_id=${businessId}&token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setAppointments(data.appointments ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [phone, businessId, token]);

  const upcoming = appointments.filter((a) => isUpcoming(a.start_at) && a.status !== "cancelled");
  const past = appointments.filter((a) => !isUpcoming(a.start_at) || a.status === "cancelled");

  return (
    <Container>
      <BackButton onClick={onBack} type="button">
        <ArrowLeft size={16} />
        Voltar
      </BackButton>

      <Title>Meus agendamentos</Title>
      <Subtitle>{business.name}</Subtitle>

      {loading && (
        <LoadingWrapper>
          <SpinIcon>
            <Hourglass size={28} weight="fill" />
          </SpinIcon>
        </LoadingWrapper>
      )}

      {error && <ErrorText>{error}</ErrorText>}

      {!loading && !error && appointments.length === 0 && (
        <EmptyState>
          <SmileySad size={36} />
          Nenhum agendamento encontrado
        </EmptyState>
      )}

      {!loading && !error && appointments.length > 0 && (
        <List>
          {upcoming.length > 0 && (
            <>
              <SectionLabel>Próximos</SectionLabel>
              {upcoming.map((a) => {
                const { date, time } = formatDateTime(a.start_at);
                return (
                  <AppointmentCard key={a.id} $status={a.status}>
                    <CardHeader>
                      <ServiceName>{a.services?.name ?? "Serviço"}</ServiceName>
                      <StatusBadge $status={a.status}>
                        {statusLabel(a.status)}
                      </StatusBadge>
                    </CardHeader>
                    <CardDetails>
                      <DetailRow>
                        <DetailIcon><CalendarBlank size={14} /></DetailIcon>
                        <span style={{ textTransform: "capitalize" }}>{date}</span>
                      </DetailRow>
                      <DetailRow>
                        <DetailIcon><Clock size={14} /></DetailIcon>
                        {time}
                      </DetailRow>
                      {a.professionals?.name && (
                        <DetailRow>
                          <DetailIcon><User size={14} /></DetailIcon>
                          {a.professionals.name}
                        </DetailRow>
                      )}
                    </CardDetails>
                  </AppointmentCard>
                );
              })}
            </>
          )}

          {past.length > 0 && (
            <>
              <SectionLabel>Histórico</SectionLabel>
              {past.map((a) => {
                const { date, time } = formatDateTime(a.start_at);
                return (
                  <AppointmentCard key={a.id} $status={a.status}>
                    <CardHeader>
                      <ServiceName>{a.services?.name ?? "Serviço"}</ServiceName>
                      <StatusBadge $status={a.status}>
                        {statusLabel(a.status)}
                      </StatusBadge>
                    </CardHeader>
                    <CardDetails>
                      <DetailRow>
                        <DetailIcon><CalendarBlank size={14} /></DetailIcon>
                        <span style={{ textTransform: "capitalize" }}>{date}</span>
                      </DetailRow>
                      <DetailRow>
                        <DetailIcon><Clock size={14} /></DetailIcon>
                        {time}
                      </DetailRow>
                      {a.professionals?.name && (
                        <DetailRow>
                          <DetailIcon><User size={14} /></DetailIcon>
                          {a.professionals.name}
                        </DetailRow>
                      )}
                    </CardDetails>
                  </AppointmentCard>
                );
              })}
            </>
          )}
        </List>
      )}
    </Container>
  );
}
