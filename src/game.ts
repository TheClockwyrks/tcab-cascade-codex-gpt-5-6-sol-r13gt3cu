import type {
  Game,
  InitApi,
  RenderApi,
  UpdateApi,
} from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import * as K from "./constants";
declare global {
  interface Array<T> {
    at(index: number): T | undefined;
  }
  interface ReadonlyArray<T> {
    at(index: number): T | undefined;
  }
}
export type Screen = "title" | "howto" | "playing" | "won";
export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type PileKind = "stock" | "waste" | "foundation" | "tableau";
export interface CardState {
  readonly id: number;
  readonly suit: Suit;
  readonly rank: number;
  readonly faceUp: boolean;
}
export interface DragState {
  readonly cards: readonly CardState[];
  readonly fromPile: "waste" | "foundation" | "tableau";
  readonly fromIndex: number;
  readonly x: number;
  readonly y: number;
}
export interface DropTargetState {
  readonly pile: "foundation" | "tableau";
  readonly index: number;
}
export interface PointerState {
  readonly x: number;
  readonly y: number;
  readonly down: boolean;
}
export interface PressState {
  readonly x: number;
  readonly y: number;
  readonly at: number;
}
export interface FlyerState {
  readonly id: number;
  readonly suit: Suit;
  readonly rank: number;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
}
export interface CascadeState {
  readonly screen: Screen;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly stock: readonly CardState[];
  readonly waste: readonly CardState[];
  readonly wasteSets: readonly number[];
  readonly foundations: readonly (readonly CardState[])[];
  readonly tableau: readonly (readonly CardState[])[];
  readonly drag: DragState | null;
  readonly dropTarget: DropTargetState | null;
  readonly pointer: PointerState;
  readonly lastPress: PressState | null;
  readonly autoFlip: boolean;
  readonly winDetect: boolean;
  readonly launching: boolean;
  readonly trailPainting: boolean;
  readonly launchClock: number;
  readonly launched: number;
  readonly flyers: readonly FlyerState[];
  readonly cascadeDone: boolean;
  readonly trailStamps: number;
  readonly nextId: number;
  readonly simTime: number;
  readonly muted: boolean;
}
type R = DeepReadonly<CascadeState>;
type Rect = { x: number; y: number; w: number; h: number };
type Ref = { pile: PileKind; index: number };
type SnapCard = {
  id: number;
  suit: Suit;
  rank: number;
  color: "red" | "black";
  faceUp: boolean;
};
export interface CascadeDebugApi {
  readonly version: number;
  reset(s: R): CascadeState;
  snapshot(s: R): object;
  reconcile(s: R): CascadeState;
  menuItemRect(s: R, index: number): Rect | null;
  setScreen(s: R, v: Screen): CascadeState;
  setMenuIndex(s: R, v: number): CascadeState;
  setTitleIndex(s: R, v: number): CascadeState;
  addCard(
    s: R,
    p: PileKind,
    i: number,
    u: Suit,
    r: number,
    f: boolean,
  ): CascadeState;
  removeCard(s: R, id: number): CascadeState;
  setCardFaceUp(s: R, id: number, v: boolean): CascadeState;
  clearPile(s: R, p: PileKind, i: number): CascadeState;
  clearTable(s: R): CascadeState;
  addWasteSet(s: R, n: number): CascadeState;
  clearWasteSets(s: R): CascadeState;
  deal(s: R): CascadeState;
  turnStock(s: R): CascadeState;
  move(
    s: R,
    p: PileKind,
    i: number,
    row: number,
    tp: PileKind,
    ti: number,
  ): [CascadeState, boolean];
  autoMove(s: R, p: PileKind, i: number): [CascadeState, boolean];
  pointerDown(s: R, x: number, y: number): CascadeState;
  pointerMove(s: R, x: number, y: number): CascadeState;
  pointerUp(s: R, x: number, y: number): CascadeState;
  setAutoFlip(s: R, v: boolean): CascadeState;
  setWinDetect(s: R, v: boolean): CascadeState;
  setLaunching(s: R, v: boolean): CascadeState;
  setTrailPainting(s: R, v: boolean): CascadeState;
  addFlyer(
    s: R,
    u: Suit,
    r: number,
    x: number,
    y: number,
    vx: number,
    vy: number,
  ): CascadeState;
  setFlyerPosition(s: R, id: number, x: number, y: number): CascadeState;
  setFlyerVelocity(s: R, id: number, vx: number, vy: number): CascadeState;
  removeFlyer(s: R, id: number): CascadeState;
  clearFlyers(s: R): CascadeState;
  setLaunchClock(s: R, v: number): CascadeState;
  clearTrail(s: R): CascadeState;
  drawLaunchVx(): number;
}
export const BACKGROUND = "#082e2b";
let trail: { suit: Suit; rank: number; x: number; y: number }[] = [];
const copy = (s: R): CascadeState => ({
  ...s,
  stock: [...s.stock],
  waste: [...s.waste],
  wasteSets: [...s.wasteSets],
  foundations: s.foundations.map((x) => [...x]),
  tableau: s.tableau.map((x) => [...x]),
  flyers: s.flyers.map((x) => ({ ...x })),
  drag: s.drag ? { ...s.drag, cards: [...s.drag.cards] } : null,
  dropTarget: s.dropTarget ? { ...s.dropTarget } : null,
  pointer: { ...s.pointer },
  lastPress: s.lastPress ? { ...s.lastPress } : null,
});
const fresh = (muted = false): CascadeState => ({
  screen: "title",
  menuIndex: 0,
  titleIndex: 0,
  stock: [],
  waste: [],
  wasteSets: [],
  foundations: Array.from({ length: 4 }, () => []),
  tableau: Array.from({ length: 7 }, () => []),
  drag: null,
  dropTarget: null,
  pointer: { x: 0, y: 0, down: false },
  lastPress: null,
  autoFlip: true,
  winDetect: true,
  launching: true,
  trailPainting: true,
  launchClock: 0,
  launched: 0,
  flyers: [],
  cascadeDone: false,
  trailStamps: 0,
  nextId: 1,
  simTime: 0,
  muted,
});
const red = (u: Suit) => u === "hearts" || u === "diamonds";
const valid = (p: PileKind, i: number) => {
  if (
    !Number.isInteger(i) ||
    (p === "foundation"
      ? i < 0 || i > 3
      : p === "tableau"
        ? i < 0 || i > 6
        : i !== 0)
  )
    throw new RangeError(`Invalid ${p} index ${i}`);
};
const pile = (s: R, p: PileKind, i: number): readonly CardState[] => {
  valid(p, i);
  return p === "stock"
    ? s.stock
    : p === "waste"
      ? s.waste
      : p === "foundation"
        ? s.foundations[i]!
        : s.tableau[i]!;
};
const put = (
  s: R,
  p: PileKind,
  i: number,
  a: readonly CardState[],
): CascadeState => {
  const n = copy(s);
  return p === "stock"
    ? { ...n, stock: [...a] }
    : p === "waste"
      ? { ...n, waste: [...a] }
      : p === "foundation"
        ? {
            ...n,
            foundations: n.foundations.map((x, j) => (j === i ? [...a] : x)),
          }
        : { ...n, tableau: n.tableau.map((x, j) => (j === i ? [...a] : x)) };
};
const run = (a: readonly CardState[]) =>
  a.every(
    (c, i) =>
      i === 0 ||
      (c.faceUp &&
        a[i - 1]!.rank === c.rank + 1 &&
        red(a[i - 1]!.suit) !== red(c.suit)),
  );
