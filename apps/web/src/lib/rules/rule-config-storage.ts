import type { RuleConfigMap } from "@power-lens/core";

/**
 * Config de liga/desliga + limiares das regras de health check, persistida
 * em localStorage — mesmo padrão de `lib/ai/settings-storage.ts` (chave
 * própria, `try/catch` em toda leitura/escrita, nunca lança).
 */
const STORAGE_KEY = "power-lens:rule-config";

export function loadRuleConfig(): RuleConfigMap | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as RuleConfigMap;
  } catch {
    return undefined;
  }
}

export function saveRuleConfig(config: RuleConfigMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // localStorage indisponível (modo privado, cota cheia) — a config
    // simplesmente não persiste entre sessões.
  }
}

export function clearRuleConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // idem
  }
}
