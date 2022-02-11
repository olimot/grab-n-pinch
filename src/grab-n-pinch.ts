import { Vec2 } from './Vec2';

interface InitialPointer extends Vec2 {
  timeStamp: number;
}

interface Pointer extends InitialPointer {
  pointerId: number;
  initial: InitialPointer;
}

export function mapEventToPointer(event: PointerEvent): Pointer {
  if (!(event instanceof PointerEvent)) throw new Error('Cannot handle event which is not pointer event');
  const initial: InitialPointer = { x: event.x, y: event.y, timeStamp: event.timeStamp };
  return { ...initial, pointerId: event.pointerId, initial };
}

export function updatePointerByEvent(pointer: Pointer, event: PointerEvent) {
  return Object.assign(pointer, { x: event.x, y: event.y, timeStamp: event.timeStamp });
}

export class GrabNPinchManager {
  translate = { x: 0, y: 0 };

  scale = 1;

  pointers: Pointer[] = [];

  maybeClick = false;

  clicked = null;

  pointingContext: {
    point0: Vec2;
    translate0: Vec2;
    scale0: number;
    pinch0: number;
    vRefPointer: Pointer;
    velocity: Vec2;
  } | null = null;

  minScale = 0;

  maxScale = +Infinity;

  constructor({
    translate,
    scale,
    minScale,
    maxScale,
  }: { translate?: Vec2; scale?: number; minScale?: number; maxScale?: number } = {}) {
    if (scale) this.scale = scale;
    if (translate) this.translate = translate;
    if (minScale) this.minScale = minScale;
    if (maxScale) this.maxScale = maxScale;
  }

  viewportPoint = (drawingPoint: Vec2) => Vec2.mult(drawingPoint, this.scale);

  drawingPoint = (viewportPoint: Vec2) =>
    Vec2.map(Vec2.mult(Vec2.subt(viewportPoint, this.translate), 1 / this.scale), Math.floor);

  addPointer = (event: PointerEvent) => {
    const pointer = mapEventToPointer(event);
    this.pointers.push(pointer);
    if (this.pointers.length === 0 || this.pointers.length > 2) return;
    this.pointingContext = {
      point0: Vec2.from(pointer),
      translate0: Vec2.from(this.translate),
      scale0: this.scale,
      pinch0: this.pointers.length === 2 ? Vec2.d(this.pointers[0], this.pointers[1]) : 0,
      vRefPointer: { ...pointer },
      velocity: { x: 0, y: 0 },
    };
    this.inertia = null;
    this.maybeClick = true;
  };

  updatePointer = (event: PointerEvent) => {
    let pointer: Pointer | undefined;
    for (let i = 0; i < this.pointers.length; i += 1) {
      if (this.pointers[i].pointerId !== event.pointerId) continue;
      pointer = Object.assign(this.pointers[i], { x: event.x, y: event.y, timeStamp: event.timeStamp });
      break;
    }

    if (!pointer || !this.pointingContext || this.pointers.length === 0 || this.pointers.length > 2) return;

    if (this.pointers.length === 2) {
      event.preventDefault();
      this.maybeClick = false;
      const { point0, translate0, scale0, pinch0 } = this.pointingContext;
      const pinch = Vec2.d(this.pointers[0], this.pointers[1]);
      this.scale = Math.min(Math.max(this.minScale, scale0 * (pinch / pinch0)), this.maxScale);
      this.translate = Vec2.add(point0, Vec2.mult(Vec2.subt(translate0, point0), pinch / pinch0));
      this.pointingContext.velocity = { x: 0, y: 0 };
    } else {
      const { vRefPointer } = this.pointingContext;
      const dt = pointer.timeStamp - vRefPointer.timeStamp;
      if (dt > 16.6667) {
        event.preventDefault();
        this.maybeClick = false;
        this.pointingContext.velocity = Vec2.mult(Vec2.subt(pointer, vRefPointer), 1 / dt);
        this.pointingContext.vRefPointer = { ...pointer };
      }
      Vec2.assign(this.translate, Vec2.add(this.pointingContext.translate0, Vec2.subt(pointer, pointer.initial)));
    }
  };

