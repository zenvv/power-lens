import type { Diagnostic, PowerLensDocument } from "../ir/index.js";
import { pl001OrphanScreen } from "./pl001-orphan-screen.js";
import { pl002DefaultControlName } from "./pl002-default-control-name.js";
import { pl003UnusedDataSource } from "./pl003-unused-data-source.js";
import { pl004HardcodedGuid } from "./pl004-hardcoded-guid.js";
import { pl005LongOnStart } from "./pl005-long-onstart.js";
import { pl006DuplicateFormula } from "./pl006-duplicate-formula.js";
import { pl007EmptyAccessibleLabel } from "./pl007-empty-accessible-label.js";
import { pl008NonDelegableFunction } from "./pl008-non-delegable-function.js";
import { pl009PremiumConnector } from "./pl009-premium-connector.js";
import { pl010InactiveRelationship } from "./pl010-inactive-relationship.js";
import { pl011UnhandledCriticalAction } from "./pl011-unhandled-critical-action.js";
import { pl012NestedForeach } from "./pl012-nested-foreach.js";
import { pl013UnusedModelEntity } from "./pl013-unused-model-entity.js";
import { pl014RiskyRelationshipShape } from "./pl014-risky-relationship-shape.js";

export type HealthCheckRule = (doc: PowerLensDocument) => Diagnostic[];

/** Toda regra em `packages/core/src/rules/` nesta lista — spec seção 7 +
 * regra de arquitetura 6 do CLAUDE.md (uma função pura por arquivo). */
export const HEALTH_CHECK_RULES: readonly HealthCheckRule[] = [
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
];

/** Roda todas as regras de health check sobre o documento e retorna os
 * diagnósticos encontrados (não modifica `doc`). */
export function runHealthChecks(doc: PowerLensDocument): Diagnostic[] {
  return HEALTH_CHECK_RULES.flatMap((rule) => rule(doc));
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
