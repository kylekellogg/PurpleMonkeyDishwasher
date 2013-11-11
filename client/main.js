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
      drawBG();
      testBounds();
      draw();
      Meteor.call( 'update', pid, players[ pid ] );
    })();
  } );
}

function drawBG() {
  context.fillStyle = 'rgb(255,255,255)';
  var mx = !!pid && !!players && !!players[ pid ] ? players[ pid ].mapX : 0,
    my = !!pid && !!players && !!players[ pid ] ? players[ pid ].mapY : 0;
  context.drawImage( bg, mx, my );
}

function draw() {
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

function testBounds() {
  var walls = {
      left: testLeft(),
      right: testRight(),
      up: testTop(),
      down: testBottom()
    };

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
}

function clamp( val, low, high ) {
  return Math.min( Math.max( val, low ), high );
}

function testLeft( _x, _y, debug ) {
  var x = _x === undefined ? clamp( players[ pid ].x - 5, 0, bg.width - 5 ) : _x,
    y = _y === undefined ? clamp( players[ pid ].y, 0, bg.height - 50 ) : _y,
    hit = testArea( x, y, 5, 50 );

  if ( !!debug ) {
    console.log( 'left hit?', hit );
  }

  return hit;
}

function testRight( _x, _y, debug ) {
  var x = _x === undefined ? clamp( players[ pid ].x + 50, 0, bg.width - 5 ) : _x,
    y = _y === undefined ? clamp( players[ pid ].y, 0, bg.height - 50 ) : _y,
    hit = testArea( x, y, 5, 50 );

  if ( !!debug ) {
    console.log( 'right hit?', hit );
  }

  return testArea( x, y, 5, 50 );
}

function testTop( _x, _y, debug ) {
  var x = _x === undefined ? clamp( players[ pid ].x, 0, bg.width - 50 ) : _x,
    y = _y === undefined ? clamp( players[ pid ].y - 5, 0, bg.height - 5 ) : _y,
    hit = testArea( x, y, 50, 5 );

  if ( !!debug ) {
    console.log( 'top hit?', hit );
  }

  return testArea( x, y, 50, 5 );
}

function testBottom( _x, _y, debug ) {
  var x = _x === undefined ? clamp( players[ pid ].x, 0, bg.width - 50 ) : _x,
    y = _y === undefined ? clamp( players[ pid ].y + 50, 0, bg.height - 5 ) : _y,
    hit = testArea( x, y, 50, 5 );

  if ( !!debug ) {
    console.log( 'bottom hit?', hit );
  }

  return testArea( x, y, 50, 5 );
}

function testArea( x, y, w, h ) {
  var d = context.getImageData( x, y, w, h ).data,
    avg = 0,
    pct = 0,
    pos,
    color;
  for ( var i = 0; i < w; i++ ) {
    for ( var j = 0; j < h; j++ ) {
      pos = (j * w + i) * 4;
      color = {
        r: d[ pos ],
        g: d[ pos + 1 ],
        b: d[ pos + 2 ],
        a: d[ pos + 3 ]
      };
      if ( near( color.r, 0, 5 ) && near( color.g, 0, 5 ) && near( color.b, 0, 5 ) && near( color.a, 255, 5 ) ) {
        avg++;
      }
    }
  }
  pct = avg / (w * h);
  return pct >= 0.85;
}

function near( val, target, leeway ) {
  return val >= target - leeway && val <= target + leeway;
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
