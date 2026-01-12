/**
 * Senna Racer - Two Lane Version
 * - Only TWO lanes
 * - Cars sized to ~80% of lane height
 * - Player moves forward, world scrolls backward
 * - Obstacles come from the right toward the player
 */

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
let laneCenters = [];           // now only 2 centers
let labels = ["SUCCESS", "PATIENCE", "HEALTH", "LOVE", "WISDOM", "COURAGE", "GRATITUDE", "HAPPINESS", "KINDNESS", "FORTUNE"];

/* ================= PRELOAD ================= */
function preload() {
  soundFormats('mp3', 'ogg');
  bgSong = loadSound('song.mp3');
}

/* ================= LANES ================= */
function updateLanes() {
  let roadHeight = height - 2 * shoulderHeight;
  laneHeight = roadHeight / 2;           // TWO lanes
  laneCenters = [
    shoulderHeight + (laneHeight / 2),           // top lane center
    shoulderHeight + laneHeight + (laneHeight / 2)  // bottom lane center
  ];
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

/* ================= ROAD ================= */
function drawRoad() {
  background(135, 206, 235); // Sky

  let topColor, bottomColor, roadColor = 60;
  switch (currentBiome) {
    case 'forest':    topColor = bottomColor = color(34, 139, 34); break;
    case 'desert':    topColor = bottomColor = color(210, 180, 140); break;
    case 'lakeside':  topColor = color(0, 191, 255); bottomColor = color(34, 139, 34); break;
    case 'beach':     topColor = bottomColor = color(238, 221, 130); break;
  }

  // Shoulders
  noStroke();
  fill(topColor);
  rect(width/2, shoulderHeight/2, width, shoulderHeight);
  fill(bottomColor);
  rect(width/2, height - shoulderHeight/2, width, shoulderHeight);

  // Road surface (two lanes)
  fill(roadColor);
  rect(width/2, height/2, width, height - shoulderHeight*2);

  // One center line (dashed) between two lanes
  stroke(255);
  strokeWeight(5);
  bgOffset += gameSpeed;
  if (bgOffset > 100) bgOffset = 0;

  let centerY = shoulderHeight + laneHeight;
  for (let x = bgOffset - width; x < width + 100; x += 100) {
    line(x, centerY, x + 60, centerY);
  }
}

/* ================= GAMEPLAY ================= */
function playGame() {
  handleInput();
  player.update();
  player.display();

  // Spawn obstacles less frequently
  if (frameCount % 80 === 0) {
    obstacles.push(new Obstacle());
  }

  if (frameCount % 35 === 0) {
    sceneries.push(new Scenery());
  }

  if (frameCount % 1800 === 0) {
    currentBiome = random(biomes.filter(b => b !== currentBiome));
  }

  // Update & draw obstacles (move left toward player)
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].update();
    obstacles[i].display();
    if (obstacles[i].hits(player)) endGame();
    if (obstacles[i].offscreenLeft()) {
      obstacles.splice(i, 1);
      score++;
      if (score % 10 === 0) {
        gameSpeed += 0.4;
        if (gameSpeed > 14) gameSpeed = 14;
      }
    }
  }

  for (let i = sceneries.length - 1; i >= 0; i--) {
    sceneries[i].update();
    sceneries[i].display();
    if (sceneries[i].offscreenLeft()) sceneries.splice(i, 1);
  }

  drawHUD();
}

/* ================= CLASSES ================= */
class Player {
  constructor() {
    this.laneIndex = 1;                    // start in bottom lane (0 = top, 1 = bottom)
    this.x = width * 0.75;                 // fixed forward position
    this.y = laneCenters[this.laneIndex];
    this.targetY = this.y;
    this.vy = 0;
    this.halfWidth = 45;
    this.halfHeight = laneHeight * 0.4;    // ~80% of lane height (0.8 / 2 = 0.4)
  }

  update() {
    // Smooth lane change
    this.y = lerp(this.y, this.targetY, 0.18);

    // Keep inside road bounds
    this.y = constrain(this.y, shoulderHeight + this.halfHeight + 10, height - shoulderHeight - this.halfHeight - 10);
  }

  changeLane(up) {
    if (up && this.laneIndex > 0) {
      this.laneIndex--;
      this.targetY = laneCenters[this.laneIndex];
    } else if (!up && this.laneIndex < 1) {
      this.laneIndex++;
      this.targetY = laneCenters[this.laneIndex];
    }
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
    // ... (rest of your car drawing code remains unchanged)
    pop();
  }
}

class Obstacle {
  constructor() {
    this.laneIndex = floor(random(2));     // only 0 or 1
    this.x = width + random(100, 400);     // spawn right side
    this.y = laneCenters[this.laneIndex];
    this.color = color(random(80, 255), random(20, 120), random(20, 120));
    this.label = random(labels);
    this.caliperColor = color(random(150,255), random(0,100), random(100,255));
    this.halfWidth = 45;
    this.halfHeight = laneHeight * 0.4;    // ~80% of lane
  }

  update() {
    this.x -= gameSpeed;                   // move left toward player
  }

  display() {
    push();
    translate(this.x, this.y);
    scale(1.9);
    noStroke();
    fill(this.color);
    // ... (your original car shape code here)
    // Label
    fill(255);
    textSize(6);
    textAlign(CENTER, CENTER);
    text(this.label, 5, 2);
    pop();
  }

  hits(p) {
    let dx = abs(p.x - this.x);
    let dy = abs(p.y - this.y);
    return dx < p.halfWidth + this.halfWidth && dy < p.halfHeight + this.halfHeight;
  }

  offscreenLeft() {
    return this.x < -100;
  }
}

/* ================= INPUT ================= */
function handleInput() {
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) {      // W or UP
    player.changeLane(true);
  }
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) {    // S or DOWN
    player.changeLane(false);
  }

  // Optional tilt support (you can keep or remove)
  if (permissionGranted) {
    tiltX = constrain(tiltX, -25, 25);
    tiltY = constrain(tiltY, -25, 25);
    // You could use tiltY for very slight forward/back, but not needed here
  }
}

/* ================= MOUSE / TOUCH ================= */
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

/* ================= RESET ================= */
function resetGame() {
  score = 0;
  gameSpeed = 5;
  obstacles = [];
  sceneries = [];
  currentBiome = random(biomes);
  updateLanes();
  player = new Player();
}

/* ================= Keep the rest unchanged ================= */
// drawTitleScreen, drawInstructionScreen, drawGameOverScreen, drawHUD,
// Scenery class, sensor permission functions, windowResized, etc.
// remain exactly as in your original code
