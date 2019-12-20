/* global $, sessionStorage*/

////////////////////////////////////////////////////////////////////////////////
///////////////////////// VARIABLE DECLARATIONS ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var REFRESH_RATE = 20;
var PADDLE_SPEED = 6;
var BALL_SPEED = 5;
var PADDLE_WIDTH = $('#paddle-left').width();
var PADDLE_HEIGHT = $('#paddle-left').height();
var BALL_SIZE = $('#ball').width();
var GAME_WIDTH = $('#board').width();
var GAME_HEIGHT = $('#board').height();
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

////////////////////////////////////////////////////////////////////////////////
////////////////////////////// GAME SETUP //////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

init();

function init() {  
  // position the paddles and the ball
  setInitialPositions();

  keysDown = {};

  // turn on keyboard inputs
  $(document).on('keydown', handleKeyDown);
  $(document).on('keyup', handleKeyUp);
  
  // start update interval
  updateInterval = setInterval(update, REFRESH_RATE);
  isPaused = false;
}

/* Sets starting positions of the paddles and the ball
and randomly chooses the inital direction of the ball */
function setInitialPositions() {
  // set Initial positions of the paddles
  moveObjectTo(paddleLeft, 0, GAME_HEIGHT / 2 - (PADDLE_HEIGHT / 2));
  moveObjectTo(paddleRight, GAME_WIDTH - PADDLE_WIDTH, GAME_HEIGHT / 2 - (PADDLE_HEIGHT / 2));
  
  // set initial position of the ball
  moveObjectTo(ball, GAME_WIDTH / 2, GAME_HEIGHT / 2);
  
  // randomize horizontal direction of ball
  ball.directionX = Math.random() > 0.5 ? -1 : 1;
  ball.directionY = 0;
}

////////////////////////////////////////////////////////////////////////////////
///////////////////////// GAME LOGIC ///////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/* 
 * On each update tick update each bubble's position and check for
 * collisions with the walls.
 */
function update() {
  movePaddles();
  moveBall();

  checkForBounce();
  checkForScore();
}

function checkForBounce() {
  // change vertical direction when bouncing off roof or floor
  if (ball.y + BALL_SIZE > GAME_HEIGHT || ball.y < 0) {
    ball.directionY *= -1;
  }

  // change horizontal direction when bouncing off either paddle
  // also change vertical direction based on where on the paddle the ball hits
  if ((ball.x < paddleLeft.x + PADDLE_WIDTH) && (ball.y > paddleLeft.y) && (ball.y < paddleLeft.y + PADDLE_HEIGHT)) {
    ball.directionX = 1;
    ball.directionY = getNewDirectionY(paddleLeft);
  }

  if ((ball.x + BALL_SIZE > paddleRight.x) && (ball.y > paddleRight.y) && (ball.y < paddleRight.y + PADDLE_HEIGHT)) {
    ball.directionX = -1;
    ball.directionY = getNewDirectionY(paddleRight);
  }

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
}

function checkForScore() {
  // If the ball exits through either side, end the game
  if (ball.x < 0) {
    reset("right");
  } else if (ball.x > GAME_WIDTH) {
    reset("left");
  }
}

function moveBall() {
  var newPositionX = ball.x + BALL_SPEED * ball.directionX;
  var newPositionY = ball.y + BALL_SPEED * ball.directionY;

  moveObjectTo(ball, newPositionX, newPositionY);
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
    moveObjectTo(paddle, paddle.x,  Math.min(paddle.y + PADDLE_SPEED, GAME_HEIGHT - PADDLE_HEIGHT));
  }
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

/* 
This Function resets the game. It may be called when the game is over
and a new game should be started.
*/
function reset(pointWinner) {  
  // update and display the score
  score[pointWinner]++;
  score.element.text(score.left + " : " + score.right);

  // stop updateInterval
  clearInterval(updateInterval);

  // turn off keyboard inputs
  $(document).off();

  // restart the game after 500 ms
  setTimeout(function() {
    
    // anything else you might want to do between points...

    // reset positions of Objects
    init();
  }, 500);
 
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////// KEYBOARD FUNCTIONS //////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/* 
This Function is the Callback Function for 'keydown' events.

The moment when a key is pressed, its KeyCode is registered in 
the keysDown Object with the value true to indicate that the
key is actively being pressed.

If the P button is pressed, pause the game

event.which returns the keycode of the key that is pressed when the
keydown event occurs
*/
function handleKeyDown(event) {
  if (event.which === KEY.P) {
    pause();
    return;
  }

  keysDown[event.which] = true;
}

/* 
This Function is the Callback Function for 'keyup' events.

When a key is released, delete that key from the keysDown Object as
it is no longer actively being pressed.
*/
function handleKeyUp(event) {
  delete keysDown[event.which];
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
