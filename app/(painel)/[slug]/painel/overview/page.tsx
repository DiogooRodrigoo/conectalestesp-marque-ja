"use client";

import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  Clock,
  User,
  Tag,
  X,
  HandWaving,
  WhatsappLogo,
  Phone,
  CurrencyDollar,
  Note,
  CalendarCheck,
  CalendarBlank,
  ChartBar,
  CheckCircle,
  Users,
  MagnifyingGlass,
  Bell,
} from "@phosphor-icons/react";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useBusiness } from "../BusinessContext";
import type { AppointmentWithRelations } from "@/types/database";
import Spinner from "@/components/ui/Spinner";
import WeekBarChart from "@/components/ui/WeekBarChart";
import AttendanceGauge from "@/components/ui/AttendanceGauge";

// ─── Utils ────────────────────────────────────────────────────────────────────

function getTodayRange() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function getWeekRange() {
  const now  = new Date();
  const day  = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function getMonthRange() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function getLastNDaysRange(n: number) {
  const end   = new Date(); end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - (n - 1));
  start.setHours(0, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

function getTodayDate() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo",
  });
}

function getStatusLabel(status: string, paymentStatus?: string | null) {
  if (status === "awaiting_payment") return "Aguard. PIX";
  if (status === "confirmed" && paymentStatus === "paid") return "PIX Pago";
  const map: Record<string, string> = {
    confirmed: "Confirmado", pending: "Pendente",
    completed: "Concluído",  cancelled: "Cancelado",
    no_show: "Faltou",
  };
  return map[status] ?? status;
}

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─── Glass card base ──────────────────────────────────────────────────────────

const GlassCard = styled.div<{ $delay?: number }>`
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-card);
  animation: ${fadeUp} 0.35s ease both;
  animation-delay: ${({ $delay }) => ($delay ?? 0)}s;
  transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s cubic-bezier(0.4,0,0.2,1);

  &:hover {
    transform: translateY(-6px) scale(1.005);
    box-shadow: var(--shadow-card-hover);
  }
`;

// ─── Page layout ──────────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  padding: 32px 32px 32px;
  animation: ${fadeUp} 0.3s ease both;

  @media (max-width: 640px) { padding: 20px 16px; }
`;

// ─── Header ───────────────────────────────────────────────────────────────────

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
`;

const HeaderLeft = styled.div``;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.6px;
  line-height: 1.15;
  margin-bottom: 4px;
`;

const PageSubtitle = styled.p`
  font-size: 13.5px;
  color: var(--color-text-muted);
  text-transform: capitalize;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  @media (max-width: 640px) { display: none; }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 280px;
  height: 44px;
  background: rgba(255, 255, 255, 0.70);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 14px;
  padding: 0 14px;
  color: var(--color-text-muted);
  font-size: 13px;

  [data-theme="dark"] & {
    background: rgba(30, 30, 36, 0.75);
    border-color: rgba(255, 255, 255, 0.08);
  }

  input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 13px;
    color: var(--color-text);
    &::placeholder { color: var(--color-text-muted); }
  }
`;

const NotifBtn = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.70);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  transition: background 0.15s, color 0.15s;

  [data-theme="dark"] & {
    background: rgba(30, 30, 36, 0.75);
    border-color: rgba(255, 255, 255, 0.08);
  }

  &:hover {
    background: rgba(249, 115, 22, 0.10);
    color: var(--color-primary);
    border-color: rgba(249, 115, 22, 0.20);
  }
`;

// ─── Metrics grid ─────────────────────────────────────────────────────────────

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px)  { grid-template-columns: 1fr; }
`;

const MetricCard = styled(GlassCard)`
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--gradient-primary);
    border-radius: 3px 0 0 3px;
  }
`;

const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const MetricLabel = styled.span`
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

const MetricIconBox = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(249,115,22,0.10);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MetricValue = styled.div`
  font-size: 30px;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -1.2px;
  line-height: 1;
`;

const MetricSubtext = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 3px;
`;

// ─── Widgets row ──────────────────────────────────────────────────────────────

const WidgetsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const WidgetCard = styled(GlassCard)`
  padding: 24px;
`;

const WidgetTitle = styled.h2`
  font-size: 15px;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.3px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

// ─── Section ──────────────────────────────────────────────────────────────────

