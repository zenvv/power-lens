import type { Diagnostic, PowerLensDocument } from "../ir/index.js";
import { getMessages, type Locale, type Messages } from "../i18n/index.js";
import { en } from "../i18n/messages/en.js";
import { pl001OrphanScreen } from "./pl001-orphan-screen.js";
import { pl002DefaultControlName } from "./pl002-default-control-name.js";
import { pl003UnusedDataSource } from "./pl003-unused-data-source.js";
import { pl004HardcodedGuid } from "./pl004-hardcoded-guid.js";
import { MAX_ONSTART_LINES, pl005LongOnStart } from "./pl005-long-onstart.js";
import { MIN_OCCURRENCES, pl006DuplicateFormula } from "./pl006-duplicate-formula.js";
import { pl007EmptyAccessibleLabel } from "./pl007-empty-accessible-label.js";
import { pl008NonDelegableFunction } from "./pl008-non-delegable-function.js";
import { pl009PremiumConnector } from "./pl009-premium-connector.js";
import { pl010InactiveRelationship } from "./pl010-inactive-relationship.js";
import { pl011UnhandledCriticalAction } from "./pl011-unhandled-critical-action.js";
import { pl012NestedForeach } from "./pl012-nested-foreach.js";
import { pl013UnusedModelEntity } from "./pl013-unused-model-entity.js";
import { pl014RiskyRelationshipShape } from "./pl014-risky-relationship-shape.js";
import { pl015LowContrast } from "./pl015-low-contrast.js";

/**
 * Opções de uma regra: limiares numéricos (hoje só PL005/PL006 — uma regra
 * que não declara `options` no seu `RuleDescriptor` ignora os campos que não
 * usa) + `locale`, lido por toda regra pra escolher o dicionário de
 * mensagens (`../i18n`).
 */
export type RuleOptions = {
  locale?: Locale;
  maxLines?: number;
  minOccurrences?: number;
};

export type HealthCheckRule = (doc: PowerLensDocument, options?: RuleOptions) => Diagnostic[];

/** Descreve uma opção numérica configurável de uma regra, pra UI conseguir
 * montar um formulário sem precisar conhecer cada regra individualmente. */
export type RuleOptionDef = {
  key: string;
  label: string;
  defaultValue: number;
  min: number;
};

export type RuleDescriptor = {
  code: string;
  label: string;
  run: HealthCheckRule;
  options?: RuleOptionDef[];
};

/** Config persistida pelo usuário pra uma regra — ausente equivale a
 * `{ enabled: true }` com os `defaultValue` de cada opção. */
export type RuleConfig = {
  enabled: boolean;
  options?: RuleOptions;
};

export type RuleConfigMap = Record<string, RuleConfig>;

/** Toda regra em `packages/core/src/rules/` nesta lista — spec seção 7 +
 * regra de arquitetura 6 do CLAUDE.md (uma função pura por arquivo). Liga/
 * desliga e limiares são opt-in: sem `RuleConfigMap`, o comportamento é
 * idêntico a antes desta lista existir (todas ligadas, limiares default).
 * `label`/`options[].label` aqui são o texto em `DEFAULT_LOCALE` (inglês) —
 * pra exibir numa UI que respeita o idioma escolhido, usar
 * `getRuleRegistry(locale)`. */
export const RULE_REGISTRY: readonly RuleDescriptor[] = [
  { code: "PL001", label: en.rules.pl001.label, run: pl001OrphanScreen },
  { code: "PL002", label: en.rules.pl002.label, run: pl002DefaultControlName },
  { code: "PL003", label: en.rules.pl003.label, run: pl003UnusedDataSource },
  { code: "PL004", label: en.rules.pl004.label, run: pl004HardcodedGuid },
  {
    code: "PL005",
    label: en.rules.pl005.label,
    run: pl005LongOnStart,
    options: [{ key: "maxLines", label: en.rules.pl005.optionLabel, defaultValue: MAX_ONSTART_LINES, min: 1 }],
  },
  {
    code: "PL006",
    label: en.rules.pl006.label,
    run: pl006DuplicateFormula,
    options: [{ key: "minOccurrences", label: en.rules.pl006.optionLabel, defaultValue: MIN_OCCURRENCES, min: 2 }],
  },
  { code: "PL007", label: en.rules.pl007.label, run: pl007EmptyAccessibleLabel },
  { code: "PL008", label: en.rules.pl008.label, run: pl008NonDelegableFunction },
  { code: "PL009", label: en.rules.pl009.label, run: pl009PremiumConnector },
  { code: "PL010", label: en.rules.pl010.label, run: pl010InactiveRelationship },
  { code: "PL011", label: en.rules.pl011.label, run: pl011UnhandledCriticalAction },
  { code: "PL012", label: en.rules.pl012.label, run: pl012NestedForeach },
  { code: "PL013", label: en.rules.pl013.label, run: pl013UnusedModelEntity },
  { code: "PL014", label: en.rules.pl014.label, run: pl014RiskyRelationshipShape },
  { code: "PL015", label: en.rules.pl015.label, run: pl015LowContrast },
];

/** `RULE_REGISTRY` traduzido pro `locale` pedido — mesma lista, só
 * `label`/`options[].label` trocados pelo dicionário de `../i18n`. */
export function getRuleRegistry(locale: Locale): readonly RuleDescriptor[] {
  const messages = getMessages(locale);
  const optionLabels: Partial<Record<string, string>> = {
    maxLines: messages.rules.pl005.optionLabel,
    minOccurrences: messages.rules.pl006.optionLabel,
  };
  return RULE_REGISTRY.map((descriptor) => {
    const code = descriptor.code.toLowerCase() as keyof Messages["rules"];
    const translatedOptions = descriptor.options?.map((option) => ({
      ...option,
      label: optionLabels[option.key] ?? option.label,
    }));
    return {
      ...descriptor,
      label: messages.rules[code].label,
      ...(translatedOptions ? { options: translatedOptions } : {}),
    };
  });
}

/** Mantido pra compatibilidade com quem só quer a lista de funções, sem
 * metadado — derivado de `RULE_REGISTRY`, não uma segunda fonte da verdade. */
export const HEALTH_CHECK_RULES: readonly HealthCheckRule[] = RULE_REGISTRY.map((descriptor) => descriptor.run);

/** Roda as regras de health check sobre o documento e retorna os
 * diagnósticos encontrados (não modifica `doc`). Sem `configs`, roda todas
 * com os defaults — mesmo comportamento de antes da Fase 8 do plano de
 * features. Uma regra com `enabled: false` no config não roda; `options`
 * repassa limiares customizados pras regras que os declaram. Sem `locale`,
 * mensagens saem em `DEFAULT_LOCALE`. */
export function runHealthChecks(doc: PowerLensDocument, configs?: RuleConfigMap, locale?: Locale): Diagnostic[] {
  return RULE_REGISTRY.flatMap(({ code, run }) => {
    const config = configs?.[code];
    if (config && !config.enabled) return [];
    const options: RuleOptions = { ...config?.options };
    if (locale !== undefined) options.locale = locale;
    return run(doc, options);
  });
}

export {
  pl001OrphanScreen,
  pl002DefaultControlName,
  pl003UnusedDataSource,
  pl004HardcodedGuid,
  pl005LongOnStart,
  pl006DuplicateFormula,
  pl007EmptyAccessibleLabel,
  pl008NonDelegableFunction,
  pl009PremiumConnector,
  pl010InactiveRelationship,
  pl011UnhandledCriticalAction,
  pl012NestedForeach,
  pl013UnusedModelEntity,
  pl014RiskyRelationshipShape,
  pl015LowContrast,
};
