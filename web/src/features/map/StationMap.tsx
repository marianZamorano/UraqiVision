// PROTOTIPO LOCAL (rama local/prueba-mapa-chiquitania, sin acordar con M-MAPA): mapa 2D de Bolivia con la estación
// publicada por el backend. Muestra la vista de radar por fecha y polarización (RF-06, RF-08), las cicatrices por
// clase candidata (RF-05, RN-05), los focos FIRMS del periodo (RF-10) y las hectáreas con rango (RF-09, RN-06).
// Sin mapa base externo (DP-07 pendiente): el fondo son los límites departamentales publicados.
import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource, type ImageSource, type Map as MlMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./stationMap.css";
import { GraficoHectareas, TablaHectareas, type PuntoHectareas } from "../interface/hectareas/Hectareas";
import { formatearHectareas, type Idioma } from "../interface/formato/formato";

type Capa = "hv" | "hh" | "ratio";
interface Vista { archivo: string; fecha: string; capa: Capa; rango_db: [number, number] }
interface IndiceVistas { esquinas_lonlat: [number, number][]; vistas: Vista[] }
interface FechaEstacion { fecha: string; estado: string; motivo: string | null; rol: string | null }
interface StationRaw {
  aviso: Record<Idioma, string>;
  area: { bbox_lonlat: [number, number, number, number] };
  fechas: FechaEstacion[];
  hueco_datos: [string, string];
}
type FC = GeoJSON.FeatureCollection;

const CLASES = [
  { id: "compatible_quema", es: "Compatible con quema", en: "Compatible with burning", color: "#c8501e" },
  { id: "perdida_previa", es: "Pérdida previa de estructura", en: "Earlier loss of structure", color: "#6b4fa0" },
  { id: "ambigua", es: "Evidencia ambigua", en: "Ambiguous evidence", color: "#c9a227" },
  { id: "insuficiente", es: "Datos insuficientes", en: "Insufficient data", color: "#7d8793" },
] as const;

const T = {
  es: {
    titulo: "Mapa de la estación", aviso: "Aviso", cargando: "Cargando capas…", error: "No se pudieron cargar las capas.",
    fecha: "Fecha de la imagen de radar", polar: "Polarización", opacidad: "Opacidad del radar", capas: "Capas",
    radar: "Imagen de radar", cicatrices: "Parches con caída de HV", focos: "Focos de calor FIRMS", bolivia: "Ver Bolivia",
    estacion: "Ver la estación", excluidas: "Fechas excluidas", hueco: "Hueco de datos NISAR",
    hv: "HV · volumen de vegetación", hh: "HH · superficies y doble rebote", ratio: "HV/HH · proporción de volumen",
    clases: "Clases candidatas (nunca causas confirmadas)", hasta: "acumulado hasta la fecha elegida",
    focosLeyenda: "Foco detectado entre el inicio de la serie y la fecha elegida", base: "línea base",
    hectareas: "Superficie con caída sostenida de HV",
    popup: { clase: "Clase", ha: "Superficie", fecha: "Primera detección", caida: "Caída de HV", motivo: "Motivo" },
  },
  en: {
    titulo: "Station map", aviso: "Notice", cargando: "Loading layers…", error: "Layers could not be loaded.",
    fecha: "Radar image date", polar: "Polarization", opacidad: "Radar opacity", capas: "Layers",
    radar: "Radar image", cicatrices: "Patches with HV drop", focos: "FIRMS hotspots", bolivia: "View Bolivia",
    estacion: "View the station", excluidas: "Excluded dates", hueco: "NISAR data gap",
    hv: "HV · vegetation volume", hh: "HH · surfaces and double bounce", ratio: "HV/HH · share of volume",
    clases: "Candidate classes (never confirmed causes)", hasta: "cumulative up to the selected date",
    focosLeyenda: "Hotspot detected between the start of the series and the selected date", base: "baseline",
    hectareas: "Area with sustained HV drop",
    popup: { clase: "Class", ha: "Area", fecha: "First detection", caida: "HV drop", motivo: "Reason" },
  },
} as const;

const BOLIVIA: [[number, number], [number, number]] = [[-69.7, -22.95], [-57.4, -9.6]];
const reducirMovimiento = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function leerCsv(texto: string): Record<string, string>[] {
  const [cab, ...filas] = texto.trim().split(/\r?\n/);
  const cols = (cab ?? "").split(",");
  return filas.map((f) => {
    const celdas = f.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "")) ?? [];
    return Object.fromEntries(cols.map((c, i) => [c, celdas[i] ?? ""]));
  });
}

