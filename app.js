/** @typedef {import('pear-interface')} */ /* global Pear */
import { Rect } from "./shapes/rect";
import { Path } from "./shapes/path";
import { Circle } from "./shapes/Circle";
import {
  averagePoints,
  getMidPoint,
  addPoints,
  subtractPoints,
  equalPoints,
} from "./util";
import Hyperswarm from "hyperswarm";
import crypto from "hypercore-crypto";
import b4a from "b4a";
const { teardown, updates } = Pear;

const mycanvas = document.getElementById("myCanvas");
const helperCanvas = document.getElementById("helperCanvas");

const SHOW_HELPER_REGIONS = true;
if (!SHOW_HELPER_REGIONS) {
  helperCanvas.style.display = "none";
}

let shapes = [];
let currentShape;
let conns = [];
let myName;

const canvasProperties = {
  width: SHOW_HELPER_REGIONS ? window.innerWidth / 2 : window.innerWidth,
  height: window.innerHeight / 2,
  center: {
    x: SHOW_HELPER_REGIONS ? window.innerWidth / 4 : window.innerWidth,
    y: window.innerHeight / 2,
  },
};

console.log(canvasProperties.width, canvasProperties.height);
mycanvas.width = canvasProperties.width;
mycanvas.height = canvasProperties.height;
helperCanvas.width = canvasProperties.width;
helperCanvas.height = canvasProperties.height;

const ctx = mycanvas.getContext("2d");
const helperCtx = helperCanvas.getContext("2d");

clearCanvas();

const swarm = new Hyperswarm();
teardown(() => swarm.destroy());
updates(() => Pear.reload());

function createShapeFromData(data) {
  if (!data || !data.type) return null;
  switch (data.type) {
    case "Path":
      return Path.fromJSON(data);
    case "Rect":
      return Rect.fromJSON(data);
    case "circle":
      return Circle.fromJSON(data);
    default:
      return null;
  }
}

function updateShape(index, newShape, type) {
  if (!shapes[index]) return;

  if (type === "move-shape") {
    shapes[index].selected = newShape.selected;
    shapes[index].center = newShape.center;
  } else {
    shapes[index] = newShape;
  }
}

function redrawCanvas() {
  clearCanvas();
  drawShapes(shapes);
}

swarm.on("connection", (peer) => {
  console.log(peer);
  myName = b4a.toString(peer.remotePublicKey, "hex");
  conns.push(peer);
  peer.write(JSON.stringify({ type: "init", data: shapes }));

  peer.on("data", (message) => {
    const parsed = JSON.parse(message);
    console.log(parsed);

    if (parsed.type === "init") {
      parsed.data.forEach((shape) => {
        const newShape = createShapeFromData(shape);
        if (newShape) shapes.push(newShape);
      });
      redrawCanvas();
    } else if (["drawing", "new-shape", "move-shape"].includes(parsed.type)) {
      const shapeReceived = createShapeFromData(parsed.data);
      if (!shapeReceived) return;

      const existingShapeIndex = shapes.findIndex(
        (shape) => shape.id === shapeReceived.id
      );
      if (existingShapeIndex !== -1) {
        updateShape(existingShapeIndex, shapeReceived, parsed.type);
      } else {
        shapes.push(shapeReceived);
      }

      redrawCanvas();
    } else if (parsed.type === "select-shape") {
      const existingShapeIndex = shapes.findIndex(
        (shape) => shape.id === parsed.data.id
      );
      if (existingShapeIndex !== -1) {
        shapes.forEach((s) => (s.selected = false)); 
        shapes[existingShapeIndex].selected = true;
        redrawCanvas();
      }
    }
    else if (parsed.type === "delete-shape") {
      shapes = shapes.filter((s) => s.id !== parsed.data.id);
      redrawCanvas();
    }
  });

  peer.on("error", (e) => console.log(`Connection error: ${e}`));
});

swarm.on("update", () => {
  document.querySelector("#peers-count").textContent = swarm.connections.size;
});

