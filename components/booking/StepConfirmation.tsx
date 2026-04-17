"use client";

import { useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  ArrowLeft,
  CalendarCheck,
  Clock,
  Tag,
  User,
  Phone,
  Spinner,
  Warning,
  CalendarX,
} from "@phosphor-icons/react";
import { Business, Service, Professional } from "@/types/database";
import { BookingState, CreatedAppointment } from "./BookingShell";
import { formatPrice, formatDuration } from "@/lib/utils/formatters";

interface DuplicateInfo {
  id: string;
  start_at: string;
  time: string;
  service_name: string;
}

interface Props {
  booking: BookingState;
  business: Business;
  services: Service[];
  professional: Professional | null;
  verificationToken: string;
  onBack: () => void;
  onSuccess: (appointment: CreatedAppointment) => void;
  onRequiresPayment: (appointmentId: string, amountCents: number, startAt: string) => void;
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

const ServiceTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(var(--color-primary-rgb), 0.1);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  margin: 2px 4px 2px 0;
`;

const ServiceTagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 2px;
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

// ─── Duplicate Warning ────────────────────────────────────────────────────────

const DuplicateCard = styled.div`
  background: rgba(245, 158, 11, 0.07);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
`;

const DuplicateHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
`;

const DuplicateTitle = styled.p`
  font-size: 14px;
  font-weight: 700;
  color: #92400e;
`;

const DuplicateInfo = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 12px;
  line-height: 1.45;
`;

const ObservationLabel = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
`;

const ObservationTextarea = styled.textarea`
  width: 100%;
  min-height: 72px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-surface);
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  &::placeholder {
    color: var(--color-text-muted);
    opacity: 0.6;
  }
`;

const DuplicateActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const CancelDuplicateBtn = styled.button`
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--color-text-muted);
  }
`;

const ConfirmAnywayBtn = styled.button<{ $loading: boolean }>`
  flex: 1.5;
  height: 44px;
  border-radius: 10px;
  background: #f59e0b;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: ${({ $loading }) => ($loading ? "not-allowed" : "pointer")};
  opacity: ${({ $loading }) => ($loading ? 0.7 : 1)};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: opacity 0.2s;

  &:hover {
    opacity: ${({ $loading }) => ($loading ? 0.7 : 0.88)};
  }
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

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}


// ─── Component ────────────────────────────────────────────────────────────────

export default function StepConfirmation({
  booking,
  business,
  services,
  professional,
  verificationToken,
  onBack,
  onSuccess,
  onRequiresPayment,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null);
  const [duplicateNote, setDuplicateNote] = useState("");

  const totalPrice = services.reduce((acc, s) => acc + s.price_cents, 0);
  const totalDuration = services.reduce((acc, s) => acc + s.duration_min, 0);

  const handleConfirm = async (force = false) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id,
          service_ids: booking.serviceIds,
          professional_id: booking.professionalId,
          client_name: booking.clientName,
          client_phone: booking.clientPhone,
          date: booking.date,
          time: booking.time,
          verification_token: verificationToken,
          force,
          notes: force && duplicateNote.trim() ? duplicateNote.trim() : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 409 && data.error === "duplicate_day") {
        // Usuário já tem agendamento neste dia — mostra aviso
        setDuplicate(data.existing as DuplicateInfo);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao confirmar agendamento");
      }

      // Negócio requer pagamento PIX antes de confirmar
      if (data.requires_payment) {
        onRequiresPayment(data.appointment_id, data.amount_cents, data.start_at);
        return;
      }

      onSuccess({
        id: data.appointment.id,
        start_at: data.appointment.start_at,
        services,
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
        {/* Serviços selecionados */}
        <SummaryRow>
          <RowIcon>
            <Tag size={16} />
          </RowIcon>
          <RowContent>
            <RowLabel>
              {services.length === 1 ? "Serviço" : `Serviços (${services.length})`}
            </RowLabel>
            <ServiceTagsRow>
              {services.map((s) => (
                <ServiceTag key={s.id}>
                  <Clock size={11} />
                  {s.name}
                </ServiceTag>
              ))}
            </ServiceTagsRow>
            <RowValue style={{ fontSize: 12, marginTop: 4 }}>
              Duração total: {formatDuration(totalDuration)}
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
          <PriceValue>{formatPrice(totalPrice)}</PriceValue>
        </PriceLine>
      </SummaryCard>

      {/* ── Card de aviso: duplo agendamento no mesmo dia ── */}
      {duplicate && (
        <DuplicateCard>
          <DuplicateHeader>
            <Warning size={18} weight="fill" color="#f59e0b" />
            <DuplicateTitle>Você já tem um agendamento neste dia</DuplicateTitle>
          </DuplicateHeader>
          <DuplicateInfo>
            <CalendarX
              size={13}
              style={{ verticalAlign: "middle", marginRight: 4 }}
              weight="bold"
            />
            <strong>{duplicate.service_name}</strong> às{" "}
            <strong>{duplicate.time}</strong>. Deseja agendar mesmo assim?
          </DuplicateInfo>

          <ObservationLabel htmlFor="duplicate-note">
            Motivo do segundo agendamento (opcional)
          </ObservationLabel>
          <ObservationTextarea
            id="duplicate-note"
            value={duplicateNote}
            onChange={(e) => setDuplicateNote(e.target.value)}
            placeholder="Ex: agendei para mim e para um familiar..."
            maxLength={300}
          />

          <DuplicateActions>
            <CancelDuplicateBtn
              type="button"
              onClick={() => {
                setDuplicate(null);
                setDuplicateNote("");
              }}
            >
              Cancelar
            </CancelDuplicateBtn>
            <ConfirmAnywayBtn
              type="button"
              $loading={loading}
              disabled={loading}
              onClick={() => handleConfirm(true)}
            >
              {loading ? (
                <SpinnerIcon>
                  <Spinner size={16} />
                </SpinnerIcon>
              ) : (
                "Confirmar mesmo assim"
              )}
            </ConfirmAnywayBtn>
          </DuplicateActions>
        </DuplicateCard>
      )}

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {!duplicate && (
        <ConfirmButton
          type="button"
          $loading={loading}
          onClick={() => handleConfirm(false)}
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
      )}
    </Container>
  );
}
