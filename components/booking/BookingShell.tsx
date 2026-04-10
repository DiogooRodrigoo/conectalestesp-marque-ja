"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styled, { keyframes } from "styled-components";
import { ArrowLeft } from "@phosphor-icons/react";
import { Business, Service, Professional, BusinessHours } from "@/types/database";
import StepLanding from "./StepLanding";
import StepServiceSelect from "./StepServiceSelect";
import StepProfessionalSelect from "./StepProfessionalSelect";
import StepDatePicker from "./StepDatePicker";
import StepTimePicker from "./StepTimePicker";
import StepClientForm from "./StepClientForm";
import StepPhoneVerification from "./StepPhoneVerification";
import StepConfirmation from "./StepConfirmation";
import SuccessScreen from "./SuccessScreen";
import MyAppointmentsScreen from "./MyAppointmentsScreen";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BookingState {
  serviceIds: string[];
  professionalId: string | null;
  date: string | null;
  time: string | null;
  clientName: string;
  clientPhone: string;
}

export interface CreatedAppointment {
  id: string;
  start_at: string;
  services: Service[];
  professional: Professional | null;
  business: Business;
}

interface BookingShellProps {
  business: Business & { business_hours?: BusinessHours[] };
  services: Service[];
  professionals: Professional[];
}

const TOTAL_STEPS = 7;

const STEP_LABELS = ["Serviço", "Profissional", "Data", "Horário", "Seus dados", "Verificar", "Confirmar"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  if (cents === 0) return "Gratuito";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function formatDateShort(ymd: string): string {
  return new Date(`${ymd}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short", day: "numeric", month: "short",
  });
}

// ─── Layout ───────────────────────────────────────────────────────────────────

/** Wrapper mobile: coluna centralizada */
const MobileWrapper = styled.div`
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px 48px;

  @media (min-width: 768px) {
    display: none;
  }
`;

/** Wrapper desktop: split layout full-viewport */
const DesktopWrapper = styled.div`
  display: none;

  @media (min-width: 768px) {
    display: flex;
    min-height: 100vh;
    background: var(--color-bg);
  }
`;

// ─── LEFT PANEL ───────────────────────────────────────────────────────────────

const LeftPanel = styled.aside<{ $color: string }>`
  width: 340px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: ${({ $color }) => $color};
`;

const LeftBgBlur = styled.div<{ $url: string }>`
  position: absolute;
  inset: -12px;
  background: url(${({ $url }) => $url}) center / cover no-repeat;
  filter: blur(22px) saturate(1.5) brightness(0.7);
  transform: scale(1.15);
`;

const LeftGradient = styled.div<{ $color: string }>`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    165deg,
    ${({ $color }) => $color}73 0%,
    ${({ $color }) => $color}d1 50%,
    var(--color-primary-hero-end) 100%
  );
`;

const LeftNoise = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.45;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
`;

const LeftContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 36px 28px 28px;
`;

const LeftLogo = styled.div`
  width: 76px;
  height: 76px;
  border-radius: 20px;
  background: #fff;
  border: 3px solid rgba(255,255,255,0.9);
  box-shadow: 0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 18px;
  flex-shrink: 0;
`;

const LeftLogoImg = styled.img`
  width: 100%; height: 100%; object-fit: cover;
`;

const LeftLogoInitial = styled.div<{ $color: string }>`
  width: 100%; height: 100%;
  background: ${({ $color }) => $color};
  color: #fff;
  font-size: 28px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LeftBizName = styled.h1`
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
  margin-bottom: 5px;
  text-shadow: 0 2px 12px rgba(0,0,0,0.2);
`;

const LeftBizAddress = styled.p`
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  line-height: 1.45;
  margin-bottom: 10px;
`;

const LeftStatusBadge = styled.div<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${({ $open }) => $open ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.1)"};
  border: 1px solid ${({ $open }) => $open ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.2)"};
  border-radius: 99px;
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 700;
  color: ${({ $open }) => $open ? "#4ADE80" : "rgba(255,255,255,0.6)"};
  width: fit-content;
  margin-bottom: 32px;
  backdrop-filter: blur(8px);
`;

const StatusDot = styled.div<{ $open: boolean }>`
  width: 6px; height: 6px;
  border-radius: 50%;
  background: ${({ $open }) => $open ? "#4ADE80" : "rgba(255,255,255,0.5)"};
`;

// Step list
const StepList = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar { display: none; }
`;

const StepItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 9px 0;
  position: relative;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 14px;
    top: 38px;
    bottom: -9px;
    width: 2px;
    background: rgba(255,255,255,0.15);
  }
`;

const StepDot = styled.div<{ $done: boolean; $active: boolean }>`
  width: 30px; height: 30px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  font-size: ${({ $done }) => $done ? "14px" : "13px"};
  font-weight: 800;
  transition: all 0.2s;
  background: ${({ $done, $active }) =>
    $done ? "rgba(255,255,255,0.92)" :
    $active ? "#fff" :
    "rgba(255,255,255,0.1)"};
  color: ${({ $done, $active }) =>
    ($done || $active) ? "var(--color-primary)" : "rgba(255,255,255,0.4)"};
  border: ${({ $done, $active }) =>
    ($done || $active) ? "none" : "1.5px solid rgba(255,255,255,0.18)"};
  box-shadow: ${({ $active }) => $active ? "0 0 0 4px rgba(255,255,255,0.22)" : "none"};
`;

const StepInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-top: 4px;
  min-width: 0;
`;

const StepName = styled.span<{ $pending: boolean }>`
  font-size: 13px;
  font-weight: 700;
  color: ${({ $pending }) => $pending ? "rgba(255,255,255,0.38)" : "#fff"};
  line-height: 1.3;
`;

const StepDetail = styled.span`
  font-size: 11px;
  color: rgba(255,255,255,0.58);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
`;

const LeftFooter = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: rgba(255,255,255,0.28);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 12px;
`;

// ─── RIGHT PANEL ──────────────────────────────────────────────────────────────

const RightPanel = styled.main`
  flex: 1;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  min-height: 100vh;
`;

const RightCard = styled.div`
  width: 100%;
  max-width: 480px;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-card);
