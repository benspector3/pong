/* global $, sessionStorage*/

////////////////////////////////////////////////////////////////////////////////
///////////////////////// INITIALIZATION ///////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var REFRESH_RATE = 20;
var PADDLE_SPEED = 6;
var BALL_SPEED = 5;
var PADDLE_WIDTH = $('#paddle-left').width();
var PADDLE_HEIGHT = $('#paddle-left').height();
var BALL_SIZE = $('#ball').width();
var BOARD_WIDTH = $('#board').width();
var BOARD_HEIGHT = $('#board').height();
var KEY = {
  W: 87,
  D: 83,
  UP: 38,
  DOWN: 40,
  P: 80
};

var paddleLeft = {}, paddleRight = {};
paddleLeft.element = $('#paddle-left');
paddleRight.element = $('#paddle-right');

var ball = {};
ball.element = $('#ball');

var score = {};
score.element = $('#score');
score.left = score.right = 0;

var keysDown = {};
var updateInterval, isPaused;

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
  if (ball.y + BALL_SIZE > BOARD_HEIGHT || ball.y < 0) {
    ball.directionY *= -1;
  }

  // save which paddle the ball hit (if it hit either at all)
  var paddleHit = null;
  if (checkLeftPaddleBounce()) {
    paddleHit = paddleLeft;
  } else if (checkRightPaddleBounce()) {
    paddleHit = paddleRight;
  }

  // if it did, change the direction of the ball
  if (paddleHit) {
    ball.directionX *= -1;
    ball.directionY = getNewDirectionY(paddleHit, ball);
  }
}

function checkLeftPaddleBounce() {
  return (ball.x < paddleLeft.x + PADDLE_WIDTH) 
    && (ball.y + BALL_SIZE > paddleLeft.y) 
    && (ball.y < paddleLeft.y + PADDLE_HEIGHT)
}

function checkRightPaddleBounce() {
  return (ball.x + BALL_SIZE > paddleRight.x) 
    && (ball.y + BALL_SIZE > paddleRight.y) 
    && (ball.y < paddleRight.y + PADDLE_HEIGHT)
}

/**
 * 
 * @param {*} paddle the paddle off which the ball hit
 */
function getNewDirectionY(paddle) {
  var paddleMiddle = paddle.y + (PADDLE_HEIGHT / 2);

  var distanceFromMiddle = Math.abs(ball.y + (BALL_SIZE / 2) - paddleMiddle);
  var magnitude = distanceFromMiddle / (PADDLE_HEIGHT / 2);

  if (ball.y + (BALL_SIZE / 2) < paddleMiddle) {
    return -1 * magnitude;
  } else {
    return 1 * magnitude;
  }
}

/**
 * If the ball exits through either side, end the game
 */
function checkAndHandleScore() {
  var winner = "";
  if (ball.x < 0) {
    winner = "right";
  } else if (ball.x + BALL_SIZE > BOARD_WIDTH) {
    winner = "left";
  }

  if (winner) {
    increaseScore(winner);
    reset();
  }

}

/**
 * Increases the score of the point winner by modifying the `score` global Object
 */
function increaseScore(pointWinner) {
  // update and display the score
  score[pointWinner]++;
  score.element.text(score.left + " : " + score.right);
}

/**
 * Called when the `keydown` event occurs. 
 * 
 * Pauses the game if the P button is pressed. Otherwise adds
 * the keycode for the pressed key to the `keysDown` Object. The key
 * is unregistered when the `keyup` event occurs (see `handleKeyUp` below)
 */
function handleKeyDown(event) {
  if (event.which === KEY.P) {
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
 * Calculate the next position of the ball based on the current
 * position and direction of the ball and the BALL_SPEED constant.
 */
function moveBall() {
  var newPositionX = ball.x + BALL_SPEED * ball.directionX;
  var newPositionY = ball.y + BALL_SPEED * ball.directionY;

  moveObjectTo(ball, newPositionX, newPositionY);
}

/**
 * Sets the x and y properties of the Object. Moves the jQuery element 
 * held by the Object to the specified coordinates.
 * @param {Object} object : The object to move
 * @param {Number} x : The x coordinate to move the object to
 * @param {Number} y : The y coordinate to move the object to
 */
function moveObjectTo(object, x, y) {
  object.x = x;
  object.y = y;
  object.element.css('top', y);
  object.element.css('left', x);
}

/**
 * Moves the left and right paddles if any of the movement keys are actively
 * being pressed: W / D or Up / Down
 */
function movePaddles() {
  // left paddle
  if (keysDown[KEY.W]) {
    movePaddleUp(paddleLeft);
  } else if (keysDown[KEY.D]) {
    movePaddleDown(paddleLeft);
  }
  
  // right paddle
  if (keysDown[KEY.UP]) {
    movePaddleUp(paddleRight);
  } else if (keysDown[KEY.DOWN]) {
    movePaddleDown(paddleRight);
  }
  
  /**
   * Moves the paddle up until it hits the top of the screen.
   * @param {Object} paddle 
   */
  function movePaddleUp(paddle) {
    moveObjectTo(paddle, paddle.x, Math.max(paddle.y - PADDLE_SPEED, 0));
  }
  
  /**
   * Moves the paddle down until it hits the bottom of the screen.
   * @param {Object} paddle 
   */
  function movePaddleDown(paddle) {
    moveObjectTo(paddle, paddle.x,  Math.min(paddle.y + PADDLE_SPEED, BOARD_HEIGHT - PADDLE_HEIGHT));
  }
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