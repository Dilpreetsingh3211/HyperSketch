import { mycanvas,shapes } from "./state";
import { redrawCanvas } from "./draw";

const fillColorInput = document.getElementById("fillColor");
const fillCheckbox = document.getElementById("fill");
const strokeColorInput = document.getElementById("strokeColor");
const strokeCheckbox = document.getElementById("stroke");
const strokeWidthInput = document.getElementById("strokeWidth");


fillColorInput.addEventListener("input", (e) =>
  changeFillColor(e.target.value)
);
fillCheckbox.addEventListener("change", (e) => changeFill(e.target.checked));

strokeColorInput.addEventListener("input", (e) =>
  changeStrokeColor(e.target.value)
);
strokeCheckbox.addEventListener("change", (e) =>
  changeStroke(e.target.checked)
);

strokeWidthInput.addEventListener("input", (e) =>
  changeStrokeWidth(e.target.value)
);


function changeFillColor(value) {
  shapes
    .filter((s) => s.selected)
    .forEach((s) => (s.options.fillColor = value));
  redrawCanvas();
}

function changeFill(value) {
  shapes.filter((s) => s.selected).forEach((s) => (s.options.fill = value));
  redrawCanvas();
}

function changeStrokeColor(value) {
  shapes
    .filter((s) => s.selected)
    .forEach((s) => (s.options.strokeColor = value));
  redrawCanvas();
}

function changeStroke(value) {
  shapes.filter((s) => s.selected).forEach((s) => (s.options.stroke = value));
  redrawCanvas();
}

function changeStrokeWidth(value) {
  shapes
    .filter((s) => s.selected)
    .forEach((s) => (s.options.strokeWidth = Number(value)));
  redrawCanvas();
}

export function getOptions() {
    return {
      fillColor: fillColorInput.value,
      strokeColor: strokeColorInput.value,
      fill: fillCheckbox.checked,
      stroke: strokeCheckbox.checked,
      strokeWidth: strokeWidthInput.value,
      lineCap: "round",
      lineJoin: "round",
    };
  }
