import { describe, expect, it } from "vitest";
import { pl001OrphanScreen } from "../../src/rules/pl001-orphan-screen.js";
import { runHealthChecks } from "../../src/rules/index.js";
import { canvasApp, control, emptyDocument } from "./helpers.js";

/** Cobertura mínima de que os três dicionários (`en`/`pt`/`es`) realmente
 * produzem texto distinto e que `locale` atravessa `runHealthChecks` até a
 * regra individual — não repete a cobertura funcional de cada regra
 * (já testada nos arquivos `plNNN-*.test.ts`), só a camada de i18n. */
describe("rule messages respect locale", () => {
  function orphanScreenDoc() {
    const doc = emptyDocument();
    doc.artifacts = [
      canvasApp({
        screens: [
          { name: "Screen1", order: 0, root: control({ name: "Screen1", type: "Screen" }) },
          { name: "Screen2", order: 1, root: control({ name: "Screen2", type: "Screen" }) },
        ],
      }),
    ];
    return doc;
  }

  it("defaults to English when no locale is passed", () => {
    const [diagnostic] = pl001OrphanScreen(orphanScreenDoc());
    expect(diagnostic?.message).toContain("isn't referenced");
  });

  it("produces Portuguese text for options.locale = 'pt'", () => {
    const [diagnostic] = pl001OrphanScreen(orphanScreenDoc(), { locale: "pt" });
    expect(diagnostic?.message).toContain("não é referenciada");
  });

  it("produces Spanish text for options.locale = 'es'", () => {
    const [diagnostic] = pl001OrphanScreen(orphanScreenDoc(), { locale: "es" });
    expect(diagnostic?.message).toContain("no está referenciada");
  });

  it("runHealthChecks threads locale through to every rule", () => {
    const diagnostics = runHealthChecks(orphanScreenDoc(), undefined, "es");
    const pl001 = diagnostics.find((d) => d.code === "PL001");
    expect(pl001?.message).toContain("no está referenciada");
  });
});
