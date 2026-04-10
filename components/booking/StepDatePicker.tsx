"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { Business, BusinessHours } from "@/types/database";

interface Props {
  business: Business & { business_hours?: BusinessHours[] };
  selectedDate: string | null;
  onSelect: (date: string) => void;
  onBack: () => void;
}

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  padding: 24px 20px 28px;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
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

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
`;

const MonthLabel = styled.span`
  font-size: 16px;
  font-weight: 800;
  color: var(--color-text);
  text-transform: capitalize;
  letter-spacing: -0.3px;
`;

const NavButton = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.18s, color 0.18s, border-color 0.18s;

  &:hover {
    border-color: var(--color-text-muted);
    color: var(--color-text);
  }

  &:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }
`;

const WeekDays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 6px;
`;

const WeekDay = styled.span`
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  padding: 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
`;

const DayCell = styled.button<{
  $today: boolean;
  $selected: boolean;
  $disabled: boolean;
  $empty: boolean;
}>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: ${({ $selected, $today }) =>
    $selected
      ? "var(--gradient-primary)"
      : $today
      ? "rgba(249,115,22,0.12)"
      : "transparent"};
  box-shadow: ${({ $selected }) =>
    $selected ? "0 4px 12px var(--color-primary-glow)" : "none"};
  color: ${({ $selected, $disabled, $empty, $today }) =>
    $empty
      ? "transparent"
      : $selected
      ? "#fff"
      : $disabled
      ? "var(--color-text)"
      : $today
      ? "var(--color-primary)"
      : "var(--color-text)"};
  opacity: ${({ $disabled, $empty }) => ($empty ? 0 : $disabled ? 0.25 : 1)};
  font-size: 14px;
  font-weight: ${({ $selected, $today }) =>
    $selected ? "700" : $today ? "600" : "400"};
  cursor: ${({ $disabled, $empty }) =>
    $empty || $disabled ? "not-allowed" : "pointer"};
  pointer-events: ${({ $empty, $disabled }) =>
    $empty || $disabled ? "none" : "auto"};
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s, transform 0.12s;

  &:hover {
    background: ${({ $selected, $disabled, $empty }) =>
      $selected || $disabled || $empty ? undefined : "var(--color-surface-2)"};
    transform: ${({ $selected, $disabled, $empty }) =>
      $selected || $disabled || $empty ? "none" : "scale(1.05)"};
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepDatePicker({ business, selectedDate, onSelect, onBack }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/blocked-dates?business_id=${business.id}&year=${viewYear}&month=${viewMonth + 1}`)
      .then((r) => r.ok ? r.json() : { blocked_dates: [] })
      .then((data) => setBlockedDates(new Set(data.blocked_dates ?? [])))
      .catch(() => {});
  }, [business.id, viewYear, viewMonth]);

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + (business.advance_booking_days ?? 30));

  // Days the business is closed (based on business_hours if available)
  const closedDays = new Set<number>();
  if (business.business_hours) {
    business.business_hours.forEach((bh) => {
      if (!bh.is_open) closedDays.add(bh.day_of_week);
    });
  }

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
  const startOffset = firstDayOfMonth.getDay(); // 0=Sun

  const totalCells = Math.ceil((startOffset + lastDayOfMonth.getDate()) / 7) * 7;

  const canGoPrev = !(viewYear === today.getFullYear() && viewMonth === today.getMonth());

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const handlePrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <Container>
      <BackButton onClick={onBack} type="button">
        ← Voltar
      </BackButton>

      <Title>Escolha a data</Title>
      <Subtitle>Selecione o dia que prefere ser atendido</Subtitle>

      <CalendarHeader>
        <NavButton onClick={handlePrev} disabled={!canGoPrev} type="button">‹</NavButton>
        <MonthLabel>{monthLabel}</MonthLabel>
        <NavButton onClick={handleNext} type="button">›</NavButton>
      </CalendarHeader>

      <WeekDays>
        {WEEK_DAYS.map((d) => (
          <WeekDay key={d}>{d}</WeekDay>
        ))}
      </WeekDays>

      <DaysGrid>
        {Array.from({ length: totalCells }).map((_, i) => {
          const dayNum = i - startOffset + 1;
          const isEmpty = dayNum < 1 || dayNum > lastDayOfMonth.getDate();

          if (isEmpty) {
            return (
              <DayCell
                key={i}
                $empty
                $today={false}
                $selected={false}
                $disabled={false}
              />
            );
          }

          const cellDate = new Date(viewYear, viewMonth, dayNum);
          const ymd = toYMD(cellDate);
          const isToday = toYMD(today) === ymd;
          const isSelected = selectedDate === ymd;
          const isPast = cellDate < today;
          const isTooFar = cellDate > maxDate;
          const isClosed = closedDays.has(cellDate.getDay());
          const isFullDayBlocked = blockedDates.has(ymd);
          const isDisabled = isPast || isTooFar || isClosed || isFullDayBlocked;

          return (
            <DayCell
              key={i}
              $empty={false}
              $today={isToday}
              $selected={isSelected}
              $disabled={isDisabled}
              type="button"
              onClick={() => !isDisabled && onSelect(ymd)}
            >
              {dayNum}
            </DayCell>
          );
        })}
      </DaysGrid>
    </Container>
  );
}
