"use client";

import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  CalendarCheck,
  CalendarBlank,
  ChartLine,
  CheckCircle,
  Clock,
  User,
  Scissors,
  X,
  HandWaving,
  WhatsappLogo,
  Phone,
  CurrencyDollar,
  Note,
} from "@phosphor-icons/react";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useBusiness } from "../BusinessContext";
import type { AppointmentWithRelations } from "@/types/database";
import Spinner from "@/components/ui/Spinner";

// ─── Utils ────────────────────────────────────────────────────────────────────

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function getTodayDate() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function getStatusLabel(status: string) {
  if (status === "confirmed") return "Confirmado";
  if (status === "pending") return "Pendente";
  if (status === "completed") return "Pago";
  if (status === "cancelled") return "Cancelado";
  return status;
}

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  padding: 32px;
  max-width: 1100px;
  animation: ${fadeUp} 0.3s ease both;

  @media (max-width: 640px) {
    padding: 20px 16px;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 28px;
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.4px;
  margin-bottom: 4px;
`;

const PageSubtitle = styled.p`
  font-size: 13.5px;
  color: var(--color-text-muted);
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const MetricCardWrapper = styled.div<{ $index: number }>`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: ${fadeUp} 0.3s ease both;
  animation-delay: ${({ $index }) => $index * 0.07}s;
  transition: border-color 0.15s ease, transform 0.15s ease;

  &:hover {
    border-color: #3a3a3a;
    transform: translateY(-2px);
  }
`;

const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const MetricLabel = styled.span`
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetricIconWrapper = styled.div<{ $color: string }>`
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  background: ${({ $color }) => `${$color}18`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color};
`;

const MetricValue = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -1px;
  line-height: 1;
`;

const MetricSubtext = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;

  svg { color: var(--color-primary); }
`;

const AppointmentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AppointmentItem = styled.div<{ $index: number }>`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  animation: ${fadeUp} 0.3s ease both;
  animation-delay: ${({ $index }) => 0.25 + $index * 0.05}s;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
  cursor: pointer;

  &:hover {
    border-color: var(--color-primary);
    transform: translateX(2px);
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  }

  @media (max-width: 640px) {
    flex-wrap: wrap;
    gap: 10px;
  }
`;

// ─── Detail Modal Styled ──────────────────────────────────────────────────────

const DetailGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child { border-bottom: none; }
`;

const DetailIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  flex-shrink: 0;
  margin-top: 1px;
`;

const DetailContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const DetailLabel = styled.p`
  font-size: 11.5px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 2px;
`;

const DetailValue = styled.p`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
`;

const DetailPriceValue = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.3px;
`;

const TimeBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 64px;
  color: var(--color-text-muted);

  span {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
  }
`;

const AppointmentInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ClientName = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AppointmentMeta = styled.p`
  font-size: 12.5px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 2px;

  svg { flex-shrink: 0; }
`;

const MetaDot = styled.span`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--color-border);
  display: inline-block;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 11.5px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 99px;
  flex-shrink: 0;
  background: ${({ $status }) => {
    if ($status === "confirmed") return "rgba(249, 115, 22, 0.1)";
    if ($status === "completed") return "rgba(34, 197, 94, 0.1)";
    if ($status === "cancelled") return "rgba(239, 68, 68, 0.1)";
    return "rgba(161, 161, 170, 0.1)";
  }};
  color: ${({ $status }) => {
    if ($status === "confirmed") return "var(--color-primary)";
    if ($status === "completed") return "var(--color-success)";
    if ($status === "cancelled") return "var(--color-danger)";
    return "var(--color-text-muted)";
  }};
  border: 1px solid ${({ $status }) => {
    if ($status === "confirmed") return "rgba(249, 115, 22, 0.2)";
    if ($status === "completed") return "rgba(34, 197, 94, 0.2)";
    if ($status === "cancelled") return "rgba(239, 68, 68, 0.2)";
    return "rgba(161, 161, 170, 0.2)";
  }};
