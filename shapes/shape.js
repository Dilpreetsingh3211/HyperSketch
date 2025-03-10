import crypto from 'hypercore-crypto';
import {
  averagePoints,
  getMidPoint,
  addPoints,
  subtractPoints,
  equalPoints,
} from "../util";
export class Shape {
  constructor(options,id) {
    this.options = options;
    this.id = id || crypto.randomBytes(4).toString('hex');
    this.colorId =Math.floor(16777216 * Math.random());
    this.center = {x:0,y:0};
    this.selected = false;
    this.lock=false;
  }
  
  setCenter(center) {
    this.center = center;
  }

  recenter() {
    const points = this.getPoints();
    this.center = getMidPoint(points);
    for (const point of points) {
      const newPoint = subtractPoints(point, this.center);
      point.x = newPoint.x;
      point.y = newPoint.y;
    }
    this.setPoints(points);
  }
  drawGizmo(ctx) {
    const center = this.center ? this.center : { x: 0, y: 0 };
    const points = this.getPoints();
    const minX = Math.min(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxX = Math.max(...points.map((p) => p.x));
    const maxY = Math.max(...points.map((p) => p.y));
  
    
    const gizmoColor = "#00A3FF"; 
    const centerColor = "black"; 
    const handleRadius = 4;       
  
    ctx.save();
  
    
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  
    
    ctx.beginPath();
    ctx.rect(minX + center.x, minY + center.y, maxX - minX, maxY - minY);
    ctx.strokeStyle = gizmoColor;
    ctx.lineWidth = 3;           
    ctx.setLineDash([3,3]);      
    ctx.stroke();
  
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    const relHandles = [
      { x: minX, y: minY },              // Top-left
      { x: maxX, y: minY },              // Top-right
      { x: minX, y: maxY },              // Bottom-left
      { x: maxX, y: maxY },              // Bottom-right
      { x: (minX + maxX) / 2, y: minY }, // Top-middle
      { x: (minX + maxX) / 2, y: maxY }, // Bottom-middle
      { x: minX, y: (minY + maxY) / 2 }, // Left-middle
      { x: maxX, y: (minY + maxY) / 2 }  // Right-middle
    ];
  
    relHandles.forEach((rel) => {
      const absX = rel.x + center.x;
      const absY = rel.y + center.y;
      ctx.beginPath();
      ctx.arc(absX, absY, handleRadius, 0, 2 * Math.PI);
      ctx.fillStyle = gizmoColor;
      ctx.fill();
    });
  
    
    ctx.beginPath();
    ctx.arc(center.x, center.y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = centerColor;
    ctx.fill();
  
    ctx.restore();
  }
  applyStyles(ctx){
    ctx.save();
    ctx.strokeStyle=this.options.strokeColor;
    ctx.fillStyle=this.options.fillColor;
    ctx.lineWidth=this.options.strokeWidth;
    ctx.lineCap = this.options.lineCap;
    ctx.lineJoin = this.options.lineJoin;
    if(this.options.stroke){
        ctx.stroke();
    }
    if(this.options.fill){
        ctx.fill();
    }
    ctx.restore();
  }
  draw(ctx) {
    throw new Error("no draw method");
  }
  applyHelperRegionStyles(ctx) {
    ctx.save();
    const red = (this.colorId & 0xff0000) >> 16;
    const green = (this.colorId & 0x00ff00) >> 8;
    const blue = this.colorId & 0x0000ff;
    ctx.strokeStyle = `rgb(${red},${green},${blue})`;
    ctx.fillStyle = `rgb(${red},${green},${blue})`;
    ctx.lineWidth = this.options.strokeWidth;
    ctx.lineCap = this.options.lineCap;
    ctx.lineJoin = this.options.lineJoin;
    if (this.options.stroke) {
      ctx.stroke();
    }
    if (this.options.fill) {
      ctx.fill();
    }
    ctx.restore();

  }
  getPoints() {
    throw new Error("getPoints method must be implemented");
  }
  setPoints(points) {
    throw new Error("setPoints method must be implemented");
  }
  drawHelperRegion(ctx) {
    throw new Error(" no helder draw method ");
  }
}
