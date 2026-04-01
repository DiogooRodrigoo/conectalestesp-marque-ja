"use client";

import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  Plus, ProhibitInset, CalendarBlank, Clock,
  Trash, User, WarningCircle,
} from "@phosphor-icons/react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useBusiness } from "../BusinessContext";
import type { BlockedSlot, Professional } from "@/types/database";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

function isUpcoming(start_at: string) {
  return new Date(start_at) >= new Date(new Date().toDateString());
}

function isDayOff(block: BlockedSlot) {
  const start = new Date(block.start_at);
  const end = new Date(block.end_at);
  return start.getHours() === 0 && end.getHours() === 23;
}

function toTimeDisplay(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  padding: 28px 32px;
  max-width: 760px;
  animation: ${fadeUp} 0.25s ease both;
  @media (max-width: 640px) { padding: 16px; }
`;

const TopRow = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 16px; margin-bottom: 8px; flex-wrap: wrap;
`;

const TitleBlock = styled.div``;
const PageTitle = styled.h1`font-size: 22px; font-weight: 700; color: var(--color-text); letter-spacing: -0.4px;`;
const PageSub = styled.p`font-size: 13px; color: var(--color-text-muted); margin-top: 4px;`;

const InfoBanner = styled.div`
  display: flex; align-items: flex-start; gap: 10px;
  background: rgba(249,115,22,0.06); border: 1px solid rgba(249,115,22,0.2);
  border-radius: var(--radius-md); padding: 12px 14px;
  margin-top: 20px; margin-bottom: 20px;
  svg { color: var(--color-primary); flex-shrink: 0; margin-top: 1px; }
`;

const InfoText = styled.p`font-size: 12.5px; color: var(--color-text-muted); line-height: 1.5;`;

const SectionLabel = styled.p`
  font-size: 11.5px; font-weight: 600; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;
`;

const BlockList = styled.div`display: flex; flex-direction: column; gap: 6px; margin-bottom: 28px;`;

const BlockCard = styled.div<{ $index: number; $past: boolean }>`
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); padding: 14px 16px;
  display: flex; align-items: center; gap: 14px;
  animation: ${fadeUp} 0.25s ease both;
  animation-delay: ${({ $index }) => $index * 0.04}s;
  transition: border-color 0.15s;
  opacity: ${({ $past }) => ($past ? 0.5 : 1)};
  &:hover { border-color: #3a3a3a; }
`;

const BlockIconWrap = styled.div<{ $past: boolean }>`
  width: 36px; height: 36px; border-radius: var(--radius-sm);
  background: ${({ $past }) => $past ? "rgba(161,161,170,0.1)" : "rgba(239,68,68,0.08)"};
  color: ${({ $past }) => $past ? "var(--color-text-muted)" : "var(--color-danger)"};
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`;

const BlockInfo = styled.div`flex: 1; min-width: 0;`;

const BlockReason = styled.p`
  font-size: 14px; font-weight: 600; color: var(--color-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const BlockMeta = styled.div`
  display: flex; align-items: center; gap: 8px; margin-top: 4px; flex-wrap: wrap;
`;

const MetaItem = styled.span`
  font-size: 12px; color: var(--color-text-muted);
  display: flex; align-items: center; gap: 4px;
`;

const MetaDot = styled.span`width: 3px; height: 3px; border-radius: 50%; background: var(--color-border);`;

const BlockRight = styled.div`display: flex; align-items: center; gap: 8px; flex-shrink: 0;`;

const DeleteBtn = styled.button`
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm); color: var(--color-text-muted);
  transition: background 0.15s, color 0.15s;
  &:hover { background: rgba(239,68,68,0.1); color: var(--color-danger); }
`;

const EmptyState = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 40px 24px;
  border: 1px dashed var(--color-border); border-radius: var(--radius-lg);
  color: var(--color-text-muted); margin-bottom: 28px;
`;

const FormGrid = styled.div`display: flex; flex-direction: column; gap: 14px;`;
const FormRow = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const Label = styled.label`display: block; font-size: 12.5px; font-weight: 500; color: var(--color-text-muted); margin-bottom: 6px;`;

const Select = styled.select`
  width: 100%; height: 40px;
  background: var(--color-surface-2); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); color: var(--color-text);
  font-size: 13.5px; font-family: inherit; padding: 0 12px; outline: none; cursor: pointer;
  option { background: var(--color-surface-2); }
  &:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(249,115,22,0.12); }
`;

const TimeRow = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 12px;`;

const TimeInput = styled.input`
  height: 40px; width: 100%;
  background: var(--color-surface-2); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); color: var(--color-text);
  font-size: 13.5px; font-family: inherit; padding: 0 12px; outline: none;
  &:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(249,115,22,0.12); }
