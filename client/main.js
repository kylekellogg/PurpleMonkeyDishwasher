var players = {},
	pid = '-1',

  keys = {
    'Left': 37,
    'Up': 38,
    'Right': 39,
    'Down': 40,
    37: 'Left',
    38: 'Up',
    39: 'Right',
    40: 'Down',
    'W': 87,
    'A': 65,
    'S': 83,
    'D': 68,
    87: 'W',
    65: 'A',
    83: 'S',
    68: 'D'
  },

  leftActive = false,
  upActive = false,
  rightActive = false,
  downActive = false,

  mapX = 0,
  mapY = 0,

	playersCollection,
	canvas,
	context,
	theGame,
	bg;

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

function Game() {
	this.players = [];
	this.secrets = [];
}

function Player() {
	this.x = 0;
	this.y = 0;
  this.fill = 'rgb(255,255,255)';

	this.bullets = 6;
	this.poison = 6;

	this.ai = true;
	this.role = '';
	this.state = '';
}

function Secret() {
	this.x = 0;
	this.y = 0;

	this.type = '';
}

function ready(e) {
  canvas = window.document.getElementById("game");
  context = canvas.getContext("2d");

  var viewportWidth = window.innerWidth;
  var viewportHeight = window.innerHeight;
  var canvasWidth = canvas.getAttribute("width");
  var canvasHeight = canvas.getAttribute("height");

  canvas.style.position = "absolute";
  canvas.style.top = (viewportHeight - canvasHeight) / 2 + "px";
  canvas.style.left = (viewportWidth - canvasWidth) / 2 + "px";

  bg = new Image();
  bg.addEventListener( 'load', function() {
  	draw();
  } );
  bg.src = 'images/floor.jpg?' + Date.now();

  Meteor.call( 'requestPlayerID', function( e, r ) {
    if ( e ) {
      // TODO: Handle error
      console.log( 'Error getting playerID' );
      return;
    }

    pid = r;
    if ( pid == -1 ) {
      console.log( 'PlayerID returned useless' );
      return;
    }
    console.log( 'PlayerID:', pid );

    players[ pid ] = new Player();
    players[ pid ].x = Math.round( Math.random() * (canvasWidth - 50) );
    players[ pid ].y = Math.round( Math.random() * (canvasHeight - 50) );
    players[ pid ].ai = false;
    players[ pid ].fill = 'rgb('+Math.round(Math.random()*255)+','+Math.round(Math.random()*255)+','+Math.round(Math.random()*255)+')';

    Meteor.call( 'update', pid, players[ pid ] );

    Meteor.subscribe( 'Players', function() {
    	//
    } );

    playersCollection = new Meteor.Collection( 'Players' );

    playersCollection.find().observe( {
    	added: function( n ) {
    		if ( !players[ n._id ] ) {
    			players[ n._id ] = n;
    			delete players[ n._id ]._id;
    		}
    	},

    	changed: function( n, o ) {
        if ( n._id === pid ) {
          return;
        }
    		if ( players[ n._id ] ) {
    			players[ n._id ] = n;
    			delete players[ n._id ]._id;
    		}
    	},

    	removed: function( n ) {
    		if ( players[ n._id ] ) {
    			delete players[ n._id ];
    		}
    	}
    } );

    (function animLoop() {
    	requestAnimFrame( animLoop );
    	update();
      draw();
    })();
  } );
}

function draw() {
  context.fillStyle = 'rgb(255,255,255)';
	context.drawImage( bg, mapX, mapY );

	for ( var id in players ) {
    context.fillStyle = players[ id ].fill || 'rgb(255,255,255)';
		context.fillRect( players[ id ].x, players[ id ].y, 50, 50 );
	}
}

//  Move using bool flags for directions
function update() {
	if ( leftActive ) {
    players[ pid ].x -= 5;
    mapX += 5;
  }
  if ( rightActive ) {
    players[ pid ].x += 5;
    mapX -= 5;
  }

  if ( upActive ) {
    players[ pid ].y -= 5;
    mapY += 5;
  }
  if ( downActive ) {
    players[ pid ].y += 5;
    mapY -= 5;
  }

  if ( mapX > 0 ) mapX = 0;
  if ( mapY > 0 ) mapY = 0;
  if ( mapX < -(bg.width - canvas.width) ) mapX = -(bg.width - canvas.width);
  if ( mapY < -(bg.height - canvas.height) ) mapY = -(bg.height - canvas.height);

  if ( players[ pid ].x > canvas.width - 100 ) players[ pid ].x = canvas.width - 100;
  if ( players[ pid ].y > canvas.height - 100 ) players[ pid ].y = canvas.height - 100;
  if ( players[ pid ].x < 50 ) players[ pid ].x = 50;
  if ( players[ pid ].y < 50 ) players[ pid ].y = 50;

	Meteor.call( 'update', pid, players[ pid ] );
}

window.onload = ready;

//  Reset player before returning to queue
window.onbeforeunload = function() {
  var x = players[ pid ].x,
    y = players[ pid ].y;
  players[ pid ] = new Player();
  players[ pid ].x = x;
  players[ pid ].y = y;
	Meteor.call( 'update', pid, players[ pid ] );
};

//  If key being pushed is recognized for game control, prevent default and flag true
window.onkeydown = function( e ) {
  switch ( e.keyCode ) {
    case keys[ 'Left' ]:
    case keys[ 'A' ]:
      leftActive = true;
      e.preventDefault();
      break;
    case keys[ 'Right' ]:
    case keys[ 'D' ]:
      rightActive = true;
      e.preventDefault();
      break;
    case keys[ 'Up' ]:
    case keys[ 'W' ]:
      upActive = true;
      e.preventDefault();
      break;
    case keys[ 'Down' ]:
    case keys[ 'S' ]:
      downActive = true;
      e.preventDefault();
      break;
  }
};

//  If key being released is recognized for game control, prevent default and flag false
window.onkeyup = function( e ) {
  switch ( e.keyCode ) {
    case keys[ 'Left' ]:
    case keys[ 'A' ]:
      leftActive = false;
      e.preventDefault();
      break;
    case keys[ 'Right' ]:
    case keys[ 'D' ]:
      rightActive = false;
      e.preventDefault();
      break;
    case keys[ 'Up' ]:
    case keys[ 'W' ]:
      upActive = false;
      e.preventDefault();
      break;
    case keys[ 'Down' ]:
    case keys[ 'S' ]:
      downActive = false;
      e.preventDefault();
      break;
  }
};
