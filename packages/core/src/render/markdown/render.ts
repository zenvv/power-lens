import type { PowerLensDocument } from "../../ir/index.js";
import { renderCanvasAppSection } from "./sections/canvas-app.js";
import { renderCloudFlowSection } from "./sections/cloud-flow.js";
import { renderDataModelSection } from "./sections/data-model.js";
import { renderDiagnosticsSection } from "./sections/diagnostics.js";
import { renderReportSection } from "./sections/report.js";
import { renderSolutionMetaSection } from "./sections/solution-meta.js";
import { renderSummarySection } from "./sections/summary.js";

/**
 * Deterministic Markdown export from the IR — spec section 7: "zero IA
 * envolvida... o baseline com o qual a saída da IA é comparada." Renders
 * every Artifact kind the union supports, even though only canvasApp and
 * solutionMeta are produced by any parser yet, since a renderer should work
 * off the IR shape rather than the current parsers' coverage.
 */
export function renderMarkdown(document: PowerLensDocument): string {
  const sections: string[] = [renderSummarySection(document)];

  for (const artifact of document.artifacts) {
    switch (artifact.kind) {
      case "canvasApp":
        sections.push(renderCanvasAppSection(artifact));
        break;
      case "cloudFlow":
        sections.push(renderCloudFlowSection(artifact));
        break;
      case "dataModel":
        sections.push(renderDataModelSection(artifact));
        break;
      case "report":
        sections.push(renderReportSection(artifact));
        break;
      case "solutionMeta":
        sections.push(renderSolutionMetaSection(artifact));
        break;
    }
  }

  sections.push(renderDiagnosticsSection(document.diagnostics));

  return sections.join("\n");
}
