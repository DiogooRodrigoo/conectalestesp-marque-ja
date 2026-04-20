"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes, css } from "styled-components";
import {
  CaretLeft, CaretRight, CalendarBlank, Clock,
  User, Tag, Phone, CheckCircle, Plus, CalendarCheck,
  X, CurrencyDollar, Note,
} from "@phosphor-icons/react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useBusiness } from "../BusinessContext";
import type { AppointmentWithRelations, Service, Professional } from "@/types/database";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Modal from "@/components/ui/Modal";

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

// BUG-09: build range in SP timezone, not browser local time
function dayRange(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  // These timestamps are interpreted by PostgreSQL as timestamptz
  return {
    start: `${y}-${m}-${d}T00:00:00-03:00`,
    end:   `${y}-${m}-${d}T23:59:59.999-03:00`,
  };
}

function toLocalDatetimeValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type AptStatus = "confirmed" | "pending" | "completed" | "cancelled" | "no_show" | "awaiting_payment";

const statusMap: Record<AptStatus, { label: string; variant: "success" | "orange" | "default" | "danger" | "warning" | "blue" }> = {
  confirmed:        { label: "Confirmado",      variant: "blue"    },
  pending:          { label: "Pendente",        variant: "default" },
  completed:        { label: "Concluído",       variant: "success" },
  cancelled:        { label: "Cancelado",       variant: "danger"  },
  no_show:          { label: "Não Compareceu",  variant: "danger"  },
  awaiting_payment: { label: "Aguardando PIX",  variant: "warning" },
};

function getAgendaStatus(status: AptStatus, paymentStatus?: string | null) {
  if (status === "confirmed" && paymentStatus === "paid") {
    return { label: "PIX Confirmado", variant: "success" as const };
  }
  return statusMap[status] ?? statusMap.pending;
}

const STATUS_OPTIONS: { value: AptStatus; label: string }[] = [
  { value: "pending",   label: "Pendente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "completed", label: "Concluído" },
  { value: "no_show",   label: "Não Compareceu" },
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
  margin: 0 auto;
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
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
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
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-card);
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
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  border-left: 3px solid ${({ $status }) => {
    if ($status === "completed")        return "var(--color-success)";
    if ($status === "confirmed")        return "var(--color-primary)";
    if ($status === "cancelled")        return "var(--color-danger)";
    if ($status === "awaiting_payment") return "#f59e0b";
    return "rgba(255,255,255,0.3)";
  }};
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-card);
  padding: 14px 16px;
  display: grid;
  grid-template-columns: 56px 1fr auto;
  align-items: center;
  gap: 16px;
  animation: ${fadeUp} 0.25s ease both;
  animation-delay: ${({ $index }) => $index * 0.04}s;
  transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s cubic-bezier(0.4,0,0.2,1);
  opacity: ${({ $status }) => ($status === "cancelled" ? 0.55 : 1)};
  cursor: pointer;
  &:hover {
    transform: translateY(-4px) scale(1.003);
    box-shadow: var(--shadow-card-hover);
  }
  @media (max-width: 600px) {
    grid-template-columns: 44px 1fr auto;
    gap: 10px;
    padding: 12px 12px;
  }
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
`;

const PriceTag = styled.span`
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.3px;
  @media (max-width: 600px) { display: none; }
`;

const StatusBtn = styled.button`
  border-radius: var(--radius-sm);
  padding: 2px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: var(--color-surface-2); }
`;

const PixConfirmBtn = styled.button`
  height: 26px; padding: 0 9px; border-radius: 7px; flex-shrink: 0;
  background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.35);
  color: #F97316; font-size: 11px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; gap: 4px;
  transition: background 0.15s;
  &:hover { background: rgba(249,115,22,0.18); }
`;

const StatusMenuEl = styled.div<{ $top: number; $right: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  right: ${({ $right }) => $right}px;
  background: rgba(255, 255, 255, 0.90);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.60);
  border-radius: var(--radius-xl);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
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
  background: ${({ $active }) => ($active ? "rgba(var(--color-primary-rgb),0.06)" : "transparent")};
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

// ─── New Appointment Form Styled ──────────────────────────────────────────────

const FormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const FieldLabel = styled.label`
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-text-muted);
`;

const FieldInput = styled.input`
  height: 40px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 13.5px;
  font-family: inherit;
  padding: 0 12px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &::placeholder { color: var(--color-text-muted); opacity: 0.6; }

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb),0.12);
  }
