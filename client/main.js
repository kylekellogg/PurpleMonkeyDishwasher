var playerID;

window.onload = function() {
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
};

window.onbeforeunload = function() {
	Meteor.call( 'returnPlayerID', playerID );
};