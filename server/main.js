var Games = new Meteor.Collection( 'Games' ),
	Players = new Meteor.Collection( 'Players' ),
	Secrets = new Meteor.Collection( 'Secrets' ),
	Roles = new Meteor.Collection( 'Roles' ),
	States = new Meteor.Collection( 'States' ),
	width = 3200,
	height = 1800,
	gameIntervalID;

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

function GameLoop() {
	//	TODO: Game logic, AI
}

function Restart() {
	if ( gameIntervalID ) {
		Meteor.clearInterval( gameIntervalID );
	}

	Roles.remove( {} );
	Roles.insert( {name: 'Agent'} );
	Roles.insert( {name: 'Rogue'} );

	States.remove( {} );
	States.insert( {name: 'Normal'} );
	States.insert( {name: 'Poisoned'} );
	States.insert( {name: 'Dead'} );
	States.insert( {name: 'Disabled'} );
	States.insert( {name: 'Alerted'} );

	Games.remove( {} );
	Players.remove( {} );
	Secrets.remove( {} );

	var game = new Game();
	for ( var i = 0, l = 50, s = 5; i < l; i++ ) {
		game.players.push( new Player() );
		game.players[i].x = Math.round( Math.random() * width );
		game.players[i].y = Math.round( Math.random() * height );
		game.players[i].role = Roles.findOne( {name: 'Agent'} );
		game.players[i].state = Roles.findOne( {name: 'Normal'} );
		Players.insert( game.players[i] );

		if ( s > 0 && Math.random() > 0.5 || l-i <= s ) {
			game.secrets.push( new Secret() );
			game.secrets[ game.secrets.length-1 ].x = Math.round( Math.random() * width );
			game.secrets[ game.secrets.length-1 ].y = Math.round( Math.random() * height );
			Secrets.insert( game.secrets[ game.secrets.length-1 ] );
			s--;
		}
	}
	Games.insert( game );

	gameIntervalID = Meteor.setInterval( GameLoop, 1/30 );
}

Meteor.startup( function OnStartUp() {
	Restart()

	Meteor.publish( 'Players', function( pid ) {
		return Players.find();
	} );
} );

Meteor.methods( {
	requestPlayerID: function() {
		var p = Players.findOne( {ai: true} );
		return p._id || '-1';
	},

	returnPlayerID: function( id ) {
		if ( id === '-1' ) {
			console.log( 'Bailed in returnPlayerID' );
			return false;
		}
		Players.update( {_id: id}, {ai: true} );
		console.log( id, Players.find( {ai: true} ).count() );
		return true;
	},

	update: function( id, player ) {
		if ( Match.test( player, {x: Number, y: Number, bullets: Number, poison: Number, ai: Boolean, role: String, state: String} ) ) {
			var p = Players.findOne( {_id: id} );
			if ( p ) {
				Players.update( {_id: id}, player );
				return true;
			}
			console.log( 'no player' );
			return false;
		}
		console.log( 'bad match' );
		return false;
	},

	restart: function() {
		Restart();
		return true;
	}
} );