`;

const LoadingCenter = styled.div`display: flex; align-items: center; justify-content: center; padding: 80px;`;

// ─── Component ────────────────────────────────────────────────────────────────

type BlockType = "day_off" | "interval";

function emptyForm() {
  return { professionalId: "all", type: "day_off" as BlockType, date: "", startTime: "12:00", endTime: "13:00", reason: "" };
}

export default function BloqueiosPage() {
  const { business, loading: bizLoading } = useBusiness();
  const [blocks, setBlocks] = useState<BlockedSlot[]>([]);
  const [professionals, setProfessionals] = useState<Pick<Professional, "id" | "name">[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    if (!business) return;
    async function load() {
      const supabase = getSupabaseClient();
      const [{ data: blocksData }, { data: profsData }] = await Promise.all([
        supabase
          .from("blocked_slots")
          .select("*")
          .eq("business_id", business!.id)
          .order("start_at"),
        supabase
          .from("professionals")
          .select("id, name")
          .eq("business_id", business!.id)
          .eq("is_active", true)
          .order("name"),
      ]);
      setBlocks(blocksData ?? []);
      setProfessionals(profsData ?? []);
      setLoading(false);
    }
    load();
  }, [business]);

  async function handleCreate() {
    if (!business || !form.date || !form.reason.trim()) return;
    setSaving(true);

    const dateStr = form.date;
    const start_at = form.type === "day_off"
      ? new Date(`${dateStr}T00:00:00`).toISOString()
      : new Date(`${dateStr}T${form.startTime}:00`).toISOString();
    const end_at = form.type === "day_off"
      ? new Date(`${dateStr}T23:59:59`).toISOString()
      : new Date(`${dateStr}T${form.endTime}:00`).toISOString();

    const { data } = await getSupabaseClient()
      .from("blocked_slots")
      .insert({
        business_id: business.id,
        professional_id: form.professionalId === "all" ? null : form.professionalId,
        start_at,
        end_at,
        reason: form.reason.trim(),
      })
      .select()
      .single();

    if (data) setBlocks((prev) => [...prev, data].sort((a, b) => a.start_at.localeCompare(b.start_at)));
    setSaving(false);
    setModalOpen(false);
    setForm(emptyForm());
  }

  async function handleDelete(id: string) {
    await getSupabaseClient().from("blocked_slots").delete().eq("id", id);
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  if (bizLoading || loading) return <LoadingCenter><Spinner size="lg" /></LoadingCenter>;

  const upcoming = blocks.filter((b) => isUpcoming(b.start_at));
  const past = blocks.filter((b) => !isUpcoming(b.start_at));

  function renderBlock(block: BlockedSlot, index: number, isPast = false) {
    const prof = professionals.find((p) => p.id === block.professional_id);
    const dayOff = isDayOff(block);

    return (
      <BlockCard key={block.id} $index={index} $past={isPast}>
        <BlockIconWrap $past={isPast}>
          <ProhibitInset size={18} weight="fill" />
        </BlockIconWrap>

        <BlockInfo>
          <BlockReason>{block.reason ?? "Sem motivo"}</BlockReason>
          <BlockMeta>
            <MetaItem><CalendarBlank size={11} />{formatDate(block.start_at)}</MetaItem>
            {!dayOff && (
              <>
                <MetaDot />
                <MetaItem>
                  <Clock size={11} />
                  {toTimeDisplay(block.start_at)} – {toTimeDisplay(block.end_at)}
                </MetaItem>
              </>
            )}
            <MetaDot />
            <MetaItem>
              <User size={11} />
              {prof ? prof.name : "Todos os profissionais"}
            </MetaItem>
          </BlockMeta>
        </BlockInfo>

        <BlockRight>
          <Badge variant={dayOff ? "danger" : "warning"} size="sm">
            {dayOff ? "Dia inteiro" : "Intervalo"}
          </Badge>
          {!isPast && (
            <DeleteBtn onClick={() => handleDelete(block.id)} title="Remover">
              <Trash size={14} />
            </DeleteBtn>
          )}
        </BlockRight>
      </BlockCard>
    );
  }

  return (
    <Page>
      <TopRow>
        <TitleBlock>
          <PageTitle>Bloqueios</PageTitle>
          <PageSub>Folgas, feriados e intervalos bloqueados</PageSub>
        </TitleBlock>
        <Button icon={<Plus size={16} weight="bold" />} onClick={() => setModalOpen(true)}>
          Novo Bloqueio
        </Button>
      </TopRow>

      <InfoBanner>
        <WarningCircle size={16} weight="fill" />
        <InfoText>
          Horários bloqueados não aparecerão para agendamento. Use para feriados, folgas e intervalos sem atendimento.
        </InfoText>
      </InfoBanner>

      <SectionLabel>Próximos</SectionLabel>
      {upcoming.length === 0 ? (
        <EmptyState>
          <ProhibitInset size={24} />
          <span style={{ fontSize: 13 }}>Nenhum bloqueio agendado</span>
        </EmptyState>
      ) : (
        <BlockList>{upcoming.map((b, i) => renderBlock(b, i, false))}</BlockList>
      )}

      {past.length > 0 && (
        <>
          <SectionLabel>Passados</SectionLabel>
          <BlockList>{past.map((b, i) => renderBlock(b, i, true))}</BlockList>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo Bloqueio"
        description="Bloqueie um horário ou dia inteiro para um ou todos os profissionais."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} loading={saving} disabled={!form.date || !form.reason.trim()}>
              Bloquear
            </Button>
          </>
        }
      >
        <FormGrid>
          <FormRow>
            <div>
              <Label>Profissional</Label>
              <Select value={form.professionalId} onChange={(e) => setForm((f) => ({ ...f, professionalId: e.target.value }))}>
                <option value="all">Todos os profissionais</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as BlockType }))}>
                <option value="day_off">Dia inteiro</option>
                <option value="interval">Intervalo</option>
              </Select>
            </div>
          </FormRow>

          <Input label="Data" type="date" value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} fullWidth />

          {form.type === "interval" && (
            <div>
              <Label>Horário</Label>
              <TimeRow>
                <TimeInput type="time" value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
                <TimeInput type="time" value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
              </TimeRow>
            </div>
          )}

          <Input label="Motivo" placeholder="Ex: Feriado, folga, reunião..."
            value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} fullWidth />
        </FormGrid>
      </Modal>
    </Page>
  );
}