const SectionTitle = styled.h2`
  font-size: 15px;
  font-weight: 800;
  color: var(--color-text);
  margin-bottom: 14px;
  letter-spacing: -0.3px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AppointmentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AppointmentItem = styled(GlassCard)<{ $index: number }>`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation-delay: ${({ $index }) => 0.3 + $index * 0.05}s;
  cursor: pointer;

  &:hover { background: rgba(255,255,255,0.85); }

  @media (max-width: 640px) { gap: 8px; padding: 10px 12px; }
`;

// ─── Detail Modal ─────────────────────────────────────────────────────────────

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
  background: rgba(249,115,22,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 1px;
`;

const DetailContent  = styled.div`flex: 1; min-width: 0;`;
const DetailLabel    = styled.p`font-size: 11.5px; font-weight: 500; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 2px;`;
const DetailValue    = styled.p`font-size: 14px; font-weight: 500; color: var(--color-text);`;
const DetailPriceVal = styled.p`font-size: 16px; font-weight: 700; color: var(--color-text); letter-spacing: -0.3px;`;

const TimeBlock = styled.div`
  min-width: 42px;
  font-size: 14px;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: -0.3px;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  @media (max-width: 400px) { font-size: 12px; min-width: 36px; }
`;

const ApptAvatar = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(249,115,22,0.12);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const StatusDotWrap = styled.div`display: flex; align-items: center; gap: 5px; flex-shrink: 0;`;

const StatusDot = styled.div<{ $status: string; $paid?: boolean }>`
  width: 6px; height: 6px; border-radius: 50%;
  background: ${({ $status, $paid }) => {
    if ($status === "completed") return "#16A34A";
    if ($status === "confirmed") return $paid ? "#16A34A" : "var(--color-primary)";
    if ($status === "cancelled") return "#DC2626";
    if ($status === "no_show")   return "#EF4444";
    if ($status === "awaiting_payment") return "#D97706";
    return "#94A3B8";
  }};
`;

const StatusText = styled.span<{ $status: string; $paid?: boolean }>`
  font-size: 11px; font-weight: 700;
  color: ${({ $status, $paid }) => {
    if ($status === "completed") return "#16A34A";
    if ($status === "confirmed") return $paid ? "#16A34A" : "var(--color-primary)";
    if ($status === "cancelled") return "#DC2626";
    if ($status === "no_show")   return "#EF4444";
    if ($status === "awaiting_payment") return "#D97706";
    return "#94A3B8";
  }};
  @media (max-width: 400px) { display: none; }
`;

const AppointmentInfo = styled.div`flex: 1; min-width: 0;`;

const ClientName = styled.p`
  font-size: 14px; font-weight: 600; color: var(--color-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const AppointmentMeta = styled.p`
  font-size: 12.5px; color: var(--color-text-muted);
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 2px;
  svg { flex-shrink: 0; }
`;

const MetaDot = styled.span`
  width: 3px; height: 3px; border-radius: 50%;
  background: var(--color-border); display: inline-block;
`;

const PixConfirmBtn = styled.button`
  height: 28px; padding: 0 10px; border-radius: 8px; flex-shrink: 0;
  background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.35);
  color: #F97316; font-size: 11px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; gap: 4px;
  transition: background 0.15s, border-color 0.15s;
  &:hover { background: rgba(249,115,22,0.18); border-color: rgba(249,115,22,0.6); }
`;

const LoadingCenter = styled.div`
  display: flex; align-items: center; justify-content: center; padding: 80px;
`;

const EmptyText = styled.p`
  font-size: 13.5px; color: var(--color-text-muted); padding: 24px 0;
`;

// ─── Welcome banner ───────────────────────────────────────────────────────────

const WelcomeBanner = styled(GlassCard)`
  padding: 20px 24px;
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  border-left: 3px solid var(--color-primary);
  box-shadow: var(--shadow-card);
`;

const WelcomeIconWrap = styled.div`
  width: 40px; height: 40px;
  background: rgba(249,115,22,0.12);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-primary); flex-shrink: 0;
`;

const WelcomeBody  = styled.div`flex: 1; min-width: 0;`;
const WelcomeTitle = styled.p`font-size: 14.5px; font-weight: 700; color: var(--color-text); margin-bottom: 4px;`;
const WelcomeText  = styled.p`font-size: 13px; color: var(--color-text-muted); line-height: 1.55;`;

const WelcomeContact = styled.a`
  display: inline-flex; align-items: center; gap: 5px;
  margin-top: 10px; font-size: 12.5px; font-weight: 600;
  color: var(--color-primary);
  padding: 5px 10px; border-radius: var(--radius-sm);
  background: rgba(249,115,22,0.08);
  border: 1px solid rgba(249,115,22,0.15);
  &:hover { background: rgba(249,115,22,0.14); }
