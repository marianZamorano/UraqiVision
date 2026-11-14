/** PROPUESTA DE DISEÑO: acordar campos exactos con M-PUBLICACIÓN. */
export type EvidenceMode = "REAL" | "DEMO";
export type IsoUtc = string;

export interface Provenance { source: string; acquiredAt: IsoUtc; method: string; version: string }

export type ReportableValue<T> =
  | ({ status: "reported"; value: T; unit?: string } & Provenance)
  | ({ status: "not-reported"; reason: string } & Partial<Provenance>)
  | ({ status: "limited"; value: T; unit?: string; reason: string; sensitivityRange?: [number, number] } & Provenance);

export interface StationDocument {
  schemaVersion: string; stationId: string; departmentId: string;
  label: { es: string; en: string }; evidenceMode: EvidenceMode;
  periods: Array<{ id: string; before: IsoUtc; after: IsoUtc }>; provenance: Provenance;
}

export interface ManifestDocument {
  schemaVersion: string; stationId: string; publicationId: string; pipelineVersion: string;
  publishedAt: IsoUtc; track?: string; orbit?: string; crid?: string; granules: string[];
  polarizations: Array<"HH" | "HV">;
  files: Array<{ path: string; sha256: string; mediaType: string; bytes: number }>;
}

export interface QualityDocument {
  schemaVersion: string; stationId: string; publicationId: string; passed: boolean;
  limitations: Array<{ code: string; message: { es: string; en: string } }>;
}

export interface ValidationDocument {
  schemaVersion: string; stationId: string; publicationId: string; referenceMethod: string;
  dice: ReportableValue<number>;
  controls: Array<{ id: string; result: "pass" | "fail" | "not-reported"; reason?: string }>;
}

export interface HectaresRow {
  stationId: string; periodId: string; polarization: "HH" | "HV"; hectares: ReportableValue<number>;
}

export interface FeatureCollection<P> {
  type: "FeatureCollection";
  features: Array<{ type: "Feature"; id?: string; geometry: unknown; properties: P }>;
}

export type ScarsGeoJson = FeatureCollection<{
  stationId: string; periodId: string; evidenceMode: EvidenceMode; hectares: ReportableValue<number>;
}>;
export type FootprintsGeoJson = FeatureCollection<{
  stationId: string; acquiredAt: IsoUtc; track?: string; orbit?: string; source: string;
}>;
export type DepartmentsGeoJson = FeatureCollection<{
  departmentId: string; nameEs: string; nameEn: string; source: string; acquiredAt: IsoUtc; version: string;
}>;

export interface PublishedStationBundle {
  station: StationDocument; manifest: ManifestDocument; quality: QualityDocument;
  validation: ValidationDocument; hectares: HectaresRow[]; scars: ScarsGeoJson;
  footprints: FootprintsGeoJson; changeCogUrl: string; viewUrls: string[];
}
