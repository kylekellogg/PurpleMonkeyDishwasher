var players = {},
	pid = '-1',
	playersCollection,
	canvas,
	context,
	theGame,
	iid,
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
  bg.src = 'images/floor.jpg';

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
    players[ pid ].x = Math.round( Math.random() * canvasWidth );
    players[ pid ].y = Math.round( Math.random() * canvasHeight );
    players[ pid ].ai = false;

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
    		draw();
    	},

    	changed: function( n, o ) {
    		if ( players[ n._id ] ) {
    			players[ n._id ] = n;
    			delete players[ n._id ]._id;
    		}
    		draw();
    	},

    	removed: function( n ) {
    		if ( players[ n._id ] ) {
    			delete players[ n._id ];
    		}
    		draw();
    	}
    } );

    (function animLoop() {
    	requestAnimFrame( animLoop );
    	update();
    })();
  } );
}

function draw() {
	context.drawImage( bg, 0, 0 );

	for ( var id in players ) {
		context.fillRect( players[ id ].x, players[ id ].y, 50, 50 );
	}
}

function update() {
	players[ pid ].x += Math.round( Math.random() * 2 - 1 );
	players[ pid ].y += Math.round( Math.random() * 2 - 1 );

	Meteor.call( 'update', pid, players[ pid ] );
}

window.onload = ready;

window.onbeforeunload = function() {
	Meteor.call( 'returnPlayerID', pid );
};