const accepts = (s: R, p: PileKind, i: number, a: readonly CardState[]) => {
  if (!a.length || !run(a)) return false;
  const t = pile(s, p, i),
    c = a[0]!;
  if (p === "foundation")
    return (
      a.length === 1 &&
      (t.length
        ? t.at(-1)!.suit === c.suit && t.at(-1)!.rank + 1 === c.rank
        : c.rank === 1)
    );
  if (p === "tableau")
    return t.length
      ? t.at(-1)!.faceUp &&
          t.at(-1)!.rank === c.rank + 1 &&
          red(t.at(-1)!.suit) !== red(c.suit)
      : c.rank === 13;
  return false;
};
const dec = (a: readonly number[]) => {
  const n = [...a];
  for (let i = n.length - 1; i >= 0; i--)
    if (n[i]! > 0) {
      n[i]!--;
      if (!n[i]) n.splice(i, 1);
      break;
    }
  return n;
};
const finish = (s: CascadeState, src?: Ref) => {
  let n = s;
  if (src?.pile === "tableau" && n.autoFlip) {
    const p = n.tableau[src.index]!;
    if (p.length && !p.at(-1)!.faceUp)
      n = {
        ...n,
        tableau: n.tableau.map((x, i) =>
          i === src.index
            ? [...x.slice(0, -1), { ...x.at(-1)!, faceUp: true }]
            : x,
        ),
      };
  }
  if (n.winDetect && n.foundations.reduce((a, p) => a + p.length, 0) === 52)
    n = {
      ...n,
      screen: "won",
      launchClock: K.LAUNCH_INTERVAL,
      launched: 0,
      flyers: [],
      cascadeDone: false,
    };
  return n;
};
const move = (
  s: R,
  p: PileKind,
  i: number,
  row: number,
  tp: PileKind,
  ti: number,
): [CascadeState, boolean] => {
  const a = pile(s, p, i);
  valid(tp, ti);
  if (!Number.isInteger(row) || row < 0 || row >= a.length)
    throw new RangeError(`Invalid row ${row}`);
  if (
    p === "stock" ||
    (p === "waste" && (row !== a.length - 1 || !s.wasteSets.length)) ||
    (p === "foundation" && row !== a.length - 1)
  )
    return [copy(s), false];
  const cards = a.slice(row);
  if (!cards[0]!.faceUp || !accepts(s, tp, ti, cards)) return [copy(s), false];
  let n = put(s, p, i, a.slice(0, row));
  if (p === "waste") n = { ...n, wasteSets: dec(n.wasteSets) };
  n = put(n, tp, ti, [...pile(n, tp, ti), ...cards]);
  return [finish(n, { pile: p, index: i }), true];
};
const auto = (s: R, p: PileKind, i: number): [CascadeState, boolean] => {
  const a = pile(s, p, i);
  if (
    (p !== "waste" && p !== "tableau") ||
    !a.length ||
    (p === "waste" && !s.wasteSets.length) ||
    !a.at(-1)!.faceUp
  )
    return [copy(s), false];
  for (let f = 0; f < 4; f++) {
    const q = move(s, p, i, a.length - 1, "foundation", f);
    if (q[1]) return q;
  }
  return [copy(s), false];
};
const deal = (s: R) => {
  let id = s.nextId;
  const d: CardState[] = [];
  for (const suit of K.SUITS)
    for (let rank = 1; rank <= 13; rank++)
      d.push({ id: id++, suit, rank, faceUp: false });
  for (let i = 51; i; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j]!, d[i]!];
  }
  let at = 0;
  const tableau: CardState[][] = [];
  for (let c = 0; c < 7; c++) {
    const p = [];
    for (let r = 0; r <= c; r++) p.push({ ...d[at++]!, faceUp: r === c });
    tableau.push(p);
  }
  trail = [];
  return {
    ...copy(s),
    stock: d.slice(at),
    waste: [],
    wasteSets: [],
    foundations: Array.from({ length: 4 }, () => []),
    tableau,
    drag: null,
    dropTarget: null,
    menuIndex: 0,
    autoFlip: true,
    winDetect: true,
    launching: true,
    trailPainting: true,
    launchClock: 0,
    launched: 0,
    flyers: [],
    cascadeDone: false,
    trailStamps: 0,
    nextId: id,
  };
};
const turn = (s: R) =>
  s.stock.length
    ? {
        ...copy(s),
        stock: s.stock.slice(0, -Math.min(3, s.stock.length)),
        waste: [
          ...s.waste,
          ...[...s.stock.slice(-Math.min(3, s.stock.length))]
            .reverse()
            .map((c) => ({ ...c, faceUp: true })),
        ],
        wasteSets: [...s.wasteSets, Math.min(3, s.stock.length)],
      }
    : s.waste.length
      ? {
          ...copy(s),
          stock: [...s.waste].reverse().map((c) => ({ ...c, faceUp: false })),
          waste: [],
          wasteSets: [],
        }
      : copy(s);
