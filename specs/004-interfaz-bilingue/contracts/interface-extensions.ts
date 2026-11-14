/**
 * PROPUESTA DE DISEÑO (004, M-INTERFAZ): extensiones a los contratos de specs/001-base-web.
 * Acordar con Joaco (001) y Mimi (M-PUBLICACIÓN) antes de implementar. No inventa datos:
 * solo declara qué campos necesita la interfaz para cumplir RF-33, RF-37, RF-11, RN-05, RN-06 y CQ-05.
 */
import type {
  IsoUtc, Provenance, ReportableValue, StationDocument, ManifestDocument, QualityDocument,
  ValidationDocument, HectaresRow,
} from "../../001-base-web/contracts/published-data";

/**
 * RNF-03 y principio IV de la constitución: todo texto que llega a la pantalla viene en los dos idiomas.
 * Propuesta también para 001: hoy `ReportableValue.reason` es un `string` en un solo idioma.
 */
export type Localized = { es: string; en: string };

/** RN-06: toda cifra de hectáreas reportada lleva su rango; sin rango → status "not-reported" del rango. */
export interface HectaresWithRange extends HectaresRow {
  range: ReportableValue<{ lower: number; upper: number }>;
}

/** §11.2 y MC-06: las cuatro clases de parche. RN-05: las causas son hipótesis con fuente, nunca certezas. */
export type PatchClass =
  | "compatible-burn"            // compatible con quema
  | "compatible-prior-loss"      // compatible con pérdida previa de estructura
  | "ambiguous"                  // evidencia ambigua
  | "insufficient-data";         // datos insuficientes

export interface Hypothesis {
  patchClass: PatchClass;
  text: Localized;
  source: string;                // obligatorio (RN-05)
  sourceDate?: IsoUtc;
}

/** §17.3 station.json incluye hipótesis; RF-33 pide advertencias. */
export interface StationDocumentExt extends StationDocument {
  hypotheses: Hypothesis[];
  warnings: Array<{ code: string; message: Localized }>;
  /** PENDIENTE DP-03: significado exacto según la capa mask del GCOV. La web no lo recalcula. */
  validDataPercent: ReportableValue<number>;
}

/** RF-37: producto y madurez, fuente de validación. */
export interface ManifestDocumentExt extends ManifestDocument {
  product: string;                               // p. ej. "NISAR L2 GCOV"
  /**
   * RN-02: la serie principal usa una sola madurez y un solo CRID; PROVISIONAL y VALIDATED se muestran como
   * tramos separados. Cada tramo lleva sus fechas y su CRID. Si falta, la vista dice «no reportada».
   */
  maturitySegments: Array<{
    maturity: "PROVISIONAL" | "VALIDATED";
    crid: string;
    from: IsoUtc;
    to: IsoUtc;
  }>;
  validationSource: string | null;               // null → «no reportada» con motivo en la vista
}

/** FR-010: cada control publicado con su resultado; CQ-05 marca «datos limitados». */
export type QualityControlId = "CQ-01" | "CQ-02" | "CQ-03" | "CQ-04" | "CQ-05" | "CQ-06";

export interface QualityDocumentExt extends QualityDocument {
  controls: Array<{
    id: QualityControlId;
    result: "pass" | "limited" | "fail" | "not-reported";
    reason?: Localized;                           // obligatorio si result ≠ "pass" (RNF-03)
    affects?: Array<"hectares" | "validDataPercent" | "validation">;
  }>;
}

/** RF-11 / FR-006: validación limitada sin Sentinel-2 válida y alternativa usada (VC-02, VC-05). */
export interface ValidationDocumentExt extends ValidationDocument {
  limited: boolean;
  limitedReason?: Localized;                     // RNF-03
  alternatives: Array<"VC-02-fire-hotspots" | "VC-05-visual-review">;
}

/** Contrato de presentación: lo que el panel recibe ya preparado (no recalcula nada). */
export type FigureMark = "none" | "limited" | "not-reported" | "range-not-reported" | "control-not-reported";

export interface DisplayedFigure {
  text: string;                 // formateado según idioma, o «no reportada»
  mark: FigureMark;
  reason?: Localized;           // obligatorio si mark ≠ "none" (RNF-03)
  provenance?: Provenance;      // fuente, fecha y método (RN-03)
}
