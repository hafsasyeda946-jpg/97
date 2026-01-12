/**
 * Modified Game: Senna Racer (Final Update)
 * - Cars move horizontally (left to right scroll).
 * - 3 horizontal lanes (top, middle, bottom) separated by dashed lines.
 * - Obstacles spawn at random lane center Y positions on left, move right.
 * - Player starts in middle lane center Y on right, can move Y to change lanes.
 * - Cars sized to fit lanes with little allowance (collision ~76% lane height).
 * - Player X for within-lane dodge, Y for lane changes.
 * - Dynamic halfHeight based on laneHeight.
 * - Labels on cars preserved.
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
let shoulderHeight = 100;
let laneHeight = 0;
let laneCenters = [];
let labels = ["SUCCESS", "PATIENCE", "HEALTH", "LOVE", "WISDOM", "COURAGE", "GRATITUDE", "HAPPINESS", "KINDNESS", "FORTUNE"];

/* ================= PRELOAD ================= */
function preload() {
  soundFormats('mp3', 'ogg');
  bgSong = loadSound('song.mp3');
}

/* ================= LANES ================= */
function updateLanes() {
  let roadHeight = height - 2 * shoulderHeight;
  laneHeight = roadHeight / 3;
  laneCenters = [];
  for (let i = 0; i < 3; i++) {
    laneCenters[i] = shoulderHeight + (i * laneHeight) + (laneHeight / 2);
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
  let topColor, bottomColor, roadColor = 60;
  switch (currentBiome) {
    case 'forest':
      topColor = bottomColor = color(34, 139, 34); // Green
      break;
    case 'desert':
      topColor = bottomColor = color(210, 180, 140); // Tan sand
      break;
    case 'lakeside':
      topColor = color(0, 191, 255); // Blue water
      bottomColor = color(34, 139, 34); // Green
      break;
    case 'beach':
      topColor = bottomColor = color(238, 221, 130); // Golden sand
      break;
  }
  // Top shoulder
  noStroke();
  fill(topColor);
  rect(width / 2, shoulderHeight / 2, width, shoulderHeight);
  // Bottom shoulder
  fill(bottomColor);
  rect(width / 2, height - shoulderHeight / 2, width, shoulderHeight);
  // Road
  fill(roadColor);
  rect(width / 2, height / 2, width, height - shoulderHeight * 2);
  // Horizontal lane lines (dashes scrolling left to right)
  stroke(255);
  strokeWeight(4);
  bgOffset += gameSpeed;
  if (bgOffset > 100) bgOffset = 0;
  for (let l = 1; l < 3; l++) {
    let ly = shoulderHeight + l * (height - shoulderHeight * 2) / 3;
    for (let x = bgOffset; x > -width; x -= 100) {
      line(x - 70, ly, x - 20, ly);
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
    'Tilt your phone to steer.\nOn Laptop: Use Arrow Keys.\nDon’t hit the other cars!',
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
    player.applyForce(tiltX * 0.12, tiltY * 0.12);
  }
  if (keyIsDown(LEFT_ARROW)) player.applyForce(-0.6, 0);
  if (keyIsDown(RIGHT_ARROW)) player.applyForce(0.6, 0);
  if (keyIsDown(UP_ARROW)) player.applyForce(0, -0.6);
  if (keyIsDown(DOWN_ARROW)) player.applyForce(0, 0.6);
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
    this.x = width - 200;
    this.y = laneCenters[1];
    this.vx = 0;
    this.vy = 0;
    this.friction = 0.94;
    this.halfWidth = 40;
    this.halfHeight = laneHeight * 0.38;
  }
  applyForce(fx, fy) {
    this.vx += fx;
    this.vy += fy;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.x = constrain(this.x, 80, width - 80);
    this.y = constrain(this.y, shoulderHeight + this.halfHeight + 10, height - shoulderHeight - this.halfHeight - 10);
  }
  display() {
    push();
    translate(this.x, this.y);
    scale(1.9);
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
    this.w = 80;
    this.x = -this.w - random(0, 100);
    this.y = laneCenters[floor(random(3))];
    this.color = color(random(80, 255), random(20, 120), random(20, 120));
    this.label = random(labels);
    this.caliperColor = color(random(150,255), random(0,100), random(100,255));
    this.halfWidth = 40;
    this.halfHeight = laneHeight * 0.38;
  }
  update() {
    this.x += gameSpeed;
  }
  display() {
    push();
    translate(this.x, this.y);
    scale(1.9);
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
    return (
      p.x + this.halfWidth > this.x - 40 &&
      p.x - this.halfWidth < this.x + 40 &&
      p.y + this.halfHeight > this.y - 15 &&
      p.y - this.halfHeight < this.y + 15
    );
  }
  offscreen() {
    return this.x > width + 100;
  }
}

class Scenery {
  constructor() {
    let typePool = ['house', 'house', 'house', 'lily', 'lily', 'hydrangea', 'hydrangea', 'bird', 'bird', 'bird'];
    this.type = random(typePool);
    this.x = -random(50, 150);
    this.y = random(shoulderHeight + 50, height - shoulderHeight - 50);
    this.side = 'bottom';
    if (this.type === 'bird') {
      this.y = random(50, 200);
      this.offx = random(-120, 120);
    } else if (this.type === 'house' || this.type === 'hydrangea') {
      this.y = random(height - 150, height - 50);
      this.offx = random() < 0.5 ? random(-width/3, -width/6) : random(width/6, width/3);
    } else if (this.type === 'lily') {
      this.y = random(height - 100, height - 50);
      this.offx = random() < 0.5 ? random(-width/3, -width/6) : random(width/6, width/3);
    }
    this.scale = random(0.8, 1.2);
    this.height = (this.type === 'lily') ? random(180, 280) : random(100, 200);
  }
  update() {
    this.x += gameSpeed * 0.8; // Parallax for depth
  }
  display() {
    push();
    translate(this.x + this.offx, this.y);
    scale(this.scale);
    switch (this.type) {
      case 'lily':
        stroke(0, 200, 0);
        strokeWeight(5);
        line(0, 0, 0, -this.height);
        noStroke();
        fill(255, 182, 193); // Pink
        for (let a = 0; a < 6; a++) {
          push();
          rotate(a * TWO_PI / 6);
          ellipse(0, -this.height - 10, 10, 30);
          pop();
        }
        fill(255, 255, 0);
        ellipse(0, -this.height - 10, 8, 8);
        break;
      case 'hydrangea':
        fill(0, 128, 0);
        ellipse(0, 0, 50, 30);
        fill(106, 90, 205); // Purple-blue
        for (let i = 0; i < 20; i++) {
          let bx = random(-25, 25);
          let by = random(-15, 15);
          ellipse(bx, by, 8, 8);
        }
        break;
      case 'house':
        fill(150);
        rect(0, 0, 50, 40);
        fill(100);
        triangle(-25, -20, 25, -20, 0, -50);
        fill(255);
        rect(-10, 10, 10, 10); // Window
        rect(10, 10, 10, 10); // Window
        fill(139, 69, 19);
        rect(0, 25, 15, 30); // Door
        break;
      case 'bird':
        noStroke();
        fill(0);
        triangle(0, 0, -15, -5, -15, 5);
        stroke(0);
        strokeWeight(2);
        line(-10, 0, -20, -10);
        line(-10, 0, -20, 10);
        break;
    }
    pop();
  }
  offscreen() {
    return this.x > width + 50;
  }
}

/* ================= RESPONSIVE ================= */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateLanes();
}
