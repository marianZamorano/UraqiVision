// Versión beta (#110): mapa 2D de Bolivia con la estación publicada por el backend (§17.3). Muestra la vista de radar
// por fecha y polarización (RF-06, RF-08), los parches por clase candidata (RF-05, RN-05), los focos FIRMS (RF-10) y
// las hectáreas con rango (RF-09, RN-06), las huellas de las escenas (RF-26), el tramo VALIDATED aparte (RN-02) y el
// agua de referencia de época seca (exploratoria); debajo, la respuesta paso a paso (Respuesta). Textos en
// es.json/en.json (RNF-03). Sin mapa base externo: DP-07 pendiente.
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import maplibregl, { type ImageSource, type Map as MlMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./stationMap.css";
import { GraficoHectareas, TablaHectareas, type PuntoHectareas } from "../interface/hectareas/Hectareas";
import { formatearHectareas, type Idioma } from "../interface/formato/formato";
import { Respuesta, type VistaMapa } from "./Respuesta";
import { CLASES, cargarArchivosEstacion, type ArchivosEstacion, type Capa, type CapaAgua } from "./stationFiles";
import { listWaterLayers, publishedOrigin } from "../../data/publicationRepository";

const BOLIVIA: [[number, number], [number, number]] = [[-69.7, -22.95], [-57.4, -9.6]];
const reducirMovimiento = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function StationMap({ base, lang }: { base: string; lang: Idioma }) {
  const { t } = useTranslation();
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MlMap | null>(null);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<ArchivosEstacion | null>(null);
  const [fecha, setFecha] = useState<string>("");
  const [capa, setCapa] = useState<Capa>("hv");
  const [vista, setVista] = useState<VistaMapa>("radar");
  const [opacidad, setOpacidad] = useState(0.85);
  const [visibles, setVisibles] = useState({ radar: true, patches: true, fires: true, control: true, huellas: false, agua: true });
  const [fechaVal, setFechaVal] = useState<string>("");
  const [agua, setAgua] = useState<CapaAgua[]>([]);

  // Agua de referencia (exploratoria): opcional; si el endpoint no la tiene, no aparece nada.
  useEffect(() => {
    const ctl = new AbortController();
    void listWaterLayers<CapaAgua>(ctl.signal).then((l) => { if (!ctl.signal.aborted) setAgua(l); });
    return () => ctl.abort();
  }, []);

  // 1. Carga de los archivos publicados (§17.3)
  useEffect(() => {
    const ctl = new AbortController();
    cargarArchivosEstacion(base, ctl.signal)
      .then((archivos) => {
        setDatos(archivos);
        const vs = archivos.vistas.vistas;
        const fechas = [...new Set(vs.filter((v) => v.capa === "hv" && v.coleccion !== "validated").map((v) => v.fecha!))].sort();
        setFecha(fechas[fechas.length - 1] ?? "");
        setFechaVal(vs.find((v) => v.coleccion === "validated")?.fecha ?? "");
      })
      .catch((e: unknown) => { if (!ctl.signal.aborted) setError(String(e)); });
    return () => ctl.abort();
  }, [base]);

  const fechas = useMemo(() => [...new Set(datos?.vistas.vistas.filter((v) => v.capa === "hv" && v.coleccion !== "validated").map((v) => v.fecha!) ?? [])].sort(), [datos]);
  // RN-02: el tramo VALIDATED se elige aparte y nunca entra a la serie, al cambio ni a las hectáreas.
  const fechasVal = useMemo(() => [...new Set(datos?.vistas.vistas.filter((v) => v.capa === "hv" && v.coleccion === "validated").map((v) => v.fecha!) ?? [])].sort(), [datos]);
  const inicioSerie = fechas[0] ?? "";
  // Qué imagen va sobre el mapa: la de la fecha y polarización, lo normal, el cambio de la fecha o el testigo óptico.
  const vistaActual = datos?.vistas.vistas.find((v) =>
    vista === "radar" ? v.fecha === fecha && v.capa === capa && v.coleccion !== "validated"
      : vista === "validated" ? v.fecha === fechaVal && v.capa === capa && v.coleccion === "validated"
        : vista === "cambio" ? v.fecha === fecha && v.capa === "cambio"
          : v.capa === vista);

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
        paint: { "fill-color": ["case", ["==", ["get", "shapeName"], datos.estacion.departamento ?? ""], "#f6f1e7", "#fbfbf8"], "fill-opacity": 1 } });
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
      m.addLayer({ id: "scars-borde", type: "line", source: "scars",
        paint: { "line-color": colorClase, "line-width": ["interpolate", ["linear"], ["zoom"], 8, 2, 12, 1] } });
      if (datos.huellas) {
        // RF-26: huellas de las escenas usadas, con su órbita, dirección, fecha y polarizaciones (clic).
        m.addSource("huellas", { type: "geojson", data: datos.huellas });
        m.addLayer({ id: "huellas", type: "fill", source: "huellas", paint: { "fill-color": "#6a4c93", "fill-opacity": 0.04 } });
        m.addLayer({ id: "huellas-borde", type: "line", source: "huellas",
          paint: { "line-color": "#6a4c93", "line-width": 1.5, "line-dasharray": [3, 2] } });
      }
      if (datos.zonasControl) {
        m.addSource("control", { type: "geojson", data: datos.zonasControl });
        m.addLayer({ id: "control", type: "line", source: "control",
          paint: { "line-color": "#0b6b3a", "line-width": 2.5, "line-dasharray": [1.5, 1] } });
      }
      m.on("mouseenter", "scars", () => { m.getCanvas().style.cursor = "pointer"; });
      m.on("mouseleave", "scars", () => { m.getCanvas().style.cursor = ""; });
      setListo(true);
      // Bolivia primero; luego vuela a la estación (instantáneo con movimiento reducido, RNF-12)
      window.setTimeout(() => m.fitBounds([[w, s], [e, n]], { padding: 40, animate: !reducirMovimiento(), duration: 3000 }), 1800);
    });
    return () => { m.remove(); mapa.current = null; setListo(false); };
  }, [datos, base]);

  // 3. Ventana emergente de cada parche, en el idioma vigente (los textos se arman aquí, no vienen del backend)
  useEffect(() => {
    const m = mapa.current;
    if (!listo || !m) return;
    const alClic = (ev: maplibregl.MapLayerMouseEvent) => {
      const p = ev.features?.[0]?.properties as Record<string, string | number> | undefined;
      if (!p) return;
      const div = document.createElement("div");
      div.className = "mapa-popup";
      ([[t("stationMap.popup.class"), t(`stationMap.class.${p.clase}`)],
        [t("stationMap.popup.area"), `${formatearHectareas(Number(p.ha), lang)} ha`],
        [t("stationMap.popup.first"), String(p.fecha_primera_deteccion)],
        [t("stationMap.popup.drop"), `${Number(p.caida_hv_db).toFixed(1)} dB`],
        [t("stationMap.popup.during"), String(p.focos_durante)],
        [t("stationMap.popup.after"), String(p.focos_despues)]] as const).forEach(([a, b]) => {
        const fila = document.createElement("p");
        const s1 = document.createElement("strong"); s1.textContent = `${a}: `;
        fila.append(s1, document.createTextNode(b)); div.append(fila);
      });
      new maplibregl.Popup({ maxWidth: "280px" }).setLngLat(ev.lngLat).setDOMContent(div).addTo(m);
    };
    m.on("click", "scars", alClic);
    return () => { m.off("click", "scars", alClic); };
  }, [listo, t, lang]);

  // 3b. Agua de referencia: llega aparte del resto, así que se agrega cuando el mapa y la lista estén listos.
  useEffect(() => {
    const m = mapa.current;
    if (!listo || !m) return;
    agua.forEach((a, i) => {
      if (m.getSource(`agua-${i}`)) return;
      const c = a.esquinas_lonlat;
      m.addSource(`agua-${i}`, { type: "image", url: `${publishedOrigin}${a.imagen}`, coordinates: [c[0]!, c[1]!, c[2]!, c[3]!] });
      m.addLayer({ id: `agua-${i}`, type: "raster", source: `agua-${i}`, paint: { "raster-opacity": 0.9, "raster-fade-duration": 0 } },
        m.getLayer("caja") ? "caja" : undefined);
    });
  }, [listo, agua]);

  // 3c. Ventana de cada huella (RF-26); los parches tienen prioridad si están encima.
  useEffect(() => {
    const m = mapa.current;
    if (!listo || !m || !m.getLayer("huellas")) return;
    const alClic = (ev: maplibregl.MapLayerMouseEvent) => {
      if (m.getLayer("scars") && m.queryRenderedFeatures(ev.point, { layers: ["scars"] }).length) return;
      const lista = ev.features ?? [];
      if (!lista.length) return;
      const div = document.createElement("div");
      div.className = "mapa-popup";
      const titulo = document.createElement("strong"); titulo.textContent = t("stationMap.fp.title"); div.append(titulo);
      // Las escenas de una misma órbita y frame se apilan: una fila por grupo con todas sus fechas y su estado.
      const grupos = new Map<string, { pol: string; fechas: string[] }>();
      for (const f of lista) {
        const p = f.properties as Record<string, string | number>;
        const clave = `${t("stationMap.fp.orbit")}: ${String(p.track).padStart(3, "0")}${p.direccion} · ${t("stationMap.fp.frame")}: ${p.frame}`;
        const g = grupos.get(clave) ?? { pol: p.polarizacion === "DHDH" ? "HH, HV" : "HH", fechas: [] };
        g.fechas.push(p.estado_en_serie && p.estado_en_serie !== "ok"
          ? `${p.fecha} (${t(`stationMap.dateState.${p.estado_en_serie}`)})` : String(p.fecha));
        grupos.set(clave, g);
      }
      for (const [clave, g] of grupos) {
        const fila = document.createElement("p");
        fila.textContent = `${clave} · ${t("stationMap.fp.pol")}: ${g.pol} · ${t("stationMap.fp.date")}: ${[...new Set(g.fechas)].sort().join(", ")}`;
        div.append(fila);
      }
      new maplibregl.Popup({ maxWidth: "340px" }).setLngLat(ev.lngLat).setDOMContent(div).addTo(m);
    };
    m.on("click", "huellas", alClic);
    return () => { m.off("click", "huellas", alClic); };
  }, [listo, t]);

  // 4. Sincronización con los controles (RF-36)
  useEffect(() => {
    const m = mapa.current;
    if (!listo || !m || !datos) return;
    // Las vistas VALIDATED traen sus propias esquinas (otra grilla); el resto usa las de la serie.
    const c = vistaActual?.esquinas_lonlat ?? datos.vistas.esquinas_lonlat;
    if (vistaActual) {
      (m.getSource("radar") as ImageSource).updateImage({ url: `${base}/${vistaActual.archivo}`, coordinates: [c[0]!, c[1]!, c[2]!, c[3]!] });
    }
    m.setPaintProperty("radar", "raster-opacity", opacidad);
    m.setLayoutProperty("radar", "visibility", visibles.radar && vistaActual ? "visible" : "none");
    for (const id of ["scars", "scars-borde"]) {
      m.setFilter(id, ["<=", ["get", "fecha_primera_deteccion"], fecha]);
      m.setLayoutProperty(id, "visibility", visibles.patches ? "visible" : "none");
    }
    m.setFilter("fires", ["all", [">", ["get", "fecha"], inicioSerie], ["<=", ["get", "fecha"], fecha]]);
    m.setLayoutProperty("fires", "visibility", visibles.fires ? "visible" : "none");
    if (m.getLayer("control")) m.setLayoutProperty("control", "visibility", visibles.control ? "visible" : "none");
    for (const id of ["huellas", "huellas-borde"]) if (m.getLayer(id)) m.setLayoutProperty(id, "visibility", visibles.huellas ? "visible" : "none");
    agua.forEach((_, i) => { if (m.getLayer(`agua-${i}`)) m.setLayoutProperty(`agua-${i}`, "visibility", visibles.agua ? "visible" : "none"); });
  }, [listo, vistaActual, opacidad, visibles, fecha, inicioSerie, datos, base, agua]);

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

  if (error) return <p role="alert" className="panel">{t("stationMap.error")} ({error})</p>;
  if (!datos) return <p role="status" className="panel">{t("stationMap.loading")}</p>;

  // RN-07: hora real de adquisición del manifiesto; sin ella la fila no se informa (RN-13), no se inventa.
  const puntos: PuntoHectareas[] = datos.hect.map((r): PuntoHectareas => {
    const hora = datos.horas[r.fecha ?? ""];
    return hora
      ? { fecha: hora, estado: "reportado", valor: Number(r.hectareas),
          rango: { min: Number(r.rango_inferior), max: Number(r.rango_superior) } }
      : { fecha: `${r.fecha}T00:00:00Z`, estado: "no-reportado", motivo: t("stationMap.noHour") };
  });
  const etqH = { titulo: t("stationMap.hectaresTitle"), fecha: t("stationMap.hectaresDate"), valor: t("stationMap.hectaresValue"),
    rango: t("stationMap.hectaresRange", { a: datos.serie.umbrales_db[0].toLocaleString(lang === "es" ? "es-BO" : "en-US"),
      b: datos.serie.umbrales_db[1].toLocaleString(lang === "es" ? "es-BO" : "en-US") }), noReportada: t("values.notReported"), rangoNoReportado: t("stationMap.rangeNotReported") };
  const excluidas = datos.estacion.fechas.filter((f) => f.estado !== "ok");
  const rol = (f: string) => datos.estacion.fechas.find((x) => x.fecha === f)?.rol;
  const encuadrar = (b: [[number, number], [number, number]], padding: number) =>
    mapa.current?.fitBounds(b, { padding, animate: !reducirMovimiento() });
  const [w, s, e, n] = datos.estacion.area.bbox_lonlat;

  return (
    <section className="mapa-estacion" aria-label={t("stationMap.title")}>
      {datos.estacion.estado === "borrador_exploratorio" ? (
        <div className="mapa-aviso" role="note">
          <strong>{t("stationMap.draftTitle")}</strong>
          <p>{t("stationMap.draftBody")}</p>
        </div>
      ) : null}
      <div className="mapa-cuerpo">
        <div className="mapa-lienzo" ref={contenedor} role="region" aria-label={t("stationMap.title")} />
        <aside className="mapa-controles">
          <fieldset>
            <legend>{t("stationMap.date")}</legend>
            <div className="mapa-fechas">
              {fechas.map((f) => (
                <button key={f} type="button" aria-pressed={f === fecha} onClick={() => setFecha(f)}
                  className={f === fecha ? "activa" : ""}>
                  {f.slice(5)}{rol(f) === "linea_base" ? <small> · {t("stationMap.baseline")}</small> : null}
                </button>
              ))}
            </div>
            <p className="mapa-nota">{t("stationMap.gap", { from: datos.estacion.hueco_datos[0], to: datos.estacion.hueco_datos[1] })}</p>
            <details>
              <summary>{t("stationMap.excluded", { n: excluidas.length })}</summary>
              <ul>{excluidas.map((f) => <li key={f.fecha}><strong>{f.fecha}</strong>: {t(`stationMap.dateState.${f.estado}`)}</li>)}</ul>
            </details>
          </fieldset>
          {fechasVal.length ? (
            <fieldset className="mapa-validated">
              <legend>{t("validated.title")}</legend>
              <div className="mapa-fechas">
                {fechasVal.map((f) => (
                  <button key={f} type="button" aria-pressed={vista === "validated" && f === fechaVal}
                    className={vista === "validated" && f === fechaVal ? "activa" : ""}
                    onClick={() => { setFechaVal(f); setVista("validated"); }}>
                    {f.slice(5)}
                  </button>
                ))}
              </div>
              <p className="mapa-nota">{t("validated.note")}</p>
            </fieldset>
          ) : null}
          <fieldset>
            <legend>{t("view.label")}</legend>
            {(["radar", "base", "cambio", "dnbr", ...(fechasVal.length ? ["validated"] : [])] as VistaMapa[]).map((k) => (
              <label key={k} className="mapa-opcion">
                <input type="radio" name="vista" checked={vista === k} onChange={() => setVista(k)} /> {t(`view.${k}`)}
              </label>
            ))}
            {vista === "cambio" && !vistaActual ? <p className="mapa-nota" role="status">{t("view.noChange")}</p> : null}
          </fieldset>
          <fieldset disabled={vista !== "radar" && vista !== "validated"}>
            <legend>{t("stationMap.polarization")}</legend>
            {(["hv", "hh", "ratio"] as Capa[]).map((k) => (
              <label key={k} className="mapa-opcion">
                <input type="radio" name="capa" checked={capa === k} onChange={() => setCapa(k)} /> {t(`stationMap.${k}`)}
              </label>
            ))}
            <label className="mapa-opcion">{t("stationMap.opacity", { pct: Math.round(opacidad * 100) })}
              <input type="range" min={0} max={1} step={0.05} value={opacidad} onChange={(ev) => setOpacidad(Number(ev.target.value))} />
            </label>
            {(vista === "radar" || vista === "validated") && vistaActual?.rango_db ? (
              <p className="mapa-nota">{t("stationMap.scale", { min: vistaActual.rango_db[0], max: vistaActual.rango_db[1] })}</p>
            ) : null}
          </fieldset>
          <fieldset>
            <legend>{t("stationMap.layers")}</legend>
            {(["radar", "patches", "fires"] as const).map((k) => (
              <label key={k} className="mapa-opcion">
                <input type="checkbox" checked={visibles[k]} onChange={() => setVisibles((v) => ({ ...v, [k]: !v[k] }))} /> {t(`stationMap.${k}`)}
              </label>
            ))}
            {datos.huellas?.features.length ? (
              <label className="mapa-opcion">
                <input type="checkbox" checked={visibles.huellas} onChange={() => setVisibles((v) => ({ ...v, huellas: !v.huellas }))} />
                <span className="muestra muestra--huella" aria-hidden="true" /> {t("stationMap.footprints")}
              </label>
            ) : null}
            {agua.length ? (
              <label className="mapa-opcion">
                <input type="checkbox" checked={visibles.agua} onChange={() => setVisibles((v) => ({ ...v, agua: !v.agua }))} />
                <span className="muestra muestra--agua" aria-hidden="true" /> {t("stationMap.water")}
              </label>
            ) : null}
            {agua.length && visibles.agua ? <p className="mapa-nota">{t("stationMap.waterNote", { n: agua.length })}</p> : null}
            {datos.zonasControl?.features.length ? (
              <label className="mapa-opcion">
                <input type="checkbox" checked={visibles.control} onChange={() => setVisibles((v) => ({ ...v, control: !v.control }))} />
                <span className="muestra muestra--control" aria-hidden="true" /> {t("control.layer")}
              </label>
            ) : null}
            <div className="mapa-botones">
              <button type="button" onClick={() => encuadrar(BOLIVIA, 24)}>{t("stationMap.viewBolivia")}</button>
              <button type="button" onClick={() => encuadrar([[w, s], [e, n]], 40)}>{t("stationMap.viewStation")}</button>
            </div>
          </fieldset>
          <fieldset>
            <legend>{t("stationMap.classes")}</legend>
            <ul className="mapa-leyenda">
              {CLASES.map((k) => (
                <li key={k.id}><span className="muestra" style={{ background: k.color }} aria-hidden="true" />
                  {t(`stationMap.class.${k.id}`)} <strong>{formatearHectareas(resumen[k.id] ?? 0, lang)} ha</strong></li>
              ))}
              <li><span className="muestra punto" aria-hidden="true" />{t("stationMap.firesCount", { n: focosVisibles })}</li>
            </ul>
            <p className="mapa-nota">{t("stationMap.cumulative")} {t("stationMap.firesNote")}</p>
          </fieldset>
        </aside>
      </div>
      <div className="mapa-hectareas">
        <GraficoHectareas puntos={puntos} idioma={lang} etiquetas={etqH} ancho={560} alto={220} />
        <TablaHectareas puntos={puntos} idioma={lang} etiquetas={etqH} />
      </div>
      <Respuesta base={base} datos={datos} lang={lang} onVer={(v, f) => {
        setVista(v);
        if (f) setFecha(f);
        contenedor.current?.scrollIntoView({ behavior: reducirMovimiento() ? "auto" : "smooth", block: "center" });
      }} />
    </section>
  );
}
