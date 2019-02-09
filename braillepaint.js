let grid;
let sx, sy;
let inverted = false;
let bSizeSlider;
let cButton;
let textP;
let tool = 'brush';

let onOverlay = false;

let ax, ay;

let dotGraphics;


function setup() {
	let c = createCanvas(500, 500);
	c.parent("#braille-canvas");
	c.canvas.style['margin-top'] = floor(windowHeight / 2 - height / 2) + 'px';
	grid = new gridCanvas(60, 64);
	sx = width / grid.width;
	sy = height / grid.height;
	dotGraphics = createGraphics(width, height);
	dotGraphics.background(100);

	toolBtn('brush', 'brush');
	toolBtn('timeline', 'line');
	toolBtn('panorama_fish_eye', 'circle');
	toolBtn('', 'bucket', 'fas fa-fill-drip','bucket (replaces stroke with fill)');
	toolBtn('', 'ellipse', 'fas fa-egg')

	let closeBrailleTxtbox = createElement('a', `<i class="material-icons">close</i>`);
	closeBrailleTxtbox.mouseClicked(hideOverlays);
	closeBrailleTxtbox.parent('#msgbox-overlay');
	let icon = closeBrailleTxtbox.child()[0];
	icon.style.fontSize = '10em';
	icon.style.color = '#fff';

	textP = createElement('p', 'hello!');
	textP.parent('#braille-msgbox');
	textP.style('font-family', 'Iosevka Web');
	textP.style('line-height', '100%');

	topMenuBtn('Generate', genBraille);
	topMenuBtn('Invert', _ => inverted = !inverted);
	topMenuBtn('Clear', _ => {
		grid.reset();
		drawDots()
	});
	let brushes = [null,0,1,2];
	topMenuBtn('Stroke: 1', btn => {
		let i = brushes.indexOf(grid.strokeC);
		grid.strokeC = brushes[(i+1)%brushes.length];
		btn.html(`Stroke: ${grid.strokeC}`);
	})
	topMenuBtn('Fill: 1', btn => {
		let i = brushes.indexOf(grid.fillC);
		grid.fillC = brushes[(i+1)%brushes.length];
		btn.html(`Fill: ${grid.fillC}`);
	})

	bSizeSlider = createSlider(0, 6, 0);
	bSizeSlider.parent('#top-menu');
	bSizeSlider.style('position', 'absolute');
	bSizeSlider.style('left', floor(windowWidth / 2 - 100) + 'px');

	hideOverlays();
}

function topMenuBtn(name, callback) {
	let btn = createButton(name);
	btn.mouseClicked(_ => callback(btn));
	btn.parent('#top-menu');
}

function toolBtn(icon, tool_, hclass = "material-icons", title) {
	if (title == undefined) title = tool_;
	let btn = createElement('a', `<i class="${hclass}">${icon}</i>`);
	btn.attribute('title', title);
	btn.mouseClicked(_ => tool = tool_);
	btn.parent('#tools');
	btn.style('cursor', 'default');
	btn.mouseOver(_ => btn.style('color', '#fff'));
	btn.mouseOut(_ => btn.style('color', 'inherit'));
	createElement('br').parent('#tools');
}

function hideOverlays() {
	selectAll('.dark-overlay').forEach(i => i.hide());
	onOverlay = false;
}

function mouseOob() {
	return mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height
}

function tileToBoolean(t, x, y) {
	if (t == 1) return true;
	if (t == 2 && ((x + (y % 2)) % 2 == 0)) return true;

	return false;
}

function drawDots() {
	dotGraphics.background(100)
	dotGraphics.noStroke();
	dotGraphics.fill(255);
	dotGraphics.ellipseMode(CORNER);
	for (let y = 0; y < grid.height; y++) {
		for (let x = 0; x < grid.width; x++) {
			let p = grid.grid[y][x];
			if (tileToBoolean(p, x, y)) {
				dotGraphics.ellipse(x * sx, y * sy, sx, sy);
			}
		}
	}
}

function draw() {
	if (onOverlay)
		return
	grid.bSize = bSizeSlider.value();
	background(100);
	image(dotGraphics, 0, 0);
	let gmx = Math.floor(mouseX / sx);
	let gmy = Math.floor(mouseY / sy);
	let pgmx = Math.floor(pmouseX / sx);
	let pgmy = Math.floor(pmouseY / sy);
	if (mouseIsPressed) {
		switch (tool) {
			case 'brush':
				if (grid.inside(gmx, gmy)) grid.line(pgmx, pgmy, gmx, gmy);
				drawDots();
				break;
			case 'line':
				stroke(255);
				strokeWeight(grid.bSize == 0 ? sx : (grid.bSize * 2 + 1) * sx);
				if (ax == undefined) {
					ax = gmx;
					ay = gmy;
				}
				line(ax * sx + sx / 2, ay * sy + sy / 2, gmx * sx + sx / 2, gmy * sy + sy / 2);
				break;
			case 'circle':
			case 'ellipse':
				if (grid.inside(gmx, gmy) && ax == undefined) {
					ax = gmx;
					ay = gmy;
				}
				ellipseMode(CENTER);
				if (grid.fillC == 1) fill(255);
				else noFill();
				stroke(255);
				strokeWeight(1);
				if (tool == 'circle') ellipse(ax * sx, ay * sy, dist(ax * sx, ay * sy, mouseX, mouseY) * 2);
				else ellipse(ax * sx, ay * sy, (mouseX - ax * sx) * 2, (mouseY - ay * sy) * 2);
				break;
		}
	}
}

function mouseReleased() {
	let gmx = Math.floor(mouseX / sx);
	let gmy = Math.floor(mouseY / sy);
	if (ax != undefined) {
		switch (tool) {
			case 'line':
				grid.line(ax, ay, gmx, gmy);
				break;
			case 'circle':
				grid.circle(ax, ay, Math.floor(dist(ax, ay, gmx, gmy)));
				break;
			case 'ellipse':
				grid.ellipse(ax, ay, Math.abs(gmx - ax), Math.abs(gmy - ay));
				break;
		}
	}
	switch (tool) {
		case 'bucket':
			grid.fill(gmx, gmy, grid.strokeC, grid.fillC);
			break;
	}
	drawDots();
	ax = ay = undefined;
}

function genBraille() {
	let finalText = '';
	let checks = [
		[1, 3],
		[0, 3],
		[1, 2],
		[1, 1],
		[1, 0],
		[0, 2],
		[0, 1],
		[0, 0]
	];
	/* braille characters are u+(0x2800+0bjhgdbfca)
	ab
	cd
	fg
	hj
	*/
	for (let y = 0; y < grid.height; y += 4) {
		for (let x = 0; x < grid.width; x += 2) {
			let tile = checks.map(i => tileToBoolean(grid.grid[y + i[1]][x + i[0]], x + i[0], y + i[1]) == inverted ? 0 : 1).join('');
			finalText += String.fromCharCode(0x2800 + parseInt(tile, 2));
		}
		finalText += '<br>';
	}
	textP.html(finalText);
	select('#braille-msgbox').parent().style.display = '';
	onOverlay = true;
}