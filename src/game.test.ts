import { describe, expect, it } from "vitest";
import { game } from "./game";

const init = () =>
  game.initialize({
    input: { register() {}, layout: () => null },
    audio: { define() {}, load: async () => {} },
    diagnostics: { register() {} },
    assets: {},
    events: {},
    viewport: () => ({}),
  } as never) as [
    Awaited<ReturnType<typeof game.initialize>>[0],
    Awaited<ReturnType<typeof game.initialize>>[1],
  ];

describe("Cascade rules", () => {
  it("deals the Klondike layout", () => {
    const [s, d] = init();
    const x = d.snapshot(d.deal(s)) as {
      stock: unknown[];
      tableau: unknown[][];
    };
    expect(x.stock).toHaveLength(24);
    expect(x.tableau.map((p) => p.length)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it("turns three cards", () => {
    const [s, d] = init();
    const x = d.snapshot(d.turnStock(d.deal(s))) as {
      stock: unknown[];
      waste: unknown[];
      wasteSets: number[];
    };
    expect(x.stock).toHaveLength(21);
    expect(x.waste).toHaveLength(3);
    expect(x.wasteSets).toEqual([3]);
  });
  it("moves an alternating descending card", () => {
    const [s, d] = init();
    let x = d.addCard(s, "tableau", 0, "spades", 8, true);
    x = d.addCard(x, "tableau", 1, "hearts", 7, true);
    const [, ok] = d.move(x, "tableau", 1, 0, "tableau", 0);
    expect(ok).toBe(true);
  });
});
