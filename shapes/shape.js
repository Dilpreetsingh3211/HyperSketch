import crypto from 'hypercore-crypto';
export class Shape {
  constructor(options,id) {
    this.options = options;
    this.id = id || crypto.randomBytes(4).toString('hex');
  }
  
  
  applyStyles(ctx){
    ctx.strokeStyle=this.options.strokeColor;
    ctx.fillStyle=this.options.fillColor;
    ctx.lineWidth=this.options.strokeWidth;

    if(this.options.stroke){
        ctx.stroke();
    }
    if(this.options.fill){
        ctx.fill();
    }
  }
  draw(ctx) {
    throw new Error("no draw method");
  }
}
