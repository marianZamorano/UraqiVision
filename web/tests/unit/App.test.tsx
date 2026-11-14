// T001 (001-base-web): la aplicación monta y expone un landmark principal (RNF-04).
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../src/app/App";

describe("App", () => {
  it("monta el shell con un landmark <main>", () => {
    render(<App />);
    expect(screen.getByRole("main")).toBeTruthy();
  });

  it("no renderiza ningún 0 como sustituto de datos ausentes (RN-13)", () => {
    const { container } = render(<App />);
    expect(container.textContent).not.toMatch(/\b0\b/);
  });
});
