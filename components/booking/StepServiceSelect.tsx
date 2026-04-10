"use client";

import styled, { keyframes } from "styled-components";
import { CheckCircle } from "@phosphor-icons/react";
import { Service } from "@/types/database";

interface Props {
  services: Service[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onAdvance: () => void;
}

// ─── Animations ──────────────────────────────────────────────────────────────

const checkPop = keyframes`
  0%   { transform: scale(0.4); opacity: 0; }
  65%  { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  padding: 24px 20px 28px;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 800;
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
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: ${({ $selected }) =>
    $selected
      ? "1.5px solid rgba(249,115,22,0.28)"
      : "1px solid var(--color-border)"};
  background: ${({ $selected }) =>
    $selected ? "var(--color-primary-subtle)" : "var(--color-surface-2)"};
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s, transform 0.12s;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${({ $selected }) => ($selected ? "var(--gradient-primary)" : "var(--color-border)")};
    border-radius: 4px 0 0 4px;
    transition: background 0.18s ease;
  }

  &:hover {
    transform: translateY(-1px);
    border-color: ${({ $selected }) =>
      $selected ? "rgba(249,115,22,0.4)" : "#a0a0a0"};
  }
  &:active { transform: translateY(0); }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 5px;
`;

const ServiceNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 1;
  min-width: 0;
`;

const ServiceName = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
`;

const PopularBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: var(--color-primary);
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.25);
  border-radius: 99px;
  padding: 2px 7px;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: 0.2px;
`;

const AnimatedCheck = styled.div<{ $visible: boolean }>`
  color: var(--color-primary);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-top: 1px;
  animation: ${({ $visible }) => ($visible ? checkPop : "none")} 0.35s
    cubic-bezier(0.34, 1.56, 0.64, 1) both;
`;

const UncheckedCircle = styled.div`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  flex-shrink: 0;
  margin-top: 1px;
  transition: border-color 0.15s;

  ${ServiceCard}:hover & {
    border-color: var(--color-text-muted);
  }
`;

const ServiceDescription = styled.p`
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.45;
  margin-bottom: 10px;
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
  border: 1px solid rgba(249,115,22,0.18);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  margin-bottom: 14px;
  background: linear-gradient(135deg, rgba(249,115,22,0.07) 0%, rgba(249,115,22,0.02) 100%);
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
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const AdvanceButton = styled.button<{ $disabled: boolean }>`
  width: 100%;
  height: 54px;
  border-radius: var(--radius-md);
  background: ${({ $disabled }) =>
    $disabled ? "var(--color-border)" : "var(--gradient-primary)"};
  color: ${({ $disabled }) => ($disabled ? "var(--color-text-muted)" : "#fff")};
  font-size: 15px;
  font-weight: 800;
  border: none;
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  transition: opacity 0.2s, transform 0.12s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: -0.2px;
  box-shadow: ${({ $disabled }) => ($disabled ? "none" : "var(--shadow-btn)")};
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ $disabled }) =>
      $disabled ? "none" : "linear-gradient(180deg, rgba(255,255,255,0.13) 0%, transparent 60%)"};
    pointer-events: none;
  }

  &:hover {
    opacity: ${({ $disabled }) => ($disabled ? 1 : 0.92)};
    transform: ${({ $disabled }) => ($disabled ? "none" : "translateY(-1px)")};
  }
  &:active {
    transform: translateY(0);
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

  // Serviço mais popular = primeiro da lista (menor display_order)
  const popularId = activeServices[0]?.id;

  const toggleService = (id: string) => {
    navigator.vibrate?.(30);
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
          const isPopular = service.id === popularId && activeServices.length > 1;

          return (
            <ServiceCard
              key={service.id}
              $selected={isSelected}
              onClick={() => toggleService(service.id)}
              type="button"
            >
              <CardHeader>
                <ServiceNameRow>
                  <ServiceName>{service.name}</ServiceName>
                  {isPopular && <PopularBadge>Mais pedido</PopularBadge>}
                </ServiceNameRow>
                {isSelected ? (
                  <AnimatedCheck $visible={isSelected}>
                    <CheckCircle size={20} weight="fill" />
                  </AnimatedCheck>
                ) : (
                  <UncheckedCircle />
                )}
              </CardHeader>

              {service.description && (
                <ServiceDescription>{service.description}</ServiceDescription>
              )}

              <CardFooter>
                <DurationBadge>
                  ⏱ {formatDuration(service.duration_min)}
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
