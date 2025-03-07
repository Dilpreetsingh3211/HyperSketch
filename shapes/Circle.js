import { Shape } from './shape';

export class Circle extends Shape {
    constructor(center, radius, options, id = null) {
        super(options, id);
        this.center = center;
        this.radius = radius;
        this.type = 'circle';
    }

    getPoints() {
        return [
            { x: this.center.x - this.radius, y: this.center.y - this.radius },
            { x: this.center.x + this.radius, y: this.center.y + this.radius }
        ];
    }

    setPoints(points) {
        const minX = points[0].x;
        const minY = points[0].y;
        const maxX = points[1].x;
        const maxY = points[1].y;

        this.center = {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2
        };
        this.radius = (maxX - minX) / 2;
    }

    setRadius(mousePosition) {
        this.radius = Math.sqrt(
            Math.pow(mousePosition.x - this.center.x, 2) +
            Math.pow(mousePosition.y - this.center.y, 2)
        );
    }

    draw(ctx, helperRegion = false) {
        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
        
        if (helperRegion) {
            this.applyHelperRegionStyles(ctx);
        } else {
            this.applyStyles(ctx);
            if (this.selected) {
                this.drawGizmo(ctx);
            }
        }
    }

    drawGizmo(ctx) {
        const minX = this.center.x - this.radius;
        const minY = this.center.y - this.radius;
        const maxX = this.center.x + this.radius;
        const maxY = this.center.y + this.radius;
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(minX, minY, maxX - minX, maxY - minY);
        ctx.strokeStyle = "orange";
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, 5, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
    }

    static fromJSON(json) {
        const options = json.options;
        const circle = new Circle(json.center, json.radius, options, json.id);
        circle.colorId = json.colorId;
        circle.selected = json.selected;
        return circle;
    }
}