async function createDrawingRoom() {
  const topicBuffer = crypto.randomBytes(32);
  joinSwarm(topicBuffer);
}
async function joinDrawingRoom(e) {
  e.preventDefault();
  const topicStr = document.querySelector("#join-drawing-room-topic").value;
  const topicBuffer = b4a.from(topicStr, "hex");
  joinSwarm(topicBuffer);
}
async function joinSwarm(topicBuffer) {
  console.log("enter join swarm");
  document.querySelector("#setup-container").classList.add("hidden");
  document.querySelector("#loading").classList.remove("hidden");

  const discovery = swarm.join(topicBuffer, { client: true, server: true });
  await discovery.flushed();

  const topic = b4a.toString(topicBuffer, "hex");

  document.querySelector("#chat-room-topic").innerText = topic;
  document.querySelector("#loading").classList.add("hidden");

  document.querySelector("#board-container").classList.remove("hidden");
  document.querySelector("#board-container").classList.add("visible");
}
function updateCanvasSize() {
  const canvas = document.querySelector("#myCanvas");
  if (!canvas) return;

  const scaleX = window.innerWidth / canvasProperties.width;
  const scaleY = window.innerHeight / canvasProperties.height;

  canvasProperties.width = window.innerWidth;
  canvasProperties.height = window.innerHeight;
  canvasProperties.center.x = window.innerWidth / 2;
  canvasProperties.center.y = window.innerHeight / 2;

  mycanvas.width = canvasProperties.width;
  mycanvas.height = canvasProperties.height;
  helperCanvas.width = canvasProperties.width;
  helperCanvas.height = canvasProperties.height;

  shapes.forEach((shape) => {
    const points = shape.getPoints();
    if (points) {
      points = points.map((point) => ({
        x: point.x * scaleX,
        y: point.y * scaleY,
      }));
    }
    this.setPoints(points);
  });

  clearCanvas();
  drawShapes(shapes);
}
const downCallbackForRect = (e) => {
  const mousePosition = {
    x: e.offsetX,
    y: e.offsetY,
  };
  console.log("inds");
  currentShape = new Rect(mousePosition, getOptions());
  broadcastDrawing(currentShape);

  const moveCallback = (e) => {
    const mousePosition = {
      x: e.offsetX,
      y: e.offsetY,
    };
    currentShape.setCorner2(mousePosition);
    broadcastDrawing(currentShape);
    clearCanvas();
    drawShapes([...shapes, currentShape]);
  };

  const upCallback = (e) => {
    mycanvas.removeEventListener("pointermove", moveCallback);
    mycanvas.removeEventListener("pointerup", upCallback);
    currentShape.recenter();
    shapes.push(currentShape);
    broadcastShape(currentShape);
  };
  mycanvas.addEventListener("pointermove", moveCallback);
  mycanvas.addEventListener("pointerup", upCallback);
};
const downCallbackForPath = (e) => {
  const mousePosition = {
    x: e.offsetX,
    y: e.offsetY,
  };

  currentShape = new Path(mousePosition, getOptions());
  broadcastDrawing(currentShape);

  const moveCallback = (e) => {
    const mousePosition = {
      x: e.offsetX,
      y: e.offsetY,
    };
    currentShape.addPoint(mousePosition);
    broadcastDrawing(currentShape);
    clearCanvas();
    drawShapes([...shapes, currentShape]);
  };

  const upCallback = (e) => {
    mycanvas.removeEventListener("pointermove", moveCallback);
    mycanvas.removeEventListener("pointerup", upCallback);
    currentShape.recenter();
    shapes.push(currentShape);
    broadcastShape(currentShape);
  };
  mycanvas.addEventListener("pointermove", moveCallback);
  mycanvas.addEventListener("pointerup", upCallback);
};

const downCallbackForSelect = (e) => {
  const startPosition = {
    x: e.offsetX,
    y: e.offsetY,
  };
  const [r, g, b, a] = helperCtx.getImageData(
    startPosition.x,
    startPosition.y,
    1,
    1
  ).data;

  const colorId = (r << 16) | (g << 8) | b;
  const shape = shapes.find((s) => colorId == s.colorId);
  shapes.forEach((s) => (s.selected = false));
  drawShapes(shapes);
  if (shape) {
    shape.selected = true;
    const oldCenter = shape.center;
    drawShapes(shapes);
    broadcastSelection(shape);
    const moveCallback = function (e) {
      const mousePosition = {
        x: e.offsetX,
        y: e.offsetY,
      };
      const newPoint = subtractPoints(mousePosition, startPosition);
      shape.setCenter(addPoints(oldCenter, newPoint));
      broadcastMove(shape);

      drawShapes(shapes);
    };

    const upCallback = (e) => {
      mycanvas.removeEventListener("pointermove", moveCallback);
      mycanvas.removeEventListener("pointerup", upCallback);
    };
    mycanvas.addEventListener("pointermove", moveCallback);
    mycanvas.addEventListener("pointerup", upCallback);
  }
};

