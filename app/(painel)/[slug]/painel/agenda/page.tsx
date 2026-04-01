"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes, css } from "styled-components";
import {
  CaretLeft, CaretRight, CalendarBlank, Clock,
  User, Scissors, Phone, CheckCircle, Plus, CalendarCheck,
  ProhibitInset,
} from "@phosphor-icons/react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useBusiness } from "../BusinessContext";
import type { AppointmentWithRelations } from "@/types/database";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

// ─── Utils ────────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

type AptStatus = "confirmed" | "pending" | "completed" | "cancelled" | "no_show";

const statusMap: Record<AptStatus, { label: string; variant: "success" | "orange" | "default" | "danger" | "warning" }> = {
  confirmed: { label: "Confirmado", variant: "orange" },
  pending:   { label: "Pendente",   variant: "default" },
  completed: { label: "Pago",       variant: "success" },
  cancelled: { label: "Cancelado",  variant: "danger" },
  no_show:   { label: "Faltou",     variant: "warning" },
};

const STATUS_OPTIONS: { value: AptStatus; label: string }[] = [
  { value: "pending",   label: "Pendente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "completed", label: "Pago" },
];

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  padding: 28px 32px;
  max-width: 960px;
  animation: ${fadeUp} 0.25s ease both;
  @media (max-width: 640px) { padding: 16px; }
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.4px;
`;

const WeekNav = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 6px;
  margin-bottom: 24px;
`;

const WeekArrow = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
  &:hover { background: var(--color-surface-2); color: var(--color-text); }
`;

const WeekDays = styled.div`
  display: flex;
  flex: 1;
  gap: 4px;
  overflow-x: auto;
  &::-webkit-scrollbar { display: none; }
`;

const DayBtn = styled.button<{ $active: boolean }>`
  flex: 1;
  min-width: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
  position: relative;
  ${({ $active }) => $active
    ? css`background: var(--color-primary); color: #fff;`
    : css`background: transparent; color: var(--color-text-muted); &:hover { background: var(--color-surface-2); color: var(--color-text); }`}
`;

const DayName = styled.span<{ $active: boolean }>`
  font-size: 10.5px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ $active }) => ($active ? "rgba(255,255,255,0.8)" : "inherit")};
`;

const DayNumber = styled.span`
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
  margin-top: 2px;
`;

const TodayDot = styled.span`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-primary);
  margin-top: 3px;
`;

const BlockDot = styled.span<{ $dayActive: boolean }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${({ $dayActive }) => $dayActive ? "rgba(255,255,255,0.75)" : "var(--color-danger)"};
  margin-top: 2px;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const StatPill = styled.div`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 140px;
`;

const StatIcon = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: ${({ $color }) => `${$color}18`};
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.5px;
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 11.5px;
  color: var(--color-text-muted);
  margin-top: 2px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const SectionTitle = styled.h2`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const AptCard = styled.div<{ $index: number; $status: string }>`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 3px solid ${({ $status }) => {
    if ($status === "completed") return "var(--color-success)";
    if ($status === "confirmed") return "var(--color-primary)";
    if ($status === "cancelled") return "var(--color-danger)";
    return "var(--color-border)";
  }};
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: grid;
  grid-template-columns: 56px 1fr auto;
  align-items: center;
  gap: 16px;
  animation: ${fadeUp} 0.25s ease both;
  animation-delay: ${({ $index }) => $index * 0.04}s;
  transition: border-color 0.15s, transform 0.15s;
  opacity: ${({ $status }) => ($status === "cancelled" ? 0.55 : 1)};
  &:hover { transform: translateX(2px); }
  @media (max-width: 600px) { grid-template-columns: 48px 1fr; }
`;

const TimeCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TimeMain = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.3px;
`;

const TimeDuration = styled.span`
  font-size: 10.5px;
  color: var(--color-text-muted);
`;

const AptInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const AptDetails = styled.div`min-width: 0;`;

const ClientName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  flex-wrap: wrap;
`;

const MetaItem = styled.span`
  font-size: 12.5px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MetaDot = styled.span`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--color-border);
`;

const AptRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
  @media (max-width: 600px) { display: none; }
`;

const PriceTag = styled.span`
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.3px;
`;

const StatusBtn = styled.button`
  border-radius: var(--radius-sm);
  padding: 2px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: var(--color-surface-2); }
`;

