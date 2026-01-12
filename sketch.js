/**
 * Modified Game: Senna Racer (Final Update)
 * - Cars move horizontally (right to left scroll).
 * - 3 horizontal lanes (top, middle, bottom) separated by dashed lines.
 * - Obstacles spawn at random lane center Y positions.
 * - Player starts in middle lane center Y, can move Y to change lanes.
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

/* ================= PRELOAD
