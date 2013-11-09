var theGame = new Game.Core()

window.onload = theGame.ready

window.onbeforeunload = function() {
	Meteor.call( 'returnPlayerID', playerID );
};
