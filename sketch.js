/**
 * Modified Game: Senna Racer (Final Update)
 * - Top-down forward racing: 2 vertical lanes (left, right), cars move forward (down screen).
 * - Player fixed near bottom, steers left/right to change/switch lanes, slight up/down adjust.
 * - Obstacles spawn ahead (top) in random lane, approach down (forward motion illusion).
 * - Cars visually/collision fit 80% of lane width (tight x, allowance y).
 * - Dynamic car scale based on laneWidth.
 * - Road divider dashed lines scroll down.
 * - Scenery parallax on shoulders/over road.
 * - All previous features preserved (biomes left/right shoulders, labels on cars, etc.).
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
let