const downCallbackForCircle = (e) => {
  const mousePosition = { x: e.offsetX, y: e.offsetY };
  currentShape = new Circle(mousePosition,0, getOptions());
  broadcastDrawing(currentShape);
  console.log(shapes);
  const moveCallback = (e) => {
    currentShape.setRadius({ x: e.offsetX, y: e.offsetY });
    console.log(shapes);
    broadcastDrawing(currentShape);
    clearCanvas();
    drawShapes([...shapes, currentShape]);
  };

  const upCallback = () => {
    mycanvas.removeEventListener("pointermove", moveCallback);
    mycanvas.removeEventListener("pointerup", upCallback);
    // currentShape.recenter();
    console.log(shapes);
    shapes.push(currentShape);
    broadcastShape(currentShape);
  };

  mycanvas.addEventListener("pointermove", moveCallback);
  mycanvas.addEventListener("pointerup", upCallback);
};

function changeTool(e) {
  mycanvas.removeEventListener("pointerdown", downCallbackForRect);
  mycanvas.removeEventListener("pointerdown", downCallbackForPath);
  mycanvas.removeEventListener("pointerdown", downCallbackForSelect);
  mycanvas.removeEventListener("pointerdown", downCallbackForCircle);
  switch (e.target.value) {
    case "rect":
      mycanvas.addEventListener("pointerdown", downCallbackForRect);
      break;
    case "path":
      mycanvas.addEventListener("pointerdown", downCallbackForPath);
      break;
    case "select":
      mycanvas.addEventListener("pointerdown", downCallbackForSelect);
      break;
    case "circle":
      mycanvas.addEventListener("pointerdown", downCallbackForCircle);
      break;
  }
}
function drawShapes(shapes) {
  clearCanvas();
  for (const shape of shapes) {
    shape.draw(ctx);
  }
  helperCtx.clearRect(0, 0, helperCanvas.width, helperCanvas.height);
  for (const shape of shapes) {
    shape.draw(helperCtx, true);
  }
}
function clearCanvas() {
  ctx.clearRect(0, 0, mycanvas.width, mycanvas.height);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, mycanvas.width, mycanvas.height);
}
function getOptions() {
  return {
    fillColor: document.getElementById("fillColor").value,
    strokeColor: document.getElementById("strokeColor").value,
    fill: document.getElementById("fill").checked,
    stroke: document.getElementById("stroke").checked,
    strokeWidth: document.getElementById("strokeWidth").value,
    lineCap: "round",
    lineJoin: "round",
  };
}
function broadcast(type, data, excludePeer = null) {
  const message = JSON.stringify({ type, data });

  for (const peer of swarm.connections) {
    if (excludePeer && peer === excludePeer) continue; 
    peer.write(message);
  }
}

function broadcastShape(shape, excludePeer = null) {
  broadcast("new-shape", shape, excludePeer);
}

function broadcastSelection(shape, excludePeer = null) {
  broadcast("select-shape", shape, excludePeer);
}

function broadcastMove(shape, excludePeer = null) {
  console.log("Moving", shape);
  broadcast("move-shape", shape, excludePeer);
}

function broadcastDrawing(drawing, excludePeer = null) {
  broadcast("drawing", drawing, excludePeer);
}
function changeFillColor(value) {
  shapes
    .filter((s) => s.selected)
    .forEach((s) => (s.options.fillColor = value));
  drawShapes(shapes);
}

function changeFill(value) {
  shapes.filter((s) => s.selected).forEach((s) => (s.options.fill = value));
  drawShapes(shapes);
}

function changeStrokeColor(value) {
  shapes
    .filter((s) => s.selected)
    .forEach((s) => (s.options.strokeColor = value));
  drawShapes(shapes);
}

function changeStroke(value) {
  shapes.filter((s) => s.selected).forEach((s) => (s.options.stroke = value));
  drawShapes(shapes);
}

function changeStrokeWidth(value) {
  shapes
    .filter((s) => s.selected)
    .forEach((s) => (s.options.strokeWidth = Number(value)));
  drawShapes(shapes);
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Delete") {
    const selectedIndex = shapes.findIndex((s) => s.selected);
    if (selectedIndex !== -1) {
      const deletedShape = shapes[selectedIndex];

      shapes.splice(selectedIndex, 1);
      drawShapes(shapes);

      broadcast("delete-shape", { id: deletedShape.id });
    }
  }
});

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

document.querySelector("#create-drawing-room").addEventListener("click", createDrawingRoom);
document.querySelector("#join-form").addEventListener("submit", joinDrawingRoom);
mycanvas.addEventListener("pointerdown", downCallbackForPath);
document.getElementById("selectTool").addEventListener("change", changeTool);
window.addEventListener("resize", updateCanvasSize);
updateCanvasSize();
