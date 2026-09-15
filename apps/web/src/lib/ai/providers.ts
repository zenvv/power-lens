/**
 * Chamada direta do browser pro provedor de LLM (spec seção 9: BYOK) — sem
 * backend, sem proxy. A OpenAI fica de fora de propósito: a API dela
 * (`api.openai.com`) não devolve `Access-Control-Allow-Origin`, ou seja,
 * não dá pra chamar direto do browser sem um servidor intermediário, o que
 * contrariaria o princípio "client-side only" do projeto. Confirmado contra
 * a documentação de cada provedor antes de escrever este arquivo:
 * - Anthropic libera CORS via o header `anthropic-dangerous-direct-browser-access`.
 * - Gemini libera CORS no endpoint REST simples `models/{model}:generateContent`
 *   (sem headers extras — headers como `Api-Revision`, usados por SDKs mais
 *   novos, quebram o preflight).
 */
export type AiProvider = "anthropic" | "gemini";

export type ProviderInfo = {
  label: string;
  defaultModel: string;
  modelHint: string;
  apiKeyUrl: string;
};

export const PROVIDERS: Record<AiProvider, ProviderInfo> = {
  anthropic: {
    label: "Anthropic (Claude)",
    defaultModel: "claude-sonnet-4-5",
    modelHint: "ID de um modelo disponível na sua conta Anthropic.",
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
  },
  gemini: {
    label: "Google Gemini",
    defaultModel: "gemini-2.5-flash",
    modelHint: "ID de um modelo disponível no Google AI Studio (tier gratuito cobre o flash).",
    apiKeyUrl: "https://aistudio.google.com/apikey",
  },
};

export class AiRequestError extends Error {}

async function callAnthropic(apiKey: string, model: string, prompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new AiRequestError(data?.error?.message ?? `A Anthropic respondeu ${response.status}.`);
  }

  const text = data?.content?.find((block: { type?: string }) => block?.type === "text")?.text;
  if (typeof text !== "string") {
    throw new AiRequestError("Resposta da Anthropic em um formato inesperado.");
  }
  return text;
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

  const data = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new AiRequestError(data?.error?.message ?? `O Gemini respondeu ${response.status}.`);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new AiRequestError("Resposta do Gemini em um formato inesperado (a mensagem pode ter sido bloqueada por filtro de segurança).");
  }
  return text;
}

export async function callAiProvider(
  provider: AiProvider,
  apiKey: string,
  model: string,
  prompt: string,
): Promise<string> {
  try {
    return provider === "anthropic" ? await callAnthropic(apiKey, model, prompt) : await callGemini(apiKey, model, prompt);
  } catch (err) {
    if (err instanceof AiRequestError) throw err;
    // fetch() rejeita com um TypeError genérico ("Failed to fetch") pra
    // qualquer falha de rede/CORS, sem detalhe nenhum — o browser não expõe
    // o motivo real por segurança.
    throw new AiRequestError(
      "Não foi possível contatar o provedor. Verifique sua conexão e se a chave de API está correta.",
    );
  }
}
