import ELK, { type ElkExtendedEdge, type ElkNode } from "elkjs/lib/elk.bundled.js";
import type { CloudFlow, FlowNode } from "@power-lens/core";
import type { Edge, Node } from "@xyflow/react";

const elk = new ELK();

export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 60;
export const GROUP_HEADER_HEIGHT = 40;
/** Altura reservada pro bloco de texto da condição/coleção (If/Foreach),
 * abaixo do cabeçalho — não do lado dele, pra caber sem espremer o nome do
 * grupo. `line-clamp-2` no componente garante que o texto nunca estoure
 * essa altura (2 linhas de ~11px + padding). */
export const GROUP_DETAIL_HEIGHT = 36;
export const BRANCH_HEADER_HEIGHT = 26;
/** Largura mínima de um grupo (If/Foreach/Scope/Switch) — maior que a de uma
 * action folha (`NODE_WIDTH`) pra sobrar espaço horizontal pro bloco de
 * condição/coleção quebrar em poucas linhas em vez de uma coluna estreita. */
const GROUP_MIN_WIDTH = 360;

/** Sentido do DAG: "DOWN" (padrão, cima pra baixo) ou "RIGHT" (esquerda pra
 * direita) — passado direto pro `elk.direction` do ELK, que já suporta os
 * dois nativamente. */
export type FlowDirection = "DOWN" | "RIGHT";

/** `extraTopPadding` reserva espaço extra no topo pro bloco de
 * condição/coleção de um If/Foreach (`GROUP_DETAIL_HEIGHT`) — 0 pra
 * qualquer outro tipo de grupo, que só tem o cabeçalho normal. */
function groupLayoutOptions(direction: FlowDirection, extraTopPadding = 0) {
  return {
    "elk.algorithm": "layered",
    "elk.direction": direction,
    "elk.spacing.nodeNode": "28",
    "elk.layered.spacing.nodeNodeBetweenLayers": "40",
    // O cabeçalho do grupo (chevron + nome + eventual bloco de condição)
    // sempre fica na faixa de cima da caixa, independente do sentido do
    // fluxo dos filhos — por isso o padding-top reservado não muda com a
    // direção.
    "elk.padding": `[top=${GROUP_HEADER_HEIGHT + extraTopPadding + 16},left=16,bottom=16,right=16]`,
    "elk.nodeSize.constraints": "MINIMUM_SIZE",
    "elk.nodeSize.minimum": `(${GROUP_MIN_WIDTH}, 0)`,
  } as const;
}

/** Igual a `groupLayoutOptions`, mas pro nó que envolve os branch containers
 * de um If/Switch (`buildBranchingElkNode`). Os branch containers nunca têm
 * aresta entre si (um `true` não roda depois de um `false`), então sem essa
 * opção o ELK os trata como "componentes desconectados" e os empilha
 * verticalmente com seu empacotador simples, ignorando `elk.direction`
 * completamente. Desligando `separateConnectedComponents`, eles voltam a
 * entrar no algoritmo "layered" normal — como não há aresta entre eles,
 * caem na mesma camada, e nós de uma mesma camada se arranjam
 * perpendicular ao sentido do layout (por isso aqui é só `direction`, sem
 * inverter: layout "DOWN" bota a mesma camada lado a lado horizontalmente,
 * que é o que queremos pros dois ramos). */
function branchesWrapperLayoutOptions(direction: FlowDirection, extraTopPadding = 0) {
  return {
    ...groupLayoutOptions(direction, extraTopPadding),
    "elk.separateConnectedComponents": "false",
    "elk.spacing.componentComponent": "28",
  } as const;
}

/** Igual a `groupLayoutOptions`, mas com um topo mais baixo — o rótulo de um
 * branch (nome do case, ou "true"/"false" cru) é só um label, sem chevron
 * nem ícone, então não precisa da mesma altura reservada de um cabeçalho de
 * grupo colapsável. Tem largura/altura mínima própria pra que um branch
 * vazio ainda apareça como uma caixa do tamanho de uma action, não uma
 * lasca sem conteúdo. */
