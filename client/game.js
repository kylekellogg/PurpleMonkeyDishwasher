if (typeof window.Game === "undefined") {
  window.Game = {};
}

var playerID;

Game.Core = function() {
  this.initialize.apply(this, arguments)
};

(function(proto){
  proto.initialize = function() {
    console.log("Starting the game")
  }

  proto.ready = function() {
    var Canvas = document.getElementById("game")
    var Context = Canvas.getContext("2d")

    var viewportWidth = window.innerWidth
    var viewportHeight = window.innerHeight
    var canvasWidth = Canvas.getAttribute("width")
    var canvasHeight = Canvas.getAttribute("height")

    Canvas.style.position = "absolute"
    Canvas.style.top = (viewportHeight - canvasHeight) / 2 + "px"
    Canvas.style.left = (viewportWidth - canvasWidth) / 2 + "px"

    var floorImg = new Image()
    floorImg.src = "images/floor.jpg"
    floorImg.addEventListener("load", function() {
      Context.drawImage(floorImg, 0, 0)
    })
  }

  Meteor.call( 'requestPlayerID', function( e, r ) {
    if ( e ) {
      //	TODO: Handle error
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

