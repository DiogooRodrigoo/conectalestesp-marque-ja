"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styled from "styled-components";
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

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BookingState {
  serviceIds: string[];         // múltiplos serviços
  professionalId: string | null;
  date: string | null;          // YYYY-MM-DD
  time: string | null;          // HH:MM
  clientName: string;
  clientPhone: string;
}

export interface CreatedAppointment {
  id: string;
  start_at: string;
  services: Service[];          // múltiplos serviços
  professional: Professional | null;
  business: Business;
}

interface BookingShellProps {
  business: Business & { business_hours?: BusinessHours[] };
  services: Service[];
  professionals: Professional[];
}

const TOTAL_STEPS = 7;

const STEP_LABELS = [
  "Serviço",
  "Profissional",
  "Data",
  "Horário",
  "Seus dados",
  "Verificar",
  "Confirmar",
];

// ─── Styled Components ────────────────────────────────────────────────────────

const Wrapper = styled.div`
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 48px;
  position: relative;
  overflow: hidden;
`;

const LogoWatermark = styled.div<{ $url: string }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 320px;
  height: 320px;
  background: url(${({ $url }) => $url}) center / contain no-repeat;
  opacity: 0.045;
  pointer-events: none;
  z-index: 0;
  user-select: none;
`;

const Header = styled.header`
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
`;

const LogoBox = styled.div<{ $color: string }>`
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
  overflow: hidden;
`;

const LogoImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const BusinessName = styled.h1`
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.3px;
`;

const BusinessAddress = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
`;

const ProgressContainer = styled.div`
  width: 100%;
  max-width: 480px;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
`;

const ProgressBar = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
`;

const ProgressSegment = styled.div<{ $active: boolean; $done: boolean }>`
  flex: 1;
  height: 3px;
  border-radius: 99px;
  background: ${({ $active, $done }) =>
    $done
      ? "var(--color-primary)"
      : $active
      ? "var(--color-primary)"
      : "var(--color-border)"};
  transition: background 0.3s ease;
`;

const ProgressLabel = styled.p`
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
`;

const StepCounter = styled.span`
  color: var(--color-primary);
  font-weight: 600;
`;

const Card = styled.div`
  width: 100%;
  max-width: 480px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  position: relative;
  z-index: 1;
`;

const BackToLandingLink = styled.button`
  background: none;
  border: none;
  font-size: 12px;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
  &:hover { color: var(--color-text); }