const ys = (a: readonly CardState[]) => {
  let fd = 0,
    ug = 0;
  for (let i = 0; i < a.length - 1; i++) {
    if (a[i]!.faceUp) ug++;
    else fd += K.FACE_DOWN_OFFSET;
  }
  let off = K.FACE_UP_OFFSET;
  if (K.TABLEAU_Y + fd + ug * off + K.CARD_H > K.COLUMN_BOTTOM_LIMIT && ug)
    off = Math.max(
      K.FACE_UP_OFFSET_MIN,
      (K.COLUMN_BOTTOM_LIMIT - K.TABLEAU_Y - K.CARD_H - fd) / ug,
    );
  const y = [K.TABLEAU_Y];
  for (let i = 1; i < a.length; i++)
    y.push(y[i - 1]! + (a[i - 1]!.faceUp ? off : K.FACE_DOWN_OFFSET));
  return y;
};
const rect = (s: R, p: PileKind, i: number): Rect =>
  p === "stock"
    ? { x: K.STOCK_X, y: K.TOP_ROW_Y, w: K.CARD_W, h: K.CARD_H }
    : p === "waste"
      ? { x: K.WASTE_X, y: K.TOP_ROW_Y, w: K.CARD_W, h: K.CARD_H }
      : p === "foundation"
        ? { x: K.FOUNDATION_X[i]!, y: K.TOP_ROW_Y, w: K.CARD_W, h: K.CARD_H }
        : {
            x: K.COLUMN_X[i]!,
            y: K.TABLEAU_Y,
            w: K.CARD_W,
            h:
              (ys(s.tableau[i]!).at(-1) ?? K.TABLEAU_Y) +
              K.CARD_H -
              K.TABLEAU_Y,
          };
const inside = (r: Rect, x: number, y: number) =>
  x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const menus = (s: Screen): Rect[] =>
  s === "title"
    ? [
        { x: 490, y: 390, w: 300, h: 58 },
        { x: 490, y: 462, w: 300, h: 58 },
      ]
    : s === "howto"
      ? [{ x: 490, y: 604, w: 300, h: 54 }]
      : s === "playing"
        ? [
            { x: 20, y: 684, w: 142, h: 28 },
            { x: 170, y: 684, w: 110, h: 28 },
            { x: 288, y: 684, w: 120, h: 28 },
          ]
        : [];
