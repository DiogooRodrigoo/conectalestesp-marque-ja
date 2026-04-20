// WhatsApp dispatcher — Evolution API

interface SendResult {
  success: boolean;
  provider: "evolution" | null;
  messageId?: string;
  error?: string;
}

export async function sendWhatsApp(
  to: string,
  message: string
): Promise<SendResult> {
  if (process.env.WHATSAPP_ENABLED !== "true") {
    return { success: false, provider: null, error: "WhatsApp notifications disabled" };
  }

  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;

  if (!apiUrl || !apiKey || !instance) {
    return { success: false, provider: null, error: "Evolution API credentials not configured" };
  }

  const digits = to.replace(/\D/g, "");
  const normalized = digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
  const phone = `${normalized}@s.whatsapp.net`;

  try {
    const response = await fetch(`${apiUrl}/send/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
        instanceid: instance,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[WhatsApp] Evolution error ${response.status}: ${body}`);
      return { success: false, provider: "evolution", error: `${response.status}: ${body}` };
    }

    const data = await response.json();
    return { success: true, provider: "evolution", messageId: data?.key?.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error(`[WhatsApp] Evolution fetch error: ${error}`);
    return { success: false, provider: "evolution", error };
  }
}