  inertia: { v0: Vec2; vqty: number; p: number } | null = null;

  removePointer = (event: PointerEvent) => {
    let removed = null;
    for (let i = 0; i < this.pointers.length; i += 1) {
      if (this.pointers[i].pointerId !== event.pointerId) continue;
      [removed] = this.pointers.splice(i, 1);
      break;
    }

    if (this.pointers.length === 2) {
      event.preventDefault();
      this.maybeClick = false;
      this.pointingContext = {
        point0: this.pointers[1],
        translate0: Vec2.from(this.translate),
        scale0: this.scale,
        pinch0: Vec2.d(this.pointers[0], this.pointers[1]),
        vRefPointer: { ...this.pointers[1] },
        velocity: { x: 0, y: 0 },
      };
    } else if (this.pointers.length === 1) {
      event.preventDefault();
      this.maybeClick = false;
      this.pointers[0] = {
        ...this.pointers[0],
        timeStamp: event.timeStamp,
        initial: { ...Vec2.from(this.pointers[0]), timeStamp: event.timeStamp },
      };
      this.pointingContext = {
        point0: Vec2.from(this.pointers[0]),
        translate0: Vec2.from(this.translate),
        scale0: this.scale,
        pinch0: 0,
        vRefPointer: { ...this.pointers[0] },
        velocity: { x: 0, y: 0 },
      };
    } else if (this.pointingContext) {
      if (!this.maybeClick && removed) {
        event.preventDefault();
        const { vRefPointer } = this.pointingContext;
        const dt = event.timeStamp - vRefPointer.timeStamp;
        if (dt > 16.6667) this.pointingContext.velocity = Vec2.mult(Vec2.subt(event, vRefPointer), 1 / dt);
        const vqty = this.pointingContext ? Vec2.hypot(this.pointingContext.velocity) : null;
        this.inertia =
          vqty !== null && vqty >= 0.5 ? { p: 0, v0: this.pointingContext.velocity, vqty } : null;
      }

      if (this.maybeClick) this.pointingContext = null;
      else this.clicked = null;
    }
  };

  scaleInertia: { v: number; point0: Vec2; translate0: Vec2; scale0: number } | null = null;

  updateScaleInertia = (event: WheelEvent) => {
    if (this.pointingContext) Vec2.assign(this.pointingContext.point0, event);
    if (!this.scaleInertia)
      this.scaleInertia = { v: 0, point0: Vec2.from(event), translate0: Vec2.from(this.translate), scale0: this.scale };
    if (this.inertia) this.inertia = null;
    this.scaleInertia.v -= Math.sign(event.deltaY) * 0.5;
  };

  run = (elapsedMS: number) => {
    if (this.inertia && this.inertia.p < 1) {
      const velocity = Vec2.mult(this.inertia.v0, 1 - this.inertia.p);
      Vec2.assign(this.translate, Vec2.add(this.translate, Vec2.mult(velocity, elapsedMS)));
      this.inertia.p += elapsedMS / (this.inertia.vqty * 512);

      if (this.inertia.p >= 1) this.inertia = null;
    }

    if (this.scaleInertia?.v) {
      const { point0, translate0, scale0 } = this.scaleInertia;
      const scale = this.scale * (1 + this.scaleInertia.v * (elapsedMS / 128));
      this.scale = Math.min(Math.max(this.minScale, scale), this.maxScale);
      this.translate = Vec2.add(point0, Vec2.mult(Vec2.subt(translate0, point0), this.scale / scale0));
      if (this.pointingContext)
        Object.assign(this.pointingContext, { translate0: Vec2.from(this.translate), scale0: this.scale });
      const computedScaleVelocity = this.scaleInertia.v - Math.sign(this.scaleInertia.v) * (elapsedMS / 128);
      this.scaleInertia.v = Math.max(-4, Math.min(computedScaleVelocity, 4));
      if (Math.abs(this.scaleInertia.v) < 0.1) this.scaleInertia = null;
    }
  };
}
