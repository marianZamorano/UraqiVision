/**
 * PROPUESTA DE DISEÑO (P-ATLAS-03, issue #63): forma del archivo de contenido de la portada y las fichas del
 * atlas (M-ATLAS). Es contenido editorial de la web, no un archivo de §17.3; el equipo acordó que viva en la web
 * (2026-11-14). Ver data-model.md. Sigue el criterio de ausencia de 001 sin importar sus contratos.
 */
export type IsoDate = string;

export interface LocalizedText { es: string; en: string }

/** Entrada de §31 del documento maestro. */
export interface SourceRef {
  refId: string;
  citation: string;
  url: string;
  consultedAt: IsoDate;
  /** Método que declara la fuente (RN-03); "not-reported" si la fuente no lo da. */
  method: LocalizedText | "not-reported";
  /** "team-proposed": está en §31, pero el catálogo ai/referencias/catalogo.json marca su relación como propuesta. */
  relation: "document" | "team-proposed";
}

/** Una afirmación lleva fuentes o el aviso «Fuente en verificación»; nunca ninguno de los dos. */
export type Sourced =
  | { sources: [SourceRef, ...SourceRef[]]; sourceStatus?: never }
  | { sources?: never; sourceStatus: "in-verification" };

export type Claim = { text: LocalizedText; kind: "context" | "hypothesis" } & Sourced;

export type SceneCount =
  | { status: "reported"; value: number; collection: "PROVISIONAL"; queriedAt: IsoDate; period: [IsoDate, IsoDate] }
  | { status: "reported"; range: [number, number]; collection: "PROVISIONAL"; queriedAt: IsoDate; period: [IsoDate, IsoDate] }
  | { status: "not-reported"; reason: LocalizedText };

export interface Highlight {
  name: LocalizedText;
  kind: "profile"; // Tunari es ficha, no estación (§11.3)
  scenes: SceneCount;
  claims: Claim[];
}

export type DepartmentCard = {
  departmentId: string; // nombre de campo según el contrato de 001 (research.md R3)
  name: LocalizedText;
  phenomenon: Claim;
  scenes: SceneCount;
  highlights?: Highlight[];
  claims?: Claim[];
} & Sourced & (
  | { status: "station"; stationRef: string }
  | { status: "profile"; stationRef?: never }
);

export type HomeImage =
  | { status: "pending" }
  | { status: "ready"; src: string; alt: LocalizedText; source: SourceRef; license: string };

export interface HomeContent {
  problemFigures: Array<Claim & { kind: "context" }>;
  image: HomeImage;
}

export interface AtlasContent {
  schemaVersion: string;
  updatedAt: IsoDate;
  home: HomeContent;
  departments: DepartmentCard[]; // exactamente 9 (validación en data-model.md)
}
