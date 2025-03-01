import {Shape} from './shape'

export class Rect extends Shape {
    constructor(corner1,options,id){
        super(options,id)
        this.corner1=corner1;
        this.corner2=corner1;
        this.type = 'Rect';
    }
    setCorner2(corner2){
        this.corner2=corner2;
    }
    getPoints() {
        return [this.corner1, this.corner2];
      }
      setPoints(points) {
        this.corner1 = points[0];
        this.corner2 = points[1];
      }
      drawHelperRegion(ctx) {
        const width = Math.abs(this.corner2.x - this.corner1.x);
        const hegiht = Math.abs(this.corner2.y - this.corner1.y);
        const minX = Math.min(this.corner1.x, this.corner2.x);
        const minY = Math.min(this.corner1.y, this.corner2.y);
    
        ctx.beginPath();
        ctx.rect(minX, minY, width, hegiht);
        this.applyHelperStyles(ctx);
    }
    draw(ctx, helperRegion = false) {
        const center = this.center ? this.center : { x: 0, y: 0 };
    
        const width = Math.abs(this.corner2.x - this.corner1.x);
        const height = Math.abs(this.corner2.y - this.corner1.y);
        const minX = Math.min(this.corner1.x, this.corner2.x);
        const minY = Math.min(this.corner1.y, this.corner2.y);
    
        ctx.beginPath();
    
        ctx.rect(minX + center.x, minY + center.y, width, height);
    
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
        const rect = new Rect(json.corner1, options, json.id);
        rect.corner2 = json.corner2;
        rect.colorId=json.colorId;
        rect.center=json.center;
        rect.selected=json.selected;
        return rect;
      }
}