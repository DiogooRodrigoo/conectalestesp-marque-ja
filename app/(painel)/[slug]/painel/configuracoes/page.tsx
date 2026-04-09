"use client";

import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  Buildings, Phone, MapPin, Link as LinkIcon,
  Copy, Check, Clock, PaintBucket, WhatsappLogo, Info, ForkKnife,
} from "@phosphor-icons/react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useBusiness } from "../BusinessContext";
import Spinner from "@/components/ui/Spinner";
import type { BusinessHours } from "@/types/database";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  padding: 28px 32px;
  max-width: 680px;
  animation: ${fadeUp} 0.25s ease both;
  @media (max-width: 640px) { padding: 16px; }
`;

const TitleBlock = styled.div`margin-bottom: 20px;`;
const PageTitle = styled.h1`font-size: 22px; font-weight: 700; color: var(--color-text); letter-spacing: -0.4px;`;
const PageSub = styled.p`font-size: 13px; color: var(--color-text-muted); margin-top: 4px;`;

const AgencyBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(249,115,22,0.05);
  border: 1px solid rgba(249,115,22,0.15);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  margin-bottom: 24px;
`;

const BannerIcon = styled.div`
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 1px;
`;

const BannerBody = styled.div`flex: 1;`;

const BannerText = styled.p`font-size: 13px; color: var(--color-text-muted); line-height: 1.55;`;

const BannerLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-primary);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  background: rgba(249,115,22,0.08);
  border: 1px solid rgba(249,115,22,0.15);

  &:hover { background: rgba(249,115,22,0.14); }
`;

const Section = styled.div<{ $delay?: number }>`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 16px;
  animation: ${fadeUp} 0.25s ease both;
  animation-delay: ${({ $delay }) => $delay ?? 0}s;
`;

const SectionHeader = styled.div`
  display: flex; align-items: center; gap: 10px;
  padding: 16px 20px; border-bottom: 1px solid var(--color-border);
`;

const SectionIcon = styled.div`
  width: 30px; height: 30px; border-radius: var(--radius-sm);
  background: rgba(249,115,22,0.1); color: var(--color-primary);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`;

const SectionTitle = styled.h2`font-size: 14px; font-weight: 600; color: var(--color-text);`;

const SectionBody = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 520px) { grid-template-columns: 1fr; }
`;

const Field = styled.div``;

const FieldLabel = styled.p`
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 5px;
`;

const FieldValue = styled.p`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.4;
`;

const FieldEmpty = styled.span`
  font-size: 13px;
  color: var(--color-border);
  font-style: italic;
`;

const LinkRow = styled.div`display: flex; align-items: center; gap: 8px;`;

const LinkPreview = styled.div`
  flex: 1; height: 40px; background: var(--color-surface-2); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); padding: 0 12px;
  display: flex; align-items: center; gap: 6px;
  font-size: 12.5px; color: var(--color-text-muted); overflow: hidden; white-space: nowrap;
`;

const LinkSlug = styled.span`color: var(--color-primary); font-weight: 600; flex-shrink: 0;`;

const CopyBtn = styled.button<{ $copied: boolean }>`
  height: 40px; width: 40px; border-radius: var(--radius-sm);
  background: ${({ $copied }) => $copied ? "rgba(34,197,94,0.1)" : "var(--color-surface-2)"};
  border: 1px solid ${({ $copied }) => $copied ? "rgba(34,197,94,0.25)" : "var(--color-border)"};
  color: ${({ $copied }) => $copied ? "var(--color-success)" : "var(--color-text-muted)"};
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  &:hover { background: var(--color-surface-2); color: var(--color-text); }
`;

const ColorDisplay = styled.div`display: flex; align-items: center; gap: 10px;`;

const ColorCircle = styled.div<{ $color: string }>`
  width: 28px; height: 28px; border-radius: 50%;
  background: ${({ $color }) => $color};
  border: 2px solid rgba(255,255,255,0.15);
  flex-shrink: 0;
`;

const HoursGrid = styled.div`display: flex; flex-direction: column; gap: 4px;`;

const HourRow = styled.div`
  display: grid;
  grid-template-columns: 52px 1fr;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-border);
  &:last-child { border-bottom: none; }
`;

const DayLabel = styled.span<{ $open: boolean }>`
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: ${({ $open }) => $open ? "var(--color-primary)" : "var(--color-border)"};
`;

const HourValue = styled.span`font-size: 13px; color: var(--color-text-muted);`;

