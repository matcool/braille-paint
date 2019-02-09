let grid;
let sx, sy;
let inverted = false;
let bSizeSlider;
let cButton;
let textP;
let tool = 'brush';

let onOverlay = false;

let ax, ay;


function setup() {
	let c = createCanvas(500, 500);
	c.parent("#braille-canvas");
	c.canvas.style['margin-top'] = floor(windowHeight / 2 - height / 2) + 'px';
	grid = new gridCanvas(60, 64);
	sx = width / grid.width;
	sy = height / grid.height;

	toolBtn('brush', 'brush');
	toolBtn('', 'eraser', 'fas fa-eraser');
	toolBtn('timeline', 'line');
	toolBtn('panorama_fish_eye', 'circle');
	toolBtn('fiber_manual_record', 'circleF');
	toolBtn('', 'bucket', 'fas fa-fill-drip');
	toolBtn('vignette', 'ellipse');
	toolBtn('', 'ellipseF', 'fas fa-egg')

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
	topMenuBtn('Clear', _ => grid.reset());

	bSizeSlider = createSlider(0, 6, 0);
	bSizeSlider.parent('#top-menu');
	bSizeSlider.style('position', 'absolute');
	bSizeSlider.style('left', floor(windowWidth / 2 - 100) + 'px');

	hideOverlays();
}

function topMenuBtn(name, callback) {
	let btn = createButton(name);
	btn.mouseClicked(callback);
	btn.parent('#top-menu');
}

function toolBtn(icon, tool_, hclass = "material-icons") {
	let btn = createElement('a', `<i class="${hclass}">${icon}</i>`);
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

function draw() {
	if (onOverlay)
		return
	let v = bSizeSlider.value();
	grid.bSize = v == 0 ? 0 : 2 * (v - 1) + 1;
	background(100)
	noStroke();
	fill(255);
	ellipseMode(CORNER);
	for (let y = 0; y < grid.height; y++) {
		for (let x = 0; x < grid.width; x++) {
			let p = grid.grid[y][x];
			if (p) {
				ellipse(x * sx, y * sy, sx, sy);
			}
		}
	}
	let gmx = Math.floor(mouseX / sx);
	let gmy = Math.floor(mouseY / sy);
	let pgmx = Math.floor(pmouseX / sx);
	let pgmy = Math.floor(pmouseY / sy);
	if (mouseIsPressed) {
		switch (tool) {
			case 'brush':
			case 'eraser':
				if (grid.inside(gmx, gmy)) grid.line(pgmx, pgmy, gmx, gmy, tool=='eraser');
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
			case 'circleF':
				if (ax == undefined) {
					ax = gmx;
					ay = gmy;
				}
				ellipseMode(CENTER);
				if (tool == 'circleF') fill(255);
				else noFill();
				stroke(255);
				strokeWeight(1);
				ellipse(ax * sx, ay * sy, dist(ax * sx, ay * sy, mouseX, mouseY) * 2);
				break;
			case 'ellipse':
			case 'ellipseF':
				if (grid.inside(gmx, gmy) && ax == undefined) {
					ax = gmx;
					ay = gmy;
				}
				ellipseMode(CENTER);
				if (tool == 'ellipseF') fill(255);
				else noFill();
				stroke(255);
				strokeWeight(1);
				ellipse(ax * sx, ay * sy, (mouseX - ax * sx) * 2, (mouseY - ay * sy) * 2);
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
			case 'circleF':
				grid.circle(ax, ay, Math.floor(dist(ax, ay, gmx, gmy)), tool == 'circleF');
				break;
			case 'ellipse':
			case 'ellipseF':
				grid.ellipse(ax, ay, Math.abs(gmx - ax), Math.abs(gmy - ay), tool == 'ellipseF');
				break;
		}
	}
	switch (tool) {
		case 'bucket':
			grid.fill(gmx, gmy, 0, 1);
			break;
	}
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
			let tile = checks.map(i => grid.grid[y + i[1]][x + i[0]] == inverted ? 0 : 1).join('');
			finalText += String.fromCharCode(0x2800 + parseInt(tile, 2));
		}
		finalText += '<br>';
	}
	textP.html(finalText);
	select('#braille-msgbox').parent().style.display = '';
	onOverlay = true;
}