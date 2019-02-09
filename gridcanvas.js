class gridCanvas {
    constructor(w, h) {
        this.width = w;
        this.height = h;
        this.reset();
        this.bSize = 0;
    }

    reset() {
        this.grid = Array(this.height).fill(0).map(i => Array(this.width).fill(0));
    }

    inside(x, y) {
        return y >= 0 && y < this.height && x >= 0 && x < this.width;
    }

    point(x, y, t = 1) {
        if (this.inside(x, y)) this.grid[y][x] = t;
    }

    rect(x, y, w, h, t = 1) {
        for (let j = 0; j <= h; j++) {
            for (let i = 0; i <= w; i++) {
                this.point(x + i, y + j, t);
            }
        }
    }

    paint(x, y, erase = false) {
        let t = erase ? 0 : 1
        if (this.bSize == 0) {
            this.point(x, y, t);
        } else {
            this.rect(x - this.bSize, y - this.bSize, this.bSize+1, this.bSize+1, t);
        }
    }

    // literally just copy pasted this https://stackoverflow.com/a/4672319
    // because i couldn't understand the one on wikipedia :grin:
    line(x0, y0, x1, y1, erase = false) {
        var dx = Math.abs(x1 - x0);
        var dy = Math.abs(y1 - y0);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx - dy;

        while (true) {
            this.paint(x0, y0, erase);

            if ((x0 == x1) && (y0 == y1)) break;
            var e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
    }

    // both from https://web.archive.org/web/20120422045142/https://banu.com/blog/7/drawing-circles/
    circle(cx, cy, r, fill = false) {
        if (fill) {
            for (let y = -r; y <= r; y++) {
                for (let x = -r; x <= r; x++) {
                    if (x ** 2 + y ** 2 <= r ** 2) {
                        this.point(x + cx, y + cy)
                    }
                }
            }
            return;
        }

        let l = Math.floor(r * Math.cos(QUARTER_PI));

        for (let x = 0; x <= l; x++) {
            let y = Math.floor(Math.sqrt(r ** 2 - x ** 2));

            this.point(x + cx, y + cy);
            this.point(x + cx, -y + cy);
            this.point(-x + cx, y + cy);
            this.point(-x + cx, -y + cy);

            this.point(y + cx, x + cy);
            this.point(y + cx, -x + cy);
            this.point(-y + cx, x + cy);
            this.point(-y + cx, -x + cy);
        }
    }

    // https://dai.fmph.uniba.sk/upload/0/01/Ellipse.pdf
    ellipse(cx, cy, rx, ry, fill = false) {
        if (fill) {
            for (let y = -ry; y <= ry; y++) {
                for (let x = -rx; x <= rx; x++) {
                    if (x ** 2 * ry ** 2 + y ** 2 * rx ** 2 <= rx ** 2 * ry ** 2) {
                        this.point(x + cx, y + cy)
                    }
                }
            }
            return;
        }

        let plotpoints = (x, y) => {
            this.point(cx + x, cy + y);
            this.point(cx - x, cy + y);
            this.point(cx - x, cy - y);
            this.point(cx + x, cy - y);
        }
        let tas = 2 * rx * rx;
        let tbs = 2 * ry * ry;
        let x = rx;
        let y = 0;
        let dx = ry ** 2 * (1 - 2 * rx);
        let dy = rx ** 2;
        let err = 0;
        let sx = tbs * rx;
        let sy = 0;
        while (sx >= sy) {
            plotpoints(x, y);
            y++;
            sy += tas;
            err += dy;
            dy += tas;
            if (err * 2 + dx > 0) {
                x--;
                sx -= tbs;
                err += dx;
                dx += tbs;
            }
        }
        x = 0;
        y = ry;
        dx = ry ** 2;
        dy = rx ** 2 * (1 - 2 * ry);
        err = 0;
        sx = 0;
        sy = tas * ry;
        while (sx <= sy) {
            plotpoints(x, y);
            x++;
            sx += tbs;
            err += dx;
            dx += tbs;
            if (err * 2 + dy > 0) {
                y--;
                sy -= tas;
                err += dy;
                dy += tas;
            }
        }
    }

    //https://en.wikipedia.org/wiki/Flood_fill
    fill(x, y, r, w) {
        if (!this.inside(x,y)) return
        let n = this.grid[y][x];
        if (n != r) return
        if (n == w) return
        this.grid[y][x] = w;
        this.fill(x - 1, y, r, w);
        this.fill(x + 1, y, r, w);
        this.fill(x, y - 1, r, w);
        this.fill(x, y + 1, r, w);
    }
}