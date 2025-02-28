import {Shape} from './shape'
export class Path extends Shape{
    constructor(startPoint,options,id){
        super(options,id)
        this.points=[startPoint];
        this.type = 'Path';
    }

    addPoint(point){
        this.points.push(point);
    }

    draw(ctx){
        ctx.beginPath();
        
        ctx.moveTo(this.points[0].x,this.points[0].y);
        for(let point of this.points){
            ctx.lineTo(point.x,point.y);
        }
        this.applyStyles(ctx);
        
    }
    static fromJSON(json) {
        
        const options = json.options;
    
        const path = new Path(json.points[0], options, json.id);
    
      
        path.points = json.points;
    
        return path;
      }
    
}