function branchLayoutOptions(direction: FlowDirection) {
  return {
    "elk.algorithm": "layered",
    "elk.direction": direction,
    "elk.spacing.nodeNode": "28",
    "elk.layered.spacing.nodeNodeBetweenLayers": "40",
    "elk.padding": `[top=${BRANCH_HEADER_HEIGHT + 12},left=12,bottom=12,right=12]`,
    "elk.nodeSize.constraints": "MINIMUM_SIZE",
    "elk.nodeSize.minimum": `(${NODE_WIDTH}, ${NODE_HEIGHT + BRANCH_HEADER_HEIGHT + 24})`,
  } as const;
}

export type FlowRfActionNodeData = {
  kind: "action";
  flowNode: FlowNode;
  isGroup: boolean;
  collapsed: boolean;
  childCount: number;
  direction: FlowDirection;
  isTrigger: boolean;
  isEnd: boolean;
};

/** Nó sintético, sem `FlowNode` correspondente no IR — só um contêiner
 * visual pro lado "true"/"false" de um If (ou o case de um Switch), pra
 * separar os ramos lado a lado como no Power Automate em vez de misturar as
 * ações dos dois lados dentro da mesma caixa (spec seção 3, "IR-first": o
 * layout não inventa dado novo, só reagrupa visualmente o que `branch` já
 * diz no IR). */
export type FlowRfBranchNodeData = {
  kind: "branch";
  ownerType: string;
  branch: string;
  /** Ramo declarado (true/false de um If, sempre mostrados os dois) mas sem
   * nenhuma action dentro na definição — o componente desenha um placeholder
   * pontilhado em vez de uma caixa vazia sem explicação. */
  isEmpty: boolean;
  direction: FlowDirection;
};

export type FlowRfNodeData = FlowRfActionNodeData | FlowRfBranchNodeData;

type PlainEdge = { id: string; source: string; target: string; statuses: string[] };
type BranchContainerInfo = { ownerType: string; branch: string; isEmpty: boolean };

/** Só If/Foreach ganham o bloco de texto extra no cabeçalho do grupo — os
 * outros tipos (Scope/Switch) não têm um `condition`/`iterateOver` no IR. */
function hasGroupDetail(flowNode: FlowNode): boolean {
  return Boolean(
    (flowNode.type === "If" && flowNode.condition) || (flowNode.type === "Foreach" && flowNode.iterateOver),
  );
}

/** Tipos de action cujos filhos se separam em ramos visuais distintos —
 * If (`branch`: "true"/"false") e Switch (`branch`: nome do case ou
 * "default"). Scope/Foreach não entram aqui: seus filhos não têm `branch`,
 * há só um "lado". */
const BRANCHING_TYPES = new Set(["If", "Switch"]);

function branchContainerId(ownerId: string, branch: string): string {
  return `${ownerId}::branch::${branch}`;
}

/** Ordem de exibição dos ramos. Um If sempre mostra os dois lados, "true"
 * antes de "false", mesmo que um deles não tenha nenhuma action na
 * definição (o branch container correspondente entra vazio — ver
 * `FlowRfBranchNodeData.isEmpty` — em vez de sumir, já que um If sempre tem
 * conceitualmente dois lados). Switch mantém a ordem de aparição dos cases,
 * com "default" sempre por último — aí sim só aparece um contêiner pros
 * cases que de fato têm ações, porque não há como saber os nomes dos cases
 * vazios (`flattenActions` não os flatten, então não sobra rastro deles no
 * IR pra fabricar uma caixa "vazia" com o nome certo). */
function orderBranches(ownerType: string, children: readonly FlowNode[]): string[] {
  if (ownerType === "If") return ["true", "false"];

  const seen: string[] = [];
  for (const child of children) {
    if (child.branch && !seen.includes(child.branch)) seen.push(child.branch);
  }
  if (seen.includes("default")) {
    return [...seen.filter((b) => b !== "default"), "default"];
  }
  return seen;
}

function groupByParent(actions: readonly FlowNode[]): Map<string | undefined, FlowNode[]> {
  const map = new Map<string | undefined, FlowNode[]>();
  for (const action of actions) {
    const list = map.get(action.parentId) ?? [];
    list.push(action);
    map.set(action.parentId, list);
  }
  return map;
}

