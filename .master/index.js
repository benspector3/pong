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

setInitialPositions();
startGame();

function startGame() {  
  setInitialPositions();

  // turn on keyboard inputs
  keysDown = {}
  $(document).on('keydown', handleKeyDown);
  $(document).on('keyup', handleKeyUp);
  
  // start update interval
  updateInterval = setInterval(update, REFRESH_RATE);
  isPaused = false;
}

function setInitialPositions(winningPaddle) {
  // set Initial positions of the paddles
  moveObjectTo(paddleLeft, 0, GAME_HEIGHT / 2 - (PADDLE_HEIGHT / 2));
  moveObjectTo(paddleRight, GAME_WIDTH - PADDLE_WIDTH, GAME_HEIGHT / 2 - (PADDLE_HEIGHT / 2));
  
  // set initial position + randomize direction of ball
  moveObjectTo(ball, GAME_WIDTH / 2, GAME_HEIGHT / 2);
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
    score.right++;
    reset();
  } else if (ball.x > GAME_WIDTH) {
    score.left++;
    reset();
  }
}

function moveBall() {
  var newPositionX = ball.x + BALL_SPEED * ball.directionX;
  var newPositionY = ball.y + BALL_SPEED * ball.directionY;

  moveObjectTo(ball, newPositionX, newPositionY);
}

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
  
  function movePaddleUp(paddle) {
    moveObjectTo(paddle, paddle.x, Math.max(0, paddle.y - PADDLE_SPEED));
  }
  
  function movePaddleDown(paddle) {
    moveObjectTo(paddle, paddle.x,  Math.min(paddle.y + PADDLE_SPEED, GAME_HEIGHT - PADDLE_HEIGHT));
  }
}

function moveObjectTo(object, x, y) {
  object.x = x;
  object.y = y;
  object.element.css('top', y);
  object.element.css('left', x);
}

function reset() {
  setInitialPositions();
  
  // display the proper score
  score.element.text(score.left + " : " + score.right);

  // stop update function from running
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
////////////////////////// KEYBOARD FUNCTIONS //////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/* 
event.which returns the keycode of the key that is pressed when the
keydown event occurs
*/
function handleKeyDown(event) {
  keysDown[event.which] = true;
  
  if (event.which === KEY.P) {
    pause();
  }
}

function handleKeyUp(event) {
  delete keysDown[event.which];
}

function pause() {
  $('#paused').toggle();
  
  if (isPaused) {
    updateInterval = setInterval(update, REFRESH_RATE) 
  } else {
    clearInterval(updateInterval)
  }

  isPaused = !isPaused;
}
