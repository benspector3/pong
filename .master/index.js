/* global $, sessionStorage*/

////////////////////////////////////////////////////////////////////////////////
///////////////////////// INITIALIZATION ///////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Constant Variables
var REFRESH_RATE = 20;
var PADDLE_SPEED = 6;
var BALL_SPEED = 6;
var PADDLE_WIDTH = $('#paddle-left').width();
var PADDLE_HEIGHT = $('#paddle-left').height();
var BALL_SIZE = $('#ball').width();
var BOARD_WIDTH = $('#board').width();
var BOARD_HEIGHT = $('#board').height();
var KEY_CODE = {
  "W": 87,
  "D": 83,
  "UP": 38,
  "DOWN": 40,
  "P": 80
};

// Game Variables
var paddleLeft = {};
paddleLeft.$element = $('#paddle-left');

var paddleRight = {};
paddleRight.$element = $('#paddle-right');

var ball = {};
ball.$element = $('#ball');

var score = {};
score.$element = $('#score');
score.left = score.right = 0;

var keysDown;
var updateInterval
var isPaused;

startGame();

////////////////////////////////////////////////////////////////////////////////
///////////////////////// CORE LOGIC ///////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function startGame() {  
  // position the paddles and the ball
  setInitialPositions();

  // randomize initial ball.directionX
  ball.directionX = Math.random() > 0.5 ? -1 : 1;
  ball.directionY = 0;

  // empty the keysDown 
  keysDown = {};

  // turn on keyboard inputs
  $(document).on('keydown', handleKeyDown);
  $(document).on('keyup', handleKeyUp);
  
  // start update interval
  updateInterval = setInterval(update, REFRESH_RATE);
  isPaused = false;
}

/* 
 * On each update tick update each bubble's position and check for
 * collisions with the walls.
 */
function update() {
  movePaddles();
  moveBall();

  checkAndHandleBounce();
  checkAndHandleScore();
}

