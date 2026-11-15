// Versión beta (#110): la respuesta de la estación contada paso a paso con sus propias imágenes y cifras publicadas
// (§17.3): lo normal (MC-02), el cambio (MC-03), los parches (MC-04, RN-05), el testigo óptico y el acuerdo, con
// dónde se rompe (VC-01, VC-02, RN-04, RN-06). Después, la serie con el rango normal del paisaje (RF-07, huecos =
// fechas sin imagen usable, RN-13) y cómo leer los colores. Textos en es.json/en.json (RNF-03).
// `compacta` (panel de detalle del explorador): cada paso con su imagen y una sola línea; lo metodológico (zonas de
// control, límites) queda plegado y la leyenda de colores no se repite (va con la línea de tiempo del globo).
import { useTranslation } from "react-i18next";
import { Area, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatearHectareas, type Idioma } from "../interface/formato/formato";
import { CLASES, type ArchivosEstacion } from "./stationFiles";

export type VistaMapa = "radar" | "base" | "cambio" | "dnbr" | "validated";

interface Props {
  base: string;
  datos: ArchivosEstacion;
  lang: Idioma;
  onVer: (vista: VistaMapa, fecha?: string) => void;
  /** Versión corta para una columna angosta: menos texto, lo metodológico plegado. */
  compacta?: boolean;
}

const TRAZO: Record<string, string> = { compatible_quema: "", perdida_previa: "6 3", ambigua: "2 3", insuficiente: "8 3 2 3" };

/** Silueta de los parches dentro de la caja de la estación (SVG, sin mapa base). */
function MiniParches({ datos }: { datos: ArchivosEstacion }) {
  const [w, s, e, n] = datos.estacion.area.bbox_lonlat;
  const x = (lon: number) => ((lon - w) / (e - w)) * 100;
  const y = (lat: number) => ((n - lat) / (n - s)) * 100;
  const color = Object.fromEntries(CLASES.map((k) => [k.id, k.color]));
  return (
    <svg viewBox="0 0 100 100" className="paso-img" role="img" aria-hidden="true" preserveAspectRatio="none">
      <rect width="100" height="100" fill="#f4f4f2" />
      {datos.scars.features.map((f, i) => {
        const g = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
        const polis = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
        const d = polis.map((p) => p.map((anillo) => `M${anillo.map(([lo, la]) => `${x(lo!).toFixed(2)},${y(la!).toFixed(2)}`).join("L")}Z`).join("")).join("");
        // Trazo grueso para que parches de pocas hectáreas se vean a esta escala.
        const c = color[(f.properties as { clase: string }).clase] ?? "#999";
        return <path key={i} d={d} fill={c} stroke={c} strokeWidth="0.8" />;
      })}
    </svg>
  );
}

