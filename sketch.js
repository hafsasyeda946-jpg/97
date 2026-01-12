/**
 * Modified Game: Senna Racer (Final Update)
 * - Vertical lanes (left, middle, right) with dashed vertical lines scrolling down.
 * - Player and obstacles now fit perfectly into one lane width with little allowance (~76% lane width used by car).
 * - Same car size and scale for player and obstacles.
 * - Proper lane-based racing: obstacles spawn from top in random lane centers, move down.
 * - Player near bottom, steers left/right primarily (tiltX/arrows), slight y movement for fine control.
 * - Scenery on left/right shoulders, parallax scrolling down.
 * - Shoulder renamed to shoulderWidth, full height sides.
 * - Collision uses dynamic halfWidth/halfHeight scaled to laneWidth.
 * - Other changes preserved (labels on cars, biomes, etc.).
 */
/* ================= GLOBAL VARIABLES ================= */
let gameState = 'TITLE';
let player;
let obstacles = [];
let sceneries = [];
let score = 0;
let highScore = 0;
let gameSpeed = 5;
let bgOffset = 0;
let bgSong;
let permissionGranted = false;
let permissionButton;
let tiltX = 0;
let tiltY = 0;
let currentBiome = 'forest';
let biomes = ['forest', 'desert', 'lakeside', 'beach'];
let shoulderWidth = 120;
let laneCenters = [];
let laneWidth = 0;
let labels = ["SUCCESS", "PATIENCE", "HEALTH", "LOVE", "WISDOM", "COURAGE", "GRATITUDE", "HAPPINESS", "KINDNESS", "FORTUNE"];

/* ================= PRELOAD ================= */
function preload() {
  soundFormats('mp3', 'ogg');
  bgSong = loadSound('song.mp3');
}

/* ================= LANES ================= */
function updateLanes() {
  let roadWidth = width - 2 * shoulderWidth;
  laneWidth = roadWidth / 3;
  laneCenters = [];
  for (let i = 0; i < 3; i++) {
    laneCenters[i] = shoulderWidth + (i * laneWidth) + (laneWidth / 2);
  }
}

/* ================= SETUP ================= */
function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  updateLanes();
  player = new Player();
  sceneries = [];
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    permissionButton = createButton('Enable Tilt Sensors');
    permissionButton.position(width / 2 - 75, height / 2 + 100);
    permissionButton.style('padding', '10px');
    permissionButton.style('border-radius', '5px');
    permissionButton.mousePressed(requestSensorPermission);
  } else if (typeof DeviceOrientationEvent !== 'undefined') {
    window.addEventListener('deviceorientation', handleOrientation);
    permissionGranted = true;
  }
}

/* ================= MAIN LOOP ================= */
function draw() {
  drawRoad();
  switch (gameState) {
    case 'TITLE':
      drawTitleScreen();
      break;
    case 'INSTRUCTIONS':
      drawInstructionScreen();
      break;
    case 'PLAYING':
      playGame();
      break;
    case 'GAMEOVER':
      drawGameOverScreen();
      break;
  }
}

/* ================= ENVIRONMENT ================= */
function drawRoad() {
  background(135, 206, 235); // Sky blue
  let leftColor, rightColor, roadColor = 60;
  switch (currentBiome) {
    case 'forest':
      leftColor = rightColor = color(34, 139, 34); // Green
      break;
    case 'desert':
      leftColor = rightColor = color(210, 180, 140); // Tan sand
      break;
    case 'lakeside':
      leftColor = color(0, 191, 255); // Blue water left
      rightColor = color(34, 139, 34); // Green right
      break;
    case 'beach':
      leftColor = rightColor = color(238, 221, 130); // Golden sand
      break;
  }
  // Left shoulder
  noStroke();
  fill(leftColor);
  rect(shoulderWidth / 2, height / 2, shoulderWidth, height);
  // Right shoulder
  fill(rightColor);
  rect(width - shoulderWidth / 2, height / 2, shoulderWidth, height);
  // Road
  fill(roadColor);
  rect(width / 2, height / 2, width - 2 * shoulderWidth, height);
  // Vertical lane lines (dashes scrolling down)
  stroke(255);
  strokeWeight(5);
  bgOffset -= gameSpeed;
  if (bgOffset <= -120) bgOffset += 120;
  let roadW = width - 2 * shoulderWidth;
  for (let l = 1; l < 3; l++) {
    let lx = shoulderWidth + (l * roadW) / 3;
    for (let y = bgOffset % 120; y < height; y += 120) {
      line(lx, y + 20, lx, y + 80);
    }
  }
}

