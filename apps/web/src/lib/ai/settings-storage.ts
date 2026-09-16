import { PROVIDERS, type AiProvider } from "./providers";

/**
 * Config de BYOK persistida em localStorage (spec seção 9: "chave do
 * próprio usuário, guardada em localStorage, chamada direta do browser
 * para o provedor") — nunca enviada pra nenhum lugar além da chamada
 * direta ao provedor selecionado.
 */
export type AiSettings = {
  provider: AiProvider;
  apiKey: string;
  model: string;
};

const STORAGE_KEY = "power-lens:ai-settings";

export function loadAiSettings(): AiSettings | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    if (!parsed.provider || !parsed.apiKey) return undefined;
    return {
      provider: parsed.provider,
      apiKey: parsed.apiKey,
      model: parsed.model || PROVIDERS[parsed.provider].defaultModel,
    };
  } catch {
    return undefined;
  }
}

export function saveAiSettings(settings: AiSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage indisponível (modo privado, cota cheia) — a config
    // simplesmente não persiste entre sessões.
  }
}

export function clearAiSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // idem
  }
}

/** Mostra só os últimos 4 caracteres da chave, pra confirmar qual chave está
 * configurada sem expor o segredo inteiro na tela (screenshots, telas
 * compartilhadas). */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 4) return "••••";
  return `••••${apiKey.slice(-4)}`;
}
