/* global $, sessionStorage*/

////////////////////////////////////////////////////////////////////////////////
///////////////////////// VARIABLE DECLARATIONS ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var PADDLE_WIDTH = 20;
var PADDLE_HEIGHT = 80;
var PADDLE_SPEED = 10;
var BALL_SPEED = 5;
var BOARD = $('#board');
var GAME_WIDTH = BOARD.width();
var GAME_HEIGHT = $(window).height();
var REFRESH_RATE = 20;
var KEY = {
  W: 87,
  D: 83,
  UP: 38,
  DOWN: 40,
  P: 80
};

var game,
keysDown,
updateInterval,
paddleLeft,
paddleRight,
ball,
score,
isPaused;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////// GAME SETUP //////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

init();

function init() {
  // set initial paddle positions
  keysDown = {}
  
  // paddles
  paddleLeft = {};
  paddleLeft.element = $('#paddle-left');
  paddleLeft.y = GAME_HEIGHT / 2;
  paddleLeft.x = 0;
  moveObjectTo(paddleLeft, paddleLeft.x, paddleLeft.y);

  paddleRight = {};
  paddleRight.element = $('#paddle-right');
  paddleRight.y = GAME_HEIGHT / 2;
  paddleRight.x = GAME_WIDTH;
  moveObjectTo(paddleRight, paddleRight.x, paddleRight.y);
  
  // ball
  ball = {}
  ball.element = $('#ball');
  ball.directionX = Math.random() > 0.5 ? -1 : 1;
  ball.directionY = Math.random() > 0.5 ? -1 : 1;
  ball.x = GAME_WIDTH / 2;
  ball.y = GAME_HEIGHT / 2;
  moveObjectTo(ball, ball.x, ball.y);
  
  // Score Variables
  score = {};
  score.left = score.right = 0;
  score.element = $('#score');

  // turn on keyboard inputs
  $(document).on('keydown', handleKeyDown);
  $(document).on('keyup', handleKeyUp);
  
  // start update interval
  updateInterval = setInterval(update, REFRESH_RATE);
  isPaused = false;
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

////////////////////////////////////////////////////////////////////////////////
///////////////////////// HELPER FUNCTIONS /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function checkForBounce() {
  // change direction when bouncing off roof or floor
  if (ball.y > GAME_HEIGHT) {
    ball.directionY = -1;
  } else if (ball.y < 0) {
    ball.directionY = 1;
  }
  
  // change direction when bouncing off either paddle
  if (ball.x < paddleLeft.x + PADDLE_WIDTH) {
    // need to also make sure the ball bounces between the top/bottom of the paddle
    if (ball.y >= paddleLeft.y && ball.y <= paddleLeft.y + PADDLE_HEIGHT) {
      ball.directionX = 1;
    }
  }
  else if (ball.x > paddleRight.x - PADDLE_WIDTH) {
    if (ball.y >= paddleRight.y && ball.y <= paddleRight.y + PADDLE_HEIGHT) {
      ball.directionX = -1;
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
  ball.x += BALL_SPEED * ball.directionX;
  ball.y += BALL_SPEED * ball.directionY;

  moveObjectTo(ball, ball.x, ball.y);
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
}

function movePaddleUp(paddle) {
  var newPositionY = paddle.y - PADDLE_SPEED;
  
  // stop the paddle from moving beyond the top of the screen
  if (newPositionY < 0) {
    newPositionY = 0;
  }

  moveObjectTo(paddle, paddle.x, newPositionY);
}

function movePaddleDown(paddle) {
  var newPositionY = paddle.y + PADDLE_SPEED;

  // stop the paddle from moving beyond the bottom of the screen
  if (newPositionY > GAME_HEIGHT - PADDLE_HEIGHT) {
    newPositionY = GAME_HEIGHT - PADDLE_HEIGHT;
  }

  moveObjectTo(paddle, paddle.x, newPositionY);
}

function moveObjectTo(object, x, y) {
  object.x = x;
  object.y = y;
  object.element.css('top', y);
  object.element.css('left', x);
}

function reset() {
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
    init();
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
  if (!isPaused) {
    isPaused = true;
    $('#paused').toggle();
    clearInterval(updateInterval);
  } else {
    isPaused = false;
    $('#paused').toggle();
    updateInterval = setInterval(update, REFRESH_RATE);
    console.log(updateInterval);
  }
}
