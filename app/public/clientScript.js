$(document).ready(function() {
  var socket = io.connect();
  console.log("Javascript Ready")
  function update() {
    //Add function for every 5 minutes or so to change trumps to turnips for 3 seconds
    socket.emit('userReqUpdate', {
      playerID: "Wilson Grumpstache"
    });
    requestAnimationFrame(update)
  }
  //Selector for when you click a navbar element
  $("#navbar").on("click", "li", function(e) {
    //Create a target variable for less querying
    $target = $(e.target)
    e.preventDefault();
    //If you are already on the right page, then don't bother
    if ($target.hasClass("active")) {
      return;
    } else {
      //If you aren't, set this as the active page, change screen
      $("#navbar li").removeClass("active")
      $target.toggleClass("active")
      changeScreen(e.target.id);
    }
  });
  function lowerFirst(stringbean) {
    return stringbean.charAt(0).toLowerCase() + stringbean.slice(1)
  }
  //Function for changing the active screen
  function changeScreen(newScreen) {
    $(".status.active").toggleClass("active hidden")
    $(".area.active").toggleClass("active hidden")
    $("#" + lowerFirst(newScreen.substr(3)) + "Status").toggleClass("active hidden")
    $("#" + lowerFirst(newScreen.substr(3))).toggleClass("active hidden")
  }
  //function for buttons
  $(".area").on("click","button",function(e){
    e.preventDefault();
    var clickedButton = lowerFirst(e.target.id.substring(0,e.target.id.length - 6))
    socket.emit('incrementClicked', {
      player: "Wilson Grumpstache",
      name: clickedButton
    })
  })
  $("#deleteSave").on("click","button",function(e){
    e.preventDefault();
    var clickedButton = lowerFirst(e.target.id.substring(0,e.target.id.length - 6))
    socket.emit('incrementClicked', {
      player: "Wilson Grumpstache",
      name: clickedButton
    })
  })
  /**
  $(".status #trumps h4").change(function(e) {
    if e.target.text
  })
  **/
  socket.on('updatePlayer', function(data) {
    for(var ii = 0; ii < data.fields.length; ii++) {
      var buttonID = ("plot" + ii + "Button");
      if (!$("#" + buttonID).length) {
        console.log("Creating button")
        var appendText = ("<button type='button' id='" + buttonID + "' class='button'>0%</button>")
        $("#plotVisualization").append(appendText)
      }
      $("#" + buttonID).text(data.fields[ii].cropLevel + "%")
    }
    //console.log(data)
    $(".status #trumps h3").text(data.trumps + "/" + data.hatchery)
    $("#hatcheryMoneyButton").text("Raise Campaign Funds! (+$" + data.trumps + ")")
    $(".status #dollaBills h3").text(data.money + "+$" + data.immigrants * 100 + "/s")
    //ADD things if am allowed
    if ($("#amMineButtonHolder").hasClass("hidden") && (data.mine == true)) {
      $("#amMinePurchasePrice").addClass("hidden")
      $("#amMineButtonHolder").removeClass("hidden")
    }
    if ($("#tacoFarmButtonHolder").hasClass("hidden") && (data.farm === true)) {
      $("#tacoFarmButtonHolder").removeClass("hidden")
      $("#tacoFarmPurchasePrice").addClass("hidden")
    }
    //Hide next tier of thing until ready:
    //trumpets
    if (!$("#trumpetManufactury").hasClass("hidden") && data.farm === false) {
      $("#trumpetManufactury").addClass("hidden")
      $("#trumpets").addClass("hidden")
      $("#tacos").addClass("lastColumn")
    } else if ($("#trumpetManufactury").hasClass("hidden") && data.farm === true) {
      $("#trumpetManufactury").removeClass("hidden")
      $("#tacos").removeClass("lastColumn")
      $("#trumpets").removeClass("hidden")
    }
    //farm
    if (!$("#trumpcoTacoFarm").hasClass("hidden") && data.mine === false) {
      $("#trumpcoTacoFarm").addClass("hidden")
      $("#tacos").addClass("hidden")
      $("#ore").addClass("lastColumn")
    } else if ($("#trumpcoTacoFarm").hasClass("hidden") && data.mine === true) {
      $("#trumpcoTacoFarm").removeClass("hidden")
      $("#ore").removeClass("lastColumn")
      $("#tacos").removeClass("hidden")
    }
    //REMOVE things if save reset
    if (data.autoMine == true && !$("#automateOreButton").hasClass("hidden")) {
      $("#automateOreButton").addClass("hidden")
    }
    if (data.autoMine == false && $("automateOreButton").hasClass("hidden")) {
      $("#automateOreButton").removeClass("hidden")
    }
    if (!$("#amMineButtonHolder").hasClass("hidden")) {
      if (data.mine === false) {
        $("#amMineButtonHolder").addClass("hidden")
        $("#amMinePurchasePrice").removeClass("hidden")
      }
    }
    if (!$("#tacoFarmButtonHolder").hasClass("hidden")) {
      if (data.farm === false) {
        $("#tacoFarmButtonHolder").addClass("hidden")
        $("#tacoFarmPurchasePrice").removeClass("hidden")
      }
    }
    $(".status #ore h3").text(data.ore)
    $("#mineOreButton").text("Mine an Ore! (" + data.oreDeposits + " Left)")
    $("#assignWorkerButton").text("Hire backpackers on a plot! ($1,000) (" + data.numberFieldsWorked + "/" + data.fields.length + ")")
    $(".status #tacos h3").text(data.tacos + "+" + data.plotQuality + "/plot")
  })

  update();
});
