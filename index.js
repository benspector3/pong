/* global $, sessionStorage*/

////////////////////////////////////////////////////////////////////////////////
///////////////////////// INITIALIZATION ///////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// jQuery objects
var $board = $('#board');
var $score = $("#score");

// factory function Objects
var ball = getGameObject('#ball');
var paddleLeft = getGameObject('#paddle-left');
var paddleRight = getGameObject('#paddle-right');

// Constant Variables
var REFRESH_RATE = 20;
var PADDLE_SPEED = 6;
var BALL_SPEED = 6;
var BOARD_WIDTH = $board.width();
var BOARD_HEIGHT = $board.height();
var KEY_CODE = {
  "W": 87,
  "S": 83,
  "UP": 38,
  "DOWN": 40,
  "P": 80
};

// Game Variables
var keysDown;
var updateInterval;
var score;

/**
 * Factory function that returns an Object with the following properties:
 * - $element <Object>: jQuery Object of the HTML element with the given id
 * - width <Number>: width of the HTML element
 * - height <Number>: height of the HTML element
 * - x <Number>: the x-coordinate for the top left corner of the object
 * - y <Number>: the y-coordinate for the top left corner of the object
 * - move <Function>: move the $element to the current x,y coordinate 
 */
function getGameObject(id) {
  var obj = {};
  obj.$element = $(id);
  obj.width = obj.$element.width();
  obj.height = obj.$element.height();
  obj.x = obj.y = 0;
  obj.velocityX = obj.velocityY = 0;
  obj.move = function() {
    obj.$element.css('left', obj.x);
    obj.$element.css('top', obj.y);
  }

  return obj;
}

function initialize() {  
  // turn on keyboard inputs
  keysDown = {};
  $(document).on('keydown', handleKeyDown);
  $(document).on('keyup', handleKeyUp);

  // start update interval
  updateInterval = setInterval(update, REFRESH_RATE);

  score = {
    'left': 0,
    'right': 0
  }

  serve(Math.random() > 0.5 ? "left" : "right");
}

////////////////////////////////////////////////////////////////////////////////
///////////////////////// CORE LOGIC ///////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function serve(winner) {
  alert(winner + " is serving");
  
  // position left paddle and set the velocity to 0
  paddleLeft.x = 0;
  paddleLeft.y = (BOARD_HEIGHT / 2) - (paddleLeft.height / 2);
  paddleLeft.velocityY = 0;

  // position right paddle and set the velocity to 0
  paddleRight.x = BOARD_WIDTH - paddleRight.width;
  paddleRight.y = (BOARD_HEIGHT / 2) - (paddleRight.height / 2);
  paddleRight.velocityY = 0;
  
  // Position the ball to serve from the winner side (first winner is chosen randomly)
  if (winner === "left") {
    ball.x = paddleLeft.x + paddleLeft.width;
    ball.velocityX = BALL_SPEED;
  } else {
    ball.x = paddleRight.x - ball.width
    ball.velocityX = -BALL_SPEED;
  }
  
  // the ball starts in the middle of the screen and has no vertical velocity
  ball.y = (BOARD_HEIGHT / 2);
  ball.velocityY = 0;

  // display the score
  $score.text(score.left + " : " + score.right);
}

/* 
 * On each update tick update each bubble's position and check for
 * collisions with the walls.
 */
function update() {
  movePaddles();
  moveBall();
  
  if (objectsCollide(ball, paddleLeft)) {
    bounceOffPaddle(paddleLeft)
  } 
  else if (objectsCollide(ball, paddleRight)) {
    bounceOffPaddle(paddleRight);
  }
  
  if (hasHitFloorOrCeiling()) {
    bounceOffFloorOrCeiling();
  }

  var winner = hasPlayerWonPoint();
  if (winner) {
    resolvePoint(winner);
  }
}

////////////////////////////////////////////////////////////////////////////////
///////////////////////////// HELPER FUNCTIONS /////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/* Movement */