const LoadingCenter = styled.div`display: flex; align-items: center; justify-content: center; padding: 80px;`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const { business, loading: bizLoading } = useBusiness();
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!business) return;
    getSupabaseClient()
      .from("business_hours")
      .select("*")
      .eq("business_id", business.id)
      .order("day_of_week")
      .then(({ data }) => setHours(data ?? []));
  }, [business]);

  function handleCopy() {
    navigator.clipboard.writeText(`https://marqueja.conectalestesp.com.br/${business?.slug}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (bizLoading) return <LoadingCenter><Spinner size="lg" /></LoadingCenter>;
  if (!business) return null;

  const address = (business.address as { formatted?: string })?.formatted;

  return (
    <Page>
      <TitleBlock>
        <PageTitle>Configurações</PageTitle>
        <PageSub>Dados e configurações do seu negócio</PageSub>
      </TitleBlock>

      <AgencyBanner>
        <BannerIcon><Info size={16} weight="fill" /></BannerIcon>
        <BannerBody>
          <BannerText>
            As configurações do seu negócio são gerenciadas pela <strong>Conecta Leste SP</strong>.
            Para solicitar qualquer alteração — nome, horários, serviços ou aparência —
            entre em contato diretamente com a agência.
          </BannerText>
          <BannerLink
            href="https://wa.me/5511999999999?text=Olá!%20Preciso%20alterar%20as%20configurações%20do%20meu%20negócio%20no%20Marque%20Já"
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsappLogo size={13} weight="fill" />
            Solicitar alteração via WhatsApp
          </BannerLink>
        </BannerBody>
      </AgencyBanner>

      <Section $delay={0}>
        <SectionHeader>
          <SectionIcon><Buildings size={16} weight="fill" /></SectionIcon>
          <SectionTitle>Informações do Negócio</SectionTitle>
        </SectionHeader>
        <SectionBody>
          <FieldGrid>
            <Field>
              <FieldLabel>Nome do estabelecimento</FieldLabel>
              <FieldValue>{business.name}</FieldValue>
            </Field>
            <Field>
              <FieldLabel>WhatsApp do dono</FieldLabel>
              <FieldValue>
                {business.phone_whatsapp
                  ? <><Phone size={13} style={{ marginRight: 4 }} />{business.phone_whatsapp}</>
                  : <FieldEmpty>não informado</FieldEmpty>
                }
              </FieldValue>
            </Field>
          </FieldGrid>

          <Field>
            <FieldLabel>Endereço</FieldLabel>
            <FieldValue>
              {address
                ? <><MapPin size={13} style={{ marginRight: 4 }} />{address}</>
                : <FieldEmpty>não informado</FieldEmpty>
              }
            </FieldValue>
          </Field>

          {business.description && (
            <Field>
              <FieldLabel>Descrição</FieldLabel>
              <FieldValue style={{ fontWeight: 400, fontSize: 13, lineHeight: 1.6 }}>
                {business.description}
              </FieldValue>
            </Field>
          )}
        </SectionBody>
      </Section>

      <Section $delay={0.05}>
        <SectionHeader>
          <SectionIcon><LinkIcon size={16} weight="fill" /></SectionIcon>
          <SectionTitle>Link de Agendamento</SectionTitle>
        </SectionHeader>
        <SectionBody>
          <Field>
            <FieldLabel>Seu link único</FieldLabel>
            <LinkRow>
              <LinkPreview>
                <span>marqueja.conectalestesp.com.br/</span>
                <LinkSlug>{business.slug}</LinkSlug>
              </LinkPreview>
              <CopyBtn $copied={copied} onClick={handleCopy} title="Copiar link">
                {copied ? <Check size={15} weight="bold" /> : <Copy size={15} />}
              </CopyBtn>
            </LinkRow>
          </Field>
        </SectionBody>
      </Section>

      <Section $delay={0.1}>
        <SectionHeader>
          <SectionIcon><PaintBucket size={16} weight="fill" /></SectionIcon>
          <SectionTitle>Aparência</SectionTitle>
        </SectionHeader>
        <SectionBody>
          <Field>
            <FieldLabel>Cor principal</FieldLabel>
            <ColorDisplay>
              <ColorCircle $color={business.primary_color ?? "#f97316"} />
              <FieldValue style={{ fontFamily: "monospace", fontSize: 13 }}>
                {business.primary_color ?? "#f97316"}
              </FieldValue>
            </ColorDisplay>
          </Field>
        </SectionBody>
      </Section>

      <Section $delay={0.15}>
        <SectionHeader>
          <SectionIcon><Clock size={16} weight="fill" /></SectionIcon>
          <SectionTitle>Horários de Funcionamento</SectionTitle>
        </SectionHeader>
        <SectionBody>
          <HoursGrid>
            {[1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
              const h = hours.find((x) => x.day_of_week === dayNum);
              if (!h) return null;
              return (
                <HourRow key={dayNum}>
                  <DayLabel $open={h.is_open ?? false}>{DAY_LABELS[dayNum]}</DayLabel>
                  <HourValue>
                    {h.is_open
                      ? `${h.open_time.slice(0, 5)} – ${h.close_time.slice(0, 5)}`
                      : "Fechado"
                    }
                  </HourValue>
                </HourRow>
              );
            })}
          </HoursGrid>
        </SectionBody>
      </Section>

      {(business.lunch_start && business.lunch_end) && (
        <Section $delay={0.2}>
          <SectionHeader>
            <SectionIcon><ForkKnife size={16} weight="fill" /></SectionIcon>
            <SectionTitle>Horário de Almoço</SectionTitle>
          </SectionHeader>
          <SectionBody>
            <Field>
              <FieldLabel>Intervalo bloqueado automaticamente</FieldLabel>
              <FieldValue>
                {business.lunch_start.slice(0, 5)} – {business.lunch_end.slice(0, 5)}
              </FieldValue>
            </Field>
          </SectionBody>
        </Section>
      )}
    </Page>
  );
}
