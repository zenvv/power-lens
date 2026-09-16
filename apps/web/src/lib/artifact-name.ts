/** Solutions sufixam o nome interno do fluxo com o GUID do workflow (ex.:
 * "NOVA_SOLICITACAO-D5A9B79A-500E-F011-9989-7C1E526B3853") — é só um
 * identificador técnico, não faz parte do nome que a pessoa deu ao fluxo.
 * Some da exibição; o nome completo continua disponível via `title` pra
 * quem precisar conferir. */
const TRAILING_GUID = /-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Solutions nomeiam fluxos/apps com o caminho completo dentro do pacote
 * (ex.: "Workflows/ACESSOS_E_LICENAS_NOVA-0311FCDC-..."). Pra abas e listas,
 * só o último segmento interessa — o caminho completo continua disponível
 * via `title` pra quem precisar conferir. */
export function shortArtifactName(name: string): string {
  const lastSlash = name.lastIndexOf("/");
  const segment = lastSlash === -1 ? name : name.slice(lastSlash + 1);
  return segment.replace(TRAILING_GUID, "");
}
