"use client";

import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  Buildings, Phone, MapPin, Link as LinkIcon,
  Copy, Check, Clock, WhatsappLogo, Info, ForkKnife,
  CurrencyCircleDollar, FloppyDisk, Spinner as SpinnerIcon,
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
  margin: 0 auto;
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
  background: rgba(var(--color-primary-rgb),0.05);
  border: 1px solid rgba(var(--color-primary-rgb),0.15);
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
  background: rgba(var(--color-primary-rgb),0.08);
  border: 1px solid rgba(var(--color-primary-rgb),0.15);

  &:hover { background: rgba(var(--color-primary-rgb),0.14); }
`;

const Section = styled.div<{ $delay?: number }>`
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  margin-bottom: 16px;
  animation: ${fadeUp} 0.25s ease both;
  animation-delay: ${({ $delay }) => $delay ?? 0}s;
  transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s cubic-bezier(0.4,0,0.2,1);
  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-card-hover);
  }
`;

const SectionHeader = styled.div`
  display: flex; align-items: center; gap: 10px;
  padding: 16px 20px; border-bottom: 1px solid var(--color-border);
`;

const SectionIcon = styled.div`
  width: 30px; height: 30px; border-radius: var(--radius-sm);
  background: rgba(var(--color-primary-rgb),0.1); color: var(--color-primary);
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

// ── PIX section components ─────────────────────────────────────────────────

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
`;

const ToggleLabel = styled.div``;

const ToggleTitle = styled.p`font-size: 14px; font-weight: 600; color: var(--color-text);`;
const ToggleSub = styled.p`font-size: 12px; color: var(--color-text-muted); margin-top: 2px; line-height: 1.4;`;

const Toggle = styled.button<{ $on: boolean }>`
  width: 44px; height: 24px; border-radius: 99px;
  border: none; cursor: pointer; flex-shrink: 0;
  background: ${({ $on }) => $on ? "var(--color-primary)" : "var(--color-border)"};
  position: relative; transition: background 0.2s;

  &::after {
    content: '';
    position: absolute;
    top: 3px; left: ${({ $on }) => $on ? "23px" : "3px"};
    width: 18px; height: 18px; border-radius: 50%; background: #fff;
    transition: left 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }
