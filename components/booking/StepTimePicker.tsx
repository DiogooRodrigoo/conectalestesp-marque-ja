"use client";

import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { ArrowLeft, CalendarBlank, ForkKnife } from "@phosphor-icons/react";

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

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;

const LoadingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const SkeletonChip = styled.div`
  height: 44px;
  border-radius: 10px;
  background: var(--color-surface-2);
  animation: ${pulse} 1.5s ease infinite;
`;

const SectionLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 16px;
  margin-bottom: 8px;

  &:first-child {
    margin-top: 0;
  }
`;

const SlotsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const TimeChip = styled.button<{ $selected: boolean }>`
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid ${({ $selected }) =>
    $selected ? "var(--color-primary)" : "var(--color-border)"};
  background: ${({ $selected }) =>
    $selected ? "var(--color-primary)" : "var(--color-surface-2)"};
  color: ${({ $selected }) => ($selected ? "#fff" : "var(--color-text)")};
  font-size: 14px;
  font-weight: ${({ $selected }) => ($selected ? "600" : "400")};
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover {
    border-color: ${({ $selected }) => ($selected ? "var(--color-primary)" : "#3a3a3a")};
  }
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
  color: #F59E0B;
  display: flex;
  align-items: center;
  flex-shrink: 0;
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

  // Verifica se tem configuração de almoço para mostrar o card
  const hasLunchBreak = !!lunchStart && !!lunchEnd;

  return (
    <Container>
      <BackButton onClick={onBack} type="button">
        <ArrowLeft size={16} />
        Voltar
      </BackButton>

      <Title>Escolha o horário</Title>
      <Subtitle style={{ textTransform: "capitalize" }}>{formattedDate}</Subtitle>

      {loading && (
        <LoadingGrid>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonChip key={i} />
          ))}
        </LoadingGrid>
      )}

      {!loading && error && (
        <EmptyState>
          <EmptyIcon>
            <CalendarBlank size={36} />
          </EmptyIcon>
          <EmptyText>Não foi possível carregar os horários.</EmptyText>
          <EmptyHint>Tente voltar e selecionar outra data.</EmptyHint>
        </EmptyState>
      )}

      {!loading && !error && slots.length === 0 && (
        <EmptyState>
          <EmptyIcon>
            <CalendarBlank size={36} />
          </EmptyIcon>
          <EmptyText>Nenhum horário disponível</EmptyText>
          <EmptyHint>Tente voltar e escolher outra data.</EmptyHint>
        </EmptyState>
      )}

      {!loading && !error && slots.length > 0 && (
        <>
          {manha.length > 0 && (
            <>
              <SectionLabel>Manhã</SectionLabel>
              <SlotsGrid>
                {manha.map((slot) => (
                  <TimeChip
                    key={slot}
                    $selected={selectedTime === slot}
                    type="button"
                    onClick={() => onSelect(slot)}
                  >
                    {slot}
                  </TimeChip>
                ))}
              </SlotsGrid>
            </>
          )}

          {hasLunchBreak && manha.length > 0 && tarde.length > 0 && (
            <LunchCard>
              <LunchIcon>
                <ForkKnife size={18} weight="fill" />
              </LunchIcon>
              <LunchText>
                <strong>Almoço</strong> — horários suspensos das{" "}
                <strong>{lunchStart}</strong> às <strong>{lunchEnd}</strong>
              </LunchText>
            </LunchCard>
          )}

          {tarde.length > 0 && (
            <>
              <SectionLabel>Tarde</SectionLabel>
              <SlotsGrid>
                {tarde.map((slot) => (
                  <TimeChip
                    key={slot}
                    $selected={selectedTime === slot}
                    type="button"
                    onClick={() => onSelect(slot)}
                  >
                    {slot}
                  </TimeChip>
                ))}
              </SlotsGrid>
            </>
          )}

          {noite.length > 0 && (
            <>
              <SectionLabel>Noite</SectionLabel>
              <SlotsGrid>
                {noite.map((slot) => (
                  <TimeChip
                    key={slot}
                    $selected={selectedTime === slot}
                    type="button"
                    onClick={() => onSelect(slot)}
                  >
                    {slot}
                  </TimeChip>
                ))}
              </SlotsGrid>
            </>
          )}
        </>
      )}
    </Container>
  );
}