const target = (
  s: R,
  x: number,
  y: number,
  a: readonly CardState[],
): DropTargetState | null => {
  x += 50;
  y += 70;
  for (let i = 0; i < 4; i++)
    if (
      inside(rect(s, "foundation", i), x, y) &&
      accepts(s, "foundation", i, a)
    )
      return { pile: "foundation", index: i };
  for (let i = 0; i < 7; i++)
    if (inside(rect(s, "tableau", i), x, y) && accepts(s, "tableau", i, a))
      return { pile: "tableau", index: i };
  return null;
};
const hit = (
  s: R,
  x: number,
  y: number,
): {
  pile: "waste" | "foundation" | "tableau";
  index: number;
  row: number;
  px: number;
  py: number;
} | null => {
  for (let i = 6; i >= 0; i--) {
    const a = s.tableau[i]!,
      y0 = ys(a);
    for (let j = a.length - 1; j >= 0; j--)
      if (inside({ x: K.COLUMN_X[i]!, y: y0[j]!, w: 100, h: 140 }, x, y))
        return {
          pile: "tableau",
          index: i,
          row: j,
          px: K.COLUMN_X[i]!,
          py: y0[j]!,
        };
  }
  for (let i = 3; i >= 0; i--)
    if (s.foundations[i]!.length && inside(rect(s, "foundation", i), x, y))
      return {
        pile: "foundation",
        index: i,
        row: s.foundations[i]!.length - 1,
        px: K.FOUNDATION_X[i]!,
        py: K.TOP_ROW_Y,
      };
  if (s.waste.length && s.wasteSets.length) {
    const n = Math.min(s.wasteSets.at(-1)!, s.waste.length),
      st = s.waste.length - n;
    for (let j = s.waste.length - 1; j >= st; j--) {
      const px = K.WASTE_X + (j - st) * K.WASTE_FAN;
      if (inside({ x: px, y: K.TOP_ROW_Y, w: 100, h: 140 }, x, y))
        return { pile: "waste", index: 0, row: j, px, py: K.TOP_ROW_Y };
    }
  }
  return null;
};
const activate = (s: R, i: number): CascadeState =>
  s.screen === "title"
    ? i === 0
      ? { ...deal(s), screen: "playing", titleIndex: 0 }
      : { ...copy(s), screen: "howto", menuIndex: 0, titleIndex: 1 }
    : s.screen === "howto"
      ? { ...copy(s), screen: "title", menuIndex: s.titleIndex }
      : s.screen === "playing"
        ? i === 0
          ? { ...deal(s), screen: "playing" }
          : i === 1
            ? { ...copy(s), screen: "title", menuIndex: s.titleIndex }
            : copy(s)
        : copy(s);
const down = (s: R, x: number, y: number): CascadeState => {
  let n: CascadeState = {
    ...copy(s),
    pointer: { x, y, down: true },
    lastPress: { x, y, at: s.simTime },
  };
  if (s.screen === "won") return { ...deal(n), screen: "playing" };
  const mi = menus(s.screen).findIndex((q) => inside(q, x, y));
  if (mi >= 0) n = { ...n, menuIndex: mi };
  if (s.screen !== "playing") return n;
  const h = hit(s, x, y),
    old = s.lastPress;
  if (h) {
    const a = pile(s, h.pile, h.index),
      c = a[h.row]!;
    if (
      c.faceUp &&
      (h.pile === "waste" || h.pile === "tableau") &&
      old &&
      s.simTime - old.at <= K.DOUBLE_CLICK_WINDOW &&
      Math.hypot(x - old.x, y - old.y) <= K.DOUBLE_CLICK_SLOP
    ) {
      const q = auto(n, h.pile, h.index);
      return {
        ...q[0],
        lastPress: { x, y, at: s.simTime },
        pointer: { x, y, down: true },
      };
    }
    if (c.faceUp && (h.pile !== "waste" || h.row === a.length - 1)) {
      const cards = a.slice(h.row);
      if (h.pile === "tableau" || cards.length === 1) {
        n = put(n, h.pile, h.index, a.slice(0, h.row));
        return {
          ...n,
          drag: {
            cards,
            fromPile: h.pile,
            fromIndex: h.index,
            x: h.px,
            y: h.py,
          },
          pointer: { x, y, down: true },
        };
      }
    }
  }
  return n;
};
const restore = (s: R) =>
  s.drag
    ? {
        ...put(s, s.drag.fromPile, s.drag.fromIndex, [
          ...pile(s, s.drag.fromPile, s.drag.fromIndex),
          ...s.drag.cards,
        ]),
        drag: null,
        dropTarget: null,
      }
    : copy(s);