`;

// ─── MOBILE components ────────────────────────────────────────────────────────

const HeroBanner = styled.header`
  width: 100%;
  max-width: 480px;
  height: 192px;
  border-radius: var(--radius-xl);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 0 20px 20px;
  margin: 16px 0;
  flex-shrink: 0;
`;

const HeroBgBlur = styled.div<{ $url: string }>`
  position: absolute;
  inset: -12px;
  background: url(${({ $url }) => $url}) center / cover no-repeat;
  filter: blur(22px) saturate(1.5) brightness(0.8);
  transform: scale(1.15);
`;

const HeroColorBg = styled.div<{ $color: string }>`
  position: absolute;
  inset: 0;
  background: ${({ $color }) => $color};
`;

const HeroGradient = styled.div<{ $color: string }>`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    165deg,
    ${({ $color }) => $color}73 0%,
    ${({ $color }) => $color}d1 50%,
    var(--color-primary-hero-end) 100%
  );
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  width: 100%;
`;

const HeroLogoBox = styled.div`
  width: 72px; height: 72px;
  border-radius: 18px;
  border: 3px solid rgba(255,255,255,0.92);
  box-shadow: 0 8px 28px rgba(0,0,0,0.28);
  overflow: hidden;
  background: #fff;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 6px;
`;

const HeroLogoImg = styled.img`
  width: 100%; height: 100%; object-fit: cover;
`;

const HeroInitials = styled.div<{ $color: string }>`
  width: 100%; height: 100%;
  background: ${({ $color }) => $color};
  color: #fff;
  font-size: 26px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
`;

const HeroName = styled.h1`
  font-size: 18px; font-weight: 800;
  color: #fff; letter-spacing: -0.3px;
  text-shadow: 0 1px 8px rgba(0,0,0,0.25);
`;

const HeroAddress = styled.p`
  font-size: 12px;
  color: rgba(255,255,255,0.78);
  text-shadow: 0 1px 4px rgba(0,0,0,0.18);
`;

const PoweredBy = styled.div`
  position: absolute;
  bottom: 8px; right: 12px;
  font-size: 9px; font-weight: 600;
  color: rgba(255,255,255,0.36);
  letter-spacing: 0.4px; text-transform: uppercase;
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.55); }
  50%       { box-shadow: 0 0 0 5px rgba(74,222,128,0); }