/* ================= GAME SCREENS ================= */
function drawTitleScreen() {
  fill(0, 0, 0, 150);
  rect(width / 2, height / 2, width, height);
  fill(255, 204, 0);
  textSize(50);
  text('SENNA RACER', width / 2, height / 2 - 50);
  textSize(20);
  fill(255);
  text('Safety First! Avoid the Cars.', width / 2, height / 2);
  fill(0, 255, 150);
  text('Tap to Start', width / 2, height / 2 + 60);
}

function drawInstructionScreen() {
  fill(0, 0, 0, 180);
  rect(width / 2, height / 2, width, height);
  fill(255);
  textSize(24);
  text('DRIVER INSTRUCTIONS', width / 2, height / 3);
  textSize(18);
  text(
    'Tilt your phone to steer left/right.\nOn Laptop: Use Arrow Keys.\nDon’t hit the other cars!',
    width / 2,
    height / 2
  );
  fill(0, 255, 150);
  text('Tap to Ride', width / 2, height / 2 + 120);
}

function drawGameOverScreen() {
  fill(0, 0, 0, 200);
  rect(width / 2, height / 2, width, height);
  fill(255, 50, 50);
  textSize(48);
  text('CRASH!', width / 2, height / 2 - 60);
  fill(255);
  textSize(24);
  text(`Final Distance: ${score}m`, width / 2, height / 2);
  text(`Session Record: ${highScore}m`, width / 2, height / 2 + 40);
  fill(0, 255, 150);
  text('Tap to Restart', width / 2, height / 2 + 100);
}

/* ================= GAMEPLAY ================= */
function playGame() {
  handleInput();
  player.update();
  player.display();
  if (frameCount % 65 === 0) {
    obstacles.push(new Obstacle());
  }
  if (frameCount % 35 === 0) {
    sceneries.push(new Scenery());
  }
  if (frameCount % 1800 === 0) {
    currentBiome = random(biomes.filter(b => b !== currentBiome));
  }
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].update();
    obstacles[i].display();
    if (obstacles[i].hits(player)) endGame();
    if (obstacles[i].offscreen()) {
      obstacles.splice(i, 1);
      score++;
      if (score % 10 === 0) {
        gameSpeed += 0.5;
        if (gameSpeed > 15) gameSpeed = 15;
      }
    }
  }
  for (let i = sceneries.length - 1; i >= 0; i--) {
    sceneries[i].update();
    sceneries[i].display();
    if (sceneries[i].offscreen()) {
      sceneries.splice(i, 1);
    }
  }
  drawHUD();
}

/* ================= HUD & INPUT ================= */
function drawHUD() {
  fill(255, 255, 0);
  noStroke();
  textSize(22);
  textAlign(LEFT);
  text(`Distance: ${score}m`, 30, 50);
  textAlign(RIGHT);
  text(`Best: ${highScore}m`, width - 30, 50);
  textAlign(CENTER);
}

function handleInput() {
  if (permissionGranted) {
    tiltX = constrain(tiltX, -25, 25);
    tiltY = constrain(tiltY, -25, 25);
    player.applyForce(tiltX * 0.15, tiltY * 0.06); // Stronger x steer, weaker y
  }
  if (keyIsDown(LEFT_ARROW)) player.applyForce(-0.8, 0);
  if (keyIsDown(RIGHT_ARROW)) player.applyForce(0.8, 0);
  if (keyIsDown(UP_ARROW)) player.applyForce(0, -0.4);
  if (keyIsDown(DOWN_ARROW)) player.applyForce(0, 0.4);
}

function mousePressed() {
  if (gameState === 'TITLE') {
    gameState = 'INSTRUCTIONS';
    if (!bgSong.isPlaying()) {
      bgSong.loop();
      bgSong.setVolume(0.4);
    }
  } else if (gameState === 'INSTRUCTIONS' || gameState === 'GAMEOVER') {
    resetGame();
    gameState = 'PLAYING';
  }
}

/* ================= GAME FLOW ================= */
function resetGame() {
  score = 0;
  gameSpeed = 5;
  obstacles = [];
  sceneries = [];
  currentBiome = random(biomes);
  updateLanes();
  player = new Player();
}

function endGame() {
  gameState = 'GAMEOVER';
  if (score > highScore) highScore = score;
}

/* ================= SENSOR HANDLING ================= */
async function requestSensorPermission() {
  try {
    const orientationPermission = await DeviceOrientationEvent.requestPermission();
    const motionPermission = await DeviceMotionEvent.requestPermission();
    if (orientationPermission === 'granted' && motionPermission === 'granted') {
      permissionGranted = true;
      window.addEventListener('deviceorientation', handleOrientation);
      permissionButton.remove();
    }
  } catch (error) {
    console.error(error);
  }
}

function handleOrientation(event) {
  tiltX = event.gamma || 0;
  tiltY = event.beta || 0;
}

