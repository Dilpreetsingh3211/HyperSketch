/** @typedef {import('pear-interface')} */ /* global Pear */
import { Rect } from "./shapes/rect";
import { Path } from "./shapes/path";

import Hyperswarm from "hyperswarm";
import crypto from 'hypercore-crypto';
import b4a from 'b4a';
const { teardown, updates } = Pear;


let shapes = [];
let currentShape = null;

const canvasProperties = {
  width: window.innerWidth,
  height: window.innerWidth,
  center: {
    x: window.innerHeight / 2,
    y: window.innerWidth / 2,
  },
};


const mycanvas = document.getElementById("myCanvas");

mycanvas.width = canvasProperties.width;
mycanvas.height = canvasProperties.height;

const ctx = mycanvas.getContext("2d");
clearCanvas();


const swarm = new Hyperswarm();
teardown(() => swarm.destroy());
updates(() => Pear.reload());


swarm.on('connection', (peer) => {
  
  peer.write(JSON.stringify({ type: 'init', data: shapes }));

  peer.on('data', (message) => {
    const parsed = JSON.parse(message);
    console.log(parsed);
    if (parsed.type === 'init'){
          parsed.data.forEach((shape)=>{
            switch(shape.type){
              case 'Path': 
                  shapes.push(Path.fromJSON(shape));
                  break;
              case 'Rect': 
                  shapes.push(Path.fromJSON(shape));
                  break;
            }
          });
          
          clearCanvas();
          drawShapes(shapes);
    }
    else if (parsed.type === 'drawing') {
  
      let shapeReceived;
      if (parsed.data.type === 'Path') {
        shapeReceived = Path.fromJSON(parsed.data);
      } else if (parsed.data.type === 'Rect') {
        shapeReceived = Rect.fromJSON(parsed.data);
      }
  
     
      const existingShapeIndex = shapes.findIndex((shape) => shape.id === shapeReceived.id);
      if (existingShapeIndex !== -1) {
        shapes[existingShapeIndex] = shapeReceived; 
      } else {
        shapes.push(shapeReceived); 
      }
  
      clearCanvas();
      drawShapes(shapes);
    } else if (parsed.type === 'new-shape') {
      let shapeReceived;
      if (parsed.data.type === 'Path') {
        shapeReceived = Path.fromJSON(parsed.data);
      } else if (parsed.data.type === 'Rect') {
        shapeReceived = Rect.fromJSON(parsed.data);
      }

      shapes.push(shapeReceived);
      clearCanvas();
      drawShapes(shapes);
    }
  });
  
  peer.on('error', (e) => console.log(`Connection error: ${e}`));
});

swarm.on('update', () => {
  document.querySelector('#peers-count').textContent = swarm.connections.size;
});



async function createChatRoom() {
  const topicBuffer = crypto.randomBytes(32);
  console.log("enter create chat room")
  joinSwarm(topicBuffer);
}
async function joinChatRoom(e) {
  e.preventDefault();
  const topicStr = document.querySelector('#join-chat-room-topic').value;
  const topicBuffer = b4a.from(topicStr, 'hex');
  joinSwarm(topicBuffer);
}
async function joinSwarm(topicBuffer) {
  console.log('enter join swarm')
  document.querySelector('#setup-container').classList.add('hidden');
  document.querySelector('#loading').classList.remove('hidden');
  

  const discovery = swarm.join(topicBuffer, { client: true, server: true });
  await discovery.flushed();

  
  const topic = b4a.toString(topicBuffer, 'hex');
 
  document.querySelector('#chat-room-topic').innerText = topic;
  document.querySelector('#loading').classList.add('hidden');

  document.querySelector('#board-container').classList.remove('hidden');
  document.querySelector('#board-container').classList.add('visible');


 
}
function updateCanvasSize() {
  const canvas = document.querySelector('#myCanvas');
  if (!canvas) return;

  
  const scaleX = window.innerWidth / canvasProperties.width;
  const scaleY = window.innerHeight / canvasProperties.height;

  canvasProperties.width = window.innerWidth;
  canvasProperties.height = window.innerHeight;
  canvasProperties.center.x = window.innerWidth / 2;
  canvasProperties.center.y = window.innerHeight / 2;

  
  canvas.width = canvasProperties.width;
  canvas.height = canvasProperties.height;

  
  shapes.forEach((shape) => {
    shape.x *= scaleX;
    shape.y *= scaleY;
    
    if (shape.width) shape.width *= scaleX;
    if (shape.height) shape.height *= scaleY;
    
    if (shape.points) {
      shape.points = shape.points.map(point => ({
        x: point.x * scaleX,
        y: point.y * scaleY
      }));
    }
  });

  clearCanvas();
  drawShapes(shapes);
}
const downCallbackForRect = (e) => {
  const mousePosition = {
    x: e.offsetX,
    y: e.offsetY,
  };
  console.log('inds');
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

    shapes.push(currentShape);
    broadcastShape(currentShape);
  };
  mycanvas.addEventListener("pointermove", moveCallback);
  mycanvas.addEventListener("pointerup", upCallback);
};
function changeTool(e) {
  mycanvas.removeEventListener("pointerdown", downCallbackForRect);
  mycanvas.removeEventListener("pointerdown", downCallbackForPath);

  switch (e.target.value) {
    case "rect":
      mycanvas.addEventListener("pointerdown", downCallbackForRect); 
      break;
    case "path":
      mycanvas.addEventListener("pointerdown", downCallbackForPath);
      break;
  }
}
function drawShapes(shapes) {
  for (const shape of shapes) {
    shape.draw(ctx);
  }
}
function clearCanvas() {
  ctx.clearRect(0, 0, mycanvas.width, mycanvas.height);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, mycanvas.width, mycanvas.height);
}
function getOptions() {
  console.log(strokeWidth);
  return {
    fillColor: fillColor.value,
    strokeColor: strokeColor.value,
    fill: fill.checked,
    stroke: stroke.checked,
    strokeWidth: strokeWidth.value,
  };
}
function broadcastShape(shape, excludePeer = null) {
  const message = JSON.stringify({ type: 'new-shape', data: shape });
  for (const peer of swarm.connections) {
    if (peer !== excludePeer) {
      peer.write(message);
    }
  }
}
function broadcastDrawing(drawing, excludePeer = null) {
  const message = JSON.stringify({ type: 'drawing', data: drawing });
  for (const peer of swarm.connections) {
    if (peer !== excludePeer) {
      peer.write(message);
    }
  }
}


document.querySelector('#create-drawing-room').addEventListener('click', createChatRoom);
document.querySelector('#join-form').addEventListener('submit', joinChatRoom);
mycanvas.addEventListener("pointerdown", downCallbackForPath);
document.getElementById("selectTool").addEventListener("change", changeTool);
window.addEventListener('resize', updateCanvasSize);
updateCanvasSize();


