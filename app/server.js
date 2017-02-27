var express = require('express')

/**NOTE: Atom waypoint options:
TODO
FIXME
CHANGED
XXX
IDEA
HACK
NOTE
REVIEW
NB
BUG
**/

//NOTE: Client should send only if still connected - server should do all calculations
/**TODO:
 * 1) Implement Great America Mining
 * 2) Implement TrumpCo TaCo Farm
 * 3) Make the other module (GAM, TC TC F, TM) hidden till unlocked - maybe with text that says "This to unlock <insertName>"
 * 0) Triple check all my functions in a variety of conditions (without a DB, without a collection, etc.)
 * IDEA: Hook in way to differentiate users without having to make login...
**/

// Create a new express application instance by calling `express()`
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

//Databases n stuff
console.log("[INFO] MongoDB must already be running")
var mongoose = require('mongoose')
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/trumpsData')

var Schema = mongoose.Schema;

//Scheming
var playerSchema = new Schema({
  playerID: { type: String, required: true, unique: true },
  trumps: Number,
  money: Number,
  lastUpdated: Date,
  areas: [{
    name: String,
    materials: Schema.Types.Mixed,
    buildings: Schema.Types.Mixed
  }]
})

var Player = mongoose.model('Player', playerSchema)

var prevTime = new Date()

function newPlayer(pID, cb) {
  //Var to hold the new player return by the get
  getPlayerByID(pID, function(result) {
    console.log("inget " + result)
    //If none exist with this ID, create
    if (result == null) {
      console.log("In new, didnt find: " + result)
      //Create temp player var holding the new player
      var thisNewPlayer = new Player({
        playerID: pID,
        trumps: 0,
        money: 0,
        lastUpdated: new Date(),
        areas: [{
          name: "mine",
          materials: {
            tacos: 0,
            ore: 0,
            trumpets: 0
          },
          buildings: {
            hatchery: 1,
            mine: false,
            oreDeposits: 10,
            immigrants: 0,
            fields: 0,
            factories: 0
          }
        }]
      })
      //Save temp player var to DB to make permanent
      //callback with the original callback given to newPlayer
      console.log("Running save and cb: \n"+ cb + "\n ----End CB----")
      thisNewPlayer.save(cb)
    } else {
      console.log("In new, found one: " + result)
      cb(result);
    }
  })
}

//cb(result)
function getPlayerByID(pID, cb) {
  Player.findOne({ 'playerID': pID }).exec(function(err,result) {
    //console.log('in findOne, have result found for: ' + pID + ', calling back')
    //Confirmed this callback is being called
    cb(result);
  })
}

//cb(err,result)
function getPlayersAll(cb) {
  Player.find({}, cb)
}

//cb(err, player)
function updatePlayer(pID, fieldAndValue, cb) {
  Player.findOneAndUpdate({ playerID: pID }, fieldAndValue, cb)
}

//cb(err)
function deletePlayer(pID, cb) {
  Player.findOneAndRemove({ playerID: pID }, cb)
}

//Templating
app.set('view engine', 'pug');

// Serve files in the 'public' directory with Express's built-in static file server
app.use(express.static('public'));

app.get('/', function (req, res) {
  res.render('index');
});

function updateAUser(data,socket) {
  getPlayerByID(data.playerID, function(result) {
    if (result == null) {
      console.log("[INFO] New Player Connected: " + data.playerID)
      newPlayer(data.playerID, function(err, newPlayer) {
        socket.emit('updatePlayer', {
          trumps: newPlayer.trumps,
          money: newPlayer.money,
          hatchery: newPlayer.areas[0].buildings.hatchery,
          mine: newPlayer.areas[0].buildings.mine,
          ore: newPlayer.areas[0].materials.ore,
          oreDeposits: newPlayer.areas[0].buildings.oreDeposits,
          immigrants: newPlayer.areas[0].buildings.immigrants
        })
      })
    } else {
      if ((new Date() - prevTime) > 1000) {
        prevTime = new Date()
        perSecond(result.playerID)
      }
      //TODO: make this work to add all /s things for each secondsince last updated
      //if (new Date() - result.lastUpdated)
      //console.log("emitting back when not null: " + result)
      socket.emit('updatePlayer', {
        trumps: result.trumps,
        money: result.money,
        hatchery: result.areas[0].buildings.hatchery,
        mine: result.areas[0].buildings.mine,
        ore: result.areas[0].materials.ore,
        oreDeposits: result.areas[0].buildings.oreDeposits,
        immigrants: result.areas[0].buildings.immigrants,
        tacos: result.areas[0].materials.tacos
      })
    }
  })
}

