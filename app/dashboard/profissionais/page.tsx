"use client";

import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  Plus, Phone, PencilSimple, Trash,
  ToggleLeft, ToggleRight, Clock, Check,
} from "@phosphor-icons/react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useBusiness } from "../BusinessContext";
import type { Professional } from "@/types/database";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkHours {
  [day: number]: { start: string; end: string; active: boolean };
}

const DEFAULT_HOURS: WorkHours = {
  1: { start: "09:00", end: "19:00", active: true },
  2: { start: "09:00", end: "19:00", active: true },
  3: { start: "09:00", end: "19:00", active: true },
  4: { start: "09:00", end: "19:00", active: true },
  5: { start: "09:00", end: "19:00", active: true },
  6: { start: "09:00", end: "16:00", active: true },
  0: { start: "09:00", end: "13:00", active: false },
};

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const TitleBlock = styled.div``;
const PageTitle = styled.h1`font-size: 22px; font-weight: 700; color: var(--color-text); letter-spacing: -0.4px;`;
const PageSub = styled.p`font-size: 13px; color: var(--color-text-muted); margin-top: 4px;`;

const ProfList = styled.div`display: flex; flex-direction: column; gap: 12px;`;

const ProfCard = styled.div<{ $index: number; $inactive: boolean }>`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px 20px 16px;
  animation: ${fadeUp} 0.25s ease both;
  animation-delay: ${({ $index }) => $index * 0.07}s;
  transition: border-color 0.15s;
  opacity: ${({ $inactive }) => ($inactive ? 0.55 : 1)};
  &:hover { border-color: #3a3a3a; }
`;

const ProfHeader = styled.div`display: flex; align-items: center; gap: 14px;`;
const ProfInfo = styled.div`flex: 1; min-width: 0;`;
const ProfName = styled.p`font-size: 15px; font-weight: 600; color: var(--color-text); letter-spacing: -0.2px;`;
const ProfMeta = styled.div`display: flex; align-items: center; gap: 8px; margin-top: 4px; flex-wrap: wrap;`;
const MetaItem = styled.span`font-size: 12.5px; color: var(--color-text-muted); display: flex; align-items: center; gap: 4px;`;

const ProfActions = styled.div`display: flex; align-items: center; gap: 4px;`;

const IconBtn = styled.button<{ $danger?: boolean }>`
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm);
  color: ${({ $danger }) => ($danger ? "var(--color-danger)" : "var(--color-text-muted)")};
  transition: background 0.15s, color 0.15s;
  &:hover {
    background: ${({ $danger }) => $danger ? "rgba(239,68,68,0.1)" : "var(--color-surface-2)"};
    color: ${({ $danger }) => $danger ? "var(--color-danger)" : "var(--color-text)"};
  }
`;

const ToggleBtn = styled.button<{ $active: boolean }>`
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm);
  color: ${({ $active }) => ($active ? "var(--color-success)" : "var(--color-text-muted)")};
  transition: background 0.15s, color 0.15s;
  &:hover { background: ${({ $active }) => $active ? "rgba(34,197,94,0.1)" : "var(--color-surface-2)"}; }
`;

const ScheduleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  @media (max-width: 520px) { grid-template-columns: repeat(4, 1fr); }
`;

const DayChip = styled.div<{ $active: boolean }>`
  display: flex; flex-direction: column; align-items: center; padding: 7px 4px;
  border-radius: var(--radius-sm);
  border: 1px solid ${({ $active }) => $active ? "rgba(249,115,22,0.28)" : "var(--color-border)"};
  background: ${({ $active }) => $active ? "rgba(249,115,22,0.07)" : "rgba(0,0,0,0.01)"};
`;

const DayLabel = styled.span<{ $active: boolean }>`
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
  color: ${({ $active }) => $active ? "var(--color-primary)" : "var(--color-text-muted)"};
