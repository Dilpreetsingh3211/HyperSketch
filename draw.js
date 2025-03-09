import { mycanvas,helperCanvas,ctx,helperCtx,shapes,state } from "./state";


function drawShapes(shapes) {
  ctx.translate(state.offsetX, state.offsetY);
  ctx.scale(state.scale, state.scale);
  for (const shape of shapes) {
    shape.draw(ctx);
  }

 
  helperCtx.translate(state.offsetX, state.offsetY);
  helperCtx.scale(state.scale, state.scale);
  for (const shape of shapes) {
    shape.draw(helperCtx, true);
  }
}

function clearCanvas() {
  
    ctx.clearRect(0, 0, mycanvas.width, mycanvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, mycanvas.width, mycanvas.height);
    // ctx.setTransform(1, 0, 0, 1, 0, 0);
  
    
    helperCtx.clearRect(0, 0, helperCanvas.width, helperCanvas.height);
    // helperCtx.setTransform(1, 0, 0, 1, 0, 0);
  }

export function redrawCanvas(currentDrawing=null) {
  mycanvas.width = window.innerWidth;
  mycanvas.height = window.innerHeight;
  helperCanvas.width = window.innerWidth;
  helperCanvas.height = window.innerHeight;
  clearCanvas();
  if(currentDrawing){
    drawShapes([...shapes,currentDrawing]);
  }
  else{
    drawShapes(shapes);
  }
  
}