`;

const HeroStatusBadge = styled.div<{ $open: boolean }>`
  position: absolute;
  top: 14px; right: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1px;
  backdrop-filter: blur(10px);
  background: ${({ $open }) =>
    $open ? "rgba(34,197,94,0.22)" : "rgba(239,68,68,0.22)"};
  border: 1px solid ${({ $open }) =>
    $open ? "rgba(74,222,128,0.45)" : "rgba(239,68,68,0.45)"};
  color: ${({ $open }) => ($open ? "#4ADE80" : "#FCA5A5")};
  z-index: 2;
  box-shadow: ${({ $open }) =>
    $open
      ? "0 2px 12px rgba(34,197,94,0.2), inset 0 1px 0 rgba(255,255,255,0.12)"
      : "0 2px 12px rgba(239,68,68,0.2), inset 0 1px 0 rgba(255,255,255,0.08)"};
`;

const HeroStatusDot = styled.div<{ $open: boolean }>`
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $open }) => ($open ? "#4ADE80" : "#EF4444")};
  animation: ${({ $open }) => ($open ? pulse : "none")} 2s ease-in-out infinite;
`;

const ProgressContainer = styled.div`
  width: 100%;
  max-width: 480px;
  margin-bottom: 12px;
  flex-shrink: 0;
`;

const ProgressBar = styled.div`
  display: flex;
  gap: 5px;
  margin-bottom: 8px;
`;

const ProgressSegment = styled.div<{ $active: boolean; $done: boolean }>`
  flex: 1;
  height: 4px;
  border-radius: 99px;
  overflow: hidden;
  background: ${({ $active, $done }) =>
    ($active || $done) ? "transparent" : "var(--color-border)"};
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 99px;
    background: var(--gradient-primary);
    transform: ${({ $active, $done }) =>
      ($active || $done) ? "scaleX(1)" : "scaleX(0)"};
    transform-origin: left;
    transition: transform 0.4s ease;
  }
`;

const ProgressLabel = styled.p`
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
  font-weight: 500;
`;

const StepCounter = styled.span`
  color: var(--color-primary);
  font-weight: 700;
`;

const MobileCard = styled.div`
  width: 100%;
  max-width: 480px;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-card);
`;

const BackToLandingLink = styled.button`
  background: none; border: none;
  font-size: 12px; color: var(--color-text-muted);
  cursor: pointer; padding: 0;
  margin-bottom: 8px;
  display: flex; align-items: center; gap: 4px;
  font-weight: 600;
  transition: color 0.2s;
  &:hover { color: var(--color-text); }
