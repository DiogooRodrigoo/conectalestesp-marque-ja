"use client";

import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  Plus, Scissors, Clock, CurrencyDollar,
  PencilSimple, Trash, ToggleLeft, ToggleRight,
} from "@phosphor-icons/react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useBusiness } from "../BusinessContext";
import type { Service } from "@/types/database";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parsePriceCents(value: string): number {
  return Math.round(parseFloat(value.replace(",", ".")) * 100) || 0;
}

function formatPriceInput(value: string): string {
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  if (isNaN(num)) return "";
  // Formata como moeda: inteiros + vírgula + 2 decimais
  return (num / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const TitleBlock = styled.div``;
const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.4px;
`;
const PageSub = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 4px;
`;

const ServiceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 24px;
`;

const ServiceCard = styled.div<{ $index: number; $inactive: boolean }>`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  animation: ${fadeUp} 0.25s ease both;
  animation-delay: ${({ $index }) => $index * 0.05}s;
  transition: border-color 0.15s;
  opacity: ${({ $inactive }) => ($inactive ? 0.55 : 1)};
  &:hover { border-color: #3a3a3a; }
`;

const ServiceIcon = styled.div`
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  background: rgba(249,115,22,0.1);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ServiceInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ServiceName = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
`;

const ServiceMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  flex-wrap: wrap;
`;

const MetaItem = styled.span`
  font-size: 12.5px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ServiceActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const IconBtn = styled.button<{ $danger?: boolean }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: ${({ $danger }) => ($danger ? "var(--color-danger)" : "var(--color-text-muted)")};
  transition: background 0.15s, color 0.15s;
  &:hover {
    background: ${({ $danger }) => $danger ? "rgba(239,68,68,0.1)" : "var(--color-surface-2)"};
    color: ${({ $danger }) => $danger ? "var(--color-danger)" : "var(--color-text)"};
  }
`;

const ToggleBtn = styled.button<{ $active: boolean }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: ${({ $active }) => ($active ? "var(--color-success)" : "var(--color-text-muted)")};
  transition: background 0.15s, color 0.15s;
  &:hover { background: ${({ $active }) => $active ? "rgba(34,197,94,0.1)" : "var(--color-surface-2)"}; }
`;

const FormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const LoadingCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px;
`;

// ─── Component ────────────────────────────────────────────────────────────────

function emptyForm() {
  return { name: "", durationMin: "30", price: "" };
}

export default function ServicosPage() {
  const { business, loading: bizLoading } = useBusiness();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  useEffect(() => {
    if (!business) return;
    async function load() {
      const { data } = await getSupabaseClient()
        .from("services")
        .select("*")
        .eq("business_id", business!.id)
        .order("display_order");
      setServices(data ?? []);
      setLoading(false);
    }
    load();
  }, [business]);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(svc: Service) {
    setEditTarget(svc);
    setForm({
      name: svc.name,
      durationMin: String(svc.duration_min),
      price: (svc.price_cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!business || !form.name.trim()) return;
    setSaving(true);
    const supabase = getSupabaseClient();
    const payload = {
      name: form.name.trim(),
      duration_min: parseInt(form.durationMin, 10) || 30,
      price_cents: parsePriceCents(form.price),
      business_id: business.id,
    };

    if (editTarget) {
      const { data } = await supabase
        .from("services")
        .update(payload)
        .eq("id", editTarget.id)
        .select()
        .single();
      if (data) setServices((prev) => prev.map((s) => (s.id === editTarget.id ? data : s)));
    } else {
      const { data } = await supabase
        .from("services")
        .insert({ ...payload, is_active: true, display_order: services.length + 1 })
        .select()
        .single();
      if (data) setServices((prev) => [...prev, data]);
    }
    setSaving(false);
    setModalOpen(false);
  }

  async function toggleActive(svc: Service) {
    const { data } = await getSupabaseClient()
      .from("services")
      .update({ is_active: !svc.is_active })
      .eq("id", svc.id)
      .select()
      .single();
    if (data) setServices((prev) => prev.map((s) => (s.id === svc.id ? data : s)));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await getSupabaseClient().from("services").delete().eq("id", deleteTarget.id);
    setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  if (bizLoading || loading) return <LoadingCenter><Spinner size="lg" /></LoadingCenter>;

  const active = services.filter((s) => s.is_active).length;

  return (
    <Page>
      <TopRow>
        <TitleBlock>
          <PageTitle>Serviços</PageTitle>
          <PageSub>{active} ativos · {services.length} no total</PageSub>
        </TitleBlock>
        <Button icon={<Plus size={16} weight="bold" />} onClick={openCreate}>Novo Serviço</Button>
      </TopRow>

      <ServiceList>
        {services.map((svc, i) => (
          <ServiceCard key={svc.id} $index={i} $inactive={!svc.is_active}>
            <ServiceIcon><Scissors size={18} weight="fill" /></ServiceIcon>
            <ServiceInfo>
              <ServiceName>{svc.name}</ServiceName>
              <ServiceMeta>
                <MetaItem><Clock size={12} />{svc.duration_min} min</MetaItem>
                <MetaItem><CurrencyDollar size={12} />{formatCurrency(svc.price_cents)}</MetaItem>
                <Badge variant={svc.is_active ? "success" : "default"} dot size="sm">
                  {svc.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </ServiceMeta>
            </ServiceInfo>
            <ServiceActions>
              <ToggleBtn $active={svc.is_active ?? false} onClick={() => toggleActive(svc)}>
                {svc.is_active ? <ToggleRight size={20} weight="fill" /> : <ToggleLeft size={20} />}
              </ToggleBtn>
              <IconBtn onClick={() => openEdit(svc)}><PencilSimple size={15} /></IconBtn>
              <IconBtn $danger onClick={() => setDeleteTarget(svc)}><Trash size={15} /></IconBtn>
            </ServiceActions>
          </ServiceCard>
        ))}
      </ServiceList>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Editar Serviço" : "Novo Serviço"}
        description="Preencha as informações do serviço oferecido."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.name.trim()}>
              {editTarget ? "Salvar" : "Criar Serviço"}
            </Button>
          </>
        }
      >
        <FormGrid>
          <Input label="Nome do serviço" placeholder="Ex: Corte Social" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} fullWidth />
          <FormRow>
            <Input label="Duração (min)" type="number" min={5} step={5} icon={<Clock size={15} />}
              value={form.durationMin} onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))} fullWidth />
            <Input label="Preço (R$)" placeholder="0,00" icon={<CurrencyDollar size={15} />}
              value={form.price}
              onChange={(e) => {
                const formatted = formatPriceInput(e.target.value);
                setForm((f) => ({ ...f, price: formatted }));
              }}
              inputMode="numeric"
              fullWidth />
          </FormRow>
        </FormGrid>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Excluir serviço?"
        description={`"${deleteTarget?.name}" será removido permanentemente.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Excluir</Button>
          </>
        }
      >
        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
          Agendamentos existentes não serão afetados.
        </span>
      </Modal>
    </Page>
  );
}
