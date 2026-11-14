// T012 (001-base-web): analizador y serializador de rutas recargables (§20.1, RF-29, FR-001, FR-002).
import { describe, expect, it } from "vitest";
import { parseRoute, serializeRoute } from "../../src/app/routeState";

describe("parseRoute", () => {
  it.each([
    ["/", "home"],
    ["/explore", "explore"],
    ["/method", "method"],
    ["/about", "about"],
  ] as const)("reconoce %s como %s", (path, route) => {
    expect(parseRoute(path)).toEqual({ route });
  });

  it("conserva el stationId de una estación válida", () => {
    expect(parseRoute("/station/san-ignacio-de-velasco")).toEqual({
      route: "station",
      stationId: "san-ignacio-de-velasco",
    });
  });

  it("tolera la barra final", () => {
    expect(parseRoute("/explore/")).toEqual({ route: "explore" });
    expect(parseRoute("/station/tarija/")).toEqual({ route: "station", stationId: "tarija" });
  });

  it.each(["/nada", "/station", "/station/", "/station/../etc", "/station/Con Espacios", "/station/a/b"])(
    "rechaza la ruta desconocida o inválida %s",
    (path) => {
      expect(parseRoute(path)).toBeNull();
    },
  );

  it("conserva departamento y periodo válidos de la query", () => {
    expect(parseRoute("/explore", "?department=santa-cruz&period=2026-11")).toEqual({
      route: "explore",
      departmentId: "santa-cruz",
      period: "2026-11",
    });
  });

  it("descarta parámetros inválidos o desconocidos sin romper la ruta", () => {
    expect(parseRoute("/explore", "?department=%3Cscript%3E&period=&otro=1")).toEqual({ route: "explore" });
  });
});

describe("serializeRoute", () => {
  it("serializa cada ruta a su camino", () => {
    expect(serializeRoute({ route: "home" })).toBe("/");
    expect(serializeRoute({ route: "about" })).toBe("/about");
    expect(serializeRoute({ route: "station", stationId: "tarija" })).toBe("/station/tarija");
  });

  it("añade departamento y periodo en orden estable", () => {
    expect(serializeRoute({ route: "explore", period: "2026-11", departmentId: "beni" })).toBe(
      "/explore?department=beni&period=2026-11",
    );
  });

  it("es reversible: parse(serialize(x)) devuelve x", () => {
    const location = { route: "station", stationId: "tarija", departmentId: "tarija", period: "2026-11" } as const;
    const url = new URL(serializeRoute(location), "http://localhost");
    expect(parseRoute(url.pathname, url.search)).toEqual(location);
  });

  it("no serializa una estación sin identificador válido", () => {
    expect(() => serializeRoute({ route: "station" })).toThrow();
    expect(() => serializeRoute({ route: "station", stationId: "../x" })).toThrow();
  });
});
