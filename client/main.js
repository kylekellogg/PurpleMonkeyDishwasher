var playerID;

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

var theGame = new Game.Core();

window.onload = theGame.ready;
