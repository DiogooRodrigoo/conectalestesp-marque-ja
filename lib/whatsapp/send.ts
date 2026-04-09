// WhatsApp dispatcher — Evolution API with Twilio fallback

interface SendResult {
  success: boolean;
  provider: "evolution" | "twilio" | null;
  messageId?: string;
  error?: string;
}

/**
 * Normalizes phone number to E.164 format for WhatsApp
 * Assumes Brazilian numbers if no country code provided
 */
function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Already has country code (starts with 55 for Brazil, 11 digits+)
  if (digits.length >= 12) {
    return `+${digits}`;
  }

  // Brazilian number without country code
  if (digits.length === 11) {
    return `+55${digits}`;
  }

  if (digits.length === 10) {
    // Landline without DDD — assume São Paulo (11)
    return `+5511${digits}`;
  }

  return `+55${digits}`;
}

/**
 * Sends message via Evolution API
 */
async function sendViaEvolution(
  to: string,
  message: string
): Promise<SendResult> {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;

  if (!apiUrl || !apiKey || !instance) {
    return {
      success: false,
      provider: null,
      error: "Evolution API credentials not configured",
    };
  }

  // Evolution GO usa número no formato XXXXXXXXXXX@s.whatsapp.net (sem +55 duplicado)
  const digits = to.replace(/\D/g, "");
  // Se já tiver 55 no início (código do Brasil), usa como está; senão adiciona
  const normalized = digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
  const phone = `${normalized}@s.whatsapp.net`;

  try {
    const response = await fetch(`${apiUrl}/send/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        success: false,
        provider: "evolution",
        error: `Evolution GO error ${response.status}: ${body}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      provider: "evolution",
      messageId: data?.id,
    };
  } catch (err) {
    return {
      success: false,
      provider: "evolution",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Sends message via Twilio WhatsApp (fallback)
 */
async function sendViaTwilio(
  to: string,
  message: string
): Promise<SendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    return {
      success: false,
      provider: null,
      error: "Twilio credentials not configured",
    };
  }

  const phone = normalizePhone(to);
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
    "base64"
  );

  try {
    const body = new URLSearchParams({
      From: `whatsapp:${from}`,
      To: `whatsapp:${phone}`,
      Body: message,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        provider: "twilio",
        error: `Twilio error: ${data.message || response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      provider: "twilio",
      messageId: data.sid,
    };
  } catch (err) {
    return {
      success: false,
      provider: "twilio",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Main dispatcher — tries Evolution API first, falls back to Twilio
 */
export async function sendWhatsApp(
  to: string,
  message: string
): Promise<SendResult> {
  // Try Evolution API first
  const evolutionResult = await sendViaEvolution(to, message);

  if (evolutionResult.success) {
    return evolutionResult;
  }

  console.warn(
    `[WhatsApp] Evolution API failed: ${evolutionResult.error}. Trying Twilio...`
  );

  // Fall back to Twilio
  const twilioResult = await sendViaTwilio(to, message);

  if (!twilioResult.success) {
    console.error(
      `[WhatsApp] Both providers failed. Twilio: ${twilioResult.error}`
    );
  }

  return twilioResult;
}
