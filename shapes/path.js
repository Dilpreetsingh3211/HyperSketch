import {Shape} from './shape'
export class Path extends Shape{
    constructor(startPoint,options,id=null){
        super(options,id)
        this.points=[startPoint];
        this.type = 'Path';
    }

    addPoint(point){
        this.points.push(point);
    }
    getPoints() {
        return this.points;
      }
    
      setPoints(points) {
        this.points = points;
      }

    
  drawHelperRegion(ctx) {
    ctx.beginPath();

    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let point of this.points) {
      ctx.lineTo(point.x, point.y);
    }
    this.applyHelperStyles(ctx);
  }
  draw(ctx, helperRegion = false) {
    ctx.beginPath();
    const center = this.center ? this.center : { x: 0, y: 0 };
    ctx.moveTo(this.points[0].x + center.x, this.points[0].y + center.y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x + center.x, this.points[i].y + center.y);
    }
    if (helperRegion) {
      this.applyHelperRegionStyles(ctx);
    } else {
      this.applyStyles(ctx);
      if (this.selected) {
        this.drawGizmo(ctx);
      }
    }
  }
    static fromJSON(json) {
        
        const options = json.options;
    
        const path = new Path(json.points[0], options, json.id);
    
      
        path.points = json.points;
        path.colorId=json.colorId;
        path.center=json.center;
        path.selected=json.selected;
    
        return path;
      }
    
}