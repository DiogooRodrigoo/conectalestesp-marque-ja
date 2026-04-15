"use client";

import styled, { keyframes } from "styled-components";

interface AttendanceGaugeProps {
  value: number; // 0–100
}

const RADIUS  = 54;
const STROKE  = 10;
const CENTER  = 72;
const CIRCUM  = 2 * Math.PI * RADIUS;

const drawIn = keyframes`
  from { stroke-dashoffset: ${CIRCUM}; }
`;

const Svg = styled.svg`
  display: block;
  margin: 0 auto;
  overflow: visible;
`;

const TrackCircle = styled.circle`
  fill: none;
  stroke: rgba(249, 115, 22, 0.12);
  stroke-width: ${STROKE};
`;

const ProgressCircle = styled.circle<{ $offset: number }>`
  fill: none;
  stroke: url(#gaugeGrad);
  stroke-width: ${STROKE};
  stroke-linecap: round;
  stroke-dasharray: ${CIRCUM};
  stroke-dashoffset: ${({ $offset }) => $offset};
  transform: rotate(-90deg);
  transform-origin: ${CENTER}px ${CENTER}px;
  animation: ${drawIn} 1s cubic-bezier(0.4, 0, 0.2, 1) both;
`;

const ValueText = styled.text`
  fill: var(--color-text);
  font-family: 'Cabinet Grotesk', inherit;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -1px;
  dominant-baseline: middle;
  text-anchor: middle;
`;

const SubText = styled.text`
  fill: var(--color-text-muted);
  font-size: 12px;
  font-weight: 500;
  dominant-baseline: middle;
  text-anchor: middle;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const Legend = styled.p`
  font-size: 12.5px;
  color: var(--color-text-muted);
  text-align: center;
  line-height: 1.5;
`;

export default function AttendanceGauge({ value }: AttendanceGaugeProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const offset  = CIRCUM * (1 - clamped / 100);

  return (
    <Wrapper>
      <Svg width={144} height={144} viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#F97316" />
            <stop offset="100%" stopColor="#FB923C" />
          </linearGradient>
        </defs>
        <TrackCircle cx={CENTER} cy={CENTER} r={RADIUS} />
        <ProgressCircle cx={CENTER} cy={CENTER} r={RADIUS} $offset={offset} />
        <ValueText x={CENTER} y={CENTER - 8}>{clamped}%</ValueText>
        <SubText x={CENTER} y={CENTER + 18}>comparecimento</SubText>
      </Svg>
      <Legend>
        {clamped >= 80
          ? "Excelente! Clientes muito comprometidos."
          : clamped >= 50
          ? "Bom comparecimento este mês."
          : "Acompanhe os cancelamentos."}
      </Legend>
    </Wrapper>
  );
}
