// WhatsApp message templates for appointment notifications

// B-02: Strip WhatsApp formatting characters from user-provided text to prevent
// injection of bold/italic/strike/code/link formatting into notifications.
function sanitize(text: string): string {
  return text.replace(/[*_~`[\]|]/g, "").trim();
}

export interface ConfirmationParams {
  clientName: string;
  businessName: string;
  serviceName: string;
  professionalName: string;
  date: string; // formatted: "Segunda, 30 de março"
  time: string; // formatted: "14:30"
  address?: string;
  bookingId: string;
}

export interface ReminderParams {
  clientName: string;
  businessName: string;
  serviceName: string;
  professionalName: string;
  date: string;
  time: string;
  address?: string;
}

export interface OwnerNotificationParams {
  ownerName: string;
  businessName: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  professionalName: string;
  date: string;
  time: string;
  notes?: string;
}

export interface CancellationParams {
  clientName: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
  reason?: string;
}

/**
 * Generates confirmation message sent to client after booking
 */
export function confirmationMessage(params: ConfirmationParams): string {
  const {
    clientName,
    businessName,
    serviceName,
    professionalName,
    date,
    time,
    address,
    bookingId,
  } = params;

  const safeClientName = sanitize(clientName);
  const lines = [
    `✅ *Agendamento Confirmado!*`,
    ``,
    `Oi, ${safeClientName}! Seu horário foi agendado com sucesso.`,
    ``,
    `📋 *Detalhes do agendamento:*`,
    `• Estabelecimento: ${businessName}`,
    `• Serviço: ${serviceName}`,
    `• Profissional: ${professionalName}`,
    `• Data: ${date}`,
    `• Horário: ${time}`,
  ];

  if (address) {
    lines.push(`• Endereço: ${address}`);
  }

  lines.push(
    ``,
    `🔖 Código do agendamento: #${bookingId.slice(0, 8).toUpperCase()}`,
    ``,
    `Caso precise cancelar ou remarcar, entre em contato com antecedência.`,
    ``,
    `_Até logo! 👋_`
  );

  return lines.join("\n");
}

/**
 * Generates reminder message sent ~2h before appointment
 */
export function reminderMessage(params: ReminderParams): string {
  const {
    clientName,
    businessName,
    serviceName,
    professionalName,
    date,
    time,
    address,
  } = params;

  const safeClientName = sanitize(clientName);
  const lines = [
    `⏰ *Lembrete de Agendamento*`,
    ``,
    `Oi, ${safeClientName}! Passando para lembrar do seu horário de hoje.`,
    ``,
    `📋 *Resumo:*`,
    `• ${businessName}`,
    `• ${serviceName} com ${professionalName}`,
    `• Hoje, ${date} às ${time}`,
  ];

  if (address) {
    lines.push(`• ${address}`);
  }

  lines.push(``, `Te esperamos! 😊`);

  return lines.join("\n");
}

/**
 * Generates notification to business owner when new booking is made
 */
export function ownerNotificationMessage(params: OwnerNotificationParams): string {
  const {
    ownerName,
    businessName,
    clientName,
    clientPhone,
    serviceName,
    professionalName,
    date,
    time,
    notes,
  } = params;

  const safeClientName = sanitize(clientName);
  const safeNotes      = notes ? sanitize(notes) : null;
  const lines = [
    `🔔 *Novo Agendamento — ${businessName}*`,
    ``,
    `Oi, ${ownerName}! Você recebeu um novo agendamento.`,
    ``,
    `👤 *Cliente:* ${safeClientName}`,
    `📱 *Telefone:* ${clientPhone}`,
    `✂️ *Serviço:* ${serviceName}`,
    `👨‍💼 *Profissional:* ${professionalName}`,
    `📅 *Data:* ${date}`,
    `⏰ *Horário:* ${time}`,
  ];

  if (safeNotes) {
    lines.push(`📝 *Observações:* ${safeNotes}`);
  }

  lines.push(``, `_Marque Já — Plataforma de Agendamentos_`);

  return lines.join("\n");
}

/**
 * Generates cancellation message sent to client
 */
export function cancellationMessage(params: CancellationParams): string {
  const { clientName, businessName, serviceName, date, time, reason } = params;

  const safeClientName = sanitize(clientName);
  const safeReason     = reason ? sanitize(reason) : null;
  const lines = [
    `❌ *Agendamento Cancelado*`,
    ``,
    `Oi, ${safeClientName}. Seu agendamento foi cancelado.`,
    ``,
    `📋 *Agendamento cancelado:*`,
    `• Estabelecimento: ${businessName}`,
    `• Serviço: ${serviceName}`,
    `• Data: ${date} às ${time}`,
  ];

  if (safeReason) {
    lines.push(``, `📝 *Motivo:* ${safeReason}`);
  }

  lines.push(
    ``,
    `Para fazer um novo agendamento, acesse o link do estabelecimento.`,
    ``,
    `_Desculpe o inconveniente. 🙏_`
  );

  return lines.join("\n");
}
