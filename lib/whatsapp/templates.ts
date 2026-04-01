// WhatsApp message templates for appointment notifications

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

  const lines = [
    `✅ *Agendamento Confirmado!*`,
    ``,
    `Oi, ${clientName}! Seu horário foi agendado com sucesso.`,
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

  const lines = [
    `⏰ *Lembrete de Agendamento*`,
    ``,
    `Oi, ${clientName}! Passando para lembrar do seu horário de hoje.`,
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

  const lines = [
    `🔔 *Novo Agendamento — ${businessName}*`,
    ``,
    `Oi, ${ownerName}! Você recebeu um novo agendamento.`,
    ``,
    `👤 *Cliente:* ${clientName}`,
    `📱 *Telefone:* ${clientPhone}`,
    `✂️ *Serviço:* ${serviceName}`,
    `👨‍💼 *Profissional:* ${professionalName}`,
    `📅 *Data:* ${date}`,
    `⏰ *Horário:* ${time}`,
  ];

  if (notes) {
    lines.push(`📝 *Observações:* ${notes}`);
  }

  lines.push(``, `_Marque Já — Plataforma de Agendamentos_`);

  return lines.join("\n");
}

/**
 * Generates cancellation message sent to client
 */
export function cancellationMessage(params: CancellationParams): string {
  const { clientName, businessName, serviceName, date, time, reason } = params;

  const lines = [
    `❌ *Agendamento Cancelado*`,
    ``,
    `Oi, ${clientName}. Seu agendamento foi cancelado.`,
    ``,
    `📋 *Agendamento cancelado:*`,
    `• Estabelecimento: ${businessName}`,
    `• Serviço: ${serviceName}`,
    `• Data: ${date} às ${time}`,
  ];

  if (reason) {
    lines.push(``, `📝 *Motivo:* ${reason}`);
  }

  lines.push(
    ``,
    `Para fazer um novo agendamento, acesse o link do estabelecimento.`,
    ``,
    `_Desculpe o inconveniente. 🙏_`
  );

  return lines.join("\n");
}
