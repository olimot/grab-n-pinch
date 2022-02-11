export interface Vec2 {
  x: number;
  y: number;
}

export interface ClientSize {
  clientWidth: number;
  clientHeight: number;
}

export const Vec2 = {
  add: (p0: Vec2, p1: Vec2) => ({ x: p0.x + p1.x, y: p0.y + p1.y }),
  subt: (p0: Vec2, p1: Vec2) => ({ x: p0.x - p1.x, y: p0.y - p1.y }),
  neg: (p: Vec2) => ({ x: -p.x, y: -p.y }),
  mult: (p: Vec2, scala: number) => ({ x: p.x * scala, y: p.y * scala }),
  hypot: (p: Vec2) => (p.x ** 2 + p.y ** 2) ** 0.5,
  eq: (p0: Vec2 | null | undefined | 0 | false | '', p1: Vec2 | null | undefined | 0 | false | '') => {
    if (p0 === p1) return true;
    if (!p0 || !p1) return false;
    return p0.x === p1.x && p0.y === p1.y;
  },
  from: <T extends Vec2>({ x, y }: T): Vec2 => ({ x, y }),
  fromSize: <T extends { width: number; height: number }>(source: T): Vec2 => ({ x: source.width, y: source.height }),
  assignSize: <T extends { width: number; height: number }>(target: T, size: Vec2): T =>
    Object.assign(target, { width: size.x, height: size.y }),
  fromClientSize: <T extends ClientSize>(source: T): Vec2 => ({ x: source.clientWidth, y: source.clientHeight }),
  proceed: (object: Vec2, p1: Vec2) => {
    const p0 = Vec2.from(object);
    return (progress: number) =>
      Vec2.assign(object, {
        x: p0.x * (1 - progress) + p1.x * progress,
        y: p0.y * (1 - progress) + p1.y * progress,
      });
  },
  d: (p0: Vec2, p1: Vec2) => Vec2.hypot(Vec2.subt(p1, p0)),
  assign: <T extends Vec2>(o: T, p: Vec2 | number) => {
    o.x = typeof p === 'number' ? p : p.x;
    o.y = typeof p === 'number' ? p : p.y;
    return o;
  },
  origin: { x: 0, y: 0 } as const,
  map: <T>(p: Vec2, mapfn: (v: number) => T) => ({ x: mapfn(p.x), y: mapfn(p.y) }),
  in: (p0: Vec2, p: Vec2, p1: Vec2) => p.x >= p0.x && p.x < p1.x && p.y >= p0.y && p.y < p1.y,
  map2d: <T, U>(values: T[][], mapfn: (v: T, p: Vec2) => U) =>
    values.map((xs, x) => xs.map((v, y) => mapfn(v, { x, y }))),
  fill2d: <T, U>(values: T[][], value: U) => values.map((xs) => xs.map(() => value)),
  get2d: <T>(values: T[][], p: Vec2) => values[p.x][p.y],
  set2d: <T>(values: T[][], p: Vec2, value: T) => {
    values[p.x][p.y] = value;
  },
  in2d: <T>(values: T[][], p: Vec2) =>
    p.x >= 0 && p.x < values.length && p.y >= 0 && p.y < values[values.length - 1].length,
  from2dSize: <T>(values: T[][]) => ({ x: values.length, y: values[0].length }),
};
