"use client";

import styled from "styled-components";

interface WeekBarChartProps {
  data: number[]; // 7 values, index 0 = 7 days ago, index 6 = today
}

const DAYS = ["D-6", "D-5", "D-4", "D-3", "D-2", "Ontem", "Hoje"];

function getDayLabels(): string[] {
  const labels: string[] = [];
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(weekdays[d.getDay()]);
  }
  return labels;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const BarsRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 120px;
`;

const BarWrap = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  height: 100%;
  justify-content: flex-end;
`;

const Bar = styled.div<{ $pct: number; $active: boolean }>`
  width: 100%;
  max-width: 40px;
  border-radius: 8px 8px 4px 4px;
  height: ${({ $pct }) => Math.max($pct, 4)}%;
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  background: ${({ $active }) =>
    $active
      ? "var(--gradient-primary)"
      : "rgba(249, 115, 22, 0.15)"};
  box-shadow: ${({ $active }) =>
    $active
      ? "0 4px 16px rgba(249, 115, 22, 0.40), 0 2px 6px rgba(249, 115, 22, 0.20)"
      : "none"};
`;

const BarCount = styled.span<{ $active: boolean }>`
  font-size: 11px;
  font-weight: ${({ $active }) => ($active ? "800" : "500")};
  color: ${({ $active }) => ($active ? "var(--color-primary)" : "var(--color-text-muted)")};
  line-height: 1;
`;

const LabelsRow = styled.div`
  display: flex;
  gap: 10px;
`;

const DayLabel = styled.span<{ $active: boolean }>`
  flex: 1;
  text-align: center;
  font-size: 11px;
  font-weight: ${({ $active }) => ($active ? "700" : "500")};
  color: ${({ $active }) => ($active ? "var(--color-primary)" : "var(--color-text-muted)")};
`;

export default function WeekBarChart({ data }: WeekBarChartProps) {
  const max = Math.max(...data, 1);
  const labels = getDayLabels();

  return (
    <Container>
      <BarsRow>
        {data.map((val, i) => {
          const isToday = i === 6;
          const pct = Math.round((val / max) * 100);
          return (
            <BarWrap key={i}>
              <BarCount $active={isToday}>{val > 0 ? val : ""}</BarCount>
              <Bar $pct={pct} $active={isToday} />
            </BarWrap>
          );
        })}
      </BarsRow>
      <LabelsRow>
        {labels.map((label, i) => (
          <DayLabel key={i} $active={i === 6}>{label}</DayLabel>
        ))}
      </LabelsRow>
    </Container>
  );
}
