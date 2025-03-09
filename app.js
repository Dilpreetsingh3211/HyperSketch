/** @typedef {import('pear-interface')} */ /* global Pear */
import { mycanvas, helperCanvas, ctx, helperCtx, shapes } from "./state";
import { redrawCanvas } from "./draw";
import "./tool.js";
import { getOptions } from "./tool.js";
import { toTrueX, toTrueY } from "./util";
import { Rect } from "./shapes/rect";
import { Path } from "./shapes/path";
import { Circle } from "./shapes/Circle";
import {Line} from "./shapes/line"
import { state } from "./state";
import { addPoints, subtractPoints } from "./util";
import Hyperswarm from "hyperswarm";
import crypto from "hypercore-crypto";
import b4a from "b4a";
const { teardown, updates } = Pear;

let currentShape;
let conns = [];
let myName;

mycanvas.width = state.canvasProperties.width;
mycanvas.height = state.canvasProperties.height;
helperCanvas.width = state.canvasProperties.width;
helperCanvas.height = state.canvasProperties.height;

const swarm = new Hyperswarm();
teardown(() => swarm.destroy());
updates(() => Pear.reload());

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
    } else if (parsed.type === "delete-shape") {
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

const downCallbackForRect = (e) => {
  const mousePosition = { x: toTrueX(e.offsetX), y: toTrueY(e.offsetY) };
  console.log("inds");
  currentShape = new Rect(mousePosition, getOptions());
  broadcastDrawing(currentShape);

  const moveCallback = (e) => {
    const mousePosition = { x: toTrueX(e.offsetX), y: toTrueY(e.offsetY) };
    currentShape.setCorner2(mousePosition);
    broadcastDrawing(currentShape);
    redrawCanvas(currentShape);
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
  const mousePosition = { x: toTrueX(e.offsetX), y: toTrueY(e.offsetY) };

  currentShape = (selectTool.value==="path") ? 
                      new Path(mousePosition, getOptions()) :
                      new Line(mousePosition,getOptions()) ;

  broadcastDrawing(currentShape);

  const moveCallback = (e) => {
    const mousePosition = { x: toTrueX(e.offsetX), y: toTrueY(e.offsetY) };
    currentShape.addPoint(mousePosition);
    broadcastDrawing(currentShape);
    redrawCanvas(currentShape);
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
  const screenX = e.offsetX;
  const screenY = e.offsetY;

  redrawCanvas();

  const [r, g, b, a] = helperCtx.getImageData(screenX, screenY, 1, 1).data;
  const colorId = (r << 16) | (g << 8) | b;
  const shape = shapes.find((s) => colorId === s.colorId);

  shapes.forEach((s) => (s.selected = false));

  if (shape) {
    shape.selected = true;
    const startPosition = { x: toTrueX(screenX), y: toTrueY(screenY) };
    const oldCenter = { x: shape.center.x, y: shape.center.y };
    broadcastSelection(shape);
    redrawCanvas();

    const moveCallback = (e) => {
      const mousePosition = { x: toTrueX(e.offsetX), y: toTrueY(e.offsetY) };
      const delta = subtractPoints(mousePosition, startPosition);
      shape.setCenter(addPoints(oldCenter, delta));
      broadcastMove(shape);
      redrawCanvas();
    };

    const upCallback = () => {
      mycanvas.removeEventListener("pointermove", moveCallback);
      mycanvas.removeEventListener("pointerup", upCallback);
    };

    mycanvas.addEventListener("pointermove", moveCallback);
    mycanvas.addEventListener("pointerup", upCallback);
  } else {
    redrawCanvas();
  }
};

const downCallbackForCircle = (e) => {
  const mousePosition = { x: toTrueX(e.offsetX), y: toTrueY(e.offsetY) };
  currentShape = new Circle(mousePosition, 0, getOptions());
  broadcastDrawing(currentShape);
  console.log(shapes);
  const moveCallback = (e) => {
    const newPoint = { x: toTrueX(e.offsetX), y: toTrueY(e.offsetY) };
    currentShape.setRadius(newPoint);
    console.log(shapes);
    broadcastDrawing(currentShape);
    redrawCanvas(currentShape);
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

const downCallbackForGrab = (e) => {
  const startPosition = { x: e.offsetX, y: e.offsetY };
  const prevOffsetX = state.offsetX;
  const prevOffsetY = state.offsetY;

  const moveCallback = (e) => {
    const mousePosition = { x: e.offsetX, y: e.offsetY };
    state.offsetX = prevOffsetX + (mousePosition.x - startPosition.x);
    state.offsetY = prevOffsetY + (mousePosition.y - startPosition.y);
    redrawCanvas();
  };

  const upCallback = () => {
    mycanvas.removeEventListener("pointermove", moveCallback);
    mycanvas.removeEventListener("pointerup", upCallback);
  };

  mycanvas.addEventListener("pointermove", moveCallback);
  mycanvas.addEventListener("pointerup", upCallback);
};

function changeTool(e) {
  mycanvas.removeEventListener("pointerdown", downCallbackForRect);
  mycanvas.removeEventListener("pointerdown", downCallbackForPath);
  mycanvas.removeEventListener("pointerdown", downCallbackForSelect);
  mycanvas.removeEventListener("pointerdown", downCallbackForCircle);
  mycanvas.removeEventListener("pointerdown", downCallbackForGrab);
  switch (e.target.value) {
    case "rect":
      mycanvas.addEventListener("pointerdown", downCallbackForRect);
      break;
    case 'line':
    case "path":
      mycanvas.addEventListener("pointerdown", downCallbackForPath);
      break;
    case "select":
      mycanvas.addEventListener("pointerdown", downCallbackForSelect);
      break;
    case "circle":
      mycanvas.addEventListener("pointerdown", downCallbackForCircle);
      break;
    case "grab":
      mycanvas.addEventListener("pointerdown", downCallbackForGrab);
      break;
  }
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

window.addEventListener("keydown", (e) => {
  if (e.key === "Delete") {
    const selectedIndex = shapes.findIndex((s) => s.selected);
    if (selectedIndex !== -1) {
      const deletedShape = shapes[selectedIndex];

      shapes.splice(selectedIndex, 1);
      redrawCanvas();

      broadcast("delete-shape", { id: deletedShape.id });
    }
  }
});

window.addEventListener("resize", (event) => {
  redrawCanvas();
});

function onMouseWheel(event) {
  event.preventDefault();
  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
  const oldScale = state.scale;
  state.scale *= zoomFactor;

  const rect = mycanvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  state.offsetX = mouseX - (mouseX - state.offsetX) * (state.scale / oldScale);
  state.offsetY = mouseY - (mouseY - state.offsetY) * (state.scale / oldScale);

  redrawCanvas();
}

const DrawingRoom = document.getElementById("create-drawing-room");
const joinForm = document.getElementById("join-form");
const selectTool = document.getElementById("selectTool");

DrawingRoom.addEventListener("click", createDrawingRoom);
joinForm.addEventListener("submit", joinDrawingRoom);
selectTool.addEventListener("change", changeTool);
mycanvas.addEventListener("pointerdown", downCallbackForPath);
mycanvas.addEventListener("wheel", onMouseWheel, { passive: false });