`;

const LoadingCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px;
`;

const EmptyText = styled.p`
  font-size: 13.5px;
  color: var(--color-text-muted);
  padding: 24px 0;
`;

const WelcomeBanner = styled.div`
  background: linear-gradient(135deg, rgba(249,115,22,0.07) 0%, rgba(249,115,22,0.03) 100%);
  border: 1px solid rgba(249,115,22,0.18);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  margin-bottom: 28px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

const WelcomeIconWrap = styled.div`
  width: 40px;
  height: 40px;
  background: rgba(249,115,22,0.12);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  flex-shrink: 0;
`;

const WelcomeBody = styled.div`flex: 1; min-width: 0;`;

const WelcomeTitle = styled.p`
  font-size: 14.5px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
`;

const WelcomeText = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.55;
`;

const WelcomeContact = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-primary);
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  background: rgba(249,115,22,0.08);
  border: 1px solid rgba(249,115,22,0.15);

  &:hover { background: rgba(249,115,22,0.14); }
`;

const WelcomeClose = styled.button`
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover { background: var(--color-surface-2); color: var(--color-text); }
`;

// ─── Component ────────────────────────────────────────────────────────────────

const WELCOME_KEY = "mj_welcome_dismissed";

const statusMap: Record<string, { label: string; variant: "success" | "orange" | "default" | "danger" | "warning" }> = {
  confirmed: { label: "Confirmado", variant: "orange" },
  pending:   { label: "Pendente",   variant: "default" },
  completed: { label: "Pago",       variant: "success" },
  cancelled: { label: "Cancelado",  variant: "danger" },
  no_show:   { label: "Faltou",     variant: "warning" },
};

export default function OverviewPage() {
  const { business, loading: bizLoading } = useBusiness();
  const [todayApts, setTodayApts] = useState<AppointmentWithRelations[]>([]);
  const [counts, setCounts] = useState({ today: 0, week: 0, month: 0, attendance: 0 });
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [detailApt, setDetailApt] = useState<AppointmentWithRelations | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(WELCOME_KEY)) setShowWelcome(true);
  }, []);

  function dismissWelcome() {
    localStorage.setItem(WELCOME_KEY, "1");
    setShowWelcome(false);
  }

  useEffect(() => {
    if (!business) return;

    async function load() {
      const supabase = getSupabaseClient();
      const { start: todayStart, end: todayEnd } = getTodayRange();
      const { start: weekStart, end: weekEnd } = getWeekRange();
      const { start: monthStart, end: monthEnd } = getMonthRange();

      const [todayRes, weekRes, monthRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("*, service:services(*), professional:professionals(*)")
          .eq("business_id", business!.id)
          .gte("start_at", todayStart)
          .lte("start_at", todayEnd)
          .neq("status", "cancelled")
          .order("start_at"),
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("business_id", business!.id)
          .gte("start_at", weekStart)
          .lte("start_at", weekEnd)
          .neq("status", "cancelled"),
        supabase
          .from("appointments")
          .select("id, status", { count: "exact" })
          .eq("business_id", business!.id)
          .gte("start_at", monthStart)
          .lte("start_at", monthEnd)
          .neq("status", "cancelled"),
      ]);

      const monthData = monthRes.data ?? [];
      const completed = monthData.filter((a) => a.status === "completed").length;
      const attendance = monthData.length > 0
        ? Math.round((completed / monthData.length) * 100)
        : 0;

      setTodayApts((todayRes.data as AppointmentWithRelations[]) ?? []);
      setCounts({
        today: todayRes.data?.length ?? 0,
        week: weekRes.count ?? 0,
        month: monthRes.count ?? 0,
        attendance,
      });
      setLoading(false);
    }

    load();
  }, [business]);

  if (bizLoading || loading) {
    return <LoadingCenter><Spinner size="lg" /></LoadingCenter>;
  }

  const METRIC_CARDS = [
    { label: "Hoje", value: String(counts.today), subtext: "agendamentos", icon: CalendarCheck, color: "var(--color-primary)" },
    { label: "Esta Semana", value: String(counts.week), subtext: "agendamentos", icon: CalendarBlank, color: "#818CF8" },
    { label: "Este Mês", value: String(counts.month), subtext: "agendamentos", icon: ChartLine, color: "#34D399" },
    { label: "Comparecimento", value: `${counts.attendance}%`, subtext: "dos agendamentos", icon: CheckCircle, color: "var(--color-success)" },
  ];

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>Visão Geral</PageTitle>
        <PageSubtitle>{getTodayDate()}</PageSubtitle>
      </PageHeader>

      {showWelcome && (
        <WelcomeBanner>
          <WelcomeIconWrap>
            <HandWaving size={20} weight="fill" />
          </WelcomeIconWrap>
          <WelcomeBody>
            <WelcomeTitle>
              Bem-vindo ao Marque Já{business ? `, ${business.name}` : ""}!
            </WelcomeTitle>
            <WelcomeText>
              Seu sistema de agendamento online está configurado e pronto para receber clientes.
              Aqui você acompanha sua agenda, gerencia serviços, profissionais e bloqueios.
              <br />Em caso de dúvidas ou solicitações de alteração, entre em contato com a <strong>Conecta Leste SP</strong>.
            </WelcomeText>
            <WelcomeContact
              href="https://wa.me/5511999999999?text=Olá!%20Preciso%20de%20ajuda%20com%20o%20Marque%20Já"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsappLogo size={14} weight="fill" />
              Falar com a Conecta Leste SP
            </WelcomeContact>
          </WelcomeBody>
          <WelcomeClose onClick={dismissWelcome} title="Fechar">
            <X size={15} weight="bold" />
          </WelcomeClose>
        </WelcomeBanner>
      )}

      <MetricsGrid>
        {METRIC_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <MetricCardWrapper key={card.label} $index={i}>
              <MetricHeader>
                <MetricLabel>{card.label}</MetricLabel>
                <MetricIconWrapper $color={card.color}>
                  <Icon size={18} weight="fill" />
                </MetricIconWrapper>
              </MetricHeader>
              <div>
                <MetricValue>{card.value}</MetricValue>
                <MetricSubtext>{card.subtext}</MetricSubtext>
              </div>
            </MetricCardWrapper>
          );
        })}
      </MetricsGrid>

      <SectionTitle>
        <Clock size={18} weight="fill" />
        Agendamentos de Hoje
      </SectionTitle>

      {todayApts.length === 0 ? (
        <EmptyText>Nenhum agendamento para hoje.</EmptyText>
      ) : (
        <AppointmentList>
          {todayApts.map((apt, i) => {
            const time = new Date(apt.start_at).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <AppointmentItem key={apt.id} $index={i} onClick={() => setDetailApt(apt)}>
                <TimeBlock>
                  <Clock size={14} />
                  <span>{time}</span>
                </TimeBlock>
                <AppointmentInfo>
                  <ClientName>{apt.client_name}</ClientName>
                  <AppointmentMeta>
                    {apt.service && <><Scissors size={12} />{apt.service.name}</>}
                    {apt.professional && <><MetaDot /><User size={12} />{apt.professional.name}</>}
                  </AppointmentMeta>
                </AppointmentInfo>
                <StatusBadge $status={apt.status}>
                  {getStatusLabel(apt.status)}
                </StatusBadge>
              </AppointmentItem>
            );
          })}
        </AppointmentList>
      )}

      {/* ─── Detail Modal ───────────────────────────────────────────────────── */}
      {detailApt && (() => {
        const apt = detailApt;
        const startDate = new Date(apt.start_at);
        const dateStr = startDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        const timeStr = startDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        const s = statusMap[apt.status] ?? statusMap.pending;
        return (
          <Modal
            open={!!detailApt}
            onClose={() => setDetailApt(null)}
            title="Detalhes do Agendamento"
            size="md"
            footer={
              <button
                onClick={() => setDetailApt(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                  border: "1px solid var(--color-border)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Fechar
              </button>
            }
          >
            <DetailGrid>
              <DetailRow>
                <DetailIcon><User size={16} weight="fill" /></DetailIcon>
                <DetailContent>
                  <DetailLabel>Cliente</DetailLabel>
                  <DetailValue>{apt.client_name}</DetailValue>
                </DetailContent>
              </DetailRow>

              {apt.client_phone && (
                <DetailRow>
                  <DetailIcon><Phone size={16} weight="fill" /></DetailIcon>
                  <DetailContent>
                    <DetailLabel>Telefone</DetailLabel>
                    <DetailValue>{apt.client_phone}</DetailValue>
                  </DetailContent>
                </DetailRow>
              )}

              <DetailRow>
                <DetailIcon><CalendarCheck size={16} weight="fill" /></DetailIcon>
                <DetailContent>
                  <DetailLabel>Data do agendamento</DetailLabel>
                  <DetailValue style={{ textTransform: "capitalize" }}>{dateStr}</DetailValue>
                </DetailContent>
              </DetailRow>

              <DetailRow>
                <DetailIcon><Clock size={16} weight="fill" /></DetailIcon>
                <DetailContent>
                  <DetailLabel>Horário</DetailLabel>
                  <DetailValue>
                    {timeStr}
                    {apt.service?.duration_min ? ` · ${apt.service.duration_min} min` : ""}
                  </DetailValue>
                </DetailContent>
              </DetailRow>

              {apt.service && (
                <DetailRow>
                  <DetailIcon><Scissors size={16} weight="fill" /></DetailIcon>
                  <DetailContent>
                    <DetailLabel>Serviço</DetailLabel>
                    <DetailValue>{apt.service.name}</DetailValue>
                  </DetailContent>
                </DetailRow>
              )}

              {apt.professional && (
                <DetailRow>
                  <DetailIcon><User size={16} weight="fill" /></DetailIcon>
                  <DetailContent>
                    <DetailLabel>Profissional</DetailLabel>
                    <DetailValue>{apt.professional.name}</DetailValue>
                  </DetailContent>
                </DetailRow>
              )}

              {apt.service && (
                <DetailRow>
                  <DetailIcon><CurrencyDollar size={16} weight="fill" /></DetailIcon>
                  <DetailContent>
                    <DetailLabel>Valor</DetailLabel>
                    <DetailPriceValue>
                      {(apt.service.price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </DetailPriceValue>
                  </DetailContent>
                </DetailRow>
              )}

              <DetailRow>
                <DetailIcon>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor" }} />
                </DetailIcon>
                <DetailContent>
                  <DetailLabel>Status</DetailLabel>
                  <div style={{ marginTop: 4 }}>
                    <Badge variant={s.variant} dot>{s.label}</Badge>
                  </div>
                </DetailContent>
              </DetailRow>

              {apt.notes && (
                <DetailRow>
                  <DetailIcon><Note size={16} weight="fill" /></DetailIcon>
                  <DetailContent>
                    <DetailLabel>Observações</DetailLabel>
                    <DetailValue>{apt.notes}</DetailValue>
                  </DetailContent>
                </DetailRow>
              )}

              <DetailRow>
                <DetailIcon><Clock size={14} /></DetailIcon>
                <DetailContent>
                  <DetailLabel>Agendado em</DetailLabel>
                  <DetailValue>
                    {apt.created_at
                      ? new Date(apt.created_at).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
                      : "—"}
                  </DetailValue>
                </DetailContent>
              </DetailRow>
            </DetailGrid>
          </Modal>
        );
      })()}
    </PageWrapper>
  );
}
