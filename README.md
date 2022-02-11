# Grab N' Pinch

A libarary supporting panning and zooming for both desktop and mobile devices.

## Example

https://olimot.github.io/grab-n-pinch/example

## Usage

```js
const gnp = new GrabNPinchManager({
  translate: { x: 0, y: 0 },
  scale: window.innerWidth / root.clientWidth,
  minScale: Math.min(0.5, window.innerWidth / root.clientWidth, window.innerHeight / root.clientHeight),
});

document.body.addEventListener('wheel', gnp.updateScaleInertia);
document.body.addEventListener('pointerdown', gnp.addPointer);
document.body.addEventListener('pointermove', gnp.updatePointer);
document.body.addEventListener('pointerleave', gnp.removePointer);
document.body.addEventListener('pointerup', gnp.removePointer);

let elapsed = 0;
(function raf() {
  requestAnimationFrame((time) => {
    const delta = time - elapsed;
    elapsed = time;
    gnp.run(delta);
    root.style.transformOrigin = '0 0';
    root.style.transform = `matrix(${gnp.scale}, 0, 0, ${gnp.scale}, ${gnp.translate.x},${gnp.translate.y})`;
    raf();
  });
})();
```
