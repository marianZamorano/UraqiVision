// 004 T015: superficie con cambio por fecha, con su rango de sensibilidad (RN-06; research.md R4).
// - Gráfico: banda [mín, máx] (Area con dataKey de rango) y línea del valor. Un valor no reportado es `null`:
//   Recharts deja un hueco y nunca dibuja un 0 (RN-13). isAnimationActive="auto" respeta el movimiento reducido.
// - Tabla: alternativa textual con los mismos datos (RNF-04); el gráfico nunca es la única forma de leer las cifras.
// - Los componentes reciben un modelo de presentación; el adaptador del panel (T011) lo arma desde los contratos.
// - Los textos llegan por `etiquetas` (i18n), nunca escritos aquí (RNF-03). Colores: tokens CSS (§20.2).
import { Area, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { formatearFecha, formatearHectareas, type Idioma } from "../formato/formato";

export type PuntoHectareas =
  | {
      fecha: string; // ISO 8601 en UTC (adquisición)
      estado: "reportado";
      valor: number;
      rango: { min: number; max: number } | null;
      motivoRango?: string; // obligatorio si rango es null
    }
  | { fecha: string; estado: "no-reportado"; motivo: string };

export interface EtiquetasHectareas {
  titulo: string;
  fecha: string;
  valor: string;
  rango: string;
  noReportada: string;
  rangoNoReportado: string;
}

interface Props {
  puntos: PuntoHectareas[];
  idioma: Idioma;
  etiquetas: EtiquetasHectareas;
}

/** Datos para Recharts: `null` deja hueco (RN-13); el rango va como [mín, máx] para la banda (RN-06). */
export function aDatosGrafico(puntos: PuntoHectareas[]) {
  return puntos.map((p) =>
    p.estado === "reportado"
      ? { fecha: p.fecha, valor: p.valor, rango: p.rango ? ([p.rango.min, p.rango.max] as [number, number]) : null }
      : { fecha: p.fecha, valor: null, rango: null },
  );
}

export function GraficoHectareas({ puntos, idioma, etiquetas, ancho, alto }: Props & { ancho: number; alto: number }) {
  return (
    <figure aria-label={etiquetas.titulo} style={{ margin: 0 }}>
      <ComposedChart width={ancho} height={alto} data={aDatosGrafico(puntos)} title={etiquetas.titulo}>
        <XAxis dataKey="fecha" tickFormatter={(f: string) => formatearFecha(f, idioma).split(",")[0] ?? f} />
        <YAxis tickFormatter={(v: number) => formatearHectareas(v, idioma)} />
        <Area
          dataKey="rango"
          name={etiquetas.rango}
          stroke="none"
          fill="var(--cambio-2)"
          fillOpacity={0.6}
          isAnimationActive="auto"
        />
        <Line
          dataKey="valor"
          name={etiquetas.valor}
          stroke="var(--cambio-4)"
          strokeWidth={2}
          connectNulls={false}
          isAnimationActive="auto"
        />
      </ComposedChart>
    </figure>
  );
}

export function TablaHectareas({ puntos, idioma, etiquetas }: Props) {
  const ha = (v: number) => formatearHectareas(v, idioma);
  return (
    <table aria-label={etiquetas.titulo}>
      <thead>
        <tr>
          <th scope="col">{etiquetas.fecha}</th>
          <th scope="col">{etiquetas.valor}</th>
          <th scope="col">{etiquetas.rango}</th>
        </tr>
      </thead>
      <tbody>
        {puntos.map((p) => (
          <tr key={p.fecha}>
            <td>{formatearFecha(p.fecha, idioma)}</td>
            {p.estado === "reportado" ? (
              <>
                <td>{ha(p.valor)}</td>
                <td>
                  {p.rango ? `${ha(p.rango.min)}–${ha(p.rango.max)}` : `${etiquetas.rangoNoReportado}: ${p.motivoRango ?? ""}`}
                </td>
              </>
            ) : (
              <td colSpan={2}>{`${etiquetas.noReportada}: ${p.motivo}`}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
