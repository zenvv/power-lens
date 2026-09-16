import type { Diagnostic, PowerLensDocument } from "../ir/index.js";
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

/**
 * Opções numéricas de uma regra (hoje só limiares — PL005/PL006). Uma regra
 * que não declara `options` no seu `RuleDescriptor` ignora o segundo
 * argumento; passar `options` pra ela não tem efeito.
 */
export type RuleOptions = Record<string, number>;

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
 * idêntico a antes desta lista existir (todas ligadas, limiares default). */
export const RULE_REGISTRY: readonly RuleDescriptor[] = [
  { code: "PL001", label: "Tela órfã", run: pl001OrphanScreen },
  { code: "PL002", label: "Controle com nome default", run: pl002DefaultControlName },
  { code: "PL003", label: "Fonte de dados nunca referenciada", run: pl003UnusedDataSource },
  { code: "PL004", label: "GUID hardcoded em fórmula", run: pl004HardcodedGuid },
  {
    code: "PL005",
    label: "App.OnStart muito longo",
    run: pl005LongOnStart,
    options: [{ key: "maxLines", label: "Linhas máximas", defaultValue: MAX_ONSTART_LINES, min: 1 }],
  },
  {
    code: "PL006",
    label: "Fórmula duplicada entre controles",
    run: pl006DuplicateFormula,
    options: [{ key: "minOccurrences", label: "Ocorrências mínimas", defaultValue: MIN_OCCURRENCES, min: 2 }],
  },
  { code: "PL007", label: "Propriedade de acessibilidade vazia", run: pl007EmptyAccessibleLabel },
  { code: "PL008", label: "Função sem delegação sobre dado remoto", run: pl008NonDelegableFunction },
  { code: "PL009", label: "Conector premium em uso", run: pl009PremiumConnector },
  { code: "PL010", label: "Relacionamento inativo", run: pl010InactiveRelationship },
  { code: "PL011", label: "Ação crítica sem tratamento de falha", run: pl011UnhandledCriticalAction },
  { code: "PL012", label: "Foreach aninhado", run: pl012NestedForeach },
  { code: "PL013", label: "Tabela/coluna do modelo nunca referenciada", run: pl013UnusedModelEntity },
  { code: "PL014", label: "Relacionamento com forma arriscada", run: pl014RiskyRelationshipShape },
];

/** Mantido pra compatibilidade com quem só quer a lista de funções, sem
 * metadado — derivado de `RULE_REGISTRY`, não uma segunda fonte da verdade. */
export const HEALTH_CHECK_RULES: readonly HealthCheckRule[] = RULE_REGISTRY.map((descriptor) => descriptor.run);

/** Roda as regras de health check sobre o documento e retorna os
 * diagnósticos encontrados (não modifica `doc`). Sem `configs`, roda todas
 * com os defaults — mesmo comportamento de antes da Fase 8 do plano de
 * features. Uma regra com `enabled: false` no config não roda; `options`
 * repassa limiares customizados pras regras que os declaram. */
export function runHealthChecks(doc: PowerLensDocument, configs?: RuleConfigMap): Diagnostic[] {
  return RULE_REGISTRY.flatMap(({ code, run }) => {
    const config = configs?.[code];
    if (config && !config.enabled) return [];
    return run(doc, config?.options);
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
};
