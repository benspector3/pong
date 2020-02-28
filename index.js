$(document).ready(function(){
  /* global $, sessionStorage*/
  
  ////////////////////////////////////////////////////////////////////////////////
  ///////////////////////// INITIALIZATION ///////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  
  /**
   * Factory function that returns an Object to contain a HTML DOM element.
   * The input should be the CSS selector
   */
  function GameItem(selector) {
    var obj = {};
    obj.$element = $(selector);
    obj.width = obj.$element.width();
    obj.height = obj.$element.height();
    obj.x = 0;
    obj.y = 0;
    obj.velocityX = 0;
    obj.velocityY = 0;
    return obj;
  }

  // jQuery objects
  var $board = $('#board');
  var $score = $("#score");
  
  // factory function Objects
  var ball = GameItem('#ball');
  var paddleLeft = GameItem('#paddle-left');
  var paddleRight = GameItem('#paddle-right');
  
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
  var score = {
    'left': 0,
    'right': 0
  };
  
  var updateInterval;
  var paused = false;

  // challenge: randomize this value
  serve(Math.random() > 0.5 ? "right" : "left"); 

  /** Iniitalizes the positions of DOM elements and starts the ball moving */
  function serve(winner) {
    // position left paddle and set the velocity to 0
    paddleLeft.x = 0;
    paddleLeft.y = (BOARD_HEIGHT / 2) - (paddleLeft.height / 2);
    paddleLeft.velocityY = 0;
    
    // position right paddle and set the velocity to 0
    paddleRight.x = BOARD_WIDTH - paddleRight.width;
    paddleRight.y = (BOARD_HEIGHT / 2) - (paddleRight.height / 2);
    paddleRight.velocityY = 0;
    
    // the ball starts in the middle of the screen and has no vertical velocity
    ball.y = (BOARD_HEIGHT / 2);
    ball.velocityY = 0;
    
    // Position the ball to serve from the winner side (first winner is chosen randomly)
    if (winner === "left") {
      ball.x = paddleLeft.x + paddleLeft.width;
      ball.velocityX = BALL_SPEED;
    } else {
      ball.x = paddleRight.x - ball.width
      ball.velocityX = -BALL_SPEED;
    }
    
    
    // display the score, alert a new server, turn on keyboard and timer events
    $score.text(score.left + " : " + score.right);
    alert(winner + " is serving");
    turnOnEvents();
  }
  
  ////////////////////////////////////////////////////////////////////////////////
  ///////////////////////// CORE LOGIC ///////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  
  /* 
  * On each update tick update each bubble's position and check for
  * collisions with the walls.
  */
  function update() {
    moveGameItem(paddleLeft);
    moveGameItem(paddleRight);
    moveGameItem(ball);

    if (doCollide(ball, paddleLeft)) {
      bounceOffPaddle(paddleLeft)
    } 
    else if (doCollide(ball, paddleRight)) {
      bounceOffPaddle(paddleRight);
    }
    
    if (hasCollidedTopBottom()) {
      bounceOffTopBottom();
    }
    
    var winner = checkForWinner();
    if (winner !== null) {
      resolvePoint(winner);
    }
  }
  
  ////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////// HELPER FUNCTIONS /////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  
  /* setup helper functions */

  /* Movement helper functions */
  function moveGameItem(obj) {
    obj.x += obj.velocityX;
    obj.y += obj.velocityY;
    obj.$element.css('left', obj.x);
    obj.$element.css('top', obj.y);

    if (obj.y > BOARD_HEIGHT - obj.height) {
      obj.y = BOARD_HEIGHT - obj.height;

    }
    if (obj.y < 0) {
      obj.y = 0;
    }
  }
  
  /* Collisions/Bouncing helper functions*/
  
  /**
   * Returns true if two objects overlap, false otherwise. Assume each object is rectangular.
   */
  function doCollide(obj1, obj2) {
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

  function hasCollidedTopBottom() {
    var maxBallY = BOARD_HEIGHT - ball.height;
    var minBallY = 0;
    if (ball.y >= maxBallY || ball.y <= minBallY) {
      return true;
    }
  }
  
  // change only vertical direction when bouncing off roof or floor
  function bounceOffTopBottom() {
    ball.velocityY = -ball.velocityY;
  }
  
  /* Scoring Helper Functions */
  function checkForWinner() {
    var winner = null;
    if (ball.x < 0) {
      winner = "right";
    } else if (ball.x > BOARD_WIDTH - ball.width) {
      winner = "left";
    }
    return winner;
  }

  function resolvePoint(winner) {
    // stop the timer and turn off keyboard events
    turnOffEvents();
    
    // increase the score and check for an end game, serve otherwise
    score[winner]++;  

    if (score[winner] === 11) {
      endGame(winner);
    } else {
      serve(winner);
    }
  }
  
  function endGame(winner) {
    alert(winner + " wins!");
  }

  function pause() {
    if (paused) {
      updateInterval = setInterval(update, REFRESH_RATE);
    } else {
      clearInterval(updateInterval);
    }
    $("#pause").toggle();
    paused = !paused;
  }
  
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////// EVENT HANDLERS //////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  
  /**
   * Called when the `keydown` event occurs. 
   */
  function handleKeyDown(event) {
    var key = event.which;
    
    if (key === KEY_CODE.P) {
      pause();
    }
    if (paused) {
      return;
    }

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
   **/
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

  function turnOnEvents() {
    // start update interval and turn on keyboard inputs
    updateInterval = setInterval(update, REFRESH_RATE);
    $(document).on('keydown', handleKeyDown);
    $(document).on('keyup', handleKeyUp);
  }

  function turnOffEvents() {
    clearInterval(updateInterval);
    $(document).off();
  }
});