/** Propuesta de zonas de control (MC-05, DP-05 pendiente): criterios, zonas y qué cambia si se usan. */
function PropuestaControl({ datos, lang, onVer, plegada = false }: { datos: ArchivosEstacion; lang: Idioma; onVer: Props["onVer"]; plegada?: boolean }) {
  const { t } = useTranslation();
  const c = datos.control;
  if (!c) return null;
  const aplicada = c.estado === "aplicada";
  const num = (x: number, d = 2) => x.toLocaleString(lang === "es" ? "es-BO" : "en-US", { maximumFractionDigits: d });
  const ha = (r: Record<"estricto" | "central" | "sensible", number>) =>
    t("control.range", { c: formatearHectareas(r.central, lang), a: formatearHectareas(r.estricto, lang), b: formatearHectareas(r.sensible, lang) });
  const zonas = datos.zonasControl?.features ?? [];
  const fechas = Object.keys(c.deriva_actual_db);
  const ultima = fechas[fechas.length - 1] ?? "";
  const Caja = plegada ? "details" : "section";
  return (
    <Caja className="bloque bloque--propuesta">
      {plegada ? <summary>{t(aplicada ? "control.titleApplied" : "control.title")}</summary> : <h2>{t(aplicada ? "control.titleApplied" : "control.title")}</h2>}
      <p><strong>{t(aplicada ? "control.whoApplied" : "control.who")}</strong> {t(aplicada ? "control.bodyApplied" : "control.body")}</p>
      {c.calibracion ? (<>
        <p>{t("control.calibration", { s: num(c.calibracion.umbrales_db.sensible), c: num(c.calibracion.umbrales_db.central), e: num(c.calibracion.umbrales_db.estricto) })}</p>
        <p className="nota">{t("control.falseAlarm", { pct: num(c.calibracion.falsa_alarma_sin_cambio_optico_pct?.sensible ?? 0),
          ctrl: num(c.calibracion.falsa_alarma_en_control_pct.sensible ?? 0) })}</p>
      </>) : null}
      <ul className="lista">{(t("control.criteria", { returnObjects: true, ref: num(c.referencia_hv_db) }) as string[]).map((x) => <li key={x}>{x}</li>)}</ul>
      {zonas.length ? (<>
        <p>{t("control.found", { n: c.candidatas_que_cumplen, k: c.elegidas })}</p>
        <h3>{t(aplicada ? "control.zonesApplied" : "control.zones")}</h3>
        <ul className="lista">{zonas.map((z) => {
          const p = z.properties as { id: string; ha: number; hv_linea_base_db: number; foco_mas_cercano_km: number };
          return <li key={p.id}>{t("control.zone", { id: p.id, ha: formatearHectareas(p.ha, lang), hv: num(p.hv_linea_base_db), km: num(p.foco_mas_cercano_km, 1) })}</li>;
        })}</ul>
        <button type="button" className="paso-ver" onClick={() => onVer("radar")}>{t("story.see")}</button>
        {c.deriva_con_control_db && c.hectareas_ultima_fecha.con_control ? (<>
          <h3>{t("control.effect")}</h3>
          <div className="tabla-envoltura">
            <table className="tabla-compacta">
              <thead><tr><th scope="col">{t("control.date")}</th><th scope="col">{t("control.now")}</th><th scope="col">{t("control.withControl")}</th></tr></thead>
              <tbody>{fechas.map((f) => (
                <tr key={f}><th scope="row">{f}</th><td>{num(c.deriva_actual_db[f] ?? 0)}</td><td>{num(c.deriva_con_control_db![f] ?? 0)}</td></tr>
              ))}</tbody>
            </table>
          </div>
          <p><strong>{t("control.hectares", { date: ultima, now: ha(c.hectareas_ultima_fecha.actual), ctrl: ha(c.hectareas_ultima_fecha.con_control) })}</strong></p>
        </>) : null}
      </>) : <p>{t("control.noZones")}</p>}
    </Caja>
  );
}

function Barra({ colores }: { colores: string[] }) {
  return <span className="barra-color" aria-hidden="true" style={{ background: `linear-gradient(90deg, ${colores.join(", ")})` }} />;
}