`;

const DayHour = styled.span<{ $active: boolean }>`
  font-size: 9.5px; margin-top: 3px; text-align: center;
  color: ${({ $active }) => $active ? "var(--color-text-muted)" : "var(--color-border)"};
`;

const FormGrid = styled.div`display: flex; flex-direction: column; gap: 16px;`;
const FormRow = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const HoursSection = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const HoursSectionLabel = styled.p`font-size: 12.5px; font-weight: 500; color: var(--color-text-muted); letter-spacing: 0.2px;`;

const HourRow = styled.div`display: grid; grid-template-columns: 40px 1fr 1fr auto; align-items: center; gap: 8px;`;

const DayToggle = styled.button<{ $active: boolean }>`
  width: 36px; height: 24px; border-radius: 99px;
  background: ${({ $active }) => $active ? "var(--color-primary)" : "var(--color-surface-2)"};
  border: 1px solid ${({ $active }) => $active ? "transparent" : "var(--color-border)"};
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, border-color 0.15s;
  font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;
  color: ${({ $active }) => $active ? "#fff" : "var(--color-text-muted)"};
`;

const TimeInput = styled.input`
  height: 34px; width: 100%;
  background: var(--color-surface-2); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); color: var(--color-text);
  font-size: 12.5px; font-family: inherit; padding: 0 10px; outline: none;
  &:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(249,115,22,0.12); }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const LoadingCenter = styled.div`display: flex; align-items: center; justify-content: center; padding: 80px;`;

// ─── Component ────────────────────────────────────────────────────────────────

function emptyForm() {
  return { name: "", phone: "", bio: "", workHours: JSON.parse(JSON.stringify(DEFAULT_HOURS)) as WorkHours };
}

