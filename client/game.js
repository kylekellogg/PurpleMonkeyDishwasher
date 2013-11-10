if (typeof window.Game === "undefined") {
  window.Game = {};
}

var playerID;

Game.Core = function() {
  this.initialize.apply(this, arguments)
};

(function(proto){
  proto.initialize = function(cvs, ctx) {
    console.log("Starting the game")
    this.canvas = cvs;
    this.context = ctx;

    //var imgLoader = new ImageLoader();

    //imgLoader.addImage("images/floor.jpg");
  }

  proto.run = function() {
    this.enterFrame(this.draw);
  }

  proto.enterFrame = function(callback) {
    callback();

    window.requestAnimationFrame(callback);
  }

  proto.draw = function() {
    console.log("drawing");
  }

  Meteor.call( 'requestPlayerID', function( e, r ) {
    if ( e ) {
      // TODO: Handle error
      console.log( 'Error getting playerID' );
      return;
    }

    playerID = r;
    if ( playerID == -1 ) {
      console.log( 'playerID returned useless' );
      return;
    }
    console.log( 'playerID:', playerID );
  } );
})(Game.Core.prototype);

