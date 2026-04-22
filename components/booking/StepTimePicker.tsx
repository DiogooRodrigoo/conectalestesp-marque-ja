"use client";

import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { ArrowLeft, CalendarBlank } from "@phosphor-icons/react";

interface Props {
  businessId: string;
  professionalId: string | null;
  date: string;
  slotDuration: number;
  serviceDuration: number;
  lunchStart?: string | null;
  lunchEnd?: string | null;
  selectedTime: string | null;
  onSelect: (time: string) => void;
  onBack: () => void;
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
  &:hover { color: var(--color-text); }
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text);
  margin-bottom: 4px;
  letter-spacing: -0.4px;
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 22px;
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;

const LoadingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const SkeletonChip = styled.div<{ $delay?: string }>`
  height: 44px;
  border-radius: 10px;
  background: var(--color-surface-2);
  animation: ${pulse} 1.5s ease ${({ $delay }) => $delay ?? "0s"} infinite;
`;

const SkeletonPeriodHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  margin-bottom: 10px;
`;

const SkeletonPill = styled.div`
  height: 24px;
  width: 80px;
  border-radius: 99px;
  background: var(--color-surface-2);
  animation: ${pulse} 1.5s ease infinite;
`;

const SkeletonLine = styled.div`
  flex: 1;
  height: 1px;
  background: var(--color-border);
`;

// ── Pill-style section header ─────────────────────────────────────────────────

const PeriodHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  margin-bottom: 10px;

  &:first-of-type {
    margin-top: 0;
  }
`;

const PeriodPill = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 99px;
  padding: 4px 12px 4px 8px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const PeriodLine = styled.div`
  flex: 1;
  height: 1px;
  background: var(--color-border);
`;

const SlotsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const TimeChipWrapper = styled.div`
  position: relative;
`;

const TimeChip = styled.button<{ $selected: boolean; $last?: boolean }>`
  width: 100%;
  min-height: 44px;
  border-radius: 10px;
  border: 1.5px solid ${({ $selected, $last }) =>
    $selected ? "transparent" : $last ? "rgba(239,68,68,0.35)" : "var(--color-border)"};
  background: ${({ $selected }) =>
    $selected ? "var(--gradient-primary)" : "var(--color-surface-2)"};
  box-shadow: ${({ $selected }) =>
    $selected ? "0 4px 12px var(--color-primary-glow)" : "none"};
  color: ${({ $selected }) => ($selected ? "#fff" : "var(--color-text)")};
  font-size: 14px;
  font-weight: ${({ $selected }) => ($selected ? "600" : "400")};
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.12s, box-shadow 0.15s;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ $selected }) =>
      $selected ? "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 60%)" : "none"};
    pointer-events: none;
  }

  &:hover {
    border-color: ${({ $selected, $last }) =>
      $selected ? "transparent" : $last ? "rgba(239,68,68,0.55)" : "#a0a0a0"};
    transform: translateY(-1px);
  }
  &:active { transform: translateY(0); }
`;

const LastSlotBadge = styled.div`
  position: absolute;
  top: -7px;
  right: -4px;
  font-size: 9px;
  font-weight: 700;
  background: var(--color-danger);
  color: #fff;
  border-radius: 99px;
  padding: 2px 6px;
  letter-spacing: 0.2px;
  pointer-events: none;
  white-space: nowrap;
`;

// ─── Card de almoço ───────────────────────────────────────────────────────────

const LunchCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 16px 0;
  padding: 12px 14px;
  background: rgba(245, 158, 11, 0.07);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: var(--radius-md);
`;

const LunchIcon = styled.div`
  font-size: 18px;
  flex-shrink: 0;
  line-height: 1;