`;

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MobileHero({
  business, logoUrl, addressFormatted, primaryColor, status,
}: {
  business: Business; logoUrl: string;
  addressFormatted: string; primaryColor: string;
  status: { isOpen: boolean; label: string };
}) {
  return (
    <HeroBanner>
      {business.logo_url ? (
        <HeroBgBlur $url={logoUrl} />
      ) : (
        <HeroColorBg $color={primaryColor} />
      )}
      <HeroGradient $color={primaryColor} />
      <HeroStatusBadge $open={status.isOpen}>
        <HeroStatusDot $open={status.isOpen} />
        {status.label}
      </HeroStatusBadge>
      <HeroContent>
        <HeroLogoBox>
          {business.logo_url
            ? <HeroLogoImg src={logoUrl} alt={business.name} />
            : <HeroInitials $color={primaryColor}>{business.name.charAt(0).toUpperCase()}</HeroInitials>
          }
        </HeroLogoBox>
        <HeroName>{business.name}</HeroName>
        {addressFormatted && <HeroAddress>{addressFormatted}</HeroAddress>}
      </HeroContent>
      <PoweredBy>Marque Já</PoweredBy>
    </HeroBanner>
  );
}

function getBusinessStatus(business: Business & { business_hours?: BusinessHours[] }) {
  const hours = business.business_hours;
  if (!hours?.length) return { isOpen: false, label: "Horários disponíveis" };

  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayHours = hours.find((h) => h.day_of_week === dayOfWeek);

  if (!todayHours?.is_open) return { isOpen: false, label: "Fechado hoje" };

  const now = today.getHours() * 60 + today.getMinutes();
  const [openH, openM] = todayHours.open_time.split(":").map(Number);
  const [closeH, closeM] = todayHours.close_time.split(":").map(Number);
  const openMins = openH * 60 + (openM || 0);
  const closeMins = closeH * 60 + (closeM || 0);

  if (now < openMins) return { isOpen: false, label: `Abre às ${todayHours.open_time}` };
  if (now >= closeMins) return { isOpen: false, label: "Fechado agora" };
  return { isOpen: true, label: `Aberto · Fecha às ${todayHours.close_time}` };
}

function DesktopStepList({
  step, booking, services, professionals,
}: {
  step: number;
  booking: BookingState;
  services: Service[];
  professionals: Professional[];
}) {
  const selServices = services.filter((s) => booking.serviceIds.includes(s.id));
  const selProfessional = professionals.find((p) => p.id === booking.professionalId);

  const steps: { label: string; detail?: string }[] = [
    {
      label: "Serviço",
      detail: selServices.length > 0
        ? selServices.map((s) => s.name).join(" + ") + " · " +
          formatPrice(selServices.reduce((a, s) => a + s.price_cents, 0))
        : undefined,
    },
    {
      label: "Profissional",
      detail: step > 2
        ? (booking.professionalId ? selProfessional?.name : "Qualquer disponível") ?? undefined
        : undefined,
    },
    { label: "Data", detail: booking.date ? formatDateShort(booking.date) : undefined },
    { label: "Horário", detail: booking.time ?? undefined },
    { label: "Seus dados", detail: booking.clientName || undefined },
    { label: "Verificar", detail: step > 6 ? "Verificado" : undefined },
    { label: "Confirmar" },
  ];

  return (
    <StepList>
      {steps.map((s, i) => {
        const num = i + 1;
        const isDone = step > num;
        const isActive = step === num;
        const isPending = step < num;
        return (
          <StepItem key={i}>
            <StepDot $done={isDone} $active={isActive}>
              {isDone ? "✓" : num}
            </StepDot>
            <StepInfo>
              <StepName $pending={isPending}>{s.label}</StepName>
              {s.detail && <StepDetail>{s.detail}</StepDetail>}
            </StepInfo>
          </StepItem>
        );
      })}
    </StepList>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingShell({ business, services, professionals }: BookingShellProps) {
  const primaryColor = business.primary_color ?? "#f97316";

  useEffect(() => {
    // Booking page sempre em light mode (design do protótipo)
    const prev = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "light");

    const hex = primaryColor.replace("#", "");
    const rFull = parseInt(hex.slice(0, 2), 16);
    const gFull = parseInt(hex.slice(2, 4), 16);
    const bFull = parseInt(hex.slice(4, 6), 16);

    // Dark shade — fórmula do protótipo: #EA6C0A para #F97316
    const rD = Math.round(rFull * 0.939);
    const gD = Math.round(gFull * 0.939);
    const bD = Math.round(bFull * 0.454);
    const dark = `#${rD.toString(16).padStart(2, "0")}${gD.toString(16).padStart(2, "0")}${bD.toString(16).padStart(2, "0")}`;

    // Hero end stop — tom mais escuro/quente para o final do gradiente hero
    const rH = Math.round(rFull * 0.803);
    const gH = Math.round(gFull * 0.696);
    const bH = Math.round(bFull * 0.227);
    const heroEnd = `rgba(${rH},${gH},${bH},0.95)`;

    document.documentElement.style.setProperty("--color-primary", primaryColor);
    document.documentElement.style.setProperty("--color-primary-dark", dark);
    document.documentElement.style.setProperty("--color-primary-glow", `rgba(${rFull},${gFull},${bFull},0.35)`);
    document.documentElement.style.setProperty("--color-primary-hero-end", heroEnd);

    return () => {
      if (prev) document.documentElement.setAttribute("data-theme", prev);
      else document.documentElement.removeAttribute("data-theme");
    };
  }, [primaryColor]);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [booking, setBooking] = useState<BookingState>({
    serviceIds: [], professionalId: null,
    date: null, time: null, clientName: "", clientPhone: "",
  });
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [createdAppointment, setCreatedAppointment] = useState<CreatedAppointment | null>(null);
  const [showMyAppointments, setShowMyAppointments] = useState(false);
  const [mode, setMode] = useState<"landing" | "booking" | "view-verify" | "view">("landing");

  const goNext = () => { setDirection(1); setStep((s) => s + 1); };
  const goBack = () => { setDirection(-1); setStep((s) => s - 1); };

  const selectedServices = services.filter((s) => booking.serviceIds.includes(s.id));
  const selectedProfessional = professionals.find((p) => p.id === booking.professionalId) ?? null;
  const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration_min, 0) || (business.slot_duration ?? 30);

  const addressFormatted =
    typeof business.address === "object" && business.address !== null
      ? (business.address as { formatted?: string }).formatted ?? "" : "";

  const logoUrl = business.logo_url ?? "/conecta-logo.jpeg";
  const status = getBusinessStatus(business);

  // ── Shared step content renderer ──────────────────────────────────────────
  function renderStepContent() {
    if (createdAppointment) {
      return showMyAppointments ? (
        <MyAppointmentsScreen
          phone={booking.clientPhone} businessId={business.id}
          token={verificationToken!} business={business}
          onBack={() => setShowMyAppointments(false)}
        />
      ) : (
        <SuccessScreen
          appointment={createdAppointment} business={business}
          onViewAppointments={() => setShowMyAppointments(true)}
        />
      );
    }

    if (mode === "landing") {
      return (
        <StepLanding
          business={business}
          onBook={() => { setMode("booking"); setStep(1); }}
          onViewAppointments={() => { setMode("view-verify"); setStep(0); }}
        />
      );
    }

    if (mode === "view-verify" || mode === "view") {
      return (
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={`vv-${step}-${mode}`} custom={direction} variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.22, ease: "easeInOut" }}>
            {mode === "view-verify" && step === 0 && (
              <StepClientForm
                clientName={booking.clientName} clientPhone={booking.clientPhone}
                businessId={business.id}
                onChange={(f, v) => setBooking((b) => ({ ...b, [f]: v }))}
                onNext={() => { setDirection(1); setStep(1); }}
                onBack={() => { setMode("landing"); setStep(1); }}
              />
            )}
            {mode === "view-verify" && step === 1 && (
              <StepPhoneVerification
                clientPhone={booking.clientPhone} businessId={business.id}
                onVerified={(token) => { setVerificationToken(token); setMode("view"); }}
                onBack={() => { setDirection(-1); setStep(0); }}
              />
            )}
            {mode === "view" && (
              <MyAppointmentsScreen
                phone={booking.clientPhone} businessId={business.id}
                token={verificationToken!} business={business}
                onBack={() => { setMode("landing"); setStep(1); }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      );
    }

    // booking flow steps 1–7
    return (
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div key={step} custom={direction} variants={slideVariants}
          initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.22, ease: "easeInOut" }}>
          {step === 1 && (
            <StepServiceSelect services={services} selectedIds={booking.serviceIds}
              onSelect={(ids) => setBooking((b) => ({ ...b, serviceIds: ids, professionalId: null, date: null, time: null }))}
              onAdvance={goNext}
            />
          )}
          {step === 2 && (
            <StepProfessionalSelect professionals={professionals}
              serviceId={booking.serviceIds[0] ?? ""} selectedId={booking.professionalId}
              onSelect={(id) => { setBooking((b) => ({ ...b, professionalId: id, date: null, time: null })); goNext(); }}
              onBack={goBack}
            />
          )}
          {step === 3 && (
            <StepDatePicker business={business} selectedDate={booking.date}
              onSelect={(date) => { setBooking((b) => ({ ...b, date, time: null })); goNext(); }}
              onBack={goBack}
            />
          )}
          {step === 4 && (
            <StepTimePicker businessId={business.id} professionalId={booking.professionalId}
              date={booking.date!} slotDuration={business.slot_duration ?? 30}
              serviceDuration={totalDuration} lunchStart={business.lunch_start}
              lunchEnd={business.lunch_end} selectedTime={booking.time}
              onSelect={(time) => { setBooking((b) => ({ ...b, time })); goNext(); }}
              onBack={goBack}
            />
          )}
          {step === 5 && (
            <StepClientForm
              clientName={booking.clientName} clientPhone={booking.clientPhone}
              businessId={business.id}
              summary={{ serviceNames: selectedServices.map((s) => s.name), date: booking.date, time: booking.time }}
              onChange={(f, v) => setBooking((b) => ({ ...b, [f]: v }))}
              onNext={goNext} onBack={goBack}
            />
          )}
          {step === 6 && (
            <StepPhoneVerification
              clientPhone={booking.clientPhone} businessId={business.id}
              onVerified={(token) => { setVerificationToken(token); goNext(); }}
              onBack={goBack}
            />
          )}
          {step === 7 && (
            <StepConfirmation
              booking={booking} business={business}
              services={selectedServices} professional={selectedProfessional}
              verificationToken={verificationToken!}
              onBack={goBack} onSuccess={(appt) => setCreatedAppointment(appt)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  const isBookingMode = mode === "booking" && !createdAppointment;
  const showDesktopSteps = isBookingMode;

  // ── Desktop left panel label/step ────────────────────────────────────────
  function desktopCurrentStepLabel() {
    if (createdAppointment) return "Confirmado";
    if (mode === "landing") return null;
    if (mode === "view-verify" || mode === "view") return null;
    return STEP_LABELS[step - 1] ?? null;
  }

  return (
    <>
      {/* ── MOBILE ─────────────────────────────────────────────────────── */}
      <MobileWrapper>
        <MobileHero business={business} logoUrl={logoUrl}
          addressFormatted={addressFormatted} primaryColor={primaryColor} status={status} />

        {isBookingMode && (
          <ProgressContainer>
            {step === 1 && (
              <BackToLandingLink onClick={() => setMode("landing")} type="button">
                <ArrowLeft size={12} /> Voltar ao início
              </BackToLandingLink>
            )}
            <ProgressBar>
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <ProgressSegment key={i} $active={i + 1 === step} $done={i + 1 < step} />
              ))}
            </ProgressBar>
            <ProgressLabel>
              <StepCounter>Passo {step}</StepCounter> de {TOTAL_STEPS} — {STEP_LABELS[step - 1]}
            </ProgressLabel>
          </ProgressContainer>
        )}

        <MobileCard>{renderStepContent()}</MobileCard>
      </MobileWrapper>

      {/* ── DESKTOP ────────────────────────────────────────────────────── */}
      <DesktopWrapper>
        {/* Left panel */}
        <LeftPanel $color={primaryColor}>
          {business.logo_url ? <LeftBgBlur $url={logoUrl} /> : null}
          <LeftGradient $color={primaryColor} />
          <LeftNoise />
          <LeftContent>
            <LeftLogo>
              {business.logo_url
                ? <LeftLogoImg src={logoUrl} alt={business.name} />
                : <LeftLogoInitial $color={primaryColor}>{business.name.charAt(0)}</LeftLogoInitial>
              }
            </LeftLogo>
            <LeftBizName>{business.name}</LeftBizName>
            {addressFormatted && <LeftBizAddress>{addressFormatted}</LeftBizAddress>}
            <LeftStatusBadge $open={status.isOpen}>
              <StatusDot $open={status.isOpen} />
              {status.label}
            </LeftStatusBadge>

            {showDesktopSteps ? (
              <DesktopStepList step={step} booking={booking}
                services={services} professionals={professionals} />
            ) : (
              <div style={{ flex: 1 }} />
            )}

            <LeftFooter>Marque Já · Conecta Leste SP</LeftFooter>
          </LeftContent>
        </LeftPanel>

        {/* Right panel */}
        <RightPanel>
          {isBookingMode && step === 1 && (
            <BackToLandingLink
              onClick={() => setMode("landing")} type="button"
              style={{ marginBottom: 16, alignSelf: "flex-start", position: "absolute", top: 20, left: 360 + 48 }}
            >
              <ArrowLeft size={12} /> Voltar ao início
            </BackToLandingLink>
          )}
          <RightCard>{renderStepContent()}</RightCard>
        </RightPanel>
      </DesktopWrapper>
    </>
  );
}