export function Respuesta({ base, datos, lang, onVer, compacta = false }: Props) {
  const { t } = useTranslation();
  const { vistas, serie, validacion: v, hect } = datos;
  const lb = serie.linea_base;
  const ultimaFila = hect[hect.length - 1];
  const fechaUlt = ultimaFila?.fecha ?? "";
  const puntoUlt = serie.fechas.find((f) => f.fecha === fechaUlt);
  const vista = (capa: string, fecha?: string) => vistas.vistas.find((x) => x.capa === capa && (fecha === undefined || x.fecha === fecha));
  const imgBase = vista("base");
  const imgCambio = vista("cambio", fechaUlt);
  const imgOptico = vista("dnbr");
  const num = (x: number, d = 1) => x.toLocaleString(lang === "es" ? "es-BO" : "en-US", { maximumFractionDigits: d });
  const ha = (x: string | undefined) => formatearHectareas(Number(x ?? 0), lang);

  const pasos = [
    { n: "01", titulo: t("story.s1.title"), texto: t("story.s1.body", { dates: lb.join(lang === "es" ? " y " : " and ") }), corto: t("story.s1.short"),
      img: imgBase && <img className="paso-img" src={`${base}/${imgBase.archivo}`} alt="" />, ver: () => onVer("base") },
    { n: "02", titulo: t("story.s2.title", { date: fechaUlt }),
      texto: t("story.s2.body", { lo: num(puntoUlt?.rango_normal?.[0] ?? 0), hi: num(puntoUlt?.rango_normal?.[1] ?? 0) }), corto: t("story.s2.short"),
      img: imgCambio && <img className="paso-img" src={`${base}/${imgCambio.archivo}`} alt="" />, ver: () => onVer("cambio", fechaUlt) },
    { n: "03", titulo: t("story.s3.title"),
      texto: t("story.s3.body", { thr: num(Math.abs(serie.umbrales_db[1]), 2), n: datos.scars.features.length, ha: ha(ultimaFila?.hectareas), min: ha(ultimaFila?.rango_inferior), max: ha(ultimaFila?.rango_superior) }),
      corto: t("story.s3.short", { n: datos.scars.features.length, ha: ha(ultimaFila?.hectareas), min: ha(ultimaFila?.rango_inferior), max: ha(ultimaFila?.rango_superior) }),
      img: <MiniParches datos={datos} />, ver: () => onVer("radar", fechaUlt) },
    { n: "04", titulo: t("story.s4.title"), texto: `${t("story.s4.body", { from: v.vc01_sentinel2.fechas[0], to: v.vc01_sentinel2.fechas[1] })} ${t(v.vc01_sentinel2.encierra_radar ? "story.s4.brackets" : "story.s4.notBrackets")}`,
      corto: t("story.s4.short", { from: v.vc01_sentinel2.fechas[0], to: v.vc01_sentinel2.fechas[1] }),
      img: imgOptico && <img className="paso-img" src={`${base}/${imgOptico.archivo}`} alt="" />, ver: () => onVer("dnbr") },
  ];

  // Serie: las fechas sin imagen usable quedan como huecos (null), nunca como cero (RN-13).
  const datosSerie = serie.fechas.map((f) => ({
    fecha: f.fecha.slice(5),
    banda: f.rango_normal,
    ...Object.fromEntries(CLASES.map((k) => [k.id, f.clases?.[k.id] ?? null])),
  }));
  const sinDato = serie.fechas.filter((f) => f.rango_normal === null);
  // Límites que el backend declara para esta estación (station.json → limites), traducidos aquí.
  // Lo quemado antes del FIN de la línea base ya forma parte de ella: el radar no lo ve como cambio.
  const rompe = (datos.estacion.limites ?? []).map((cod) => t(`limits.${cod}`, { start: lb[lb.length - 1] }));
  const pal = vistas.paletas;
  const descargas = [["change", "change.tif"], ["scars", "scars.geojson"], ["hectares", "hectares.csv"],
    ["serie", "serie.json"], ["validation", "validation.json"], ["manifest", "manifest.json"]] as const;

  return (
    <div className={compacta ? "respuesta respuesta--compacta" : "respuesta"}>
      {compacta ? null : (
        <header className="respuesta-cabecera">
          <p className="eyebrow">{t("story.eyebrow")}</p>
          <h2>{t("story.title")}</h2>
          <p>{t("story.lead")}</p>
        </header>
      )}

      <ol className="pasos">
        {pasos.map((p) => (
          <li key={p.n} className="paso">
            {p.img}
            <div>
              <p className="paso-n">{p.n} / 05</p>
              <h3>{p.titulo}</h3>
              <p>{compacta ? p.corto : p.texto}</p>
              <button type="button" className="paso-ver" onClick={p.ver}>{t("story.see")}</button>
            </div>
          </li>
        ))}
        <li className="paso paso--ancho">
          <div>
            <p className="paso-n">05 / 05</p>
            <h3>{t("story.s5.title")}</h3>
            {compacta ? null : <p>{t("story.s5.body")}</p>}
            <ul className="acuerdo">
              {v.acuerdo_por_clase_optica.map((a) => (
                <li key={a.clase_optica}>
                  <span className="acuerdo-nombre">{t(`story.optical.${a.clase_optica}`)}</span>
                  <span className="acuerdo-barra" aria-hidden="true"><span style={{ width: `${Math.min(100, a.pct_marcado ?? 0)}%` }} /></span>
                  <strong>{a.pct_marcado === null ? t("values.notReported") : t("story.marked", { pct: num(a.pct_marcado) })}</strong>
                  <span className="nota">{t("story.cells", { a: formatearHectareas(a.ha_marcadas, lang), b: formatearHectareas(a.ha, lang) })}</span>
                </li>
              ))}
            </ul>
            <p>{t("story.s5.fires", { a: v.vc02_focos.focos_en_o_junto_a_parche, b: v.vc02_focos.focos_periodo })}</p>
            {compacta ? (
              <details>
                <summary>{t("story.breaks")} ({rompe.length})</summary>
                <ul className="lista">{rompe.map((r) => <li key={r}>{r}</li>)}</ul>
              </details>
            ) : (<>
              <h4>{t("story.breaks")}</h4>
              <ul className="lista">{rompe.map((r) => <li key={r}>{r}</li>)}</ul>
            </>)}
          </div>
        </li>
      </ol>

      <PropuestaControl datos={datos} lang={lang} onVer={onVer} plegada={compacta} />

      <section className="bloque">
        <h2>{t("serie.title")}</h2>
        {compacta ? null : <p>{t("serie.body")}</p>}
        <div className="grafico-serie">
          <ResponsiveContainer width="100%" height={compacta ? 220 : 300}>
            <ComposedChart data={datosSerie} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <XAxis dataKey="fecha" />
              <YAxis domain={[Math.min(-5, Math.floor(serie.umbrales_db[1]) - 1), 2]} label={{ value: t("serie.axis"), angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={(val) => (typeof val === "number" ? `${num(val, 2)} dB` : String(val))} />
              {/* Sobre el panel oscuro del explorador, la línea base y la banda van más tenues para no tapar las líneas. */}
              <ReferenceArea x1={lb[0]?.slice(5)} x2={lb[lb.length - 1]?.slice(5)} fill="#e8eef6" fillOpacity={compacta ? 0.12 : 1} label={{ value: t("serie.baseline"), position: "insideTop", fill: compacta ? "#c3ccdd" : undefined }} />
              <Area dataKey="banda" name={t("serie.band")} stroke="none" fill="#c9c9c4" fillOpacity={compacta ? 0.22 : 0.55} isAnimationActive="auto" connectNulls={false} />
              <ReferenceLine y={serie.umbrales_db[1]} stroke="#8a3210" strokeDasharray="4 3" label={{ value: t("serie.threshold", { v: num(serie.umbrales_db[1], 2) }), position: "insideBottomRight" }} />
              {CLASES.map((k) => (
                <Line key={k.id} dataKey={k.id} name={t(`stationMap.class.${k.id}`)} stroke={k.color} strokeWidth={2}
                  strokeDasharray={TRAZO[k.id]} dot={{ r: 4 }} connectNulls={false} isAnimationActive="auto" />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <ul className="leyenda-serie">
          <li><span className="muestra" style={{ background: "#c9c9c4" }} aria-hidden="true" />{t("serie.band")}</li>
          {CLASES.map((k) => (
            <li key={k.id}><svg width="28" height="10" aria-hidden="true"><line x1="0" y1="5" x2="28" y2="5" stroke={k.color} strokeWidth="2.5" strokeDasharray={TRAZO[k.id]} /></svg>
              {t(`stationMap.class.${k.id}`)}</li>
          ))}
        </ul>
        {sinDato.length ? (
          <p className="nota">{t("serie.gaps")}: {sinDato.map((f) => `${f.fecha} (${t(`stationMap.dateState.${f.estado}`)})`).join(" · ")}</p>
        ) : null}
      </section>

      {compacta ? null : <section className="bloque">
        <h2>{t("colors.title")}</h2>
        <dl className="colores">
          <div><dt>{t("colors.radar")}</dt><dd><Barra colores={pal.radar} /><span className="extremos"><span>{t("colors.radarLo")}</span><span>{t("colors.radarHi")}</span></span></dd></div>
          <div><dt>{t("colors.change")}</dt><dd><Barra colores={pal.cambio} /><span className="extremos"><span>{t("colors.changeLo")}</span><span>{t("colors.changeMid")}</span><span>{t("colors.changeHi")}</span></span></dd></div>
          <div><dt>{t("colors.optical")}</dt><dd><Barra colores={pal.optico} /><span className="extremos"><span>{t("colors.opticalLo")}</span><span>{t("colors.opticalHi")}</span></span></dd></div>
          <div><dt>{t("colors.patches")}</dt><dd><ul className="mapa-leyenda">
            {CLASES.map((k) => <li key={k.id}><span className="muestra" style={{ background: k.color }} aria-hidden="true" />{t(`stationMap.class.${k.id}`)}</li>)}
            <li><span className="muestra punto" aria-hidden="true" />{t("stationMap.fires")}</li>
            {datos.zonasControl?.features.length ? <li><span className="muestra muestra--control" aria-hidden="true" />{t("control.layer")}</li> : null}
          </ul></dd></div>
        </dl>
      </section>}

      <p className="descargas">
        <strong>{t("downloads.title")}:</strong>{" "}
        {descargas.map(([k, archivo], i) => (
          <span key={k}>{i ? " · " : ""}<a href={`${base}/${archivo}`} download>{t(`downloads.${k}`)}</a></span>
        ))}
      </p>
    </div>
  );
}