`;

const LunchText = styled.p`
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;

  strong {
    color: var(--color-text);
    font-weight: 600;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 36px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const EmptyIcon = styled.div`
  color: var(--color-text-muted);
  opacity: 0.4;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: var(--color-text-muted);
  font-weight: 500;
`;

const EmptyHint = styled.p`
  font-size: 12px;
  color: var(--color-text-muted);
  opacity: 0.6;
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupSlotsByPeriod(slots: string[]): {
  manha: string[];
  tarde: string[];
  noite: string[];
} {
  const manha: string[] = [];
  const tarde: string[] = [];
  const noite: string[] = [];

  for (const slot of slots) {
    const [hourStr] = slot.split(":");
    const hour = parseInt(hourStr, 10);
    if (hour < 12) {
      manha.push(slot);
    } else if (hour < 18) {
      tarde.push(slot);
    } else {
      noite.push(slot);
    }
  }

  return { manha, tarde, noite };
}

// ─── Sub-component: Period Section ───────────────────────────────────────────

function PeriodSection({
  icon,
  label,
  slots,
  selectedTime,
  onSelect,
}: {
  icon: string;
  label: string;
  slots: string[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
}) {
  if (slots.length === 0) return null;
  const lastSlot = slots[slots.length - 1];
  const isOnlyOne = slots.length === 1;

  return (
    <>
      <PeriodHeader>
        <PeriodPill>
          {icon}
          {label}
        </PeriodPill>
        <PeriodLine />
      </PeriodHeader>
      <SlotsGrid>
        {slots.map((slot) => {
          const isLast = slot === lastSlot && isOnlyOne;
          return (
            <TimeChipWrapper key={slot}>
              <TimeChip
                $selected={selectedTime === slot}
                $last={isLast}
                type="button"
                onClick={() => onSelect(slot)}
              >
                {slot}
              </TimeChip>
              {isLast && <LastSlotBadge>Último</LastSlotBadge>}
            </TimeChipWrapper>
          );
        })}
      </SlotsGrid>
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepTimePicker({
  businessId,
  professionalId,
  date,
  slotDuration,
  serviceDuration,
  lunchStart,
  lunchEnd,
  selectedTime,
  onSelect,
  onBack,
}: Props) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const params = new URLSearchParams({ business_id: businessId, date });
    if (professionalId) params.set("professional_id", professionalId);
    if (serviceDuration && serviceDuration !== slotDuration) {
      params.set("duration", serviceDuration.toString());
    }

    fetch(`/api/slots?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar horários");
        return res.json();
      })
      .then((data: { slots: string[] }) => {
        setSlots(data.slots ?? []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [businessId, professionalId, date, serviceDuration, slotDuration]);

  const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const { manha, tarde, noite } = groupSlotsByPeriod(slots);
  const hasLunchBreak = !!lunchStart && !!lunchEnd;

  return (
    <Container>
      <BackButton onClick={onBack} type="button">
        <ArrowLeft size={14} weight="bold" /> Voltar
      </BackButton>

      <Title>Escolha o horário</Title>
      <Subtitle style={{ textTransform: "capitalize" }}>{formattedDate}</Subtitle>

      {loading && (
        <>
          <SkeletonPeriodHeader>
            <SkeletonPill />
            <SkeletonLine />
          </SkeletonPeriodHeader>
          <LoadingGrid>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonChip key={i} $delay={`${i * 0.08}s`} />
            ))}
          </LoadingGrid>
          <SkeletonPeriodHeader>
            <SkeletonPill style={{ width: 64 }} />
            <SkeletonLine />
          </SkeletonPeriodHeader>
          <LoadingGrid>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonChip key={i} $delay={`${(i + 6) * 0.08}s`} />
            ))}
          </LoadingGrid>
        </>
      )}

      {!loading && error && (
        <EmptyState>
          <EmptyIcon><CalendarBlank size={36} weight="thin" /></EmptyIcon>
          <EmptyText>Não foi possível carregar os horários.</EmptyText>
          <EmptyHint>Tente voltar e selecionar outra data.</EmptyHint>
        </EmptyState>
      )}

      {!loading && !error && slots.length === 0 && (
        <EmptyState>
          <EmptyIcon><CalendarBlank size={36} weight="thin" /></EmptyIcon>
          <EmptyText>Nenhum horário disponível</EmptyText>
          <EmptyHint>Tente voltar e escolher outra data.</EmptyHint>
        </EmptyState>
      )}

      {!loading && !error && slots.length > 0 && (
        <>
          <PeriodSection
            icon="☀️"
            label="Manhã"
            slots={manha}
            selectedTime={selectedTime}
            onSelect={onSelect}
          />

          {hasLunchBreak && manha.length > 0 && tarde.length > 0 && (
            <LunchCard>
              <LunchIcon>🍴</LunchIcon>
              <LunchText>
                <strong>Almoço</strong> — horários suspensos das{" "}
                <strong>{lunchStart}</strong> às <strong>{lunchEnd}</strong>
              </LunchText>
            </LunchCard>
          )}

          <PeriodSection
            icon="🌤"
            label="Tarde"
            slots={tarde}
            selectedTime={selectedTime}
            onSelect={onSelect}
          />

          <PeriodSection
            icon="🌙"
            label="Noite"
            slots={noite}
            selectedTime={selectedTime}
            onSelect={onSelect}
          />
        </>
      )}
    </Container>
  );
}
