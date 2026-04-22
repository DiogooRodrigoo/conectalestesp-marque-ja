"use client";

import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import {
  ArrowLeft, CalendarBlank, Clock, User,
  CheckCircle, Hourglass, SmileySad,
  QrCode, CurrencyCircleDollar, CaretRight, X,
  Warning, DotsThree,
} from "@phosphor-icons/react";
import { Business } from "@/types/database";
import StepPayment from "./StepPayment";

interface AppointmentItem {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  notes: string | null;
  payment_status: string | null;
  payment_amount_cents: number | null;
  payment_expires_at: string | null;
  payment_id: string | null;
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

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { transform: translateY(10px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const popIn = keyframes`
  from { transform: scale(0.94) translateY(8px); opacity: 0; }
  to   { transform: scale(1) translateY(0);      opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

// ─── List Styled Components ───────────────────────────────────────────────────

const Container = styled.div`padding: 24px 20px 28px;`;

const BackButton = styled.button`
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--color-text-muted);
  margin-bottom: 20px; padding: 0;
  background: none; border: none; cursor: pointer;
  transition: color 0.2s;
  &:hover { color: var(--color-text); }
`;

const Title = styled.h2`
  font-size: 18px; font-weight: 700; color: var(--color-text);
  letter-spacing: -0.4px; margin-bottom: 4px;
`;

const Subtitle = styled.p`font-size: 13px; color: var(--color-text-muted); margin-bottom: 20px;`;

const LoadingWrapper = styled.div`display: flex; justify-content: center; padding: 40px 0;`;

const SpinIcon = styled.div`animation: ${spin} 0.8s linear infinite; color: var(--color-primary);`;

const EmptyState = styled.div`
  text-align: center; padding: 40px 0; color: var(--color-text-muted);
  display: flex; flex-direction: column; align-items: center; gap: 10px; font-size: 14px;
`;

const List = styled.div`
  display: flex; flex-direction: column; gap: 10px;
  animation: ${fadeUp} 0.3s ease both;
`;

const AppointmentCard = styled.div<{ $status: string }>`
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-left: 3px solid ${({ $status }) => statusColor($status)};
  border-radius: 12px;
  padding: 13px 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 0.15s, border-color 0.15s;
  &:hover { background: var(--color-surface); border-color: ${({ $status }) => statusColor($status)}88; }
  &:active { background: var(--color-surface); }
`;

const CardMain = styled.div`flex: 1; min-width: 0;`;

const CardTop = styled.div`
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; gap: 8px;
`;

const ServiceBlock = styled.div`min-width: 0;`;

const ServiceLabel = styled.span`
  font-size: 10px; font-weight: 600; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 1px;
`;

const ServiceName = styled.span`
  font-size: 14px; font-weight: 600; color: var(--color-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  display: block; max-width: 190px;
`;

const StatusBadge = styled.span<{ $status: string; $paid?: boolean }>`
  font-size: 10px; font-weight: 700; padding: 2px 7px;
  border-radius: 99px; flex-shrink: 0;
  background: ${({ $status, $paid }) => $paid ? "rgba(34,197,94,0.12)" : statusBg($status)};
  color: ${({ $status, $paid }) => $paid ? "#16A34A" : statusColor($status)};
  text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;
`;

const CardMeta = styled.div`
  display: flex; align-items: center; gap: 10px;
  font-size: 12px; color: var(--color-text-muted);
`;

const MetaItem = styled.span`display: flex; align-items: center; gap: 3px;`;

const ChevronWrap = styled.div`
  color: var(--color-text-muted); flex-shrink: 0; display: flex; align-items: center;
`;

const PixDot = styled.div`
  width: 7px; height: 7px; border-radius: 50%;
  background: #D97706; flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(217,119,6,0.2);
`;

const ErrorText = styled.p`
  font-size: 13px; color: var(--color-danger); text-align: center; padding: 20px 0;
`;

const SectionLabel = styled.p`
  font-size: 11px; font-weight: 600; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: 0.6px; margin: 16px 0 8px;
  &:first-child { margin-top: 0; }
`;

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed; inset: 0; z-index: 50;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(2px);
  animation: ${fadeIn} 0.18s ease both;
  display: flex; align-items: center; justify-content: center;
  padding: 20px 16px;
`;

const Sheet = styled.div`
  width: 100%; max-width: 420px;
  background: var(--color-surface);
  border-radius: 20px;
  border: 1px solid var(--color-border);
  box-shadow: 0 24px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1);
  animation: ${popIn} 0.22s cubic-bezier(0.34, 1.3, 0.64, 1) both;
  max-height: 88vh;
  overflow-y: auto;
  &::-webkit-scrollbar { display: none; }
`;

const SheetHeader = styled.div`
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 12px;
`;

const SheetHeaderLeft = styled.div`flex: 1; min-width: 0;`;

const SheetTag = styled.span`
  font-size: 10px; font-weight: 700; color: var(--color-primary);
  text-transform: uppercase; letter-spacing: 0.6px;
  display: block; margin-bottom: 3px;
`;

const SheetServiceName = styled.h3`
  font-size: 18px; font-weight: 800; color: var(--color-text);
  letter-spacing: -0.4px; line-height: 1.2;
`;

const SheetCloseBtn = styled.button`
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
  background: var(--color-surface-2); border: 1px solid var(--color-border);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted); cursor: pointer;
  transition: background 0.15s;
  &:hover { background: var(--color-border); }
`;

const SheetBody = styled.div`padding: 18px 20px 26px; display: flex; flex-direction: column; gap: 14px;`;

const InfoRow = styled.div`
  display: flex; align-items: center; gap: 10px;
  font-size: 13.5px; color: var(--color-text-muted);
`;

const InfoIcon = styled.span`
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
  background: rgba(var(--color-primary-rgb), 0.08);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-primary);
`;

const InfoLabel = styled.span`
  font-size: 11px; font-weight: 600; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 1px;
`;

const InfoValue = styled.span`font-size: 14px; font-weight: 500; color: var(--color-text);`;

const Divider = styled.hr`border: none; border-top: 1px solid var(--color-border); margin: 4px 0;`;

// Payment status card
function paymentBg(type: string) {
  if (type === "paid")    return "rgba(34,197,94,0.08)";
  if (type === "pending") return "rgba(217,119,6,0.07)";
  if (type === "expired") return "rgba(239,68,68,0.07)";
  return "var(--color-surface-2)";
}
function paymentBorder(type: string) {
  if (type === "paid")    return "1px solid rgba(34,197,94,0.25)";
  if (type === "pending") return "1px solid rgba(217,119,6,0.25)";
  if (type === "expired") return "1px solid rgba(239,68,68,0.2)";
  return "1px solid var(--color-border)";
}
function paymentIconBg(type: string) {
  if (type === "paid")    return "rgba(34,197,94,0.15)";
  if (type === "pending") return "rgba(217,119,6,0.12)";
  if (type === "expired") return "rgba(239,68,68,0.1)";
  return "var(--color-border)";
}
function paymentIconColor(type: string) {
  if (type === "paid")    return "#16A34A";
  if (type === "pending") return "#D97706";
  if (type === "expired") return "#DC2626";
  return "var(--color-text-muted)";
}
function paymentTitleColor(type: string) {
  if (type === "paid")    return "#16A34A";
  if (type === "pending") return "#D97706";
  if (type === "expired") return "#DC2626";
  return "var(--color-text-muted)";
}

const PaymentCard = styled.div<{ $type: string }>`
  border-radius: 12px;
  padding: 14px 16px;
  display: flex; align-items: flex-start; gap: 12px;
  background: ${({ $type }) => paymentBg($type)};
  border: ${({ $type }) => paymentBorder($type)};
`;

const PaymentIconWrap = styled.div<{ $type: string }>`
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: ${({ $type }) => paymentIconBg($type)};
  color: ${({ $type }) => paymentIconColor($type)};
`;

const PaymentInfo = styled.div`flex: 1; min-width: 0;`;

const PaymentTitle = styled.p<{ $type: string }>`
  font-size: 13px; font-weight: 700;
  color: ${({ $type }) => paymentTitleColor($type)};
`;

const PaymentDesc = styled.p`font-size: 12px; color: var(--color-text-muted); margin-top: 2px; line-height: 1.4;`;

const PaymentAmount = styled.span`
  font-size: 15px; font-weight: 800; color: var(--color-text); display: block; margin-top: 3px;
`;

const PixPayBtn = styled.button`
  width: 100%; height: 46px; border-radius: 12px; margin-top: 4px;
  background: var(--color-primary); color: #fff;
  font-size: 14px; font-weight: 700; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: opacity 0.2s;
  &:hover { opacity: 0.88; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(status: string, paymentStatus?: string | null): string {
  if (status === "confirmed" && paymentStatus === "paid") return "#22c55e";
  switch (status) {
    case "confirmed":        return "#3b82f6";
    case "completed":        return "var(--color-success)";
    case "cancelled":        return "var(--color-danger)";
    case "no_show":          return "#ef4444";
    case "awaiting_payment": return "#D97706";
    default:                 return "var(--color-text-muted)";
  }
}

function statusBg(status: string, paymentStatus?: string | null): string {
  if (status === "confirmed" && paymentStatus === "paid") return "rgba(34,197,94,0.12)";
  switch (status) {
    case "confirmed":        return "rgba(59,130,246,0.12)";
    case "completed":        return "rgba(34,197,94,0.12)";
    case "cancelled":        return "rgba(239,68,68,0.12)";
    case "no_show":          return "rgba(239,68,68,0.12)";
    case "awaiting_payment": return "rgba(217,119,6,0.12)";
    default:                 return "rgba(100,100,100,0.1)";
  }
}

function statusLabel(status: string, paymentStatus?: string | null): string {
  if (status === "confirmed" && paymentStatus === "paid") return "Confirmado ✓";
  switch (status) {
    case "confirmed":        return "Confirmado";
    case "pending":          return "Em análise";
    case "completed":        return "Concluído";
    case "cancelled":        return "Cancelado";
    case "no_show":          return "Não compareceu";
    case "awaiting_payment": return "Aguardando pagamento";
    default:                 return status;
  }
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const tz = "America/Sao_Paulo";
  return {
    date:      d.toLocaleDateString("pt-BR",  { timeZone: tz, weekday: "long",  day: "numeric", month: "long"  }),
    time:      d.toLocaleTimeString("pt-BR",  { timeZone: tz, hour: "2-digit",  minute: "2-digit" }),
    dateShort: d.toLocaleDateString("pt-BR",  { timeZone: tz, weekday: "short", day: "numeric", month: "short" }),
  };
}

function isUpcoming(iso: string): boolean {
  return new Date(iso) >= new Date();
}

function pixStillValid(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) > new Date();
}

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type PaymentType = "pending" | "paid" | "expired" | "none";

function getPaymentType(apt: AppointmentItem): PaymentType {
  if (!apt.payment_id && apt.status !== "awaiting_payment") return "none";
  if (apt.payment_status === "paid") return "paid";
  if (apt.status === "awaiting_payment" && pixStillValid(apt.payment_expires_at)) return "pending";
  if (apt.status === "awaiting_payment") return "expired";
  return "none";
}

// ─── Bottom Sheet Component ───────────────────────────────────────────────────

function AppointmentDetail({
  apt,
  onClose,
  onPay,
}: {
  apt: AppointmentItem;
  onClose: () => void;
  onPay: () => void;
}) {
  const { date, time } = formatDateTime(apt.start_at);
  const payType = getPaymentType(apt);
  const isPaidStatus = apt.status === "confirmed" && apt.payment_status === "paid";

  return (
    <Overlay onClick={onClose}>
      <Sheet onClick={(e) => e.stopPropagation()}>
        <SheetHeader>
          <SheetHeaderLeft>
            <SheetTag>Detalhes do agendamento</SheetTag>
            <SheetServiceName>{apt.services?.name ?? "Serviço"}</SheetServiceName>
          </SheetHeaderLeft>
          <SheetCloseBtn type="button" onClick={onClose}>
            <X size={14} weight="bold" />
          </SheetCloseBtn>
        </SheetHeader>

        <SheetBody>
          {/* Status badge */}
          <div>
            <StatusBadge
              $status={apt.status}
              $paid={isPaidStatus}
              style={{ fontSize: 11, padding: "4px 10px" }}
            >
              {statusLabel(apt.status, apt.payment_status)}
            </StatusBadge>
          </div>

          <Divider />

          {/* Info rows */}
          <InfoRow>
            <InfoIcon><CalendarBlank size={15} weight="fill" /></InfoIcon>
            <div>
              <InfoLabel>Data</InfoLabel>
              <InfoValue style={{ textTransform: "capitalize" }}>{date}</InfoValue>
            </div>
          </InfoRow>

          <InfoRow>
            <InfoIcon><Clock size={15} weight="fill" /></InfoIcon>
            <div>
              <InfoLabel>Horário</InfoLabel>
              <InfoValue>
                {time}
                {apt.services?.duration_min ? ` · ${apt.services.duration_min} min` : ""}
              </InfoValue>
            </div>
          </InfoRow>

          {apt.professionals?.name && (
            <InfoRow>
              <InfoIcon><User size={15} weight="fill" /></InfoIcon>
              <div>
                <InfoLabel>Profissional</InfoLabel>
                <InfoValue>{apt.professionals.name}</InfoValue>
              </div>
            </InfoRow>
          )}

          {apt.services?.price_cents && (
            <InfoRow>
              <InfoIcon><CurrencyCircleDollar size={15} weight="fill" /></InfoIcon>
              <div>
                <InfoLabel>Valor do serviço</InfoLabel>
                <InfoValue>{formatPrice(apt.services.price_cents)}</InfoValue>
              </div>
            </InfoRow>
          )}

          {apt.notes && (
            <InfoRow>
              <InfoIcon><DotsThree size={15} weight="fill" /></InfoIcon>
              <div>
                <InfoLabel>Observações</InfoLabel>
                <InfoValue>{apt.notes}</InfoValue>
              </div>
            </InfoRow>
          )}

          <Divider />

          {/* Payment status card */}
          {payType !== "none" && (
            <>
              <PaymentCard $type={payType}>
                <PaymentIconWrap $type={payType}>
                  {payType === "paid"    && <CheckCircle size={20} weight="fill" />}
                  {payType === "pending" && <QrCode size={20} weight="fill" />}
                  {payType === "expired" && <Warning size={20} weight="fill" />}
                </PaymentIconWrap>
                <PaymentInfo>
                  {payType === "paid" && (
                    <>
                      <PaymentTitle $type="paid">Pagamento PIX confirmado</PaymentTitle>
                      <PaymentDesc>O estabelecimento confirmou o recebimento.</PaymentDesc>
                      {apt.payment_amount_cents && (
                        <PaymentAmount>{formatPrice(apt.payment_amount_cents)}</PaymentAmount>
                      )}
                    </>
                  )}
                  {payType === "pending" && (
                    <>
                      <PaymentTitle $type="pending">Pagamento PIX pendente</PaymentTitle>
                      <PaymentDesc>
                        Aguardando confirmação do estabelecimento após seu pagamento.
                      </PaymentDesc>
                      {apt.payment_amount_cents && (
                        <PaymentAmount>{formatPrice(apt.payment_amount_cents)}</PaymentAmount>
                      )}
                    </>
                  )}
                  {payType === "expired" && (
                    <>
                      <PaymentTitle $type="expired">PIX expirado</PaymentTitle>
                      <PaymentDesc>O tempo para pagamento esgotou. O horário foi liberado.</PaymentDesc>
                    </>
                  )}
                </PaymentInfo>
              </PaymentCard>

              {payType === "pending" && (
                <PixPayBtn type="button" onClick={onPay}>
                  <QrCode size={16} weight="bold" />
                  Abrir QR Code PIX
                </PixPayBtn>
              )}
            </>
          )}

          {/* Appointment confirmed without PIX */}
          {payType === "none" && apt.status === "confirmed" && (
            <PaymentCard $type="none">
              <PaymentIconWrap $type="none">
                <CheckCircle size={20} weight="fill" />
              </PaymentIconWrap>
              <PaymentInfo>
                <PaymentTitle $type="none">Agendamento confirmado</PaymentTitle>
                <PaymentDesc>Seu agendamento está confirmado. Até lá!</PaymentDesc>
              </PaymentInfo>
            </PaymentCard>
          )}
        </SheetBody>
      </Sheet>
    </Overlay>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MyAppointmentsScreen({ phone, businessId, token, business, onBack }: Props) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pixApt, setPixApt] = useState<AppointmentItem | null>(null);
  const [selectedApt, setSelectedApt] = useState<AppointmentItem | null>(null);

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

  if (pixApt) {
    return (
      <StepPayment
        appointmentId={pixApt.id}
        amountCents={pixApt.payment_amount_cents ?? 0}
        businessId={businessId}
        onSuccess={() => {
          setAppointments((prev) =>
            prev.map((a) => a.id === pixApt.id ? { ...a, status: "confirmed", payment_status: "paid" } : a)
          );
          setPixApt(null);
        }}
        onRetry={() => setPixApt(null)}
      />
    );
  }

  const upcoming = appointments.filter((a) => isUpcoming(a.start_at) && a.status !== "cancelled");
  const past = appointments.filter((a) => !isUpcoming(a.start_at) || a.status === "cancelled");

  function renderCard(a: AppointmentItem) {
    const { dateShort, time } = formatDateTime(a.start_at);
    const isPaidStatus = a.status === "confirmed" && a.payment_status === "paid";
    const hasPendingPix = a.status === "awaiting_payment" && a.payment_status === "awaiting" && pixStillValid(a.payment_expires_at);

    return (
      <AppointmentCard
        key={a.id}
        $status={a.status}
        onClick={() => setSelectedApt(a)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setSelectedApt(a)}
      >
        {hasPendingPix && <PixDot title="Pagamento PIX pendente" />}
        <CardMain>
          <CardTop>
            <ServiceBlock>
              <ServiceLabel>Serviço</ServiceLabel>
              <ServiceName>{a.services?.name ?? "—"}</ServiceName>
            </ServiceBlock>
            <StatusBadge $status={a.status} $paid={isPaidStatus}>
              {statusLabel(a.status, a.payment_status)}
            </StatusBadge>
          </CardTop>
          <CardMeta>
            <MetaItem>
              <CalendarBlank size={11} />
              <span style={{ textTransform: "capitalize" }}>{dateShort}</span>
            </MetaItem>
            <MetaItem><Clock size={11} />{time}</MetaItem>
            {a.professionals?.name && (
              <MetaItem><User size={11} />{a.professionals.name}</MetaItem>
            )}
          </CardMeta>
        </CardMain>
        <ChevronWrap><CaretRight size={14} /></ChevronWrap>
      </AppointmentCard>
    );
  }

  return (
    <Container>
      <BackButton onClick={onBack} type="button">
        <ArrowLeft size={16} /> Voltar
      </BackButton>

      <Title>Meus agendamentos</Title>
      <Subtitle>{business.name}</Subtitle>

      {loading && (
        <LoadingWrapper>
          <SpinIcon><Hourglass size={28} weight="fill" /></SpinIcon>
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
              {upcoming.map(renderCard)}
            </>
          )}
          {past.length > 0 && (
            <>
              <SectionLabel>Histórico</SectionLabel>
              {past.map(renderCard)}
            </>
          )}
        </List>
      )}

      {selectedApt && (
        <AppointmentDetail
          apt={selectedApt}
          onClose={() => setSelectedApt(null)}
          onPay={() => {
            setPixApt(selectedApt);
            setSelectedApt(null);
          }}
        />
      )}
    </Container>
  );
}
