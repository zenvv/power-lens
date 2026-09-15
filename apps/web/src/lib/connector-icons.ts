import sharepointonline from "@/assets/connector-icons/sharepointonline.png";
import excelonlinebusiness from "@/assets/connector-icons/excelonlinebusiness.png";
import office365 from "@/assets/connector-icons/office365.png";
import office365users from "@/assets/connector-icons/office365users.png";
import teams from "@/assets/connector-icons/teams.png";
import onedriveforbusiness from "@/assets/connector-icons/onedriveforbusiness.png";
import onenote from "@/assets/connector-icons/onenote.png";
import commondataserviceforapps from "@/assets/connector-icons/commondataserviceforapps.png";
import approvals from "@/assets/connector-icons/approvals.png";
import planner from "@/assets/connector-icons/planner.png";
import microsoftforms from "@/assets/connector-icons/microsoftforms.png";
import powerbi from "@/assets/connector-icons/powerbi.png";
import salesforce from "@/assets/connector-icons/salesforce.png";
import slack from "@/assets/connector-icons/slack.png";
import github from "@/assets/connector-icons/github.png";
import sql from "@/assets/connector-icons/sql.png";
import twitter from "@/assets/connector-icons/twitter.png";
import dropbox from "@/assets/connector-icons/dropbox.png";
import gmail from "@/assets/connector-icons/gmail.png";
import googlesheet from "@/assets/connector-icons/googlesheet.png";
import googledrive from "@/assets/connector-icons/googledrive.png";

/**
 * Ícones oficiais dos conectores mais comuns do Power Automate, vendorizados
 * localmente (baixados uma vez do CDN público que o próprio
 * learn.microsoft.com/connectors/<id>/ usa pra exibir o ícone de cada
 * conector — não é chamado em runtime, spec seção 3 "client-side only").
 *
 * A chave é o `connectorName` normalizado que já sai do parser
 * (parsers/flow/actions.ts): último segmento do apiId sem o prefixo
 * "shared_", ex. "shared_sharepointonline" -> "sharepointonline". Não é uma
 * lista exaustiva de conectores — só os mais comuns; um conector fora dela
 * cai no fallback genérico (FlowNode.tsx).
 */
export const CONNECTOR_ICONS: Readonly<Record<string, string>> = {
  sharepointonline,
  excelonlinebusiness,
  office365,
  office365users,
  teams,
  onedriveforbusiness,
  onenote,
  commondataserviceforapps,
  approvals,
  planner,
  microsoftforms,
  powerbi,
  salesforce,
  slack,
  github,
  sql,
  twitter,
  dropbox,
  gmail,
  googlesheet,
  googledrive,
};