`;

const WelcomeClose = styled.button`
  width: 28px; height: 28px; border-radius: var(--radius-sm);
  color: var(--color-text-muted); display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
  &:hover { background: rgba(0,0,0,0.06); color: var(--color-text); }
`;

// ─── Component ────────────────────────────────────────────────────────────────

const WELCOME_KEY = "mj_welcome_dismissed";

const statusMap: Record<string, { label: string; variant: "success" | "orange" | "default" | "danger" | "warning" | "blue" }> = {
  confirmed:        { label: "Confirmado",      variant: "blue"    },
  confirmed_paid:   { label: "PIX Confirmado",  variant: "success" },
  pending:          { label: "Pendente",        variant: "default" },
  completed:        { label: "Concluído",       variant: "success" },
  cancelled:        { label: "Cancelado",       variant: "danger"  },
  no_show:          { label: "Não Compareceu",  variant: "danger"  },
  awaiting_payment: { label: "Aguardando PIX",  variant: "warning" },
};

function getStatusMapEntry(status: string, paymentStatus?: string | null) {
  if (status === "confirmed" && paymentStatus === "paid") return statusMap.confirmed_paid;
  return statusMap[status] ?? statusMap.pending;
}

export default function OverviewPage() {
  const { business, loading: bizLoading } = useBusiness();
  const [todayApts,  setTodayApts]  = useState<AppointmentWithRelations[]>([]);
  const [counts,     setCounts]     = useState({ today: 0, week: 0, month: 0, attendance: 0 });
  const [weekData,   setWeekData]   = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [loading,    setLoading]    = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [detailApt,  setDetailApt]  = useState<AppointmentWithRelations | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(WELCOME_KEY)) setShowWelcome(true);
  }, []);

  function dismissWelcome() {
    localStorage.setItem(WELCOME_KEY, "1");
    setShowWelcome(false);
  }

  async function confirmPixPayment(aptId: string) {
    const res = await fetch("/api/payments/pix/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointment_id: aptId }),
    });
    if (!res.ok) return;
    setTodayApts((prev) =>
      prev.map((a) => a.id === aptId ? { ...a, status: "confirmed", payment_status: "paid" } as typeof a : a)
    );
    setDetailApt((prev) => prev?.id === aptId ? { ...prev, status: "confirmed", payment_status: "paid" } as typeof prev : prev);
  }

  useEffect(() => {
    if (!business) return;

    async function load() {
      const supabase = getSupabaseClient();
      const { start: todayStart, end: todayEnd } = getTodayRange();
      const { start: weekStart,  end: weekEnd  } = getWeekRange();
      const { start: monthStart, end: monthEnd } = getMonthRange();
      const { start: last7Start, end: last7End } = getLastNDaysRange(7);

      const [todayRes, weekRes, monthRes, last7Res] = await Promise.all([
        supabase
          .from("appointments")
          .select("*, service:services(*), professional:professionals(*), payment_status, payment_amount_cents")
          .eq("business_id", business!.id)
          .gte("start_at", todayStart).lte("start_at", todayEnd)
          .neq("status", "cancelled").order("start_at"),
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("business_id", business!.id)
          .gte("start_at", weekStart).lte("start_at", weekEnd)
          .neq("status", "cancelled"),
        supabase
          .from("appointments")
          .select("id, status", { count: "exact" })
          .eq("business_id", business!.id)
          .gte("start_at", monthStart).lte("start_at", monthEnd)
          .neq("status", "cancelled"),
        supabase
          .from("appointments")
          .select("start_at")
          .eq("business_id", business!.id)
          .gte("start_at", last7Start).lte("start_at", last7End)
          .neq("status", "cancelled"),
      ]);

      // Build 7-day bar data
      const counts7 = [0, 0, 0, 0, 0, 0, 0];
      const now = new Date();
      (last7Res.data ?? []).forEach((apt) => {
        const d = new Date(apt.start_at);
        const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
        if (diff >= 0 && diff < 7) counts7[6 - diff]++;
      });

      const monthData  = monthRes.data ?? [];
      const completed  = monthData.filter((a) => a.status === "completed").length;
      const attendance = monthData.length > 0
        ? Math.round((completed / monthData.length) * 100)
        : 0;

      setTodayApts((todayRes.data as AppointmentWithRelations[]) ?? []);
      setCounts({
        today:      todayRes.data?.length ?? 0,
        week:       weekRes.count ?? 0,
        month:      monthRes.count ?? 0,
        attendance,
      });
      setWeekData(counts7);
      setLoading(false);
    }

    load();
  }, [business]);

  if (bizLoading || loading) {
    return <LoadingCenter><Spinner size="lg" /></LoadingCenter>;
  }

  const METRIC_CARDS = [
    { label: "Hoje",           value: String(counts.today),     subtext: "agendamentos", icon: CalendarBlank },
    { label: "Esta Semana",    value: String(counts.week),      subtext: "agendamentos", icon: ChartBar },
    { label: "Este Mês",       value: String(counts.month),     subtext: "agendamentos", icon: CheckCircle },
    { label: "Comparecimento", value: `${counts.attendance}%`,  subtext: "dos agendamentos", icon: Users },
  ];

  return (
    <PageWrapper>

      {/* ── Header ── */}
      <PageHeader>
        <HeaderLeft>
          <PageTitle>Visão Geral</PageTitle>
          <PageSubtitle>{getTodayDate()}</PageSubtitle>
        </HeaderLeft>
        <HeaderRight>
          <SearchBar>
            <MagnifyingGlass size={16} />
            <input placeholder="Buscar agendamento..." />
          </SearchBar>
          <NotifBtn aria-label="Notificações">
            <Bell size={20} />
          </NotifBtn>
        </HeaderRight>
      </PageHeader>

      {/* ── Welcome banner ── */}
      {showWelcome && (
        <WelcomeBanner>
          <WelcomeIconWrap><HandWaving size={20} weight="fill" /></WelcomeIconWrap>
          <WelcomeBody>
            <WelcomeTitle>
              Bem-vindo ao Marque Já{business ? `, ${business.name}` : ""}!
            </WelcomeTitle>
            <WelcomeText>
              Seu sistema de agendamento online está configurado e pronto para receber clientes.
              Aqui você acompanha sua agenda, gerencia serviços, profissionais e bloqueios.
              <br />Em caso de dúvidas ou solicitações, entre em contato com a{" "}
              <strong>{process.env.NEXT_PUBLIC_SUPPORT_NAME ?? "nossa equipe"}</strong>.
            </WelcomeText>
            <WelcomeContact
              href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "5511999999999"}?text=Olá!%20Preciso%20de%20ajuda%20com%20o%20Marque%20Já`}
              target="_blank" rel="noopener noreferrer"
            >
              <WhatsappLogo size={14} weight="fill" />
              Falar com o suporte
            </WelcomeContact>
          </WelcomeBody>
          <WelcomeClose onClick={dismissWelcome} title="Fechar">
            <X size={15} weight="bold" />
          </WelcomeClose>
        </WelcomeBanner>
      )}

      {/* ── Metrics ── */}
      <MetricsGrid>
        {METRIC_CARDS.map((card, i) => (
          <MetricCard key={card.label} $delay={i * 0.07}>
            <MetricHeader>
              <MetricLabel>{card.label}</MetricLabel>
              <MetricIconBox><card.icon size={17} weight="fill" /></MetricIconBox>
            </MetricHeader>
            <div>
              <MetricValue>{card.value}</MetricValue>
              <MetricSubtext>{card.subtext}</MetricSubtext>
            </div>
          </MetricCard>
        ))}
      </MetricsGrid>

      {/* ── Widgets row ── */}
      <WidgetsRow>
        <WidgetCard $delay={0.28}>
          <WidgetTitle>
            <ChartBar size={16} weight="fill" style={{ color: "var(--color-primary)" }} />
            Agendamentos — Últimos 7 Dias
          </WidgetTitle>
          <WeekBarChart data={weekData} />
        </WidgetCard>

        <WidgetCard $delay={0.34}>
          <WidgetTitle>
            <CheckCircle size={16} weight="fill" style={{ color: "var(--color-primary)" }} />
            Comparecimento — Mês Atual
          </WidgetTitle>
          <AttendanceGauge value={counts.attendance} />
        </WidgetCard>
      </WidgetsRow>

      {/* ── Today appointments ── */}
      <SectionTitle>
        <CalendarBlank size={16} weight="fill" style={{ color: "var(--color-primary)" }} />
        Agendamentos de Hoje
      </SectionTitle>

      {todayApts.length === 0 ? (
        <EmptyText>Nenhum agendamento para hoje.</EmptyText>
      ) : (
        <AppointmentList>
          {todayApts.map((apt, i) => {
            const time = new Date(apt.start_at).toLocaleTimeString("pt-BR", {
              hour: "2-digit", minute: "2-digit",
            });
            const initials = apt.client_name
              .split(" ").filter(Boolean).slice(0, 2)
              .map((w: string) => w[0].toUpperCase()).join("");
            return (
              <AppointmentItem key={apt.id} $index={i} onClick={() => setDetailApt(apt)}>
                <TimeBlock>{time}</TimeBlock>
                <ApptAvatar>{initials}</ApptAvatar>
                <AppointmentInfo>
                  <ClientName>{apt.client_name}</ClientName>
                  <AppointmentMeta>
                    {apt.service && <><Tag size={11} />{apt.service.name}</>}
                    {apt.professional && <><MetaDot /><User size={11} />{apt.professional.name}</>}
                  </AppointmentMeta>
                </AppointmentInfo>
                {apt.status === "awaiting_payment" && (apt as { payment_status?: string | null }).payment_status !== "paid" ? (
                  <PixConfirmBtn
                    type="button"
                    onClick={(e) => { e.stopPropagation(); confirmPixPayment(apt.id); }}
                    title="Confirmar recebimento do PIX"
                  >
                    ✓ PIX
                  </PixConfirmBtn>
                ) : (
                  <StatusDotWrap>
                    <StatusDot
                      $status={apt.status}
                      $paid={(apt as { payment_status?: string | null }).payment_status === "paid"}
                    />
                    <StatusText
                      $status={apt.status}
                      $paid={(apt as { payment_status?: string | null }).payment_status === "paid"}
                    >
                      {getStatusLabel(apt.status, (apt as { payment_status?: string | null }).payment_status)}
                    </StatusText>
                  </StatusDotWrap>
                )}
              </AppointmentItem>
            );
          })}
        </AppointmentList>
      )}

      {/* ── Detail Modal ── */}
      {detailApt && (() => {
        const apt = detailApt;
        const startDate = new Date(apt.start_at);
        const dateStr   = startDate.toLocaleDateString("pt-BR", {
          weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo",
        });
        const timeStr = startDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
        const s = getStatusMapEntry(apt.status, (apt as { payment_status?: string | null }).payment_status);
        return (
          <Modal
            open={!!detailApt}
            onClose={() => setDetailApt(null)}
            title="Detalhes do Agendamento"
            size="md"
            footer={
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {apt.status === "awaiting_payment" && (apt as { payment_status?: string }).payment_status !== "paid" && (
                  <button
                    onClick={() => confirmPixPayment(apt.id)}
                    style={{
                      padding: "8px 16px", borderRadius: "var(--radius-sm)",
                      fontSize: 13, fontWeight: 700, color: "#fff",
                      background: "var(--color-primary)", border: "none", cursor: "pointer",
                    }}
                  >
                    ✓ Confirmar recebimento do PIX
                  </button>
                )}
                <button
                  onClick={() => setDetailApt(null)}
                  style={{
                    padding: "8px 16px", borderRadius: "var(--radius-sm)",
                    fontSize: 13, color: "var(--color-text-muted)",
                    border: "1px solid var(--color-border)",
                    background: "transparent", cursor: "pointer",
                  }}
                >
                  Fechar
                </button>
              </div>
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
                  <DetailLabel>Data</DetailLabel>
                  <DetailValue style={{ textTransform: "capitalize" }}>{dateStr}</DetailValue>
                </DetailContent>
              </DetailRow>

              <DetailRow>
                <DetailIcon><Clock size={16} weight="fill" /></DetailIcon>
                <DetailContent>
                  <DetailLabel>Horário</DetailLabel>
                  <DetailValue>
                    {timeStr}{apt.service?.duration_min ? ` · ${apt.service.duration_min} min` : ""}
                  </DetailValue>
                </DetailContent>
              </DetailRow>

              {apt.service && (
                <DetailRow>
                  <DetailIcon><Tag size={16} weight="fill" /></DetailIcon>
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
                    <DetailPriceVal>
                      {(apt.service.price_cents / 100).toLocaleString("pt-BR", {
                        style: "currency", currency: "BRL",
                      })}
                    </DetailPriceVal>
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
                      ? new Date(apt.created_at).toLocaleDateString("pt-BR", {
                          day: "numeric", month: "long", year: "numeric",
                        })
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