`;

const PixInput = styled.input`
  width: 100%; height: 40px;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  padding: 0 12px; font-size: 13px; color: var(--color-text);
  background: var(--color-surface-2); box-sizing: border-box;
  transition: border-color 0.15s;

  &:focus { outline: none; border-color: var(--color-primary); }
  &::placeholder { color: var(--color-text-muted); opacity: 0.6; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

const PixSelect = styled.select`
  width: 100%; height: 40px;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  padding: 0 12px; font-size: 13px; color: var(--color-text);
  background: var(--color-surface-2); box-sizing: border-box;
  cursor: pointer; transition: border-color 0.15s;

  &:focus { outline: none; border-color: var(--color-primary); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

const SaveBtn = styled.button<{ $loading: boolean }>`
  height: 40px; padding: 0 20px; border-radius: var(--radius-sm);
  background: var(--color-primary); color: #fff; border: none;
  font-size: 13px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  opacity: ${({ $loading }) => $loading ? 0.7 : 1};
  transition: opacity 0.2s;
  &:hover { opacity: ${({ $loading }) => $loading ? 0.7 : 0.88}; }
  &:disabled { cursor: not-allowed; }
`;

const spinAnim = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SpinWrap = styled.div`
  animation: ${spinAnim} 0.8s linear infinite; display: flex; align-items: center;
`;

const SaveFeedback = styled.p<{ $error: boolean }>`
  font-size: 12px;
  color: ${({ $error }) => $error ? "var(--color-danger)" : "var(--color-success)"};
  font-weight: 500;
  margin-top: 4px;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const { business, loading: bizLoading } = useBusiness();
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [copied, setCopied] = useState(false);

  // ── PIX state ──────────────────────────────────────────────────────────────
  const [pixEnabled, setPixEnabled] = useState(false);
  const [pixKey, setPixKey] = useState("");
  const [pixHolderName, setPixHolderName] = useState("");
  const [pixChargeType, setPixChargeType] = useState<"total" | "signal">("total");
  const [pixSignalPercent, setPixSignalPercent] = useState<number>(30);
  const [savingPix, setSavingPix] = useState(false);
  const [pixFeedback, setPixFeedback] = useState<{ msg: string; error: boolean } | null>(null);

  useEffect(() => {
    if (!business) return;
    getSupabaseClient()
      .from("business_hours")
      .select("*")
      .eq("business_id", business.id)
      .order("day_of_week")
      .then(({ data }) => setHours(data ?? []));

    // Popula campos PIX com valores atuais
    setPixEnabled(business.pix_enabled ?? false);
    setPixKey(business.pix_key ?? "");
    setPixHolderName(business.pix_holder_name ?? "");
    setPixChargeType((business.pix_charge_type as "total" | "signal") ?? "total");
    setPixSignalPercent(business.pix_signal_percent ?? 30);
  }, [business]);

  async function handleSavePix() {
    if (!business) return;
    if (pixEnabled && (!pixKey.trim() || !pixHolderName.trim())) {
      setPixFeedback({ msg: "Preencha a chave PIX e o nome do titular para ativar.", error: true });
      return;
    }
    setSavingPix(true);
    setPixFeedback(null);
    const { error } = await getSupabaseClient()
      .from("businesses")
      .update({
        pix_enabled: pixEnabled,
        pix_key: pixKey.trim() || null,
        pix_holder_name: pixHolderName.trim() || null,
        pix_charge_type: pixChargeType,
        pix_signal_percent: pixChargeType === "signal" ? pixSignalPercent : null,
      })
      .eq("id", business.id);
    setSavingPix(false);
    setPixFeedback(error
      ? { msg: "Erro ao salvar. Tente novamente.", error: true }
      : { msg: "Configurações PIX salvas com sucesso!", error: false }
    );
    setTimeout(() => setPixFeedback(null), 4000);
  }

  function handleCopy() {
    const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "marqueja.conectalestesp.com.br";
    navigator.clipboard.writeText(`https://${domain}/${business?.slug}`).catch(() => {});
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
            As configurações do seu negócio são gerenciadas pela <strong>{process.env.NEXT_PUBLIC_SUPPORT_NAME ?? "nossa equipe"}</strong>.
            Para solicitar qualquer alteração — nome, horários, serviços ou aparência —
            entre em contato diretamente conosco.
          </BannerText>
          <BannerLink
            href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "5511999999999"}?text=Olá!%20Preciso%20alterar%20as%20configurações%20do%20meu%20negócio%20no%20Marque%20Já`}
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
                <span>{process.env.NEXT_PUBLIC_APP_DOMAIN ?? "marqueja.conectalestesp.com.br"}/</span>
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

      {/* ── Seção PIX ───────────────────────────────────────────────────── */}
      <Section $delay={0.25}>
        <SectionHeader>
          <SectionIcon><CurrencyCircleDollar size={16} weight="fill" /></SectionIcon>
          <SectionTitle>Pagamento via PIX</SectionTitle>
        </SectionHeader>
        <SectionBody>
          <ToggleRow>
            <ToggleLabel>
              <ToggleTitle>Ativar pagamento PIX no agendamento</ToggleTitle>
              <ToggleSub>
                Quando ativo, o cliente precisa pagar antes de confirmar o horário.
              </ToggleSub>
            </ToggleLabel>
            <Toggle
              $on={pixEnabled}
              type="button"
              onClick={() => setPixEnabled((v) => !v)}
              title={pixEnabled ? "Desativar PIX" : "Ativar PIX"}
            />
          </ToggleRow>

          <FieldGrid>
            <Field>
              <FieldLabel>Chave PIX</FieldLabel>
              <PixInput
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, CNPJ, e-mail, telefone ou aleatória"
                disabled={!pixEnabled}
              />
            </Field>
            <Field>
              <FieldLabel>Nome do titular</FieldLabel>
              <PixInput
                value={pixHolderName}
                onChange={(e) => setPixHolderName(e.target.value)}
                placeholder="Nome que aparece no QR Code"
                disabled={!pixEnabled}
              />
            </Field>
          </FieldGrid>

          <FieldGrid>
            <Field>
              <FieldLabel>Tipo de cobrança</FieldLabel>
              <PixSelect
                value={pixChargeType}
                onChange={(e) => setPixChargeType(e.target.value as "total" | "signal")}
                disabled={!pixEnabled}
              >
                <option value="total">Valor total do serviço</option>
                <option value="signal">Sinal (percentual)</option>
              </PixSelect>
            </Field>
            {pixChargeType === "signal" && (
              <Field>
                <FieldLabel>Percentual do sinal (%)</FieldLabel>
                <PixInput
                  type="number"
                  min={1}
                  max={100}
                  value={pixSignalPercent}
                  onChange={(e) => setPixSignalPercent(Number(e.target.value))}
                  placeholder="Ex: 30"
                  disabled={!pixEnabled}
                />
              </Field>
            )}
          </FieldGrid>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <SaveBtn
              type="button"
              $loading={savingPix}
              disabled={savingPix}
              onClick={handleSavePix}
            >
              {savingPix
                ? <><SpinWrap><SpinnerIcon size={14} /></SpinWrap> Salvando...</>
                : <><FloppyDisk size={14} weight="bold" /> Salvar PIX</>
              }
            </SaveBtn>
            {pixFeedback && (
              <SaveFeedback $error={pixFeedback.error}>{pixFeedback.msg}</SaveFeedback>
            )}
          </div>
        </SectionBody>
      </Section>
    </Page>
  );
}