function buildBranchingElkNode(
  flowNode: FlowNode,
  children: FlowNode[],
  byParent: Map<string | undefined, FlowNode[]>,
  collapsed: ReadonlySet<string>,
  edgesOut: PlainEdge[],
  direction: FlowDirection,
  branchContainers: Map<string, BranchContainerInfo>,
): ElkNode {
  const branchNodes: ElkNode[] = orderBranches(flowNode.type, children).map((branch) => {
    const branchChildren = children.filter((c) => c.branch === branch);
    const localEdges: ElkExtendedEdge[] = [];
    for (const child of branchChildren) {
      for (const runAfter of child.runAfter) {
        if (branchChildren.some((c) => c.id === runAfter.id)) {
          const id = `${runAfter.id}->${child.id}`;
          localEdges.push({ id, sources: [runAfter.id], targets: [child.id] });
          edgesOut.push({ id, source: runAfter.id, target: child.id, statuses: runAfter.statuses });
        }
      }
    }

    const id = branchContainerId(flowNode.id, branch);
    branchContainers.set(id, { ownerType: flowNode.type, branch, isEmpty: branchChildren.length === 0 });

    return {
      id,
      layoutOptions: branchLayoutOptions(direction),
      children: branchChildren.map((child) =>
        buildElkNode(child, byParent, collapsed, edgesOut, direction, branchContainers),
      ),
      edges: localEdges,
    };
  });

  return {
    id: flowNode.id,
    layoutOptions: branchesWrapperLayoutOptions(direction, hasGroupDetail(flowNode) ? GROUP_DETAIL_HEIGHT : 0),
    children: branchNodes,
    edges: [],
  };
}

function buildElkNode(
  flowNode: FlowNode,
  byParent: Map<string | undefined, FlowNode[]>,
  collapsed: ReadonlySet<string>,
  edgesOut: PlainEdge[],
  direction: FlowDirection,
  branchContainers: Map<string, BranchContainerInfo>,
): ElkNode {
  const children = byParent.get(flowNode.id) ?? [];
  const isGroup = children.length > 0;
  const isCollapsed = isGroup && collapsed.has(flowNode.id);

  if (!isGroup || isCollapsed) {
    return { id: flowNode.id, width: NODE_WIDTH, height: NODE_HEIGHT };
  }

  if (BRANCHING_TYPES.has(flowNode.type) && children.some((c) => c.branch)) {
    return buildBranchingElkNode(flowNode, children, byParent, collapsed, edgesOut, direction, branchContainers);
  }

  const localEdges: ElkExtendedEdge[] = [];
  for (const child of children) {
    for (const runAfter of child.runAfter) {
      if (children.some((c) => c.id === runAfter.id)) {
        const id = `${runAfter.id}->${child.id}`;
        localEdges.push({ id, sources: [runAfter.id], targets: [child.id] });
        edgesOut.push({ id, source: runAfter.id, target: child.id, statuses: runAfter.statuses });
      }
    }
  }

  return {
    id: flowNode.id,
    layoutOptions: groupLayoutOptions(direction, hasGroupDetail(flowNode) ? GROUP_DETAIL_HEIGHT : 0),
    children: children.map((child) => buildElkNode(child, byParent, collapsed, edgesOut, direction, branchContainers)),
    edges: localEdges,
  };
}

function collectRfNodes(
  elkNode: ElkNode,
  parentId: string | undefined,
  flowNodesById: Map<string, FlowNode>,
  byParent: Map<string | undefined, FlowNode[]>,
  collapsed: ReadonlySet<string>,
  direction: FlowDirection,
  triggerId: string,
  endIds: ReadonlySet<string>,
  branchContainers: ReadonlyMap<string, BranchContainerInfo>,
  out: Node<FlowRfNodeData>[],
): void {
  for (const child of elkNode.children ?? []) {
    const branchInfo = branchContainers.get(child.id);
    if (branchInfo) {
      out.push({
        id: child.id,
        type: "flowBranch",
        position: { x: child.x ?? 0, y: child.y ?? 0 },
        ...(parentId ? { parentId, extent: "parent" as const } : {}),
        draggable: false,
        selectable: false,
        style: { width: child.width, height: child.height },
        data: {
          kind: "branch",
          ownerType: branchInfo.ownerType,
          branch: branchInfo.branch,
          isEmpty: branchInfo.isEmpty,
          direction,
        },
      });

      if (child.children) {
        collectRfNodes(
          child,
          child.id,
          flowNodesById,
          byParent,
          collapsed,
          direction,
          triggerId,
          endIds,
          branchContainers,
          out,
        );
      }
      continue;
    }

    const flowNode = flowNodesById.get(child.id);
    if (!flowNode) continue;

    const childActions = byParent.get(child.id) ?? [];
    const isGroup = childActions.length > 0;

    out.push({
      id: child.id,
      type: "flowNode",
      position: { x: child.x ?? 0, y: child.y ?? 0 },
      ...(parentId ? { parentId, extent: "parent" as const } : {}),
      draggable: false,
      selectable: false,
      style: { width: child.width, height: child.height },
      data: {
        kind: "action",
        flowNode,
        isGroup,
        collapsed: isGroup && collapsed.has(child.id),
        childCount: childActions.length,
        direction,
        isTrigger: child.id === triggerId,
        isEnd: endIds.has(child.id),
      },
    });

    if (child.children) {
      collectRfNodes(
        child,
        child.id,
        flowNodesById,
        byParent,
        collapsed,
        direction,
        triggerId,
        endIds,
        branchContainers,
        out,
      );
    }
  }
}