/* ================= CLASSES ================= */
class Player {
  constructor() {
    this.x = laneCenters[1];
    this.y = height - 120;
    this.vx = 0;
    this.vy = 0;
    this.friction = 0.94;
    this.halfWidth = laneWidth * 0.38;
    this.halfHeight = 28;
  }
  applyForce(fx, fy) {
    this.vx += fx;
    this.vy += fy;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= this.friction;
    this.vy *= this.friction * 0.92;
    this.x = constrain(this.x, shoulderWidth + this.halfWidth * 1.3, width - shoulderWidth - this.halfWidth * 1.3);
    this.y = constrain(this.y, height * 0.72, height - 70);
  }
  display() {
    push();
    translate(this.x, this.y);
    scale(1.95);
    noStroke();
    fill(255, 69, 0);
    beginShape();
    vertex(-40, 8);
    bezierVertex(-40, 8, -35, -2, -25, -5);
    bezierVertex(-15, -8, 0, -8, 15, -5);
    bezierVertex(25, -3, 35, 0, 40, 5);
    bezierVertex(45, 10, 30, 12, 15, 12);
    bezierVertex(0, 12, -20, 10, -40, 8);
    endShape(CLOSE);
    fill(0);
    quad(-20, -5, 10, -5, 15, 0, -15, 0);
    fill(50);
    triangle(-10, 5, 0, 10, -5, 10);
    fill(0);
    stroke(100);
    strokeWeight(1);
    ellipse(-25, 10, 15, 15);
    ellipse(25, 10, 15, 15);
    noStroke();
    fill(0, 100, 255);
    ellipse(-25, 10, 8, 8);
    ellipse(25, 10, 8, 8);
    fill(50);
    rect(35, -5, 20, 3);
    quad(35, -5, 40, -15, 50, -15, 45, -5);
    stroke(50);
    strokeWeight(2);
    line(38, -2, 38, 5);
    line(45, -2, 45, 5);
    noStroke();
    fill(0);
    triangle(30, 12, 40, 18, 25, 18);
    triangle(-40, 0, -35, -5, -40, -5);
    triangle(-40, 5, -35, 10, -40, 10);
    fill(100);
    ellipse(30, 8, 5, 3);
    fill(255, 255, 0);
    ellipse(-38, -2, 6, 3);
    ellipse(-38, 2, 6, 3);
    fill(255, 0, 0);
    ellipse(38, 3, 4, 2);
    ellipse(38, 7, 4, 2);
    fill(150);
    ellipse(18, -4, 5, 3);
    fill(0, 0, 0, 150);
    quad(-15, -6, 5, -6, 10, -1, -10, -1);
    fill(255, 255, 255, 100);
    textSize(4);
    text('midevs', -5, 5);
    pop();
  }
}

class Obstacle {
  constructor() {
    this.laneIndex = floor(random(3));
    this.x = laneCenters[this.laneIndex];
    this.y = -100;
    this.color = color(random(80, 255), random(20, 120), random(20, 120));
    this.label = random(labels);
    this.caliperColor = color(random(150,255), random(0,100), random(100,255));
    this.halfWidth = laneWidth * 0.38;
    this.halfHeight = 28;
  }
  update() {
    this.y += gameSpeed;
  }
  display() {
    push();
    translate(this.x, this.y);
    scale(1.95);
    noStroke();
    fill(this.color);
    beginShape();
    vertex(-40, 8);
    bezierVertex(-40, 8, -35, -2, -25, -5);
    bezierVertex(-15, -8, 0, -8, 15, -5);
    bezierVertex(25, -3, 35, 0, 40, 5);
    bezierVertex(45, 10, 30, 12, 15, 12);
    bezierVertex(0, 12, -20, 10, -40, 8);
    endShape(CLOSE);
    fill(20);
    quad(-20, -5, 10, -5, 15, 0, -15, 0);
    fill(0);
    ellipse(-25, 10, 15, 15);
    ellipse(25, 10, 15, 15);
    fill(red(this.caliperColor), green(this.caliperColor), blue(this.caliperColor));
    ellipse(-25, 10, 8, 8);
    ellipse(25, 10, 8, 8);
    fill(40);
    rect(35, -5, 18, 3);
    fill(0);
    triangle(-40, 0, -35, -5, -40, -5);
    // Label printed ON the car body (side panel area)
    fill(255);
    noStroke();
    textSize(6);
    textAlign(CENTER, CENTER);
    text(this.label, 5, 2); // Main placement - middle-right side
    textSize(4);
    fill(220);
    text(this.label, -12, -2); // Smaller faint version on left side for style
    pop();
  }
  hits(p) {
    let dx = abs(p.x - this.x);
    let dy = abs(p.y - this.y);
    return dx < (p.halfWidth + this.halfWidth) && dy < (p.halfHeight + this.halfHeight);
  }
  offscreen() {
    return this.y > height + 60;
  }
}

