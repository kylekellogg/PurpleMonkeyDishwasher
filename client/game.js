if (typeof window.Game === "undefined") {
  window.Game = {};
}

if ( typeof window.PlayerID === "undefined" ) {
  window.PlayerID = "-1";
}

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

    window.PlayerID = r;
    if ( window.PlayerID == -1 ) {
      console.log( 'PlayerID returned useless' );
      return;
    }
    console.log( 'PlayerID:', window.PlayerID );
  } );
})(Game.Core.prototype);