export default function ProfissionaisPage() {
  const { business, loading: bizLoading } = useBusiness();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Professional | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<Professional | null>(null);

  useEffect(() => {
    if (!business) return;
    async function load() {
      const { data } = await getSupabaseClient()
        .from("professionals")
        .select("*")
        .eq("business_id", business!.id)
        .order("name");
      setProfessionals(data ?? []);
      setLoading(false);
    }
    load();
  }, [business]);

  function openCreate() { setEditTarget(null); setForm(emptyForm()); setModalOpen(true); }

  function openEdit(prof: Professional) {
    setEditTarget(prof);
    setForm({ name: prof.name, phone: "", bio: prof.bio ?? "", workHours: JSON.parse(JSON.stringify(DEFAULT_HOURS)) });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!business || !form.name.trim()) return;
    setSaving(true);
    const supabase = getSupabaseClient();
    const payload = { name: form.name.trim(), bio: form.bio || null, business_id: business.id };

    if (editTarget) {
      const { data } = await supabase.from("professionals").update(payload).eq("id", editTarget.id).select().single();
      if (data) setProfessionals((prev) => prev.map((p) => (p.id === editTarget.id ? data : p)));
    } else {
      const { data } = await supabase.from("professionals").insert({ ...payload, is_active: true }).select().single();
      if (data) setProfessionals((prev) => [...prev, data]);
    }
    setSaving(false);
    setModalOpen(false);
  }

  async function toggleActive(prof: Professional) {
    const { data } = await getSupabaseClient()
      .from("professionals")
      .update({ is_active: !prof.is_active })
      .eq("id", prof.id)
      .select()
      .single();
    if (data) setProfessionals((prev) => prev.map((p) => (p.id === prof.id ? data : p)));
  }

  if (bizLoading || loading) return <LoadingCenter><Spinner size="lg" /></LoadingCenter>;

  const active = professionals.filter((p) => p.is_active).length;

  return (
    <Page>
      <TopRow>
        <TitleBlock>
          <PageTitle>Profissionais</PageTitle>
          <PageSub>{active} ativos · {professionals.length} cadastrados</PageSub>
        </TitleBlock>
        <Button icon={<Plus size={16} weight="bold" />} onClick={openCreate}>Novo Profissional</Button>
      </TopRow>

      <ProfList>
        {professionals.map((prof, i) => (
          <ProfCard key={prof.id} $index={i} $inactive={!prof.is_active}>
            <ProfHeader>
              <Avatar name={prof.name} size="md" />
              <ProfInfo>
                <ProfName>{prof.name}</ProfName>
                <ProfMeta>
                  {prof.bio && <MetaItem>{prof.bio}</MetaItem>}
                  <Badge variant={prof.is_active ? "success" : "default"} dot size="sm">
                    {prof.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </ProfMeta>
              </ProfInfo>
              <ProfActions>
                <ToggleBtn $active={prof.is_active} onClick={() => toggleActive(prof)}>
                  {prof.is_active ? <ToggleRight size={20} weight="fill" /> : <ToggleLeft size={20} />}
                </ToggleBtn>
                <IconBtn onClick={() => openEdit(prof)}><PencilSimple size={15} /></IconBtn>
                <IconBtn $danger onClick={() => setDeleteTarget(prof)}><Trash size={15} /></IconBtn>
              </ProfActions>
            </ProfHeader>
            <ScheduleGrid>
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const h = DEFAULT_HOURS[day];
                return (
                  <DayChip key={day} $active={h.active}>
                    <DayLabel $active={h.active}>{DAY_LABELS[day]}</DayLabel>
                    <DayHour $active={h.active}>{h.active ? h.start : "–"}</DayHour>
                  </DayChip>
                );
              })}
            </ScheduleGrid>
          </ProfCard>
        ))}
      </ProfList>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Editar Profissional" : "Novo Profissional"}
        description="Dados do profissional."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.name.trim()}>
              {editTarget ? "Salvar" : "Cadastrar"}
            </Button>
          </>
        }
      >
        <FormGrid>
          <FormRow>
            <Input label="Nome" placeholder="Nome completo" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} fullWidth />
            <Input label="WhatsApp" placeholder="11 9 9999-9999" icon={<Phone size={15} />}
              value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} fullWidth />
          </FormRow>
          <Input label="Bio (opcional)" placeholder="Especialidade, anos de experiência..." value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} fullWidth />
          <HoursSection>
            <HoursSectionLabel>Horários de trabalho</HoursSectionLabel>
            {[1, 2, 3, 4, 5, 6, 0].map((day) => {
              const h = form.workHours[day];
              return (
                <HourRow key={day}>
                  <DayToggle $active={h.active}
                    onClick={() => setForm((f) => ({ ...f, workHours: { ...f.workHours, [day]: { ...h, active: !h.active } } }))}>
                    {DAY_LABELS[day]}
                  </DayToggle>
                  <TimeInput type="time" value={h.start} disabled={!h.active}
                    onChange={(e) => setForm((f) => ({ ...f, workHours: { ...f.workHours, [day]: { ...h, start: e.target.value } } }))} />
                  <TimeInput type="time" value={h.end} disabled={!h.active}
                    onChange={(e) => setForm((f) => ({ ...f, workHours: { ...f.workHours, [day]: { ...h, end: e.target.value } } }))} />
                  {h.active
                    ? <Check size={14} style={{ color: "var(--color-success)", flexShrink: 0 }} />
                    : <Clock size={14} style={{ color: "var(--color-border)", flexShrink: 0 }} />}
                </HourRow>
              );
            })}
          </HoursSection>
        </FormGrid>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover profissional?"
        description={`"${deleteTarget?.name}" será removido.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" onClick={async () => {
              await getSupabaseClient().from("professionals").delete().eq("id", deleteTarget!.id);
              setProfessionals((prev) => prev.filter((p) => p.id !== deleteTarget!.id));
              setDeleteTarget(null);
            }}>Remover</Button>
          </>
        }
      >
        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Agendamentos existentes não serão afetados.</span>
      </Modal>
    </Page>
  );
}
