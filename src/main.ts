let mouseX: number = window.innerWidth / 2;
let mouseY: number = window.innerHeight / 2;

let lastMouseX: number = undefined!;
let lastMouseY: number = undefined!;

let ctx: CanvasRenderingContext2D | null = null;
let debug: HTMLParagraphElement | null = null;

const width = window.innerWidth;
const height = window.innerHeight;

// The big buffer is 2x the canvas in each dimension
// so the mouse can roam the full canvas and the view never runs out of data
const bigWidth = width * 2;
const bigHeight = height * 2;

// Precomputed RGBA big buffer
const bigData = new Uint8ClampedArray(bigWidth * bigHeight * 4);

// Canvas-sized ImageData we copy into each frame
let imageData: ImageData;

// Lookup tables — only 360 possible hues
const HUE_R = new Uint8Array(360);
const HUE_G = new Uint8Array(360);
const HUE_B = new Uint8Array(360);


///////////////////////////////////////////////////////////////////////////////////////////////////


(function mouse(): void {
  window.addEventListener('mousemove', (ev: MouseEvent) => {
    mouseX = ev.clientX;
    mouseY = ev.clientY;
  });
})();


///////////////////////////////////////////////////////////////////////////////////////////////////


(function (): void {
  const body = document.querySelector('body')!;
  body.style.margin = '0px';
  body.style.overflow = 'hidden';
  const root = document.querySelector<HTMLDivElement>('#root')!;
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  root.appendChild(canvas);
  canvas.setAttribute('id', 'canvas');
  canvas.width = width;
  canvas.height = height;

  ctx = canvas.getContext('2d')!;
  imageData = ctx.createImageData(width, height);

  debug = document.createElement('p');
  debug.style.position = 'fixed';
  debug.style.top = '10px';
  debug.style.left = '10px';
  debug.style.color = 'white';
  debug.style.fontFamily = 'monospace';
  debug.style.pointerEvents = 'none';
  document.body.appendChild(debug);

  // Build hue lookup table
  for (let h = 0; h < 360; h++) {
    const [r, g, b] = hslToRgb(h, 80, 50);
    HUE_R[h] = r;
    HUE_G[h] = g;
    HUE_B[h] = b;
  }

  // Precompute the big buffer once
  precompute();

  // Start render loop
  requestAnimationFrame(loop);
})()


function precompute(): void {
  // The point in big-buffer space that corresponds to "mouse at screen center"
  // is the center of the big buffer itself.
  const originX = bigWidth / 2;
  const originY = bigHeight / 2;

  const longest = Math.sqrt(bigWidth * bigWidth + bigHeight * bigHeight) / 2;

  for (let y = 0; y < bigHeight; y++) {
    for (let x = 0; x < bigWidth; x++) {
      const dx = x - originX;
      const dy = y - originY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const hue = Math.round((dist / longest) * 360) % 360;
      const i = (y * bigWidth + x) * 4;
      bigData[i]     = HUE_R[hue];
      bigData[i + 1] = HUE_G[hue];
      bigData[i + 2] = HUE_B[hue];
      bigData[i + 3] = 255;
    }
  }
}


function loop(): void {
  if (mouseX !== lastMouseX || mouseY !== lastMouseY) {
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    render();
  }
  requestAnimationFrame(loop);
}


// Each frame: figure out which rectangle of the big buffer to show,
// then copy it into the canvas ImageData and flush.
function render(): void {
  if (ctx === null) { return; }
  const start = performance.now();

  // When mouse is at screen center we look at the center of the big buffer.
  // Moving mouse right means the gradient origin should move right too,
  // so we subtract the mouse delta to shift the viewport in the opposite direction.
  const offsetX = Math.round(bigWidth / 2 - width / 2 - (mouseX - width / 2));
  const offsetY = Math.round(bigHeight / 2 - height / 2 - (mouseY - height / 2));

  // Clamp so we never read outside the big buffer
  const clampedOffsetX = Math.max(0, Math.min(offsetX, bigWidth - width));
  const clampedOffsetY = Math.max(0, Math.min(offsetY, bigHeight - height));

  const dest = imageData.data;

  for (let row = 0; row < height; row++) {
    const srcRow = clampedOffsetY + row;
    const srcBase = (srcRow * bigWidth + clampedOffsetX) * 4;
    const destBase = row * width * 4;
    const rowBytes = width * 4;
    dest.set(bigData.subarray(srcBase, srcBase + rowBytes), destBase);
  }

  ctx.putImageData(imageData, 0, 0);

  if (debug) {
    debug.innerText = `${(performance.now() - start).toFixed(2)}ms`;
  }
}


///////////////////////////////////////////////////////////////////////////////////////////////////


function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}