class Scenery {
  constructor() {
    let typePool = ['house', 'house', 'house', 'lily', 'lily', 'hydrangea', 'hydrangea', 'bird', 'bird', 'bird'];
    this.type = random(typePool);
    this.side = random() < 0.5 ? 'left' : 'right';
    this.x = this.side === 'left' ? random(25, shoulderWidth - 25) : width - random(25, shoulderWidth - 25);
    this.y = -random(150, 350);
    if (this.type === 'bird') {
      this.y = -random(80, 280);
      this.x = random(shoulderWidth + 20, width - shoulderWidth - 20); // Birds over road
    }
    if (this.type === 'lily' || this.type === 'hydrangea') {
      this.y = -random(200, 400);
    }
    this.scale = random(0.7, 1.1);
    this.height = this.type === 'lily' ? random(200, 320) : random(120, 220);
  }
  update() {
    this.y += gameSpeed * 0.75; // Parallax
  }
  display() {
    push();
    translate(this.x, this.y);
    scale(this.scale);
    switch (this.type) {
      case 'lily':
        stroke(0, 150, 0);
        strokeWeight(7 / this.scale);
        line(0, 0, 0, -this.height);
        noStroke();
        fill(0, 200, 0, 200);
        for (let i = 1; i < 5; i++) {
          let ly = -this.height * i / 5;
          push();
          translate(0, ly);
          rotate(PI / 4);
          ellipse(12, 0, 25, 6);
          rotate(-PI / 2);
          ellipse(12, 0, 25, 6);
          pop();
        }
        fill(255, 182, 193);
        for (let a = 0; a < 8; a++) {
          push();
          rotate(a * TWO_PI / 8);
          ellipse(0, -this.height - 15, 14, 40);
          pop();
        }
        fill(255, 105, 180);
        for (let a = 0; a < 6; a++) {
          push();
          rotate(a * TWO_PI / 6 + PI / 6);
          ellipse(0, -this.height - 10, 10, 30);
          pop();
        }
        fill(255, 255, 0);
        ellipse(0, -this.height - 15, 12, 12);
        stroke(255, 215, 0);
        strokeWeight(1.5 / this.scale);
        for (let a = 0; a < 8; a++) {
          push();
          rotate(a * TWO_PI / 8);
          line(0, -this.height - 15, 3, -this.height - 28);
          pop();
        }
        noStroke();
        break;
      case 'hydrangea':
        fill(0, 128, 0);
        ellipse(0, 0, 70, 50);
        ellipse(-25, 0, 50, 40);
        ellipse(25, 0, 50, 40);
        fill(106, 90, 205);
        for (let i = 0; i < 40; i++) {
          let bx = random(-35, 35);
          let by = random(-25, 25);
          ellipse(bx, by, 10, 10);
        }
        fill(255, 240, 245);
        for (let i = 0; i < 15; i++) {
          let bx = random(-35, 35);
          let by = random(-25, 25);
          ellipse(bx, by, 6, 6);
        }
        break;
      case 'house':
        fill(139, 69, 19);
        rect(0, 0, 70, 60);
        fill(100, 50, 0);
        triangle(-35, -30, 35, -30, 0, -70);
        fill(80);
        rect(25, -55, 12, 25);
        fill(0, 150, 255, 150);
        rect(-20, 5, 20, 20);
        stroke(255);
        strokeWeight(2 / this.scale);
        line(-20, 5, -20, 25);
        line(-10, 15, 10, 15);
        line(-20, 15, 10, 15);
        noStroke();
        fill(0, 150, 255, 150);
        rect(20, 5, 20, 20);
        stroke(255);
        strokeWeight(2 / this.scale);
        line(20, 5, 20, 25);
        line(10, 15, 30, 15);
        line(20, 15, 30, 15);
        noStroke();
        fill(100, 50, 0);
        rect(0, 25, 25, 35);
        fill(255);
        ellipse(8, 25, 4, 4);
        break;
      case 'bird':
        fill(100);
        ellipse(0, 0, 20, 12);
        triangle(-12, 0, -25, -6, -25, 6);
        fill(80);
        ellipse(12, -3, 10, 10);
        fill(255);
        ellipse(15, -4, 3, 3);
        stroke(80);
        strokeWeight(3 / this.scale);
        noFill();
        arc(-3, -6, 25, 12, PI / 2, 3 * PI / 2);
        arc(-3, 6, 25, 12, PI + PI / 2, PI / 2);
        noStroke();
        break;
    }
    pop();
  }
  offscreen() {
    return this.y > height + 120;
  }
}

/* ================= RESPONSIVE ================= */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateLanes();
  if (player) {
    player.x = laneCenters[1];
    player.y = height - 120;
    player.halfWidth = laneWidth * 0.38;
    player.halfHeight = 28;
  }
}
