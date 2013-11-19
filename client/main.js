var players = {},
  pid = '-1',

  keys = {
    'Left': 37,
    'Up': 38,
    'Right': 39,
    'Down': 40,
    'W': 87,
    'A': 65,
    'S': 83,
    'D': 68,
  },

  leftKeyDown = false,
  rightKeyDown = false,
  upKeyDown = false,
  downKeyDown = false,

  leftActive = false,
  upActive = false,
  rightActive = false,
  downActive = false,

  walls = {},
  wallImages = [],

  lastPos = {x:0,y:0},

  frameCount = 0,

  playersCollection,
  canvas,
  context,
  bg;

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

function Player() {
  this.x = 0;
  this.y = 0;
  this.width = 50;
  this.height = 50;
  this.mapX = 0;
  this.mapY = 0;
  this.fill = 'rgb(255,255,255)';

  this.bullets = 6;
  this.poison = 6;

  this.ai = true;
  this.role = '';
  this.state = '';
}

function Wall( _x, _y, _w, _h ) {
  this.x = ~~_x;
  this.y = ~~_y;
  this.width = Math.max( ~~_w, 50 );
  this.height = Math.max( ~~_h, 50 );
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

    lastPos = {x: 50, y: 50};

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
  } );

  bg = new Image();
  bg.addEventListener( 'load', function() {
    console.log( 'bg', bg.width, bg.height );
    loadWalls();
    //findWalls();
  } );
  bg.src = 'images/floor.jpg?' + Date.now();
}

function loadWalls() {
  var r = new XMLHttpRequest();
  r.onreadystatechange = function () {
    if (r.readyState != 4 || r.status != 200) return;
    walls = JSON.parse( r.responseText );

    (function animLoop() {
      requestAnimFrame( animLoop );
      //  Make sure only checking against bg image and not players as well
      drawBG();
      update();
      draw();
      Meteor.call( 'update', pid, players[ pid ] );
      frameCount++;
    })();
  };
  r.open( "GET", "walls.json", false );
  r.send();
}

/*function findWalls() {
  var x,y,lx,ly,queue;
  drawBG();

  var mx = 0,
    my = 0;

  context.fillStyle = 'rgb(255,255,255)';

  for ( x = 0, lx = bg.width; x < lx; x += 50 ) {
    for ( y = 0, ly = bg.height; y < ly; y += 50 ) {
      mx = Math.floor(x / canvas.width) * canvas.width;
      my = Math.floor(y / canvas.height) * canvas.height;
      context.drawImage( bg, -mx, -my );
      if ( testWall( x-mx, y-my, 50, 50, 0.85, false ) ) {
        if ( !walls[mx] ) {
          walls[mx] = {};
        }
        if ( !walls[mx][my] ) {
          walls[mx][my] = [];
        }
        walls[ mx ][ my ].push( new Wall( x, y, 50, 50 ) );
      }
    }
  }

  context.clearRect( 0, 0, bg.width, bg.height );
  context.fillStyle = "rgb(255,0,0)";

  queue = [];

  for ( x = 0, lx = bg.width; x < lx; x += canvas.width ) {
    for ( y = 0, ly = bg.height; y < ly; y += canvas.height ) {
      var img = new Image();
      img.addEventListener( 'load', function() {
        if ( queue.length ) {
          var o = queue.shift();
          o.img.src = o.src;
        } else {
          (function animLoop() {
            requestAnimFrame( animLoop );
            //  Make sure only checking against bg image and not players as well
            drawBG();
            update();
            draw();
            Meteor.call( 'update', pid, players[ pid ] );
            frameCount++;
          })();
        }
      } );

      context.clearRect( 0, 0, canvas.width, canvas.height );

      for ( var i = 0, l = walls[x][y].length; i < l; i++ ) {
        var wall = walls[x][y][i],
          _x = wall.x - x,
          _y = wall.y - y;
        context.fillRect( _x, _y, wall.width, wall.height );
      }

      wallImages.push( {
        img: img,
        x: x,
        y: y
      } );

      queue.push( {src: canvas.toDataURL(), img: wallImages[ wallImages.length - 1 ].img} );
    }
  }

  var json = JSON.stringify( walls );
  console.log( json );

  var o = queue.shift();
  o.img.src = o.src;
}*/