`;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingShell({ business, services, professionals }: BookingShellProps) {
  useEffect(() => {
    const color = business.primary_color ?? "#f97316";
    const hex = color.replace("#", "");
    const r = Math.round(parseInt(hex.slice(0, 2), 16) * 0.9);
    const g = Math.round(parseInt(hex.slice(2, 4), 16) * 0.9);
    const b = Math.round(parseInt(hex.slice(4, 6), 16) * 0.9);
    const dark = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    document.documentElement.style.setProperty("--color-primary", color);
    document.documentElement.style.setProperty("--color-primary-dark", dark);
  }, [business.primary_color]);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [booking, setBooking] = useState<BookingState>({
    serviceIds: [],
    professionalId: null,
    date: null,
    time: null,
    clientName: "",
    clientPhone: "",
  });
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [createdAppointment, setCreatedAppointment] = useState<CreatedAppointment | null>(null);
  const [showMyAppointments, setShowMyAppointments] = useState(false);
  const [mode, setMode] = useState<"landing" | "booking" | "view-verify" | "view">("landing");

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const selectedServices = services.filter((s) => booking.serviceIds.includes(s.id));
  const selectedProfessional = professionals.find((p) => p.id === booking.professionalId) ?? null;
  const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration_min, 0) || (business.slot_duration ?? 30);

  const addressFormatted =
    typeof business.address === "object" && business.address !== null
      ? (business.address as { formatted?: string }).formatted ?? ""
      : "";

  const logoUrl = business.logo_url ?? "/conecta-logo.jpeg";

  // ── Tela de sucesso pós-agendamento ──────────────────────────────────────────
  if (createdAppointment) {
    return (
      <Wrapper>
        {business.logo_url && <LogoWatermark $url={logoUrl} />}
        <Header>
          <LogoBox $color={business.primary_color ?? "#f97316"}>
            <LogoImg src={logoUrl} alt={business.name} />
          </LogoBox>
          <BusinessName>{business.name}</BusinessName>
        </Header>
        <Card>
          {showMyAppointments ? (
            <MyAppointmentsScreen
              phone={booking.clientPhone}
              businessId={business.id}
              token={verificationToken!}
              business={business}
              onBack={() => setShowMyAppointments(false)}
            />
          ) : (
            <SuccessScreen
              appointment={createdAppointment}
              business={business}
              onViewAppointments={() => setShowMyAppointments(true)}
            />
          )}
        </Card>
      </Wrapper>
    );
  }

  // ── Landing + fluxo "ver agendamentos" pela tela inicial ──────────────────────
  if (mode === "landing" || mode === "view-verify" || mode === "view") {
    return (
      <Wrapper>
        {business.logo_url && <LogoWatermark $url={logoUrl} />}
        <Header>
          <LogoBox $color={business.primary_color ?? "#f97316"}>
            <LogoImg src={logoUrl} alt={business.name} />
          </LogoBox>
          <BusinessName>{business.name}</BusinessName>
          {addressFormatted && <BusinessAddress>{addressFormatted}</BusinessAddress>}
        </Header>
        <Card>
          {mode === "landing" && (
            <StepLanding
              business={business}
              onBook={() => { setMode("booking"); setStep(1); }}
              onViewAppointments={() => { setMode("view-verify"); setStep(0); }}
            />
          )}
          {mode === "view-verify" && (
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`vv-${step}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                {step === 0 && (
                  <StepClientForm
                    clientName={booking.clientName}
                    clientPhone={booking.clientPhone}
                    businessId={business.id}
                    onChange={(field, value) => setBooking((b) => ({ ...b, [field]: value }))}
                    onNext={() => { setDirection(1); setStep(1); }}
                    onBack={() => { setMode("landing"); setStep(1); }}
                  />
                )}
                {step === 1 && (
                  <StepPhoneVerification
                    clientPhone={booking.clientPhone}
                    businessId={business.id}
                    onVerified={(token) => {
                      setVerificationToken(token);
                      setMode("view");
                    }}
                    onBack={() => { setDirection(-1); setStep(0); }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
          {mode === "view" && (
            <MyAppointmentsScreen
              phone={booking.clientPhone}
              businessId={business.id}
              token={verificationToken!}
              business={business}
              onBack={() => { setMode("landing"); setStep(1); }}
            />
          )}
        </Card>
      </Wrapper>
    );
  }

  // ── Fluxo de agendamento (steps 1–7) ─────────────────────────────────────────
  return (
    <Wrapper>
      {business.logo_url && <LogoWatermark $url={logoUrl} />}
      <Header>
        <LogoBox $color={business.primary_color ?? "#f97316"}>
          <LogoImg
            src={logoUrl}
            alt={business.name}
          />
        </LogoBox>
        <BusinessName>{business.name}</BusinessName>
        {addressFormatted && <BusinessAddress>{addressFormatted}</BusinessAddress>}
      </Header>

      <ProgressContainer>
        {step === 1 && (
          <BackToLandingLink onClick={() => setMode("landing")} type="button">
            <ArrowLeft size={12} />
            Voltar ao início
          </BackToLandingLink>
        )}
        <ProgressBar>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <ProgressSegment
              key={i}
              $active={i + 1 === step}
              $done={i + 1 < step}
            />
          ))}
        </ProgressBar>
        <ProgressLabel>
          <StepCounter>Passo {step}</StepCounter> de {TOTAL_STEPS} — {STEP_LABELS[step - 1]}
        </ProgressLabel>
      </ProgressContainer>

      <Card>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            {step === 1 && (
              <StepServiceSelect
                services={services}
                selectedIds={booking.serviceIds}
                onSelect={(ids) => {
                  setBooking((b) => ({
                    ...b,
                    serviceIds: ids,
                    professionalId: null,
                    date: null,
                    time: null,
                  }));
                }}
                onAdvance={goNext}
              />
            )}
            {step === 2 && (
              <StepProfessionalSelect
                professionals={professionals}
                serviceId={booking.serviceIds[0] ?? ""}
                selectedId={booking.professionalId}
                onSelect={(id) => {
                  setBooking((b) => ({ ...b, professionalId: id, date: null, time: null }));
                  goNext();
                }}
                onBack={goBack}
              />
            )}
            {step === 3 && (
              <StepDatePicker
                business={business}
                selectedDate={booking.date}
                onSelect={(date) => {
                  setBooking((b) => ({ ...b, date, time: null }));
                  goNext();
                }}
                onBack={goBack}
              />
            )}
            {step === 4 && (
              <StepTimePicker
                businessId={business.id}
                professionalId={booking.professionalId}
                date={booking.date!}
                slotDuration={business.slot_duration ?? 30}
                serviceDuration={totalDuration}
                lunchStart={business.lunch_start}
                lunchEnd={business.lunch_end}
                selectedTime={booking.time}
                onSelect={(time) => {
                  setBooking((b) => ({ ...b, time }));
                  goNext();
                }}
                onBack={goBack}
              />
            )}
            {step === 5 && (
              <StepClientForm
                clientName={booking.clientName}
                clientPhone={booking.clientPhone}
                businessId={business.id}
                onChange={(field, value) =>
                  setBooking((b) => ({ ...b, [field]: value }))
                }
                onNext={goNext}
                onBack={goBack}
              />
            )}
            {step === 6 && (
              <StepPhoneVerification
                clientPhone={booking.clientPhone}
                businessId={business.id}
                onVerified={(token) => {
                  setVerificationToken(token);
                  goNext();
                }}
                onBack={goBack}
              />
            )}
            {step === 7 && (
              <StepConfirmation
                booking={booking}
                business={business}
                services={selectedServices}
                professional={selectedProfessional}
                verificationToken={verificationToken!}
                onBack={goBack}
                onSuccess={(appt) => setCreatedAppointment(appt)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </Card>
    </Wrapper>
  );
}