export default function StationMap({ base, lang }: { base: string; lang: Idioma }) {
  const t = T[lang];
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MlMap | null>(null);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<{ vistas: IndiceVistas; estacion: StationRaw; scars: FC; fires: FC; deps: FC;
    hect: Record<string, string>[]; horas: Record<string, string> } | null>(null);
  const [fecha, setFecha] = useState<string>("");
  const [capa, setCapa] = useState<Capa>("hv");
  const [opacidad, setOpacidad] = useState(0.85);
  const [visibles, setVisibles] = useState({ radar: true, cicatrices: true, focos: true });

  // 1. Carga de los archivos publicados (§17.3)
  useEffect(() => {
    const ctl = new AbortController();
    const j = (p: string) => fetch(`${base}/${p}`, { signal: ctl.signal }).then((r) => {
      if (!r.ok) throw new Error(`${p}: ${r.status}`);
      return r.json();
    });
    Promise.all([j("views/index.json"), j("station.json"), j("scars.geojson"), j("fires.geojson"),
      j("atlas/departments.geojson"), j("manifest.json"), fetch(`${base}/hectares.csv`, { signal: ctl.signal }).then((r) => r.text())])
      .then(([vistas, estacion, scars, fires, deps, manifest, csv]) => {
        const horas: Record<string, string> = {};
        for (const g of (manifest as { granulos: { escena: string; fecha: string }[] }).granulos) {
          const m = /_(\d{8})T(\d{2})(\d{2})(\d{2})_/.exec(g.escena);
          if (m) horas[g.fecha] = `${g.fecha}T${m[2]}:${m[3]}:${m[4]}Z`;
        }
        setDatos({ vistas, estacion, scars, fires, deps, hect: leerCsv(csv), horas });
        const fechas = [...new Set((vistas as IndiceVistas).vistas.map((v) => v.fecha))].sort();
        setFecha(fechas[fechas.length - 1] ?? "");
      })
      .catch((e: unknown) => { if (!ctl.signal.aborted) setError(String(e)); });
    return () => ctl.abort();
  }, [base]);

  const fechas = useMemo(() => [...new Set(datos?.vistas.vistas.map((v) => v.fecha) ?? [])].sort(), [datos]);
  const inicioSerie = fechas[0] ?? "";
  const vistaActual = datos?.vistas.vistas.find((v) => v.fecha === fecha && v.capa === capa);

  // 2. Creación del mapa (una vez que hay datos)
  useEffect(() => {
    if (!datos || !contenedor.current || mapa.current) return;
    const m = new maplibregl.Map({
      container: contenedor.current,
      style: { version: 8, sources: {}, layers: [{ id: "fondo", type: "background", paint: { "background-color": "#e8ece6" } }] },
      bounds: BOLIVIA, fitBoundsOptions: { padding: 24 }, attributionControl: false,
    });
    mapa.current = m;
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
    m.addControl(new maplibregl.AttributionControl({ compact: true,
      customAttribution: "NISAR (NASA/ISRO, ASF) · NASA FIRMS · geoBoundaries" }));
    m.on("load", () => {
      const [w, s, e, n] = datos.estacion.area.bbox_lonlat;
      m.addSource("deps", { type: "geojson", data: datos.deps });
      m.addLayer({ id: "deps-relleno", type: "fill", source: "deps",
        paint: { "fill-color": ["case", ["==", ["get", "shapeName"], "Santa Cruz"], "#f6f1e7", "#fbfbf8"], "fill-opacity": 1 } });
      m.addLayer({ id: "deps-borde", type: "line", source: "deps", paint: { "line-color": "#8a8a8a", "line-width": 1 } });
      const c = datos.vistas.esquinas_lonlat;
      const v0 = datos.vistas.vistas.find((v) => v.capa === "hv")!;
      m.addSource("radar", { type: "image", url: `${base}/${v0.archivo}`, coordinates: [c[0]!, c[1]!, c[2]!, c[3]!] });
      m.addLayer({ id: "radar", type: "raster", source: "radar", paint: { "raster-opacity": 0.85, "raster-fade-duration": 0 } });
      m.addSource("caja", { type: "geojson", data: { type: "Feature", properties: {},
        geometry: { type: "Polygon", coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] } } });
      m.addLayer({ id: "caja", type: "line", source: "caja", paint: { "line-color": "#005a9e", "line-width": 2, "line-dasharray": [2, 1] } });
      m.addSource("fires", { type: "geojson", data: datos.fires });
      m.addLayer({ id: "fires", type: "circle", source: "fires", paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 0.8, 10, 1.6, 13, 3.5],
        "circle-color": "#ffd23f", "circle-opacity": 0.9, "circle-stroke-color": "#3a2a00", "circle-stroke-width": 0.4 } });
      m.addSource("scars", { type: "geojson", data: datos.scars });
      const colorClase = ["match", ["get", "clase"], ...CLASES.flatMap((k) => [k.id, k.color]), "#999"] as unknown as string;
      m.addLayer({ id: "scars", type: "fill", source: "scars", paint: { "fill-color": colorClase, "fill-opacity": 0.9 } });
      m.addLayer({ id: "scars-borde", type: "line", source: "scars", paint: { "line-color": colorClase, "line-width": ["interpolate", ["linear"], ["zoom"], 8, 2, 12, 1] } });
      m.on("click", "scars", (ev) => {
        const p = ev.features?.[0]?.properties as Record<string, string | number> | undefined;
        if (!p) return;
        const k = CLASES.find((x) => x.id === p.clase);
        const tt = T[lang].popup;
        const div = document.createElement("div");
        div.className = "mapa-popup";
        [[tt.clase, k ? k[lang] : String(p.clase)], [tt.ha, `${formatearHectareas(Number(p.ha), lang)} ha`],
         [tt.fecha, String(p.fecha_primera_deteccion)], [tt.caida, `${Number(p.caida_hv_db).toFixed(1)} dB`],
         [tt.motivo, String(p.motivo)]].forEach(([a, b]) => {
          const fila = document.createElement("p");
          const s1 = document.createElement("strong"); s1.textContent = `${a}: `;
          fila.append(s1, document.createTextNode(String(b))); div.append(fila);
        });
        new maplibregl.Popup({ maxWidth: "280px" }).setLngLat(ev.lngLat).setDOMContent(div).addTo(m);
      });
      m.on("mouseenter", "scars", () => { m.getCanvas().style.cursor = "pointer"; });
      m.on("mouseleave", "scars", () => { m.getCanvas().style.cursor = ""; });
      setListo(true);
      // Bolivia primero; luego vuela a la estación (instantáneo con movimiento reducido, RNF-12)
      window.setTimeout(() => m.fitBounds([[w, s], [e, n]], { padding: 40, animate: !reducirMovimiento(), duration: 3000 }), 1800);
    });
    return () => { m.remove(); mapa.current = null; setListo(false); };
  }, [datos, base, lang]);

  // 3. Sincronización con los controles (RF-36)
  useEffect(() => {
    const m = mapa.current;
    if (!listo || !m || !vistaActual) return;
    const c = datos!.vistas.esquinas_lonlat;
    (m.getSource("radar") as ImageSource).updateImage({ url: `${base}/${vistaActual.archivo}`, coordinates: [c[0]!, c[1]!, c[2]!, c[3]!] });
    m.setPaintProperty("radar", "raster-opacity", opacidad);
    m.setLayoutProperty("radar", "visibility", visibles.radar ? "visible" : "none");
    m.setFilter("scars", ["<=", ["get", "fecha_primera_deteccion"], fecha]);
    m.setFilter("scars-borde", ["<=", ["get", "fecha_primera_deteccion"], fecha]);
    m.setLayoutProperty("scars", "visibility", visibles.cicatrices ? "visible" : "none");
    m.setLayoutProperty("scars-borde", "visibility", visibles.cicatrices ? "visible" : "none");
    m.setFilter("fires", ["all", [">", ["get", "fecha"], inicioSerie], ["<=", ["get", "fecha"], fecha]]);
    m.setLayoutProperty("fires", "visibility", visibles.focos ? "visible" : "none");
    void (m.getSource("scars") as GeoJSONSource);
  }, [listo, vistaActual, opacidad, visibles, fecha, inicioSerie, datos, base]);

  const resumen = useMemo(() => {
    const acc = Object.fromEntries(CLASES.map((k) => [k.id, 0])) as Record<string, number>;
    for (const f of datos?.scars.features ?? []) {
      const p = f.properties as { clase: string; ha: number; fecha_primera_deteccion: string };
      if (p.fecha_primera_deteccion <= fecha) acc[p.clase] = (acc[p.clase] ?? 0) + p.ha;
    }
    return acc;
  }, [datos, fecha]);
  const focosVisibles = useMemo(() => (datos?.fires.features ?? []).filter((f) => {
    const d = (f.properties as { fecha: string }).fecha;
    return d > inicioSerie && d <= fecha;
  }).length, [datos, fecha, inicioSerie]);

  // RN-07: hora real de adquisición (UTC) del manifiesto; sin ella la fila no se informa (RN-13), no se inventa.
  const puntos: PuntoHectareas[] = (datos?.hect ?? []).map((r): PuntoHectareas => {
    const hora = datos?.horas[r.fecha ?? ""];
    return hora
      ? { fecha: hora, estado: "reportado", valor: Number(r.hectareas),
          rango: { min: Number(r.rango_inferior), max: Number(r.rango_superior) } }
      : { fecha: `${r.fecha}T00:00:00Z`, estado: "no-reportado", motivo: "Sin hora de adquisición en el manifiesto" };
  });
  const etqH = { titulo: t.hectareas, fecha: lang === "es" ? "Fecha" : "Date", valor: lang === "es" ? "Hectáreas" : "Hectares",
    rango: lang === "es" ? "Rango (umbral −3 a −2 dB)" : "Range (−3 to −2 dB threshold)",
    noReportada: lang === "es" ? "No reportada" : "Not reported", rangoNoReportado: lang === "es" ? "Rango no reportado" : "Range not reported" };

  if (error) return <p role="alert" className="panel">{t.error} ({error})</p>;
  if (!datos) return <p role="status" className="panel">{t.cargando}</p>;
  const excluidas = datos.estacion.fechas.filter((f) => f.estado !== "ok");
  const rol = (f: string) => datos.estacion.fechas.find((x) => x.fecha === f)?.rol;

  return (
    <section className="mapa-estacion" aria-label={t.titulo}>
      <p className="mapa-aviso" role="note"><strong>{t.aviso}:</strong> {datos.estacion.aviso[lang]}</p>
      <div className="mapa-cuerpo">
        <div className="mapa-lienzo" ref={contenedor} role="region" aria-label={t.titulo} />
        <aside className="mapa-controles">
          <fieldset>
            <legend>{t.fecha}</legend>
            <div className="mapa-fechas">
              {fechas.map((f) => (
                <button key={f} type="button" aria-pressed={f === fecha} onClick={() => setFecha(f)}
                  className={f === fecha ? "activa" : ""}>
                  {f.slice(5)}{rol(f) === "linea_base" ? <small> · {t.base}</small> : null}
                </button>
              ))}
            </div>
            <p className="mapa-nota">{t.hueco}: {datos.estacion.hueco_datos.join(" → ")}</p>
            <details>
              <summary>{t.excluidas} ({excluidas.length})</summary>
              <ul>{excluidas.map((f) => <li key={f.fecha}><strong>{f.fecha}</strong>: {f.motivo ?? f.estado}</li>)}</ul>
            </details>
          </fieldset>
          <fieldset>
            <legend>{t.polar}</legend>
            {(["hv", "hh", "ratio"] as Capa[]).map((k) => (
              <label key={k} className="mapa-opcion">
                <input type="radio" name="capa" checked={capa === k} onChange={() => setCapa(k)} /> {t[k]}
              </label>
            ))}
            <label className="mapa-opcion">{t.opacidad}: {Math.round(opacidad * 100)} %
              <input type="range" min={0} max={1} step={0.05} value={opacidad} onChange={(e) => setOpacidad(Number(e.target.value))} />
            </label>
            {vistaActual ? <p className="mapa-nota">{vistaActual.rango_db[0]} dB ▸ {vistaActual.rango_db[1]} dB</p> : null}
          </fieldset>
          <fieldset>
            <legend>{t.capas}</legend>
            {(["radar", "cicatrices", "focos"] as const).map((k) => (
              <label key={k} className="mapa-opcion">
                <input type="checkbox" checked={visibles[k]} onChange={() => setVisibles((v) => ({ ...v, [k]: !v[k] }))} /> {t[k]}
              </label>
            ))}
            <div className="mapa-botones">
              <button type="button" onClick={() => mapa.current?.fitBounds(BOLIVIA, { padding: 24, animate: !reducirMovimiento() })}>{t.bolivia}</button>
              <button type="button" onClick={() => { const [w, s, e, n] = datos.estacion.area.bbox_lonlat;
                mapa.current?.fitBounds([[w, s], [e, n]], { padding: 40, animate: !reducirMovimiento() }); }}>{t.estacion}</button>
            </div>
          </fieldset>
          <fieldset>
            <legend>{t.clases}</legend>
            <ul className="mapa-leyenda">
              {CLASES.map((k) => (
                <li key={k.id}><span className="muestra" style={{ background: k.color }} aria-hidden="true" />
                  {k[lang]} <strong>{formatearHectareas(resumen[k.id] ?? 0, lang)} ha</strong></li>
              ))}
              <li><span className="muestra punto" style={{ background: "#ffd23f" }} aria-hidden="true" />{t.focos}: <strong>{focosVisibles}</strong></li>
            </ul>
            <p className="mapa-nota">{t.hasta}. {t.focosLeyenda}.</p>
          </fieldset>
        </aside>
      </div>
      <div className="mapa-hectareas">
        <GraficoHectareas puntos={puntos} idioma={lang} etiquetas={etqH} ancho={560} alto={220} />
        <TablaHectareas puntos={puntos} idioma={lang} etiquetas={etqH} />
      </div>
    </section>
  );
}