function drawBG() {
  var mx = !!pid && !!players && !!players[ pid ] ? players[ pid ].mapX : 0,
    my = !!pid && !!players && !!players[ pid ] ? players[ pid ].mapY : 0;
  context.clearRect( 0, 0, canvas.width, canvas.height );
  context.fillStyle = 'rgb(255,255,255)';
  context.drawImage( bg, mx, my );
  /*if ( wallImages ) {
    for ( var i = 0, l = wallImages.length; i < l; i++ ) {
      var wallImage = wallImages[ i ],
        x = wallImage.x + mx,
        y = wallImage.y + my;
      context.drawImage( wallImage.img, x, y );
    }
  }*/
}

function draw() {
  //drawBG();

  for ( var id in players ) {
    var x = players[ id ].x,
      y = players[ id ].y;
    context.fillStyle = players[ id ].fill || 'rgb(255,255,255)';
    if ( id !== pid && !players[ id ].ai ) {
      var mx = players[ id ].mapX,
        my = players[ id ].mapY;
      x = Math.abs( mx ) + x + mx;
      y = Math.abs( my ) + y + my;
    }
    context.fillRect( x, y, players[ id ].width, players[ id ].height );
  }
}

function move( val /* string */, amount, clampLow, clampHigh, mapClampLow, mapClampHigh ) {
  var p,
    map;

  val = ''+val;
  map = 'map' + val.toUpperCase();

  if ( players[ pid ][ val ] !== undefined ) {
    players[ pid ][ val ] += amount;

    //  Clamp player to bounds
    if ( players[ pid ][ val ] < clampLow || players[ pid ][ val ] > clampHigh ) {
      if ( players[ pid ][ val ] < clampLow ) {
        players[ pid ][ val ] = clampLow;
      } else {
        players[ pid ][ val ] = clampHigh;
      }
    }
  }

  if ( players[ pid ][ map ] !== undefined &&
    ((players[ pid ].x !== lastPos.x || players[ pid ].y !== lastPos.y) ||
    ((players[ pid ][ val ] === clampLow || players[ pid ][ val ] === clampHigh) &&
      players[ pid ][ map ] !== mapClampLow || players[ pid ][ map ] !== mapClampHigh)) ) {
    players[ pid ][ map ] -= amount;

    //  Test bounds for map
    if ( players[ pid ][ map ] < mapClampLow || players[ pid ][ map ] > mapClampHigh ) {
      if ( players[ pid ][ map ] < mapClampLow ) {
        players[ pid ][ map ] = mapClampLow;
      } else {
        players[ pid ][ map ] = mapClampHigh;
      }
    } else {
      for ( var w in walls ) {
        w[ val ] -= amount;
      }
      for ( p in players ) {
        if ( p !== pid && players[ p ].ai && players[ p ][ val ] !== undefined ) {
          players[ p ][ val ] -= amount;
        }
      }
    }
  }

  lastPos.x = players[ pid ].x;
  lastPos.y = players[ pid ].y;
}

//  Move using bool flags for directions
function update() {
  if ( !!pid && !!players && !!players[ pid ] ) {
    var moved = false;

    if ( leftActive ) {
      if ( !willHitWall( players[ pid ].x - 5 ) ) {
        move( 'x', -5, players[ pid ].width, canvas.width - 100, -(bg.width - canvas.width), 0 );
        moved = true;
      }
    }
    if ( rightActive ) {
      if ( !willHitWall( players[ pid ].x + 5 ) ) {
        move( 'x', 5, players[ pid ].width, canvas.width - 100, -(bg.width - canvas.width), 0 );
        moved = true;
      }
    }
    if ( upActive ) {
      if ( !willHitWall( undefined, players[ pid ].y - 5 ) ) {
        move( 'y', -5, players[ pid ].height, canvas.height - 100, -(bg.height - canvas.height), 0 );
        moved = true;
      }
    }
    if ( downActive ) {
      if ( !willHitWall( undefined, players[ pid ].y + 5 ) ) {
        move( 'y', 5, players[ pid ].height, canvas.height - 100, -(bg.height - canvas.height), 0 );
        moved = true;
      }
    }
  }
}

