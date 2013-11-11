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
  this.mapX = 0;
  this.mapY = 0;
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
    players[ pid ].x = 50;
    players[ pid ].y = 50;
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
  var mx = !!pid && !!players && !!players[ pid ] ? players[ pid ].mapX : 0,
    my = !!pid && !!players && !!players[ pid ] ? players[ pid ].mapY : 0;
	context.drawImage( bg, mx, my );

	for ( var id in players ) {
    context.fillStyle = players[ id ].fill || 'rgb(255,255,255)';
    var x = players[ id ].x,
      y = players[ id ].y;
    if ( id !== pid && !players[ id ].ai ) {
      x = Math.abs( players[ id ].mapX ) + players[ id ].x + players[ pid ].mapX;
      y = Math.abs( players[ id ].mapY ) + players[ id ].y + players[ pid ].mapY;
    }
		context.fillRect( x, y, 50, 50 );
	}
}

//  Move using bool flags for directions
function update() {
  var p;
	if ( leftActive ) {
    players[ pid ].x -= 5;
    if ( players[ pid ].x < 50 ) players[ pid ].x = 50;

    players[ pid ].mapX += 5;
    if ( players[ pid ].mapX > 0 ) {
      players[ pid ].mapX = 0;
    } else {
      for ( p in players ) {
        if ( p !== pid && players[ p ].ai ) {
          players[ p ].x += 5;
        }
      }
    }
  }
  if ( rightActive ) {
    players[ pid ].x += 5;
    if ( players[ pid ].x > canvas.width - 100 ) players[ pid ].x = canvas.width - 100;

    players[ pid ].mapX -= 5;
    if ( players[ pid ].mapX < -(bg.width - canvas.width) ) {
      players[ pid ].mapX = -(bg.width - canvas.width);
    } else {
      for ( p in players ) {
        if ( p !== pid && players[ p ].ai ) {
          players[ p ].x -= 5;
        }
      }
    }
  }

  if ( upActive ) {
    players[ pid ].y -= 5;
    if ( players[ pid ].y < 50 ) players[ pid ].y = 50;

    players[ pid ].mapY += 5;
    if ( players[ pid ].mapY > 0 ) {
      players[ pid ].mapY = 0;
    } else {
      for ( p in players ) {
        if ( p !== pid && players[ p ].ai ) {
          players[ p ].y += 5;
        }
      }
    }
  }
  if ( downActive ) {
    players[ pid ].y += 5;
    if ( players[ pid ].y > canvas.height - 100 ) players[ pid ].y = canvas.height - 100;

    players[ pid ].mapY -= 5;
    if ( players[ pid ].mapY < -(bg.height - canvas.height) ) {
      players[ pid ].mapY = -(bg.height - canvas.height);
    } else {
      for ( p in players ) {
        if ( p !== pid && players[ p ].ai ) {
          players[ p ].y -= 5;
        }
      }
    }
  }

  var d = context.getImageData( players[ pid ].x, players[ pid ].y, 50, 50 ).data,
    walls = {
      left: false,
      right: false,
      up: false,
      down: false
    }
  for ( var x = 0; x < 50; x++ ) {
    for ( var y = 0; y < 50; y++ ) {
      var pos = (y * 50 + x) * 4,
        r = d[ pos ],
        g = d[ pos + 1 ],
        b = d[ pos + 2 ],
        black = r === 0 && g === 0 && b === 0;

      if ( x === 0 && black ) {
        console.log( 'up wall' );
        walls.up = true;
      } else if ( x === 49 && black ) {
        console.log( 'down wall' );
        walls.down = true;
      }

      if ( y === 0 && black ) {
        console.log( 'left wall' );
        walls.left = true;
      } else if ( y === 49 && black ) {
        console.log( 'right wall' );
        walls.right = true;
      }
    }
  }

  if ( walls.left && leftActive ) {
    players[ pid ].x += 5;
    if ( players[ pid ].x > canvas.width - 100 ) players[ pid ].x = canvas.width - 100;

    players[ pid ].mapX -= 5;
    if ( players[ pid ].mapX < -(bg.width - canvas.width) ) {
      players[ pid ].mapX = -(bg.width - canvas.width);
    } else {
      for ( p in players ) {
        if ( p !== pid && players[ p ].ai ) {
          players[ p ].x -= 5;
        }
      }
    }
  }
  if ( walls.right && rightActive ) {
    players[ pid ].x -= 5;
    if ( players[ pid ].x < 50 ) players[ pid ].x = 50;

    players[ pid ].mapX += 5;
    if ( players[ pid ].mapX > 0 ) {
      players[ pid ].mapX = 0;
    } else {
      for ( p in players ) {
        if ( p !== pid && players[ p ].ai ) {
          players[ p ].x += 5;
        }
      }
    }
  }

  if ( walls.up && upActive ) {
    players[ pid ].y += 5;
    if ( players[ pid ].y > canvas.height - 100 ) players[ pid ].y = canvas.height - 100;

    players[ pid ].mapY -= 5;
    if ( players[ pid ].mapY < -(bg.height - canvas.height) ) {
      players[ pid ].mapY = -(bg.height - canvas.height);
    } else {
      for ( p in players ) {
        if ( p !== pid && players[ p ].ai ) {
          players[ p ].y -= 5;
        }
      }
    }
  }
  if ( walls.down && downActive ) {
    players[ pid ].y -= 5;
    if ( players[ pid ].y < 50 ) players[ pid ].y = 50;

    players[ pid ].mapY += 5;
    if ( players[ pid ].mapY > 0 ) {
      players[ pid ].mapY = 0;
    } else {
      for ( p in players ) {
        if ( p !== pid && players[ p ].ai ) {
          players[ p ].y += 5;
        }
      }
    }
  }

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
