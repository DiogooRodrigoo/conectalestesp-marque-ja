import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/whatsapp/send";
import {
  confirmationMessage,
  ownerNotificationMessage,
} from "@/lib/whatsapp/templates";

interface CreateBookingBody {
  business_id: string;
  service_ids: string[];     // múltiplos serviços
  professional_id: string | null;
  client_name: string;
  client_phone: string;
  date: string;
  time: string;
  notes?: string;
  verification_token: string;
  force?: boolean;           // true = permite duplo agendamento no mesmo dia
  source?: "public" | "admin"; // admin = bypass PIX obrigatório
}

const MIN_PIX_AMOUNT_CENTS = 500; // R$ 5,00

function calcularValorPix(
  services: { price_cents: number }[],
  chargeType: string | null,
  signalPercent: number | null
): number {
  const totalServicos = services.reduce((acc, s) => acc + s.price_cents, 0);
  return chargeType === "signal" && signalPercent
    ? Math.round(totalServicos * (signalPercent / 100))
    : totalServicos;
}

// Server runs in UTC; always format in São Paulo local time for notifications
const SAO_PAULO_TZ = "America/Sao_Paulo";

function formatDatePtBR(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    timeZone: SAO_PAULO_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTimePtBR(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    timeZone: SAO_PAULO_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateBookingBody = await request.json();

    const required: (keyof CreateBookingBody)[] = [
      "business_id",
      "service_ids",
      "client_name",
      "client_phone",
      "date",
      "time",
      "verification_token",
    ];

    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    if (!Array.isArray(body.service_ids) || body.service_ids.length === 0) {
      return NextResponse.json(
        { error: "service_ids must be a non-empty array" },
        { status: 400 }
      );
    }

    // M-02/M-04: Limites de tamanho para evitar payloads abusivos
    if (body.service_ids.length > 10) {
      return NextResponse.json({ error: "Too many services" }, { status: 400 });
    }
    if (body.client_name.length > 120) {
      return NextResponse.json({ error: "client_name too long" }, { status: 400 });
    }
    if (body.notes && body.notes.length > 500) {
      return NextResponse.json({ error: "notes too long" }, { status: 400 });
    }

    // C-02: source:admin só é aceito com sessão autenticada no painel
    if (body.source === "admin") {
      const adminClient = await createServerSupabaseClient();
      const { data: { user }, error: authError } = await adminClient.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json(
        { error: "date must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    if (!/^\d{2}:\d{2}$/.test(body.time)) {
      return NextResponse.json(
        { error: "time must be in HH:MM format" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClientWithServiceRole();

    // ── Valida token de verificação de telefone ───────────────────────────────
    const cleanPhone = body.client_phone.replace(/\D/g, "");
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: verification } = await supabase
      .from("phone_verifications")
      .select("id, phone")
      .eq("token", body.verification_token)
      .eq("business_id", body.business_id)
      .is("token_used_at", null)
      .gte("verified_at", thirtyMinutesAgo)
      .single();

    if (!verification || verification.phone !== cleanPhone) {
      return NextResponse.json(
        { error: "Verificação de telefone inválida ou expirada. Reinicie o agendamento." },
        { status: 401 }
      );
    }

    // ── Verifica duplo agendamento no mesmo dia (antes de consumir token) ─────
    if (!body.force) {
      const dayStart = `${body.date}T00:00:00-03:00`;
      const dayEnd = `${body.date}T23:59:59.999-03:00`;

      const phoneVariants = [
        cleanPhone,
        `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`,
        `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`,
      ];

      const { data: sameDayAppt } = await supabase
        .from("appointments")
        .select(`
          id,
          start_at,
          services ( name )
        `)
        .eq("business_id", body.business_id)
        .in("client_phone", phoneVariants)
        .gte("start_at", dayStart)
        .lte("start_at", dayEnd)
        .in("status", ["confirmed", "pending"])
        .limit(1)
        .single();

      if (sameDayAppt) {
        const startDt = new Date(sameDayAppt.start_at);
        const existingTime = startDt.toLocaleTimeString("pt-BR", {
          timeZone: SAO_PAULO_TZ,
          hour: "2-digit",
          minute: "2-digit",
        });
        const serviceName =
          (sameDayAppt.services as { name: string } | null)?.name ?? "Serviço";

        return NextResponse.json(
          {
            error: "duplicate_day",
            existing: {
              id: sameDayAppt.id,
              start_at: sameDayAppt.start_at,
              time: existingTime,
              service_name: serviceName,
            },
          },
          { status: 409 }
        );
      }
    }

    // ── Busca negócio e todos os serviços selecionados ────────────────────────
    const [businessResult, servicesResult] = await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, slot_duration, phone_whatsapp, booking_enabled, pix_enabled, pix_key, pix_charge_type, pix_signal_percent")
        .eq("id", body.business_id)
        .single(),
      // A-02: filtra por business_id para impedir uso de serviços de outro negócio
      supabase
        .from("services")
        .select("id, name, duration_min, price_cents, is_active")
        .in("id", body.service_ids)
        .eq("business_id", body.business_id),
    ]);

    if (businessResult.error || !businessResult.data) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    if (servicesResult.error || !servicesResult.data || servicesResult.data.length === 0) {
      return NextResponse.json({ error: "Services not found" }, { status: 404 });
    }

    const business = businessResult.data;
    const services = servicesResult.data;

    if (!(business.booking_enabled ?? false)) {
      return NextResponse.json(
        { error: "Booking is currently disabled" },
        { status: 403 }
      );
    }

    for (const svc of services) {
      if (!(svc.is_active ?? true)) {
        return NextResponse.json(
          { error: `Service "${svc.name}" is not available` },
          { status: 400 }
        );
      }
    }

    // Duração total = soma de todos os serviços
    const totalDuration = services.reduce((acc, s) => acc + (s.duration_min ?? 30), 0);

    // Trata data+hora como horário local de SP (UTC-3)
    const startAt = new Date(`${body.date}T${body.time}:00-03:00`);
    const endAt = new Date(startAt.getTime() + totalDuration * 60 * 1000);

    if (isNaN(startAt.getTime())) {
      return NextResponse.json(
        { error: "Invalid date or time" },
        { status: 400 }
      );
    }

    // ── Valida professional_id contra business_id (A-02) ─────────────────────
    let professional: { name: string } | null = null;
    if (body.professional_id) {
      const { data: prof, error: profError } = await supabase
        .from("professionals")
        .select("name")
        .eq("id", body.professional_id)
        .eq("business_id", body.business_id)
        .single();

      if (profError || !prof) {
        return NextResponse.json({ error: "Professional not found" }, { status: 404 });
      }
      professional = prof;
    }

    // ── Verifica conflito de horário com profissional ─────────────────────────
    if (body.professional_id) {
      // BUG-02: awaiting_payment também bloqueia o slot
      const { data: conflicts } = await supabase
        .from("appointments")
        .select("id")
        .eq("professional_id", body.professional_id)
        .in("status", ["confirmed", "pending", "awaiting_payment"])
        .lt("start_at", endAt.toISOString())
        .gt("end_at", startAt.toISOString());

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          { error: "This time slot is no longer available" },
          { status: 409 }
        );
      }
    }

    // Serviço primário = primeiro da lista (para o campo FK único da tabela)
    const primaryService = services.find(s => s.id === body.service_ids[0]) ?? services[0];
    const serviceNames = services.map((s) => s.name).join(" + ");

    // Sempre salva telefone somente com dígitos
    const normalizedClientPhone = cleanPhone;

    // ── Verifica se o negócio requer pagamento PIX ────────────────────────────
    const isAdminSource = body.source === "admin";
    const pixEnabled = business.pix_enabled && business.pix_key && !isAdminSource;

    let pixAmountCents: number | null = null;
    let requiresPayment = false;

    if (pixEnabled) {
      pixAmountCents = calcularValorPix(
        services,
        business.pix_charge_type ?? "total",
        business.pix_signal_percent ?? null
      );
      // Só exige pagamento se valor mínimo de R$ 5,00 for atingido
      requiresPayment = pixAmountCents >= MIN_PIX_AMOUNT_CENTS;
    }

    const appointmentStatus = requiresPayment ? "awaiting_payment" : "confirmed";

    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        business_id: body.business_id,
        service_id: primaryService.id,
        professional_id: body.professional_id ?? null,
        client_name: body.client_name,
        client_phone: normalizedClientPhone,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        status: appointmentStatus,
        notes: body.notes ?? null,
        reminder_sent: false,
        confirmation_sent: false,
        payment_required: requiresPayment,
        payment_status: requiresPayment ? "awaiting" : null,
        payment_amount_cents: requiresPayment ? pixAmountCents : null,
      })
      .select()
      .single();

    if (insertError || !appointment) {
      console.error("[POST /api/bookings] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create appointment" },
        { status: 500 }
      );
    }

    // BUG-03: consome token apenas após insert bem-sucedido, evitando bloquear o cliente em caso de erro
    await supabase
      .from("phone_verifications")
      .update({ token_used_at: new Date().toISOString() })
      .eq("id", verification.id);

    // ── Se requer pagamento PIX, retorna dados para o frontend prosseguir ──────
    if (requiresPayment) {
      return NextResponse.json(
        {
          requires_payment: true,
          appointment_id: appointment.id,
          amount_cents: pixAmountCents,
          start_at: appointment.start_at, // BUG-10: authoritative value from DB
        },
        { status: 201 }
      );
    }

    const formattedDate = formatDatePtBR(startAt);
    const formattedTime = formatTimePtBR(startAt);
    const professionalName = professional?.name ?? "Qualquer disponível";

    const notificationPromises: Promise<unknown>[] = [];

    notificationPromises.push(
      sendWhatsApp(
        normalizedClientPhone,
        confirmationMessage({
          clientName: body.client_name,
          businessName: business.name,
          serviceName: serviceNames,
          professionalName,
          date: formattedDate,
          time: formattedTime,
          bookingId: appointment.id,
        })
      ).then(async (result) => {
        if (result.success) {
          await supabase
            .from("appointments")
            .update({ confirmation_sent: true })
            .eq("id", appointment.id);
        }
      })
    );

    if (business.phone_whatsapp) {
      notificationPromises.push(
        sendWhatsApp(
          business.phone_whatsapp,
          ownerNotificationMessage({
            ownerName: business.name,
            businessName: business.name,
            clientName: body.client_name,
            clientPhone: body.client_phone,
            serviceName: serviceNames,
            professionalName,
            date: formattedDate,
            time: formattedTime,
            notes: body.notes,
          })
        )
      );
    }

    Promise.allSettled(notificationPromises).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        appointment: {
          id: appointment.id,
          status: appointment.status,
          start_at: appointment.start_at,
          end_at: appointment.end_at,
          client_name: appointment.client_name,
          service_names: serviceNames,
          professional_name: professionalName,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