const movePointer = (s: R, x: number, y: number): CascadeState => {
  let n = { ...copy(s), pointer: { x, y, down: s.pointer.down } };
  const mi = menus(s.screen).findIndex((q) => inside(q, x, y));
  if (mi >= 0) n = { ...n, menuIndex: mi };
  if (s.drag) {
    const d = {
      ...s.drag,
      x: s.drag.x + x - s.pointer.x,
      y: s.drag.y + y - s.pointer.y,
    };
    n = { ...n, drag: d, dropTarget: target(n, d.x, d.y, d.cards) };
  }
  return n;
};
const up = (s: R, x: number, y: number): CascadeState => {
  let n = { ...movePointer(s, x, y), pointer: { x, y, down: false } };
  if (!s.lastPress) return n;
  const click =
    Math.hypot(x - s.lastPress.x, y - s.lastPress.y) <= K.DRAG_THRESHOLD;
  if (click) {
    n = restore(n);
    if (
      s.screen === "playing" &&
      inside(rect(s, "stock", 0), s.lastPress.x, s.lastPress.y)
    )
      n = turn(n);
  } else if (n.drag) {
    const d = n.drag;
    if (n.dropTarget) {
      let q = put(n, n.dropTarget.pile, n.dropTarget.index, [
        ...pile(n, n.dropTarget.pile, n.dropTarget.index),
        ...d.cards,
      ]);
      if (d.fromPile === "waste") q = { ...q, wasteSets: dec(q.wasteSets) };
      n = finish(
        { ...q, drag: null, dropTarget: null },
        { pile: d.fromPile, index: d.fromIndex },
      );
    } else n = restore(n);
  }
  const rs = menus(s.screen),
    a = rs.findIndex((q) => inside(q, s.lastPress!.x, s.lastPress!.y)),
    b = rs.findIndex((q) => inside(q, x, y));
  if (a >= 0 && a === b) n = activate(n, b);
  return n;
};
const vx = () => {
  const n =
    K.LAUNCH_VX_MIN + Math.random() * (K.LAUNCH_VX_MAX - K.LAUNCH_VX_MIN);
  return Math.random() < 0.5 ? -n : n;
};
const cascade = (s: R, dt: number): CascadeState => {
  if (s.screen !== "won") return copy(s);
  const f = s.flyers
    .map((q) => {
      let vy = q.vy + K.GRAVITY * dt,
        y = q.y + vy * dt;
      if (y >= K.FLOOR_Y && vy > 0) {
        y = K.FLOOR_Y;
        vy = -vy * K.BOUNCE_DAMP;
      }
      return { ...q, x: q.x + q.vx * dt, y, vy };
    })
    .filter((q) => !(q.x + 100 < 0 || q.x > K.STAGE_W));
  let stamps = s.trailStamps;
  if (s.trailPainting) {
    trail.push(
      ...f.map((q) => ({ suit: q.suit, rank: q.rank, x: q.x, y: q.y })),
    );
    stamps += f.length;
  }
  const foundations = s.foundations.map((q) => [...q]);
  let clock = s.launchClock,
    launched = s.launched;
  if (s.launching) {
    clock += dt;
    while (clock >= K.LAUNCH_INTERVAL && launched < 52) {
      let i = -1;
      for (let z = 0; z < 4; z++) {
        const j = (launched + z) % 4;
        if (foundations[j]!.length) {
          i = j;
          break;
        }
      }
      if (i < 0) break;
      clock -= K.LAUNCH_INTERVAL;
      const c = foundations[i]!.pop()!;
      f.push({
        id: c.id,
        suit: c.suit,
        rank: c.rank,
        x: K.FOUNDATION_X[i]!,
        y: K.TOP_ROW_Y,
        vx: vx(),
        vy: K.LAUNCH_VY,
      });
      launched++;
    }
  }
  return {
    ...copy(s),
    foundations,
    flyers: f,
    launchClock: clock,
    launched,
    trailStamps: stamps,
    cascadeDone: launched === 52 && !f.length,
  };
};
const locate = (s: R, id: number) => {
  for (const p of ["stock", "waste"] as const) {
    const row = pile(s, p, 0).findIndex((c) => c.id === id);
    if (row >= 0) return { pile: p as PileKind, index: 0, row };
  }
  for (const p of ["foundation", "tableau"] as const)
    for (let i = 0; i < (p === "foundation" ? 4 : 7); i++) {
      const row = pile(s, p, i).findIndex((c) => c.id === id);
      if (row >= 0) return { pile: p as PileKind, index: i, row };
    }
  return null;
};
const sc = (c: DeepReadonly<CardState>): SnapCard => ({
  id: c.id,
  suit: c.suit,
  rank: c.rank,
  color: red(c.suit) ? "red" : "black",
  faceUp: c.faceUp,
});
const snapshot = (s: R) => ({
  version: 1,
  screen: s.screen,
  menuIndex: s.menuIndex,
  titleIndex: s.titleIndex,
  dealMode: K.DEAL_MODE,
  turnCount: K.TURN_COUNT,
  dealModeLabel: K.DEAL_MODE_LABEL,
  muted: s.muted,
  autoFlip: s.autoFlip,
  winDetect: s.winDetect,
  launching: s.launching,
  trailPainting: s.trailPainting,
  stock: s.stock.map(sc),
  waste: s.waste.map(sc),
  wasteSets: [...s.wasteSets],
  wasteVisibleCount: s.wasteSets.at(-1) ?? 0,
  foundations: s.foundations.map((p) => p.map(sc)),
  tableau: s.tableau.map((p) => p.map(sc)),
  drag: s.drag ? { ...s.drag, cards: s.drag.cards.map(sc) } : null,
  dropTarget: s.drag ? target(s, s.drag.x, s.drag.y, s.drag.cards) : null,
  pointer: { ...s.pointer },
  lastPress: s.lastPress ? { ...s.lastPress } : null,
  launchClock: s.launchClock,
  launched: s.launched,
  flyers: s.flyers.map((f) => ({ ...f })),
  cascadeDone: s.cascadeDone,
  trailStamps: s.trailStamps,
  simTime: s.simTime,
});
const debug = (): CascadeDebugApi => ({
  version: K.CASCADE_DEBUG_VERSION,
  reset: (s) => {
    trail = [];
    return fresh(s.muted);
  },
  snapshot,
  reconcile: copy,
  menuItemRect: (s, i) => menus(s.screen)[i] ?? null,
  setScreen: (s, screen) => ({ ...copy(s), screen }),
  setMenuIndex: (s, menuIndex) => ({ ...copy(s), menuIndex }),
  setTitleIndex: (s, titleIndex) => ({ ...copy(s), titleIndex }),
  addCard: (s, p, i, suit, rank, faceUp) => {
    valid(p, i);
    if (
      !K.SUITS.includes(suit) ||
      !Number.isInteger(rank) ||
      rank < 1 ||
      rank > 13
    )
      throw new RangeError("Invalid card");
    return {
      ...put(s, p, i, [...pile(s, p, i), { id: s.nextId, suit, rank, faceUp }]),
      nextId: s.nextId + 1,
    };
  },
  removeCard: (s, id) => {
    const l = locate(s, id);
    if (!l) throw new Error(`Unknown card ${id}`);
    let n = put(
      s,
      l.pile,
      l.index,
      pile(s, l.pile, l.index).filter((c) => c.id !== id),
    );
    if (l.pile === "waste") n = { ...n, wasteSets: dec(n.wasteSets) };
    return n;
  },
  setCardFaceUp: (s, id, faceUp) => {
    const l = locate(s, id);
    if (!l) throw new Error(`Unknown card ${id}`);
    return put(
      s,
      l.pile,
      l.index,
      pile(s, l.pile, l.index).map((c) => (c.id === id ? { ...c, faceUp } : c)),
    );
  },
  clearPile: (s, p, i) => {
    const n = put(s, p, i, []);
    return p === "waste" ? { ...n, wasteSets: [] } : n;
  },
  clearTable: (s) => ({
    ...copy(s),
    stock: [],
    waste: [],
    wasteSets: [],
    foundations: Array.from({ length: 4 }, () => []),
    tableau: Array.from({ length: 7 }, () => []),
    drag: null,
    dropTarget: null,
  }),
  addWasteSet: (s, n) => {
    if (!Number.isInteger(n) || n < 0) throw new RangeError("Invalid count");
    return { ...copy(s), wasteSets: [...s.wasteSets, n] };
  },
  clearWasteSets: (s) => ({ ...copy(s), wasteSets: [] }),
  deal,
  turnStock: turn,
  move,
  autoMove: auto,
  pointerDown: down,
  pointerMove: movePointer,
  pointerUp: up,
  setAutoFlip: (s, autoFlip) => ({ ...copy(s), autoFlip }),
  setWinDetect: (s, winDetect) => ({ ...copy(s), winDetect }),
  setLaunching: (s, launching) => ({ ...copy(s), launching }),
  setTrailPainting: (s, trailPainting) => ({ ...copy(s), trailPainting }),
  addFlyer: (s, suit, rank, x, y, vx0, vy) => ({
    ...copy(s),
    flyers: [...s.flyers, { id: s.nextId, suit, rank, x, y, vx: vx0, vy }],
    nextId: s.nextId + 1,
  }),
  setFlyerPosition: (s, id, x, y) => {
    if (!s.flyers.some((f) => f.id === id))
      throw new Error(`Unknown flyer ${id}`);
    return {
      ...copy(s),
      flyers: s.flyers.map((f) => (f.id === id ? { ...f, x, y } : { ...f })),
    };
  },
  setFlyerVelocity: (s, id, vx0, vy) => {
    if (!s.flyers.some((f) => f.id === id))
      throw new Error(`Unknown flyer ${id}`);
    return {
      ...copy(s),
      flyers: s.flyers.map((f) =>
        f.id === id ? { ...f, vx: vx0, vy } : { ...f },
      ),
    };
  },
  removeFlyer: (s, id) => {
    if (!s.flyers.some((f) => f.id === id))
      throw new Error(`Unknown flyer ${id}`);
    return {
      ...copy(s),
      flyers: s.flyers.filter((f) => f.id !== id).map((f) => ({ ...f })),
    };
  },
  clearFlyers: (s) => ({ ...copy(s), flyers: [] }),
  setLaunchClock: (s, launchClock) => ({ ...copy(s), launchClock }),
  clearTrail: (s) => {
    trail = [];
    return { ...copy(s), trailStamps: 0 };
  },
  drawLaunchVx: vx,
});
const glyph: Record<Suit, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};
const rank = (r: number) =>
  r === 1 ? "A" : r === 11 ? "J" : r === 12 ? "Q" : r === 13 ? "K" : String(r);