const StatusMenuEl = styled.div<{ $top: number; $right: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  right: ${({ $right }) => $right}px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
  z-index: 9999;
  min-width: 152px;
  overflow: hidden;
  animation: ${fadeUp} 0.15s ease;
`;

const StatusOptionBtn = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  color: ${({ $active }) => ($active ? "var(--color-primary)" : "var(--color-text)")};
  font-weight: ${({ $active }) => ($active ? "600" : "400")};
  background: ${({ $active }) => ($active ? "rgba(249,115,22,0.06)" : "transparent")};
  transition: background 0.15s;
  &:hover { background: var(--color-surface-2); }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 56px 24px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
`;

const LoadingCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const { business, loading: bizLoading } = useBusiness();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekOffset, setWeekOffset] = useState(0);
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const [weekBlocks, setWeekBlocks] = useState<Set<string>>(new Set());
  const [portalMounted, setPortalMounted] = useState(false);

  useEffect(() => { setPortalMounted(true); }, []);

  const weekStart = (() => {
    const d = addDays(today, weekOffset * 7);
    const day = d.getDay();
    return addDays(d, -(day === 0 ? 6 : day - 1));
  })();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (!statusMenuId) return;
    function handleClick() { setStatusMenuId(null); }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [statusMenuId]);

  const loadDay = useCallback(async (date: Date) => {
    if (!business) return;
    setLoading(true);
    const { start, end } = dayRange(date);
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("appointments")
      .select("*, service:services(*), professional:professionals(*)")
      .eq("business_id", business.id)
      .gte("start_at", start)
      .lte("start_at", end)
      .order("start_at");
    setAppointments((data as AppointmentWithRelations[]) ?? []);
    setLoading(false);
  }, [business]);

  useEffect(() => { loadDay(selectedDate); }, [selectedDate, loadDay]);

  useEffect(() => {
    if (!business) return;
    const d = addDays(new Date(), weekOffset * 7);
    const dayN = d.getDay();
    const ws = addDays(d, -(dayN === 0 ? 6 : dayN - 1));
    ws.setHours(0, 0, 0, 0);
    const we = addDays(ws, 6);
    we.setHours(23, 59, 59, 999);

    getSupabaseClient()
      .from("blocked_slots")
      .select("start_at")
      .eq("business_id", business.id)
      .gte("start_at", ws.toISOString())
      .lte("start_at", we.toISOString())
      .then(({ data }) => {
        const set = new Set<string>();
        (data ?? []).forEach((b) => {
          const bd = new Date(b.start_at);
          set.add(`${bd.getFullYear()}-${bd.getMonth()}-${bd.getDate()}`);
        });
        setWeekBlocks(set);
      });
  }, [business, weekOffset]);

  function hasBlock(date: Date) {
    return weekBlocks.has(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
  }

  async function changeStatus(aptId: string, newStatus: AptStatus) {
    await getSupabaseClient()
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", aptId);
    setAppointments((prev) =>
      prev.map((a) => (a.id === aptId ? { ...a, status: newStatus } : a))
    );
    setStatusMenuId(null);
  }

  const confirmed  = appointments.filter((a) => a.status === "confirmed").length;
  const completed  = appointments.filter((a) => a.status === "completed").length;
  const pending    = appointments.filter((a) => a.status === "pending").length;
  const revenue    = appointments
    .filter((a) => a.status === "completed")
    .reduce((acc, a) => acc + (a.service?.price_cents ?? 0), 0);

  if (bizLoading) return <LoadingCenter><Spinner size="lg" /></LoadingCenter>;

  return (
    <Page>
      <TopRow>
        <PageTitle>Agenda</PageTitle>
        <Button icon={<Plus size={16} weight="bold" />} size="sm">
          Novo Agendamento
        </Button>
      </TopRow>

      <WeekNav>
        <WeekArrow onClick={() => setWeekOffset((w) => w - 1)}>
          <CaretLeft size={16} weight="bold" />
        </WeekArrow>
        <WeekDays>
          {weekDays.map((d) => {
            const isActive = isSameDay(d, selectedDate);
            const blocked = hasBlock(d);
            return (
              <DayBtn
                key={d.toISOString()}
                $active={isActive}
                onClick={() => setSelectedDate(d)}
              >
                <DayName $active={isActive}>{WEEKDAYS[d.getDay()]}</DayName>
                <DayNumber>{d.getDate()}</DayNumber>
                {isSameDay(d, today) && !isActive && <TodayDot />}
                {blocked && <BlockDot $dayActive={isActive} title="Dia com bloqueio" />}
              </DayBtn>
            );
          })}
        </WeekDays>
        <WeekArrow onClick={() => setWeekOffset((w) => w + 1)}>
          <CaretRight size={16} weight="bold" />
        </WeekArrow>
      </WeekNav>

      <StatsRow>
        <StatPill>
          <StatIcon $color="var(--color-primary)"><CalendarCheck size={16} weight="fill" /></StatIcon>
          <div><StatValue>{confirmed}</StatValue><StatLabel>Confirmados</StatLabel></div>
        </StatPill>
        <StatPill>
          <StatIcon $color="var(--color-success)"><CheckCircle size={16} weight="fill" /></StatIcon>
          <div><StatValue>{completed}</StatValue><StatLabel>Pagos</StatLabel></div>
        </StatPill>
        <StatPill>
          <StatIcon $color="#a1a1aa"><Clock size={16} weight="fill" /></StatIcon>
          <div><StatValue>{pending}</StatValue><StatLabel>Pendentes</StatLabel></div>
        </StatPill>
        <StatPill>
          <StatIcon $color="#34d399"><Scissors size={16} weight="fill" /></StatIcon>
          <div><StatValue>{formatCurrency(revenue)}</StatValue><StatLabel>Faturado</StatLabel></div>
        </StatPill>
      </StatsRow>

      <SectionHeader>
        <SectionTitle>
          {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}
          {isSameDay(selectedDate, today) ? " · Hoje" : ` · ${WEEKDAYS[selectedDate.getDay()]}`}
        </SectionTitle>
      </SectionHeader>

      {loading ? (
        <LoadingCenter><Spinner /></LoadingCenter>
      ) : appointments.length === 0 ? (
        <EmptyState>
          <CalendarBlank size={24} />
          <span style={{ fontSize: 14 }}>Nenhum agendamento neste dia</span>
        </EmptyState>
      ) : (
        <List>
          {appointments.map((apt, i) => {
            const time = new Date(apt.start_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            const durationMin = apt.service?.duration_min;
            const s = statusMap[apt.status as AptStatus] ?? statusMap.pending;
            return (
              <AptCard key={apt.id} $index={i} $status={apt.status}>
                <TimeCol>
                  <TimeMain>{time}</TimeMain>
                  {durationMin && <TimeDuration>{durationMin}min</TimeDuration>}
                </TimeCol>
                <AptInfo>
                  <Avatar name={apt.client_name} size="sm" />
                  <AptDetails>
                    <ClientName>{apt.client_name}</ClientName>
                    <MetaRow>
                      {apt.service && <MetaItem><Scissors size={11} />{apt.service.name}</MetaItem>}
                      {apt.professional && <><MetaDot /><MetaItem><User size={11} />{apt.professional.name}</MetaItem></>}
                      {apt.client_phone && <><MetaDot /><MetaItem><Phone size={11} />{apt.client_phone}</MetaItem></>}
                    </MetaRow>
                  </AptDetails>
                </AptInfo>
                <AptRight>
                  <StatusBtn
                    onClick={(e) => {
                      e.stopPropagation();
                      if (statusMenuId === apt.id) {
                        setStatusMenuId(null);
                      } else {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setMenuCoords({
                          top: rect.bottom + 6,
                          right: window.innerWidth - rect.right,
                        });
                        setStatusMenuId(apt.id);
                      }
                    }}
                    title="Alterar status"
                  >
                    <Badge variant={s.variant} dot>{s.label}</Badge>
                  </StatusBtn>
                  {apt.service && <PriceTag>{formatCurrency(apt.service.price_cents)}</PriceTag>}
                </AptRight>
              </AptCard>
            );
          })}
        </List>
      )}

      {portalMounted && statusMenuId && createPortal(
        <StatusMenuEl
          $top={menuCoords.top}
          $right={menuCoords.right}
          onClick={(e) => e.stopPropagation()}
        >
          {STATUS_OPTIONS.map((opt) => {
            const apt = appointments.find((a) => a.id === statusMenuId);
            return (
              <StatusOptionBtn
                key={opt.value}
                $active={apt?.status === opt.value}
                onClick={() => changeStatus(statusMenuId, opt.value)}
              >
                {opt.label}
              </StatusOptionBtn>
            );
          })}
        </StatusMenuEl>,
        document.body
      )}
    </Page>
  );
}