function willHitWall( _x, _y, _w, _h ) {
  var mockPlayer = {};

  _x = _x || players[ pid ].x;
  _y = _y || players[ pid ].y;
  _w = _w || players[ pid ].width;
  _h = _h || players[ pid ].height;

  mockPlayer.x = _x;
  mockPlayer.y = _y;
  mockPlayer.width = _w;
  mockPlayer.height = _h;

  for ( var x in walls ) {
    if ( walls.hasOwnProperty( x ) ) {
      for ( var y in walls[x] ) {
        if ( walls[x].hasOwnProperty( y ) ) {
          for ( var i = 0, l = walls[x][y].length; i < l; i++ ) {
            var wall = walls[x][y][i],
              mockWall = new Wall( wall.x + players[ pid ].mapX, wall.y + players[ pid ].mapY, wall.width, wall.height ),
              intersection = intersects( mockPlayer, mockWall );
            if ( !!intersection ) {
              if ( intersection.width === 0 || intersection.height === 0 ) continue;

              if ( leftActive ) {
                // players[ pid ].x = wall.x + wall.width + players[ pid ].mapX;
                // move( 'x', intersection.width, players[ pid ].width, canvas.width - 100, -(bg.width - canvas.width), 0 );
                leftActive = false;
                return true;
              }
              if ( rightActive ) {
                // players[ pid ].x = wall.x - players[ pid ].width + players[ pid ].mapX;
                // move( 'x', -intersection.width, players[ pid ].width, canvas.width - 100, -(bg.width - canvas.width), 0 );
                rightActive = false;
                return true;
              }
              if ( upActive ) {
                // players[ pid ].y = wall.y + wall.height + players[ pid ].mapY;
                // move( 'y', intersection.height, players[ pid ].height, canvas.height - 100, -(bg.height - canvas.height), 0 );
                upActive = false;
                return true;
              }
              if ( downActive ) {
                // players[ pid ].y = wall.y - players[ pid ].height + players[ pid ].mapY;
                // move( 'y', -intersection.height, players[ pid ].height, canvas.height - 100, -(bg.height - canvas.height), 0 );
                downActive = false;
                return true;
              }
            }
          }
        }
      }
    }
  }

  return false;
}

function intersects( a, b ) {
  var x = (a.x < b.x + b.width && a.x >= b.x) || (a.x + a.width >= b.x && a.x + a.width < b.x + b.width),
    y = (a.y < b.y + b.height && a.y >= b.y) || (a.y + a.height >= b.y && a.y + a.height < b.y + b.height);

  if ( x && y ) {
    var rect = {};
    // get rectangle to return here
    if ( b.x > a.x ) {
      rect.x = a.x + (b.x - a.x);
      rect.width = a.x + a.width - rect.x;
    } else {
      rect.x = b.x + (a.x - b.x);
      rect.width = b.x + b.width - rect.x;
    }

    if ( b.y > a.y ) {
      rect.y = a.y + (b.y - a.y);
      rect.height = a.y + a.height - rect.y;
    } else {
      rect.y = b.y + (a.y - b.y);
      rect.height = b.y + b.height - rect.y;
    }

    return rect;
  }
  return false;
}

function clamp( val, low, high ) {
  return Math.min( Math.max( val, low ), high );
}

function testWall( x, y, w, h, allowance, debug ) {
  var d = context.getImageData( x, y, w, h ).data,
    avg = 0,
    pct = 0,
    alw = allowance !== undefined ? +allowance : 0.85,
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
  if ( !!debug ) {
    console.log( (pct * 100) + '%' );
  }
  return pct >= alw;
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
    case keys.Left:
    case keys.A:
      if ( leftKeyDown ) {
        e.preventDefault();
        return;
      }
      leftKeyDown = true;
      leftActive = true;
      e.preventDefault();
      break;
    case keys.Right:
    case keys.D:
      if ( rightKeyDown ) {
        e.preventDefault();
        return;
      }
      rightKeyDown = true;
      rightActive = true;
      e.preventDefault();
      break;
    case keys.Up:
    case keys.W:
      if ( upKeyDown ) {
        e.preventDefault();
        return;
      }
      upKeyDown = true;
      upActive = true;
      e.preventDefault();
      break;
    case keys.Down:
    case keys.S:
      if ( downKeyDown ) {
        e.preventDefault();
        return;
      }
      downKeyDown = true;
      downActive = true;
      e.preventDefault();
      break;
  }
};

//  If key being released is recognized for game control, prevent default and flag false
window.onkeyup = function( e ) {
  switch ( e.keyCode ) {
    case keys.Left:
    case keys.A:
      leftActive = false;
      leftKeyDown = false;
      e.preventDefault();
      break;
    case keys.Right:
    case keys.D:
      rightActive = false;
      rightKeyDown = false;
      e.preventDefault();
      break;
    case keys.Up:
    case keys.W:
      upActive = false;
      upKeyDown = false;
      e.preventDefault();
      break;
    case keys.Down:
    case keys.S:
      downActive = false;
      downKeyDown = false;
      e.preventDefault();
      break;
  }
};
