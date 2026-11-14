// T013 (001-base-web): adaptador pequeño sobre History API, sin librería de enrutado (research.md §2).
// Enlaces recargables y atrás/adelante (FR-001, FR-002). Sin provider: la fuente de verdad es window.location.
import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { parseRoute, type RouteLocation } from "./routeState";

const NAVIGATE_EVENT = "uraqi:navigate";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  window.addEventListener(NAVIGATE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(NAVIGATE_EVENT, onChange);
  };
}

const currentUrl = () => `${window.location.pathname}${window.location.search}`;

/** Cambia de ruta sin recargar la página. */
export function navigate(to: string, options: { replace?: boolean } = {}): void {
  if (to === currentUrl()) return;
  if (options.replace) window.history.replaceState(null, "", to);
  else window.history.pushState(null, "", to);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

/** URL actual (camino y query); se actualiza con navigate y con atrás/adelante. */
export function useCurrentUrl(): string {
  return useSyncExternalStore(subscribe, currentUrl, () => "/");
}

/** Estado de ruta validado de la URL actual, o `null` si la ruta no existe. */
export function useRoute(): RouteLocation | null {
  const url = new URL(useCurrentUrl(), "http://localhost");
  return parseRoute(url.pathname, url.search);
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string };

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/** Enlace real (`<a href>`): el clic simple navega sin recargar; con modificadores lo maneja el navegador. */
export function Link({ to, onClick, target, ...rest }: LinkProps) {
  return (
    <a
      {...rest}
      href={to}
      target={target}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || !isPlainLeftClick(event) || (target && target !== "_self")) return;
        event.preventDefault();
        navigate(to);
      }}
    />
  );
}

type NavLinkProps = LinkProps & { end?: boolean };

/** Enlace de navegación que marca la página actual (`aria-current="page"` y clase `active`). */
export function NavLink({ to, end = false, className, ...rest }: NavLinkProps) {
  const path = new URL(useCurrentUrl(), "http://localhost").pathname;
  const active = path === to || (!end && to !== "/" && path.startsWith(`${to}/`));
  const classes = [className, active ? "active" : null].filter(Boolean).join(" ") || undefined;

  return <Link {...rest} to={to} className={classes} aria-current={active ? "page" : undefined} />;
}
