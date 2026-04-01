"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styled from "styled-components";
import { Business, Service, Professional } from "@/types/database";
import StepServiceSelect from "./StepServiceSelect";
import StepProfessionalSelect from "./StepProfessionalSelect";
import StepDatePicker from "./StepDatePicker";
import StepTimePicker from "./StepTimePicker";
import StepClientForm from "./StepClientForm";
import StepConfirmation from "./StepConfirmation";
import SuccessScreen from "./SuccessScreen";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BookingState {
  serviceId: string | null;
  professionalId: string | null;
  date: string | null;      // YYYY-MM-DD
  time: string | null;      // HH:MM
  clientName: string;
  clientPhone: string;
}

export interface CreatedAppointment {
  id: string;
  start_at: string;
  service: Service;
  professional: Professional | null;
  business: Business;
}

interface BookingShellProps {
  business: Business;
  services: Service[];
  professionals: Professional[];
}

const TOTAL_STEPS = 6;

const STEP_LABELS = [
  "Serviço",
  "Profissional",
  "Data",
  "Horário",
  "Seus dados",
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
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [booking, setBooking] = useState<BookingState>({
    serviceId: null,
    professionalId: null,
    date: null,
    time: null,
    clientName: "",
    clientPhone: "",
  });
  const [createdAppointment, setCreatedAppointment] = useState<CreatedAppointment | null>(null);

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const selectedService = services.find((s) => s.id === booking.serviceId) ?? null;
  const selectedProfessional = professionals.find((p) => p.id === booking.professionalId) ?? null;

  const logoInitials = business.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const addressFormatted =
    typeof business.address === "object" && business.address !== null
      ? (business.address as { formatted?: string }).formatted ?? ""
      : "";

  if (createdAppointment) {
    return (
      <Wrapper>
        <Header>
          <LogoBox $color={business.primary_color}>
            {business.logo_url ? (
              <LogoImg src={business.logo_url} alt={business.name} />
            ) : (
              logoInitials
            )}
          </LogoBox>
          <BusinessName>{business.name}</BusinessName>
        </Header>
        <Card>
          <SuccessScreen
            appointment={createdAppointment}
            business={business}
          />
        </Card>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Header>
        <LogoBox $color={business.primary_color}>
          {business.logo_url ? (
            <LogoImg src={business.logo_url} alt={business.name} />
          ) : (
            logoInitials
          )}
        </LogoBox>
        <BusinessName>{business.name}</BusinessName>
        {addressFormatted && <BusinessAddress>{addressFormatted}</BusinessAddress>}
      </Header>

      <ProgressContainer>
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
                selectedId={booking.serviceId}
                onSelect={(id) => {
                  setBooking((b) => ({ ...b, serviceId: id, professionalId: null, date: null, time: null }));
                  goNext();
                }}
              />
            )}
            {step === 2 && (
              <StepProfessionalSelect
                professionals={professionals}
                serviceId={booking.serviceId!}
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
                slotDuration={business.slot_duration}
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
                onChange={(field, value) =>
                  setBooking((b) => ({ ...b, [field]: value }))
                }
                onNext={goNext}
                onBack={goBack}
              />
            )}
            {step === 6 && (
              <StepConfirmation
                booking={booking}
                business={business}
                service={selectedService!}
                professional={selectedProfessional}
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
