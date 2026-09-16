import { describe, expect, it } from "vitest";
import { shortArtifactName } from "../src/lib/artifact-name.js";

describe("shortArtifactName", () => {
  it("keeps only the last path segment", () => {
    expect(shortArtifactName("Workflows/COMPRAS_NOVA_SOLICITACAO")).toBe(
      "COMPRAS_NOVA_SOLICITACAO",
    );
  });

  it("strips a trailing workflow GUID", () => {
    expect(
      shortArtifactName("NIONE_COMPRAS_NOVA_SOLICITAO-D5A9B79A-500E-F011-9989-7C1E526B3853"),
    ).toBe("NIONE_COMPRAS_NOVA_SOLICITAO");
  });

  it("strips the GUID after taking the last path segment", () => {
    expect(
      shortArtifactName(
        "Workflows/COMPRAS_ATT_STATUS-F51AC1CE-17A8-EF11-B8E8-7C1E521C819B",
      ),
    ).toBe("COMPRAS_ATT_STATUS");
  });

  it("leaves names without a trailing GUID untouched", () => {
    expect(shortArtifactName("ACESSOS_E_LICENCAS")).toBe("ACESSOS_E_LICENCAS");
  });
});