const path = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  c.beginPath();
  c.roundRect(x, y, w, h, 8);
};
const card = (
  c: CanvasRenderingContext2D,
  a: { suit: Suit; rank: number; faceUp?: boolean },
  x: number,
  y: number,
  lift = false,
) => {
  c.save();
  if (lift) {
    c.shadowColor = "#000b";
    c.shadowBlur = 15;
    c.shadowOffsetY = 7;
  }
  path(c, x, y, 100, 140);
  c.fillStyle = a.faceUp === false ? "#193e68" : "#faf7ed";
  c.fill();
  c.lineWidth = 2;
  c.strokeStyle = a.faceUp === false ? "#efc96e" : "#d5cbb6";
  c.stroke();
  if (a.faceUp === false) {
    c.strokeStyle = "#83b5c4";
    for (let n = 15; n < 125; n += 15) {
      c.beginPath();
      c.moveTo(x + 8, y + n);
      c.lineTo(x + 92, y + n + 35);
      c.stroke();
    }
  } else {
    c.fillStyle = red(a.suit) ? "#c83249" : "#17272c";
    c.font = "700 23px Georgia";
    c.textAlign = "left";
    c.textBaseline = "top";
    c.fillText(rank(a.rank), x + 9, y + 8);
    c.fillText(glyph[a.suit], x + 9, y + 35);
    c.font = "48px Georgia";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(glyph[a.suit], x + 50, y + 83);
  }
  c.restore();
};
const slot = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  on = false,
) => {
  path(c, x, y, 100, 140);
  c.fillStyle = on ? "#8ef0b633" : "#fff1";
  c.fill();
  c.strokeStyle = on ? "#9cf5bd" : "#cfe5d35a";
  c.lineWidth = on ? 4 : 2;
  c.setLineDash([8, 7]);
  c.stroke();
  c.setLineDash([]);
};
const table = (s: R, c: CanvasRenderingContext2D) => {
  for (const q of trail) card(c, { ...q, faceUp: true }, q.x, q.y);
  slot(c, K.STOCK_X, K.TOP_ROW_Y);
  if (s.stock.length) card(c, s.stock.at(-1)!, K.STOCK_X, K.TOP_ROW_Y);
  slot(c, K.WASTE_X, K.TOP_ROW_Y);
  if (s.wasteSets.length) {
    const n = Math.min(s.wasteSets.at(-1)!, s.waste.length),
      st = s.waste.length - n;
    for (let i = st; i < s.waste.length; i++)
      card(c, s.waste[i]!, K.WASTE_X + (i - st) * K.WASTE_FAN, K.TOP_ROW_Y);
  }
  for (let i = 0; i < 4; i++) {
    slot(
      c,
      K.FOUNDATION_X[i]!,
      K.TOP_ROW_Y,
      s.dropTarget?.pile === "foundation" && s.dropTarget.index === i,
    );
    if (s.foundations[i]!.length)
      card(c, s.foundations[i]!.at(-1)!, K.FOUNDATION_X[i]!, K.TOP_ROW_Y);
  }
  for (let i = 0; i < 7; i++) {
    slot(
      c,
      K.COLUMN_X[i]!,
      K.TABLEAU_Y,
      s.dropTarget?.pile === "tableau" && s.dropTarget.index === i,
    );
    const y = ys(s.tableau[i]!);
    s.tableau[i]!.forEach((q, j) => card(c, q, K.COLUMN_X[i]!, y[j]!));
  }
  if (s.drag) {
    let y = s.drag.y;
    for (const q of s.drag.cards) {
      card(c, q, s.drag.x, y, true);
      y += 34;
    }
  }
  for (const q of s.flyers) card(c, { ...q, faceUp: true }, q.x, q.y);
};
const button = (
  c: CanvasRenderingContext2D,
  r: Rect,
  t: string,
  on: boolean,
) => {
  path(c, r.x, r.y, r.w, r.h);
  c.fillStyle = on ? "#e0b35b" : "#123f3a";
  c.fill();
  c.strokeStyle = "#b9d3c8";
  c.stroke();
  c.fillStyle = on ? "#17312d" : "#eef5ef";
  c.font = "700 16px system-ui";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(t, r.x + r.w / 2, r.y + r.h / 2);
};
const render = (s: R, c: CanvasRenderingContext2D) => {
  c.fillStyle = BACKGROUND;
  c.fillRect(0, 0, K.STAGE_W, K.STAGE_H);
  if (s.screen === "playing" || s.screen === "won") table(s, c);
  if (s.screen === "title") {
    const g = c.createRadialGradient(640, 260, 20, 640, 320, 610);
    g.addColorStop(0, "#17685c");
    g.addColorStop(1, BACKGROUND);
    c.fillStyle = g;
    c.fillRect(0, 0, 1280, 720);
    c.fillStyle = "#f2d18a";
    c.font = "800 94px Georgia";
    c.textAlign = "center";
    c.fillText(K.TITLE_TEXT, 640, 235);
    c.fillStyle = "#afd4c8";
    c.font = "600 22px system-ui";
    c.fillText(K.TAGLINE_TEXT, 640, 280);
    c.font = "600 16px system-ui";
    c.fillText(K.DEAL_MODE_LABEL, 640, 326);
  }
  if (s.screen === "howto") {
    c.fillStyle = "#0c3b36";
    c.fillRect(0, 0, 1280, 720);
    c.fillStyle = "#f2d18a";
    c.textAlign = "center";
    c.font = "700 48px Georgia";
    c.fillText("HOW TO PLAY", 640, 90);
    c.fillStyle = "#e9f0e9";
    c.font = "22px system-ui";
    [
      "Build every foundation from ACE to KING.",
      "Build columns downward in alternating colors.",
      "Only a KING can fill an empty column.",
      "Tap the STOCK to deal three; it recycles when empty.",
      "Drag a card or run to move it.",
      "DOUBLE-CLICK an exposed card to send it home.",
    ].forEach((x, i) => c.fillText(x, 640, 180 + i * 54));
  }
  const labels =
    s.screen === "title"
      ? [...K.TITLE_ITEMS]
      : s.screen === "howto"
        ? [K.HOWTO_BACK_LABEL]
        : s.screen === "playing"
          ? [...K.HUD_ITEMS]
          : [];
  if (s.screen === "playing") {
    c.fillStyle = "#061f1d";
    c.fillRect(0, K.HUD_Y, 1280, K.HUD_H);
  }
  menus(s.screen).forEach((r, i) =>
    button(
      c,
      r,
      labels[i]! +
        (s.screen === "playing" && i === 2 ? (s.muted ? " OFF" : " ON") : ""),
      s.menuIndex === i,
    ),
  );
  if (s.screen === "playing") {
    c.fillStyle = "#afd4c8";
    c.font = "600 14px system-ui";
    c.textAlign = "right";
    c.textBaseline = "middle";
    c.fillText(K.DEAL_MODE_LABEL, 1255, 698);
  }
  if (s.screen === "won" && s.cascadeDone) {
    c.fillStyle = "#082e2bdc";
    c.fillRect(390, 280, 500, 150);
    c.fillStyle = "#f2d18a";
    c.font = "800 66px Georgia";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(K.WIN_TEXT, 640, 345);
    c.fillStyle = "#fff";
    c.font = "18px system-ui";
    c.fillText("PRESS ANYWHERE TO DEAL AGAIN", 640, 400);
  }
};
export const game: Game<CascadeState, CascadeDebugApi> = {
  initialize(api: InitApi<CascadeState>) {
    for (const [n, keys] of Object.entries(K.MENU_BINDINGS))
      api.input.register(n, { keys: [...keys] });
    Object.values(K.CUES).forEach((q, i) =>
      api.audio.define(q, {
        wave: i % 2 ? "sine" : "triangle",
        freq: 180 + i * 85,
        freqTo: 120 + i * 62,
        gain: 0.12,
        durationMs: 65 + i * 7,
      }),
    );
    api.diagnostics.register("screen", (s) => `${s.screen} · ${K.DEAL_MODE}`);
    api.diagnostics.register(
      "draw",
      (s) => `stock ${s.stock.length} · waste ${s.waste.length}`,
    );
    api.diagnostics.register("foundations", (s) =>
      s.foundations.map((p) => p.length).join(" / "),
    );
    api.diagnostics.register("tableau", (s) =>
      s.tableau.map((p) => p.length).join(" / "),
    );
    api.diagnostics.register("hand", (s) =>
      s.drag ? `${s.drag.cards.length} cards` : "empty",
    );
    api.diagnostics.register(
      "cascade",
      (s) => `${s.launched} launched · ${s.flyers.length} flying`,
    );
    return [fresh(false), debug()];
  },
  update(s, api: UpdateApi, dt) {
    let n = { ...copy(s), simTime: s.simTime + dt, muted: api.audio.muted() };
    const u = api.input.pressed(K.MENU_UP),
      d = api.input.pressed(K.MENU_DOWN),
      ok = api.input.pressed(K.MENU_CONFIRM),
      back = api.input.pressed(K.MENU_BACK),
      count = menus(n.screen).length;
    if (n.screen !== "won") {
      if (u && count)
        n = { ...n, menuIndex: (n.menuIndex + count - 1) % count };
      else if (d && count) n = { ...n, menuIndex: (n.menuIndex + 1) % count };
      else if (ok) {
        if (n.screen === "playing" && n.menuIndex === 2) {
          api.audio.setMuted(!api.audio.muted());
          n = { ...n, muted: api.audio.muted() };
        } else n = activate(n, n.menuIndex);
      } else if (back && n.screen === "howto") n = activate(n, 0);
    }
    for (const p of api.input.pointerSamples()) {
      if (!p.primary) continue;
      const soundClick =
        p.type === "up" &&
        n.screen === "playing" &&
        n.lastPress !== null &&
        inside(menus("playing")[2]!, n.lastPress.x, n.lastPress.y) &&
        inside(menus("playing")[2]!, p.x, p.y);
      n =
        p.type === "down"
          ? down(n, p.x, p.y)
          : p.type === "move"
            ? movePointer(n, p.x, p.y)
            : up(n, p.x, p.y);
      if (soundClick) api.audio.setMuted(!api.audio.muted());
    }
    if (n.screen === "won") n = cascade(n, dt);
    return { ...n, muted: api.audio.muted() };
  },
  render(s, api: RenderApi) {
    render(s, api.ctx);
  },
};
