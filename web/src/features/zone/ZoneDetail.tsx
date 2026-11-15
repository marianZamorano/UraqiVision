// «Más información» de la zona abierta en el explorador (RF-29): la respuesta paso a paso de la estación (Respuesta),
// con todos sus archivos publicados (§17.3). Se carga solo al abrir el detalle, porque trae los parches y los focos
// (varios MB) y el gráfico (RNF-01). Los botones «ver en el mapa» de cada paso cambian la imagen sobre el globo.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Language } from "../../contracts/view-state";
import { Respuesta, type VistaMapa } from "../map/Respuesta";
import { cargarArchivosEstacion, type ArchivosEstacion } from "../map/stationFiles";
import "../map/stationMap.css";

type ZoneDetailProps = {
  base: string;
  lang: Language;
  onSee: (vista: VistaMapa, fecha?: string) => void;
};

export default function ZoneDetail({ base, lang, onSee }: ZoneDetailProps) {
  const { t } = useTranslation();
  const [settled, setSettled] = useState<{ base: string; datos: ArchivosEstacion | null } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    cargarArchivosEstacion(base, controller.signal).then(
      (datos) => {
        if (!controller.signal.aborted) setSettled({ base, datos });
      },
      () => {
        if (!controller.signal.aborted) setSettled({ base, datos: null });
      },
    );
    return () => controller.abort();
  }, [base]);

  if (!settled || settled.base !== base) return <p role="status">{t("zone.loading")}</p>;
  if (!settled.datos) return <p role="alert">{t("zone.error")}</p>;
  return <Respuesta base={base} datos={settled.datos} lang={lang} onVer={onSee} compacta />;
}