function perSecond(playerID) {
  getPlayerByID(playerID, function(player) {
    if (!player) {
      console.log("No player found! " + player)
      return
    }
    var newVal = player
    newVal.money += (player.areas[0].buildings.immigrants * 100)
    updatePlayer(player.playerID, newVal, function (err, player) {})
  })
}

io.on('connection', function (socket) {
  socket.on('userReqUpdate', function (data) {
    updateAUser(data,socket);
  })
  socket.on('incrementClicked', function(data) {
    //console.log("incrementClicked")
    if (data.name === "hatchery") {
      getPlayerByID(data.player, function(player) {
        if (!player) {
          console.log("No player found! " + player)
          return
        }
        if (player.trumps < player.areas[0].buildings.hatchery) {
          updatePlayer(player.playerID, {trumps: (player.trumps + 1) }, function(err,player) {})
        } else {
          //console.log("Too many trumps for your hatchery")
        }
      })
    }
    if (data.name === "hatcheryMoney") {
      getPlayerByID(data.player, function(player) {
        if (!player) {
          console.log("No player found! " + player)
          return
        }
        //console.log("Adding money: 1x" + player.trumps)
        updatePlayer(player.playerID, { money: (player.money + player.trumps) }, function (err, player) {})
      })
    }
    if (data.name === "purchaseMine") {
      getPlayerByID(data.player, function(player) {
        if (!player) {
          console.log("No player found! " + player)
          return
        }
        if (player.money >= 10000) {
          var newVal = player
          newVal.areas[0].buildings.mine = true
          newVal.money = (player.money - 10000)
          updatePlayer(player.playerID, newVal, function(err, player) {})
        }
      })
    }
    if (data.name === "trumpSlot") {
      getPlayerByID(data.player, function(player) {
        if (!player) {
          console.log("No player found! " + player)
          return
        }
        if (player.money >= 100) {
          var newVal = player
          newVal.areas[0].buildings.hatchery = (player.areas[0].buildings.hatchery + 1)
          newVal.money = (player.money - 100)
          updatePlayer(player.playerID, newVal, function (err, player) {})
        }
      })
    }
    if (data.name === "mineOre") {
      getPlayerByID(data.player, function(player) {
        if (!player) {
          console.log("No player found! " + player)
          return
        }
        if (player.areas[0].buildings.oreDeposits > 0) {
          var newVal = player
          newVal.areas[0].buildings.oreDeposits = (player.areas[0].buildings.oreDeposits - 1);
          newVal.areas[0].materials.ore = (player.areas[0].materials.ore + 1)
          updatePlayer(player.playerID, newVal, function (err,player) {})
        }
      })
    }
    if (data.name === "expandMines") {
      getPlayerByID(data.player, function(player) {
        if (!player) {
          console.log("No player found! " + player)
          return
        }
        if (player.money > 2500) {
          var newVal = player
          newVal.areas[0].buildings.oreDeposits = (player.areas[0].buildings.oreDeposits + 25)
          newVal.money = (player.money - 2500)
          updatePlayer(player.playerID, newVal, function(err,player) {})
        }
      })
    }
    if (data.name === "hireImmigrants") {
      getPlayerByID(data.player, function(player) {
        if (!player) {
          console.log("No player found! " + player)
          return
        }
        if (player.money > 10000) {
          var newVal = player
          newVal.areas[0].buildings.immigrants = (player.areas[0].buildings.immigrants + 1)
          newVal.money = (player.money - 10000)
          updatePlayer(player.playerID, newVal, function(err,player) {})
        }
      })
    }
    if (data.name === "farmTaco") {
      /**IDEA:
      Instead of doing the farm a taco thing,
      have players purchase taco plots,
      assign trumps to these plots
      eventually tacos are produced and trumps
      must be reassigned for another farm cycle
      to take place.
      IDEA:
      Buttons:
       - Assign trumps (0/1 default) - on right click can remove trump?
       - Buy more plots (1 default)
       - Taco sale! (Exponentially increasing
        costs in tacos, but reduces the cost by
        1 factor for all other upgrades)
      TODO:
      * Add in the exponential increase
        of upgrades
      * Move the whole checking-if-areas-unlocked thing
        to the server, just check when something is bought and
        add fields to say what is unlocked to the data structure
      **/
      getPlayerByID(data.player, function(player) {
        if (!player) {
          console.log("No player found! " + player)
          return
        }
        var newVal = player
        newVal.areas[0].materials.tacos = player.areas[0].materials.tacos + 1
        updatePlayer(player.playerID, newVal, function (err, player) {})
      })
    }
    if (data.name === "delete") {
      getPlayerByID(data.player, function(player) {
        if (player) {
          deletePlayer(player.playerID, function(err) {} )
        }
      })
    }
  })
});

// Have the Express application listen for incoming requests on port 8080
server.listen(8080, function() {
  console.log('Trumps server listening on port 8080');
});
