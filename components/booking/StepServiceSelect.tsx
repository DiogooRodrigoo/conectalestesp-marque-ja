"use client";

import styled from "styled-components";
import { CheckCircle, Clock } from "@phosphor-icons/react";
import { Service } from "@/types/database";

interface Props {
  services: Service[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  padding: 24px 20px 28px;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.4px;
  margin-bottom: 4px;
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 22px;
`;

const ServiceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ServiceCard = styled.button<{ $selected: boolean }>`
  position: relative;
  width: 100%;
  padding: 16px;
  border-radius: var(--radius-md);
  border: ${({ $selected }) =>
    $selected
      ? "1.5px solid var(--color-primary)"
      : "1px solid var(--color-border)"};
  border-left: ${({ $selected }) =>
    $selected ? "3px solid var(--color-primary)" : "1px solid var(--color-border)"};
  background: ${({ $selected }) =>
    $selected ? "rgba(249,115,22,0.08)" : "var(--color-surface-2)"};
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: ${({ $selected }) =>
      $selected ? "var(--color-primary)" : "#3a3a3a"};
    border-left-color: ${({ $selected }) =>
      $selected ? "var(--color-primary)" : "#3a3a3a"};
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
`;

const ServiceName = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
`;

const CheckBadge = styled.div`
  color: var(--color-primary);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-top: 1px;
`;

const ServiceDescription = styled.p`
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.45;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DurationBadge = styled.span`
  font-size: 12px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Price = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  if (cents === 0) return "Gratuito";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepServiceSelect({ services, selectedId, onSelect }: Props) {
  const activeServices = services
    .filter((s) => s.is_active)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  return (
    <Container>
      <Title>Escolha o serviço</Title>
      <Subtitle>Selecione o que você gostaria de agendar</Subtitle>

      <ServiceList>
        {activeServices.map((service) => {
          const isSelected = service.id === selectedId;
          return (
            <ServiceCard
              key={service.id}
              $selected={isSelected}
              onClick={() => onSelect(service.id)}
              type="button"
            >
              <CardHeader>
                <ServiceName>{service.name}</ServiceName>
                {isSelected && (
                  <CheckBadge>
                    <CheckCircle size={18} weight="fill" />
                  </CheckBadge>
                )}
              </CardHeader>

              {service.description && (
                <ServiceDescription>{service.description}</ServiceDescription>
              )}

              <CardFooter>
                <DurationBadge>
                  <Clock size={13} />
                  {formatDuration(service.duration_min)}
                </DurationBadge>
                <Price>{formatPrice(service.price_cents)}</Price>
              </CardFooter>
            </ServiceCard>
          );
        })}
      </ServiceList>
    </Container>
  );
}
