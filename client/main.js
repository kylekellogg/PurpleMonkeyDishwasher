window.Init = {};
var canvas, context, theGame;

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

  theGame = new Game.Core(canvas, context);
  theGame.run();
}

window.onload = Init.ready;

window.onbeforeunload = function() {
	Meteor.call( 'returnPlayerID', playerID );
};