/** Uma action é "fim" de fluxo quando nenhuma outra action roda depois dela
 * (não aparece como `runAfter` de ninguém) — pode haver mais de uma, uma por
 * ramo (branch de If/Switch, por exemplo). O gatilho nunca conta como fim. */
function findEndIds(flow: CloudFlow): Set<string> {
  const referenced = new Set(flow.actions.flatMap((a) => a.runAfter.map((r) => r.id)));
  return new Set(flow.actions.filter((a) => !referenced.has(a.id)).map((a) => a.id));
}

export async function layoutFlow(
  flow: CloudFlow,
  collapsed: ReadonlySet<string>,
  direction: FlowDirection = "DOWN",
): Promise<{ nodes: Node<FlowRfNodeData>[]; edges: Edge[] }> {
  const byParent = groupByParent(flow.actions);
  const topLevel = byParent.get(undefined) ?? [];

  const flowNodesById = new Map<string, FlowNode>([[flow.trigger.id, flow.trigger]]);
  for (const action of flow.actions) flowNodesById.set(action.id, action);

  const edgesOut: PlainEdge[] = [];
  const rootLocalEdges: ElkExtendedEdge[] = [];
  const branchContainers = new Map<string, BranchContainerInfo>();

  for (const action of topLevel) {
    if (action.runAfter.length === 0) {
      const id = `${flow.trigger.id}->${action.id}`;
      rootLocalEdges.push({ id, sources: [flow.trigger.id], targets: [action.id] });
      edgesOut.push({ id, source: flow.trigger.id, target: action.id, statuses: [] });
      continue;
    }
    for (const runAfter of action.runAfter) {
      const id = `${runAfter.id}->${action.id}`;
      rootLocalEdges.push({ id, sources: [runAfter.id], targets: [action.id] });
      edgesOut.push({ id, source: runAfter.id, target: action.id, statuses: runAfter.statuses });
    }
  }

  const rootGraph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction,
      "elk.spacing.nodeNode": "48",
      "elk.layered.spacing.nodeNodeBetweenLayers": "64",
    },
    children: [
      { id: flow.trigger.id, width: NODE_WIDTH, height: NODE_HEIGHT },
      ...topLevel.map((action) => buildElkNode(action, byParent, collapsed, edgesOut, direction, branchContainers)),
    ],
    edges: rootLocalEdges,
  };

  const laidOut = await elk.layout(rootGraph);

  // The root graph's children already include the trigger (first entry) and
  // every top-level action, so one recursive walk covers the whole tree.
  const nodes: Node<FlowRfNodeData>[] = [];
  const endIds = findEndIds(flow);
  collectRfNodes(
    laidOut,
    undefined,
    flowNodesById,
    byParent,
    collapsed,
    direction,
    flow.trigger.id,
    endIds,
    branchContainers,
    nodes,
  );

  const edges: Edge[] = edgesOut.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label:
      edge.statuses.length > 0 && !(edge.statuses.length === 1 && edge.statuses[0] === "Succeeded")
        ? edge.statuses.join(", ")
        : undefined,
    animated: false,
  }));

  return { nodes, edges };
}
