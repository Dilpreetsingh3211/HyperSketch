import { state } from "./state";
import { mycanvas } from "./state";
export function averagePoints(points) {
  const sum = points.reduce((acc, p) => addPoints(acc, p), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}
export function getMidPoint(points) {
  const minX = Math.min(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxX = Math.max(...points.map((p) => p.x));
  const maxY = Math.max(...points.map((p) => p.y));
  return { x: minX + (maxX - minX) / 2, y: minY + (maxY - minY) / 2 };
}
export function addPoints(p1, p2) {
  return { x: p1.x + p2.x, y: p1.y + p2.y };
}
export function subtractPoints(p1, p2) {
  return { x: p1.x - p2.x, y: p1.y - p2.y };
}
export function equalPoints(p1, p2) {
  return p1.x === p2.x && p1.y === p2.y;
}

export function toScreenX(xTrue) {
  return (xTrue + state.offsetX) * state.scale;
}
export function toScreenY(yTrue) {
  return (yTrue + state.offsetY) * state.scale;
}
export function toTrueX(screenX) {
  return (screenX - state.offsetX) / state.scale;
}

export function toTrueY(screenY) {
  return (screenY - state.offsetY) / state.scale;
}
export function trueHeight() {
  return mycanvas.clientHeight / state.scale;
}
export function trueWidth() {
  return mycanvas.clientWidth / state.scale;
}