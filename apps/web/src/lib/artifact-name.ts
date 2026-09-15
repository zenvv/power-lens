/** Solutions nomeiam fluxos/apps com o caminho completo dentro do pacote
 * (ex.: "Workflows/ACESSOS_E_LICENAS_NOVA-0311FCDC-..."). Pra abas e listas,
 * só o último segmento interessa — o caminho completo continua disponível
 * via `title` pra quem precisar conferir. */
export function shortArtifactName(name: string): string {
  const lastSlash = name.lastIndexOf("/");
  return lastSlash === -1 ? name : name.slice(lastSlash + 1);
}
