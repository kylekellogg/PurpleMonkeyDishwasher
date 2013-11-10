window.Init = {};
var canvas, context, theGame;

if ( typeof window.PlayerID === "undefined" ) {
  window.PlayerID = "-1";
}

Init.ready = function(e) {
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

    window.PlayerID = r;
    if ( window.PlayerID == -1 ) {
      console.log( 'PlayerID returned useless' );
      return;
    }
    console.log( 'PlayerID:', window.PlayerID );
  } );
}

window.onload = Init.ready;

window.onbeforeunload = function() {
	Meteor.call( 'returnPlayerID', window.PlayerID );
};
