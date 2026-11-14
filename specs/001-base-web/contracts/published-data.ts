/** PROPUESTA DE DISEÑO: §17.3 fija el contenido mínimo; acordar los campos adicionales con M-PUBLICACIÓN. */
export type EvidenceMode = "REAL" | "DEMO";
export type IsoUtc = string;
export type LocalizedText = { es: string; en: string };
export type Polarization = "HH" | "HV";

export interface Provenance { source: string; acquiredAt: IsoUtc; method: string; version: string }

export type ReportableValue<T> =
  | ({ status: "reported"; value: T; unit?: string } & Provenance)
  | ({ status: "not-reported"; reason: string } & Partial<Provenance>)
  | ({ status: "limited"; value: T; unit?: string; reason: string; sensitivityRange?: [number, number] } & Provenance);

/** §17.3: identificador, nombre es/en, área, órbita usada, fechas, hipótesis, relato local y preguntas sugeridas. */
export interface StationDocument {
  schemaVersion: string; stationId: string; departmentId: string;
  label: LocalizedText; evidenceMode: EvidenceMode;
  /** propuesta: unidad y rango de sensibilidad a acordar. */
  area: ReportableValue<number>;
  orbit: string;
  periods: Array<{ id: string; before: IsoUtc; after: IsoUtc }>;
  /** propuesta: RN-05 exige fuente en cada hipótesis. */
  hypotheses: Array<{ text: LocalizedText; source: string }>;
  localStory: LocalizedText;
  suggestedQuestions: LocalizedText[];
  provenance: Provenance;
}

/** §17.3: gránulos usados con nombre, fecha, órbita, CRID y suma de verificación. */
export interface Granule {
  name: string; acquiredAt: IsoUtc; orbit: string; crid: string; checksum: string;
}

export interface ManifestDocument {
  schemaVersion: string; stationId: string; publicationId: string; pipelineVersion: string;
  publishedAt: IsoUtc; track?: string; granules: Granule[];
  polarizations: Polarization[];
  files: Array<{ path: string; sha256: string; mediaType: string; bytes: number }>;
}

export interface QualityDocument {
  schemaVersion: string; stationId: string; publicationId: string; passed: boolean;
  limitations: Array<{ code: string; message: LocalizedText }>;
}

export interface ValidationDocument {
  schemaVersion: string; stationId: string; publicationId: string; referenceMethod: string;
  dice: ReportableValue<number>;
  controls: Array<{ id: string; result: "pass" | "fail" | "not-reported"; reason?: string }>;
  /** propuesta: §17.3 pide contexto de focos de calor, sin fijar su forma. */
  hotspotsContext?: { source: string; acquiredAt: IsoUtc; summary: LocalizedText };
}

/** §17.3: fecha, hectáreas y rango inferior/superior; RN-06 exige el rango. */
export type HectaresValue =
  | ({ status: "reported"; value: number; unit: "ha"; sensitivityRange: [number, number] } & Provenance)
  | ({ status: "not-reported"; reason: string } & Partial<Provenance>);

export interface HectaresRow {
  stationId: string; periodId: string; date: IsoUtc;
  polarization: Polarization; hectares: HectaresValue;
}

export interface FeatureCollection<P> {
  type: "FeatureCollection";
  features: Array<{ type: "Feature"; id?: string; geometry: unknown; properties: P }>;
}

/** §17.3: cicatrices con fecha y clase; RN-05 fija las cuatro clases (nombres propuestos). */
export type PatchClass =
  | "burn-compatible" | "prior-structure-loss-compatible"
  | "ambiguous-evidence" | "insufficient-data";
export type ScarsGeoJson = FeatureCollection<{
  stationId: string; periodId: string; evidenceMode: EvidenceMode;
  acquiredAt: IsoUtc; class: PatchClass; hectares: ReportableValue<number>;
}>;

/** §17.3: huellas con órbita, dirección, fechas y polarizaciones. */
export type FootprintsGeoJson = FeatureCollection<{
  stationId: string; acquiredAt: IsoUtc; track?: string; orbit: string;
  direction: string; polarizations: Polarization[]; source: string;
}>;

export type DepartmentsGeoJson = FeatureCollection<{
  departmentId: string; nameEs: string; nameEn: string; source: string; acquiredAt: IsoUtc; version: string;
}>;

export interface PublishedStationBundle {
  station: StationDocument; manifest: ManifestDocument; quality: QualityDocument;
  validation: ValidationDocument; hectares: HectaresRow[]; scars: ScarsGeoJson;
  footprints: FootprintsGeoJson; changeCogUrl: string; viewUrls: string[];
}