/* 
This Function resets the game. It may be called when the game is over
and a new game should be started.
*/
function reset() {  
    // stop updateInterval
  clearInterval(updateInterval);

  // turn off keyboard inputs
  $(document).off();

  // restart the game after 500 ms
  setTimeout(function() {
    
    // anything else you might want to do between points...

    // reset positions of Objects
    startGame();
  }, 500);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////// HELPER FUNCTIONS ////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Bounce the ball off the paddles and the ceiling. 
 * getNewDirectionY calculates the new angle based on where
 * along the paddle the ball hits
 */
function checkAndHandleBounce() {
  // change vertical direction when bouncing off roof or floor
  var maxBallY = BOARD_HEIGHT - BALL_SIZE;
  var minBallY = 0;

  if (ball.y > maxBallY) {
    ball.directionY = -Math.abs(ball.directionY);
  } else if (ball.y < minBallY) {
    ball.directionY = Math.abs(ball.directionY);
  }

  // save which paddle the ball hit (if it hit either at all)
  var paddleHit = null, newDirectionX;
  if (checkLeftPaddleCollision()) {
    paddleHit = paddleLeft;
    newDirectionX = 1;
  } else if (checkRightPaddleCollision()) {
    paddleHit = paddleRight;
    newDirectionX = -1;
  }

  // if it did, change the direction of the ball
  if (paddleHit) {
    ball.directionX = newDirectionX;
    ball.directionY = getNewDirectionY(paddleHit, ball);
  }
}

/**
 * If the ball exits through either side, increase the score of the winner
 * and reset the game
 */
function checkAndHandleScore() {
  var maxBallX = BOARD_WIDTH - BALL_SIZE;
  var minBallX = 0;
  
  var winner;
  if (ball.x < minBallX) {
    winner = "right";
  } else if (ball.x > maxBallX) {
    winner = "left";
  }

  if (winner) {
    increaseScore(winner);
    reset();
  }
}

function checkLeftPaddleCollision() {
  return (ball.x < paddleLeft.x + PADDLE_WIDTH) 
    && (ball.y + BALL_SIZE > paddleLeft.y) 
    && (ball.y < paddleLeft.y + PADDLE_HEIGHT)
}

function checkRightPaddleCollision() {
  return (ball.x + BALL_SIZE > paddleRight.x) 
    && (ball.y + BALL_SIZE > paddleRight.y) 
    && (ball.y < paddleRight.y + PADDLE_HEIGHT)
}

/**
 * The further away from the middle of the paddle the ball is
 * when it hits the paddle, the sharper the angle of the bounce
 * @param {*} paddle the paddle off which the ball hit
 */
function getNewDirectionY(paddle) {
  /* The displacement of the ball is the distance between the middle 
  of the ball and the middle of the paddle */
  var paddleMiddleY = paddle.y + (PADDLE_HEIGHT / 2);
  var ballMiddleY = ball.y + (BALL_SIZE / 2);
  var displacementY = ballMiddleY - paddleMiddleY;

  /* The magnitude is the % of the displacement of half the paddle height 
  This may be modified to change how the angle is calculated. */
  var magnitude = displacementY / (PADDLE_HEIGHT / 2);
  return magnitude;
}

/**
 * Called when the `keydown` event occurs. 
 * 
 * Pauses the game if the P button is pressed. Otherwise adds
 * the keycode for the pressed key to the `keysDown` Object. The key
 * is unregistered when the `keyup` event occurs (see `handleKeyUp` below)
 */
function handleKeyDown(event) {
  if (event.which === KEY_CODE.P) {
    pause();
    return;
  }

  keysDown[event.which] = true;
}

/**
 * Called when the `keyup` event occurs.
 * 
 * Deletes the keycode for the released key from the `keysDown` Object.
 */
function handleKeyUp(event) {
  delete keysDown[event.which];
}

/**
 * Increases the score of the point winner by modifying the `score` global Object
 */
function increaseScore(pointWinner) {
  // update and display the score
  score[pointWinner]++;
  score.$element.text(score.left + " : " + score.right);
}

/**
 * Calculate the next position of the ball based on the current
 * position and direction of the ball and the BALL_SPEED constant.
 */
function moveBall() {
  var newPositionX = ball.x + BALL_SPEED * ball.directionX;
  var newPositionY = ball.y + BALL_SPEED * ball.directionY;

  moveObjectTo(ball, newPositionX, newPositionY);
}

/**
 * Sets the x and y properties of the Object and moves the jQuery element 
 * held by the Object to the specified coordinates.
 * @param {Object} object : The object to move.
 * @param {Number} newX : The x coordinate to move the object to
 * @param {Number} newY : The y coordinate to move the object to
 */
function moveObjectTo(object, newX, newY) {
  object.x = newX;
  object.y = newY;
  object.$element.css('left', newX);
  object.$element.css('top', newY);
}

/**
 * Moves the left and right paddles if any of the movement keys are actively
 * being pressed: W / D or Up / Down
 */
function movePaddles() {
  // left paddle
  if (keysDown[KEY_CODE.W]) {
    movePaddleUp(paddleLeft);
  } else if (keysDown[KEY_CODE.D]) {
    movePaddleDown(paddleLeft);
  }
  
  // right paddle
  if (keysDown[KEY_CODE.UP]) {
    movePaddleUp(paddleRight);
  } else if (keysDown[KEY_CODE.DOWN]) {
    movePaddleDown(paddleRight);
  }
}

/**
 * Moves the paddle up until it hits the top of the screen.
 * @param {Object} paddle 
 */
function movePaddleUp(paddle) {
  var minPaddleY = 0;
  var newPaddleX = paddle.x;
  var newPaddleY = paddle.y - PADDLE_SPEED;
  moveObjectTo(paddle, newPaddleX, Math.max(newPaddleY, minPaddleY));
}

/**
 * Moves the paddle down until it hits the bottom of the screen.
 * @param {Object} paddle 
 */
function movePaddleDown(paddle) {
  var maxPaddleY = BOARD_HEIGHT - PADDLE_HEIGHT;
  var newPaddleX = paddle.x;
  var newPaddleY = paddle.y + PADDLE_SPEED;
  moveObjectTo(paddle, newPaddleX, Math.min(newPaddleY, maxPaddleY));
}

/* 
This Function, when called, will pause the game by turning off/on the
updateInterval ticking timer
*/
function pause() {
  // Show/Hide the "Paused" message
  $('#paused').toggle();
  
  // if the game is not currently paused, stop the ticking timer interval
  // otherwise start it up again and save the interval ID in updateInterval
  if (!isPaused) {
    clearInterval(updateInterval)
  } 
  else {
    updateInterval = setInterval(update, REFRESH_RATE) 
  }

  // flip the value of isPaused
  isPaused = !isPaused;
}

/* Sets starting positions of the paddles and the ball
and randomly chooses the inital direction of the ball */
function setInitialPositions() {
  var boardMiddleY = BOARD_HEIGHT / 2,
    boardMiddleX = BOARD_WIDTH / 2;

  var leftPaddleXi = 0,
    leftPaddleYi = boardMiddleY - (PADDLE_HEIGHT / 2),
    rightPaddleXi = BOARD_WIDTH - PADDLE_WIDTH,
    rightPaddleYi = boardMiddleY - (PADDLE_HEIGHT / 2);

  moveObjectTo(paddleLeft, leftPaddleXi, leftPaddleYi);
  moveObjectTo(paddleRight, rightPaddleXi, rightPaddleYi);
  moveObjectTo(ball, boardMiddleX, boardMiddleY);
}