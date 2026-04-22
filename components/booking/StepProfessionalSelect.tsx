"use client";

import styled from "styled-components";
import { ArrowLeft, CheckCircle } from "@phosphor-icons/react";
import { Professional } from "@/types/database";

interface Props {
  professionals: Professional[];
  serviceId: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
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
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;

  &:hover { color: var(--color-text); }
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

const ProfessionalList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ProfCard = styled.button<{ $selected: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: ${({ $selected }) =>
    $selected
      ? "1.5px solid rgba(var(--color-primary-rgb),0.28)"
      : "1px solid var(--color-border)"};
  background: ${({ $selected }) =>
    $selected ? "var(--color-primary-subtle)" : "var(--color-surface-2)"};
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.12s;
  position: relative;
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
    border-color: ${({ $selected }) =>
      $selected ? "rgba(var(--color-primary-rgb),0.4)" : "#3a3a3a"};
    transform: translateY(-1px);
  }
  &:active { transform: translateY(0); }
`;

const AvatarCircle = styled.div<{ $any?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ $any }) =>
    $any ? "rgba(var(--color-primary-rgb),0.12)" : "rgba(var(--color-primary-rgb),0.15)"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-primary);
  font-size: ${({ $any }) => ($any ? "18px" : "14px")};
  font-weight: 700;
  letter-spacing: 0;
`;

const ProfInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const ProfName = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
`;

const ProfBio = styled.span`
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CheckBadge = styled.div`
  color: var(--color-primary);
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepProfessionalSelect({
  professionals,
  selectedId,
  onSelect,
  onBack,
}: Props) {
  const active = professionals.filter((p) => p.is_active);

  const anySelected = selectedId === null;

  return (
    <Container>
      <BackButton onClick={onBack} type="button">
        <ArrowLeft size={14} weight="bold" /> Voltar
      </BackButton>

      <Title>Escolha o profissional</Title>
      <Subtitle>Selecione com quem deseja ser atendido</Subtitle>

      <ProfessionalList>
        {/* "Qualquer disponível" card */}
        <ProfCard
          key="any"
          $selected={anySelected}
          onClick={() => onSelect(null)}
          type="button"
        >
          <AvatarCircle $any>✦</AvatarCircle>
          <ProfInfo>
            <ProfName>Qualquer disponível</ProfName>
            <ProfBio>Primeiro profissional livre no horário</ProfBio>
          </ProfInfo>
          {anySelected && (
            <CheckBadge><CheckCircle size={20} weight="fill" /></CheckBadge>
          )}
        </ProfCard>

        {/* Individual professional cards */}
        {active.map((prof) => {
          const isSelected = selectedId === prof.id;
          return (
            <ProfCard
              key={prof.id}
              $selected={isSelected}
              onClick={() => onSelect(prof.id)}
              type="button"
            >
              <AvatarCircle>
                {getInitials(prof.name)}
              </AvatarCircle>
              <ProfInfo>
                <ProfName>{prof.name}</ProfName>
                {prof.bio && <ProfBio>{prof.bio}</ProfBio>}
              </ProfInfo>
              {isSelected && (
                <CheckBadge><CheckCircle size={20} weight="fill" /></CheckBadge>
              )}
            </ProfCard>
          );
        })}
      </ProfessionalList>
    </Container>
  );
}
