"use client";

import { useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  Warning,
  CalendarX,
  Tag,
  User,
  CalendarBlank,
  Clock,
  CheckCircle,
  Spinner,
} from "@phosphor-icons/react";

interface AppointmentInfo {
  id: string;
  status: string;
  start_at: string;
  service_name: string;
  professional_name: string | null;
  client_name: string;
}

interface Props {
  appointment: AppointmentInfo;
  businessName: string;
  businessSlug: string;
  businessColor?: string;
  isPastDeadline: boolean;
}

// ─── Styled Components ────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { transform: translateY(12px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const Wrapper = styled.div`
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 48px;
`;

const Header = styled.header`
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
`;

const LogoBox = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
`;

const BusinessName = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted);
`;

const Card = styled.div`
  width: 100%;
  max-width: 480px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 28px 24px;
  animation: ${fadeUp} 0.35s ease both;
`;

const PageTitle = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.4px;
  margin-bottom: 4px;
`;

const PageSubtitle = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 24px;
`;

const SummaryBox = styled.div`
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px 18px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SummaryItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const SummaryIcon = styled.div<{ $color: string }>`
  color: ${({ $color }) => $color};
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

const DeadlineBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  margin-bottom: 20px;
`;

const DeadlineIcon = styled.div`
  color: var(--color-danger);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-top: 1px;
`;

const DeadlineText = styled.p`
  font-size: 13px;
  color: var(--color-danger);
  line-height: 1.45;
  font-weight: 500;
`;

const ErrorBanner = styled.div`
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 13px;
  color: var(--color-danger);
  margin-bottom: 14px;
`;

const CancelButton = styled.button<{ $loading: boolean }>`
  width: 100%;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--color-danger);
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
  margin-bottom: 12px;

  &:hover {
    opacity: ${({ $loading }) => ($loading ? 0.7 : 0.88)};
  }
`;

const BackLink = styled.a`
  display: block;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: var(--color-text);
  }
`;

const SpinnerIcon = styled.div`
  animation: ${spin} 0.8s linear infinite;
  display: flex;
  align-items: center;
`;

// ─── Success state ────────────────────────────────────────────────────────────

const SuccessWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
`;

const SuccessCircle = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.1);
  border: 2px solid var(--color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
`;

const SuccessTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: var(--color-success);
  letter-spacing: -0.3px;
`;

const SuccessText = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.5;
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(isoString: string) {
  const d = new Date(isoString);
  const date = d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return {
    date: date.charAt(0).toUpperCase() + date.slice(1),
    time,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CancelConfirm({
  appointment,
  businessName,
  businessSlug,
  businessColor = "#F97316",
  isPastDeadline,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  const { date, time } = formatDateTime(appointment.start_at);

  const logoInitials = businessName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const handleCancel = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${appointment.id}/cancel`, {
        method: "PATCH",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao cancelar agendamento");
      }

      setCancelled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <Header>
        <LogoBox $color={businessColor}>{logoInitials}</LogoBox>
        <BusinessName>{businessName}</BusinessName>
      </Header>

      <Card>
        {cancelled ? (
          <SuccessWrapper>
            <SuccessCircle>
              <CheckCircle size={32} weight="fill" color="var(--color-success)" />
            </SuccessCircle>
            <SuccessTitle>Agendamento cancelado</SuccessTitle>
            <SuccessText>
              Seu agendamento foi cancelado com sucesso.{"\n"}
              Esperamos te ver em breve!
            </SuccessText>
            <BackLink href={`/${businessSlug}`} style={{ marginTop: 8 }}>
              Fazer novo agendamento
            </BackLink>
          </SuccessWrapper>
        ) : (
          <>
            <PageTitle>Cancelar agendamento</PageTitle>
            <PageSubtitle>Confirme os dados antes de cancelar</PageSubtitle>

            <SummaryBox>
              <SummaryItem>
                <SummaryIcon $color={businessColor}>
                  <Tag size={15} />
                </SummaryIcon>
                <SummaryContent>
                  <SummaryLabel>Serviço</SummaryLabel>
                  <SummaryValue>{appointment.service_name}</SummaryValue>
                </SummaryContent>
              </SummaryItem>

              {appointment.professional_name && (
                <SummaryItem>
                  <SummaryIcon $color={businessColor}>
                    <User size={15} />
                  </SummaryIcon>
                  <SummaryContent>
                    <SummaryLabel>Profissional</SummaryLabel>
                    <SummaryValue>{appointment.professional_name}</SummaryValue>
                  </SummaryContent>
                </SummaryItem>
              )}

              <SummaryItem>
                <SummaryIcon $color={businessColor}>
                  <CalendarBlank size={15} />
                </SummaryIcon>
                <SummaryContent>
                  <SummaryLabel>Data</SummaryLabel>
                  <SummaryValue style={{ textTransform: "capitalize" }}>{date}</SummaryValue>
                </SummaryContent>
              </SummaryItem>

              <SummaryItem>
                <SummaryIcon $color={businessColor}>
                  <Clock size={15} />
                </SummaryIcon>
                <SummaryContent>
                  <SummaryLabel>Horário</SummaryLabel>
                  <SummaryValue>{time}</SummaryValue>
                </SummaryContent>
              </SummaryItem>
            </SummaryBox>

            {isPastDeadline ? (
              <DeadlineBanner>
                <DeadlineIcon>
                  <Warning size={18} weight="fill" />
                </DeadlineIcon>
                <DeadlineText>
                  O prazo para cancelamento encerrou. Cancelamentos devem ser feitos com no mínimo 30 minutos de antecedência.
                </DeadlineText>
              </DeadlineBanner>
            ) : (
              <>
                {error && <ErrorBanner>{error}</ErrorBanner>}
                <CancelButton
                  type="button"
                  $loading={loading}
                  onClick={handleCancel}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <SpinnerIcon>
                        <Spinner size={18} />
                      </SpinnerIcon>
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <CalendarX size={18} weight="bold" />
                      Confirmar cancelamento
                    </>
                  )}
                </CancelButton>
                <BackLink href={`/${businessSlug}`}>Voltar ao início</BackLink>
              </>
            )}
          </>
        )}
      </Card>
    </Wrapper>
  );
}