function movePaddles() { 
  // move the paddles but prevent them from moving off the screen
  paddleLeft.y += paddleLeft.velocityY;
  paddleLeft.y = Math.max(Math.min(paddleLeft.y, BOARD_HEIGHT - paddleLeft.height), 0);
  paddleLeft.move();

  paddleRight.y += paddleRight.velocityY;
  paddleRight.y = Math.max(Math.min(paddleRight.y, BOARD_HEIGHT - paddleRight.height), 0);
  paddleRight.move();
}

/**
 * Calculate the next position of the ball based on the current
 * position and direction of the ball and the BALL_SPEED constant.
 */
function moveBall() {
  ball.x += ball.velocityX;
  ball.y += ball.velocityY;
  ball.move();
}

/* Bouncing */

/**
 * Returns true if two objects overlap, false otherwise. Assume each object is rectangular.
 */
function objectsCollide(obj1, obj2) {
  var left1 = { "x": obj1.x, "y": obj1.y };
  var right1 = { "x": obj1.x + obj1.width, "y": obj1.y + obj1.height};
  var left2 = { "x": obj2.x, "y": obj2.y };
  var right2 = { "x": obj2.x + obj2.width, "y": obj2.y + obj2.height};
  
  // If one rectangle is on left side of other they do not overlap
  if (left2.x > right1.x || left1.x > right2.x) {
    return false; 
  }

  // If one rectangle is above other they do not overlap
  if (right2.y < left1.y || right1.y < left2.y) {
    return false; 
  }
  
  return true;
}

function bounceOffPaddle(paddle) {
  // bounce off the paddle horizontally
  ball.velocityX *= -1;

  /* The magnitude of the ball is the % distance from the middle of the paddle 
  At the top of the paddle displacement = 1, at the middle displacement = 0 */
  var paddleMiddleY = paddle.y + (paddle.height / 2);
  var ballMiddleY = ball.y + (ball.height / 2);
  var magnitude = (ballMiddleY - paddleMiddleY) / (paddle.height / 2);

  // bounce off the paddle at an angle 
  ball.velocityY = BALL_SPEED * magnitude;
}

function hasHitFloorOrCeiling() {
  var maxBallY = BOARD_HEIGHT - ball.height;
  var minBallY = 0;
  return ball.y > maxBallY || ball.y < minBallY;
}

// change only vertical direction when bouncing off roof or floor
function bounceOffFloorOrCeiling() {
  ball.velocityY = -ball.velocityY;
}

/* Scoring */

function hasPlayerWonPoint() {
  if (ball.x < 0) {
    return "right";
  } else if (ball.x > BOARD_WIDTH - ball.width) {
    return "left";
  }
  return "";
}

function resolvePoint(winner) {
  score[winner]++;
  if (score[winner] === 11) {
    endGame(winner);
  } else {
    serve(winner);
  }
}

function endGame(winner) {
  clearInterval(updateInterval);
  $(document).off();
  alert(winner + " wins!");
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////// KEYBOARD FUNCTIONS //////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Called when the `keydown` event occurs. 
 * 
 * Pauses the game if the P button is pressed. Otherwise adds
 * the keycode for the pressed key to the `keysDown` Object. The key
 * is unregistered when the `keyup` event occurs (see `handleKeyUp` below)
 */
function handleKeyDown(event) {
  var key = event.which;

  // move the left paddle
  if (key === KEY_CODE.W) {
    paddleLeft.velocityY = -PADDLE_SPEED;
  } else if (key === KEY_CODE.S) {
    paddleLeft.velocityY = PADDLE_SPEED;
  }

  // move the right paddle
  if (key === KEY_CODE.UP) {
    paddleRight.velocityY = -PADDLE_SPEED;
  } else if (key === KEY_CODE.DOWN) {
    paddleRight.velocityY = PADDLE_SPEED;
  }

}

/**
 * Called when the `keyup` event occurs.
 * 
 * Deletes the keycode for the released key from the `keysDown` Object.
 */
function handleKeyUp(event) {
  var key = event.which;

  // move the left paddle
  if (key === KEY_CODE.W || key === KEY_CODE.S) {
    paddleLeft.velocityY = 0;
  }

  // move the right paddle
  if (key === KEY_CODE.UP || key === KEY_CODE.DOWN) {
    paddleRight.velocityY = 0;
  }
}