`;

const FieldSelect = styled.select`
  height: 40px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 13.5px;
  font-family: inherit;
  padding: 0 12px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb),0.12);
  }
`;

const FieldTextarea = styled.textarea`
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 13.5px;
  font-family: inherit;
  padding: 10px 12px;
  outline: none;
  resize: vertical;
  min-height: 72px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &::placeholder { color: var(--color-text-muted); opacity: 0.6; }

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb),0.12);
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

function emptyNewApt(selectedDate: Date) {
  const d = new Date(selectedDate);
  d.setHours(9, 0, 0, 0);
  return {
    clientName: "",
    clientPhone: "",
    startAt: toLocalDatetimeValue(d),
    serviceId: "",
    professionalId: "",
    status: "pending" as AptStatus,
    notes: "",
  };
}

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

  // Detail modal
  const [detailApt, setDetailApt] = useState<AppointmentWithRelations | null>(null);

  // Cancel modal
  const [cancelAptId, setCancelAptId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // New appointment modal
  const [newAptOpen, setNewAptOpen] = useState(false);
  const [newAptForm, setNewAptForm] = useState(emptyNewApt(today));
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

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
      .neq("status", "cancelled")
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

  // Load services & professionals for new appointment form
  useEffect(() => {
    if (!business) return;
    const supabase = getSupabaseClient();
    Promise.all([
      supabase.from("services").select("*").eq("business_id", business.id).eq("is_active", true).order("display_order"),
      supabase.from("professionals").select("*").eq("business_id", business.id).eq("is_active", true),
    ]).then(([svcRes, profRes]) => {
      setServices(svcRes.data ?? []);
      setProfessionals(profRes.data ?? []);
    });
  }, [business]);

  function hasBlock(date: Date) {
    return weekBlocks.has(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
  }

  async function confirmPixPayment(aptId: string) {
    try {
      const res = await fetch("/api/payments/pix/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: aptId }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("[confirmPixPayment] error:", data.error);
        return;
      }
    } catch (err) {
      console.error("[confirmPixPayment] fetch error:", err);
      return;
    }
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === aptId
          ? { ...a, status: "confirmed" as AptStatus, payment_status: "paid" }
          : a
      )
    );
    setDetailApt((prev) =>
      prev?.id === aptId ? { ...prev, status: "confirmed" as AptStatus, payment_status: "paid" } : prev
    );
  }

  async function cancelAppointment(aptId: string, reason: string) {
    setCancelling(true);
    try {
      const res = await fetch("/api/appointments/admin-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: aptId, reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("[cancelAppointment] error:", data.error);
        return;
      }
    } catch (err) {
      console.error("[cancelAppointment] fetch error:", err);
      return;
    } finally {
      setCancelling(false);
    }
    setAppointments((prev) =>
      prev.map((a) => a.id === aptId ? { ...a, status: "cancelled" as AptStatus } : a)
    );
    setDetailApt((prev) =>
      prev?.id === aptId ? { ...prev, status: "cancelled" as AptStatus } : prev
    );
    setCancelAptId(null);
    setCancelReason("");
  }

  async function changeStatus(aptId: string, newStatus: AptStatus) {
    const current = appointments.find((a) => a.id === aptId);
    const isPixConfirm = newStatus === "confirmed" && current?.status === "awaiting_payment";

    const updatePayload: Record<string, unknown> = { status: newStatus };
    if (isPixConfirm) {
      updatePayload.payment_status = "paid";
      updatePayload.payment_paid_at = new Date().toISOString();
    }

    const { error } = await getSupabaseClient()
      .from("appointments")
      .update(updatePayload)
      .eq("id", aptId);
    if (error) {
      console.error("[changeStatus] Supabase error:", error.message);
      return;
    }
    setAppointments((prev) =>
      prev.map((a) => (a.id === aptId ? { ...a, status: newStatus, ...(isPixConfirm ? { payment_status: "paid" } : {}) } : a))
    );
    setStatusMenuId(null);
  }

  function openNewApt() {
    setNewAptForm(emptyNewApt(selectedDate));
    setNewAptOpen(true);
  }

  async function handleSaveNewApt() {
    if (!business || !newAptForm.clientName.trim() || !newAptForm.startAt) return;
    setSaving(true);
    const supabase = getSupabaseClient();

    const startAt = new Date(newAptForm.startAt);
    const selectedService = services.find((s) => s.id === newAptForm.serviceId);
    const durationMin = selectedService?.duration_min ?? 30;
    const endAt = new Date(startAt.getTime() + durationMin * 60_000);

    // BUG-06: handle Supabase errors
    const { data, error: insertError } = await supabase
      .from("appointments")
      .insert({
        business_id: business.id,
        client_name: newAptForm.clientName.trim(),
        client_phone: newAptForm.clientPhone.trim(),
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        service_id: newAptForm.serviceId || null,
        professional_id: newAptForm.professionalId || null,
        status: newAptForm.status,
        notes: newAptForm.notes.trim() || null,
      })
      .select("*, service:services(*), professional:professionals(*)")
      .single();

    if (insertError) {
      console.error("[handleSaveNewApt] Supabase error:", insertError.message);
      setSaving(false);
      return;
    }
    if (data) {
      const apt = data as AppointmentWithRelations;
      if (isSameDay(new Date(apt.start_at), selectedDate)) {
        setAppointments((prev) => [...prev, apt].sort(
          (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
        ));
      }
    }
    setSaving(false);
    setNewAptOpen(false);
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
        <Button icon={<Plus size={16} weight="bold" />} size="sm" onClick={openNewApt}>
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
          <div><StatValue>{completed}</StatValue><StatLabel>Concluídos</StatLabel></div>
        </StatPill>
        <StatPill>
          <StatIcon $color="#a1a1aa"><Clock size={16} weight="fill" /></StatIcon>
          <div><StatValue>{pending}</StatValue><StatLabel>Pendentes</StatLabel></div>
        </StatPill>
        <StatPill>
          <StatIcon $color="#34d399"><Tag size={16} weight="fill" /></StatIcon>
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
            const time = new Date(apt.start_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
            const durationMin = apt.service?.duration_min;
            const s = getAgendaStatus(apt.status as AptStatus, apt.payment_status);
            const isPendingPix = apt.status === "awaiting_payment" && apt.payment_status !== "paid";
            return (
              <AptCard
                key={apt.id}
                $index={i}
                $status={apt.status}
                onClick={() => setDetailApt(apt)}
              >
                <TimeCol>
                  <TimeMain>{time}</TimeMain>
                  {durationMin && <TimeDuration>{durationMin}min</TimeDuration>}
                </TimeCol>
                <AptInfo>
                  <Avatar name={apt.client_name} size="sm" />
                  <AptDetails>
                    <ClientName>{apt.client_name}</ClientName>
                    <MetaRow>
                      {apt.service && <MetaItem><Tag size={11} />{apt.service.name}</MetaItem>}
                      {apt.professional && <><MetaDot /><MetaItem><User size={11} />{apt.professional.name}</MetaItem></>}
                      {apt.client_phone && <><MetaDot /><MetaItem><Phone size={11} />{apt.client_phone}</MetaItem></>}
                    </MetaRow>
                  </AptDetails>
                </AptInfo>
                <AptRight>
                  {isPendingPix ? (
                    <PixConfirmBtn
                      type="button"
                      onClick={(e) => { e.stopPropagation(); confirmPixPayment(apt.id); }}
                      title="Confirmar recebimento do PIX"
                    >
                      ✓ PIX
                    </PixConfirmBtn>
                  ) : (
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
                  )}
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

      {/* ─── Detail Modal ───────────────────────────────────────────────────── */}
      {detailApt && (() => {
        const apt = detailApt;
        const startDate = new Date(apt.start_at);
        const dateStr = startDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
        const timeStr = startDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
        const s = getAgendaStatus(apt.status as AptStatus, apt.payment_status);
        return (
          <Modal
            open={!!detailApt}
            onClose={() => setDetailApt(null)}
            title="Detalhes do Agendamento"
            size="md"
            footer={
              <>
                {apt.status === "awaiting_payment" && apt.payment_status !== "paid" && (
                  <Button
                    variant="primary"
                    onClick={() => confirmPixPayment(apt.id)}
                  >
                    ✓ Confirmar recebimento do PIX
                  </Button>
                )}
                {apt.status !== "cancelled" && apt.status !== "completed" && apt.status !== "no_show" && (
                  <Button
                    variant="danger"
                    onClick={() => { setCancelAptId(apt.id); setCancelReason(""); }}
                  >
                    Cancelar agendamento
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setDetailApt(null)}>Fechar</Button>
              </>
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
                    <DetailPriceValue>{formatCurrency(apt.service.price_cents)}</DetailPriceValue>
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
                      ? new Date(apt.created_at).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" })
                      : "—"}
                  </DetailValue>
                </DetailContent>
              </DetailRow>
            </DetailGrid>
          </Modal>
        );
      })()}

      {/* ─── Cancel Confirmation Modal ─────────────────────────────────────── */}
      <Modal
        open={!!cancelAptId}
        onClose={() => { setCancelAptId(null); setCancelReason(""); }}
        title="Cancelar agendamento"
        description="O cliente será notificado via WhatsApp. Essa ação não pode ser desfeita."
        size="sm"
        footer={
          <>
            <Button
              variant="danger"
              onClick={() => cancelAptId && cancelAppointment(cancelAptId, cancelReason)}
              disabled={cancelling}
            >
              {cancelling ? "Cancelando..." : "Confirmar cancelamento"}
            </Button>
            <Button variant="ghost" onClick={() => { setCancelAptId(null); setCancelReason(""); }}>
              Voltar
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)" }}>
            Motivo do cancelamento <span style={{ fontWeight: 400 }}>(opcional)</span>
          </label>
          <FieldTextarea
            placeholder="Ex: Profissional indisponível, feriado, etc."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>

      {/* ─── New Appointment Modal ──────────────────────────────────────────── */}
      <Modal
        open={newAptOpen}
        onClose={() => setNewAptOpen(false)}
        title="Novo Agendamento"
        description="Preencha os dados para criar um agendamento manualmente."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewAptOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSaveNewApt}
              loading={saving}
              disabled={!newAptForm.clientName.trim() || !newAptForm.startAt}
            >
              Criar Agendamento
            </Button>
          </>
        }
      >
        <FormGrid>
          <FormRow>
            <FieldGroup>
              <FieldLabel>Nome do cliente *</FieldLabel>
              <FieldInput
                placeholder="Ex: João Silva"
                value={newAptForm.clientName}
                onChange={(e) => setNewAptForm((f) => ({ ...f, clientName: e.target.value }))}
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Telefone</FieldLabel>
              <FieldInput
                placeholder="(11) 99999-9999"
                value={newAptForm.clientPhone}
                onChange={(e) => setNewAptForm((f) => ({ ...f, clientPhone: e.target.value }))}
              />
            </FieldGroup>
          </FormRow>

          <FieldGroup>
            <FieldLabel>Data e horário *</FieldLabel>
            <FieldInput
              type="datetime-local"
              value={newAptForm.startAt}
              onChange={(e) => setNewAptForm((f) => ({ ...f, startAt: e.target.value }))}
            />
          </FieldGroup>

          <FormRow>
            <FieldGroup>
              <FieldLabel>Serviço</FieldLabel>
              <FieldSelect
                value={newAptForm.serviceId}
                onChange={(e) => setNewAptForm((f) => ({ ...f, serviceId: e.target.value }))}
              >
                <option value="">Selecionar serviço</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </FieldSelect>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Profissional</FieldLabel>
              <FieldSelect
                value={newAptForm.professionalId}
                onChange={(e) => setNewAptForm((f) => ({ ...f, professionalId: e.target.value }))}
              >
                <option value="">Selecionar profissional</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </FieldSelect>
            </FieldGroup>
          </FormRow>

          <FieldGroup>
            <FieldLabel>Status inicial</FieldLabel>
            <FieldSelect
              value={newAptForm.status}
              onChange={(e) => setNewAptForm((f) => ({ ...f, status: e.target.value as AptStatus }))}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </FieldSelect>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Observações</FieldLabel>
            <FieldTextarea
              placeholder="Alguma informação adicional sobre o agendamento..."
              value={newAptForm.notes}
              onChange={(e) => setNewAptForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </FieldGroup>
        </FormGrid>
      </Modal>
    </Page>
  );
}
