"use client";

import styled from "styled-components";
import { CheckCircle, Clock, Plus, Minus } from "@phosphor-icons/react";
import { Service } from "@/types/database";

interface Props {
  services: Service[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onAdvance: () => void;
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
  margin-bottom: 20px;
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

// ─── Footer de total ──────────────────────────────────────────────────────────

const TotalFooter = styled.div`
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  margin-bottom: 14px;
  background: var(--color-surface-2);
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TotalLabel = styled.span`
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 500;
`;

const TotalValue = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
`;

const TotalPriceValue = styled.span`
  font-size: 18px;
  font-weight: 800;
  color: var(--color-primary);
`;

const AdvanceButton = styled.button<{ $disabled: boolean }>`
  width: 100%;
  height: 52px;
  border-radius: 12px;
  background: ${({ $disabled }) =>
    $disabled ? "var(--color-border)" : "var(--color-primary)"};
  color: ${({ $disabled }) => ($disabled ? "var(--color-text-muted)" : "#fff")};
  font-size: 15px;
  font-weight: 700;
  border: none;
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  transition: opacity 0.2s, background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    opacity: ${({ $disabled }) => ($disabled ? 1 : 0.88)};
  }
`;

const SelectedCountBadge = styled.span`
  background: rgba(255, 255, 255, 0.25);
  border-radius: 99px;
  font-size: 13px;
  font-weight: 700;
  padding: 2px 8px;
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

export default function StepServiceSelect({ services, selectedIds, onSelect, onAdvance }: Props) {
  const activeServices = services
    .filter((s) => s.is_active)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const selectedServices = activeServices.filter((s) => selectedIds.includes(s.id));
  const totalPrice = selectedServices.reduce((acc, s) => acc + s.price_cents, 0);
  const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration_min, 0);
  const hasSelection = selectedIds.length > 0;

  const toggleService = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelect([...selectedIds, id]);
    }
  };

  return (
    <Container>
      <Title>Escolha o serviço</Title>
      <Subtitle>Selecione um ou mais serviços para agendar</Subtitle>

      <ServiceList>
        {activeServices.map((service) => {
          const isSelected = selectedIds.includes(service.id);
          return (
            <ServiceCard
              key={service.id}
              $selected={isSelected}
              onClick={() => toggleService(service.id)}
              type="button"
            >
              <CardHeader>
                <ServiceName>{service.name}</ServiceName>
                {isSelected ? (
                  <CheckBadge>
                    <CheckCircle size={18} weight="fill" />
                  </CheckBadge>
                ) : (
                  <CheckBadge style={{ color: "var(--color-text-muted)", opacity: 0.4 }}>
                    <Plus size={18} weight="bold" />
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

      {hasSelection && (
        <TotalFooter>
          <TotalRow>
            <TotalLabel>Duração total</TotalLabel>
            <TotalValue>{formatDuration(totalDuration)}</TotalValue>
          </TotalRow>
          <TotalRow>
            <TotalLabel>Total</TotalLabel>
            <TotalPriceValue>{formatPrice(totalPrice)}</TotalPriceValue>
          </TotalRow>
        </TotalFooter>
      )}

      <AdvanceButton
        type="button"
        $disabled={!hasSelection}
        disabled={!hasSelection}
        onClick={hasSelection ? onAdvance : undefined}
      >
        {hasSelection ? (
          <>
            Avançar
            <SelectedCountBadge>
              {selectedIds.length} {selectedIds.length === 1 ? "serviço" : "serviços"}
            </SelectedCountBadge>
          </>
        ) : (
          "Selecione ao menos um serviço"
        )}
      </AdvanceButton>
    </Container>
  );
}
