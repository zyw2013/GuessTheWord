/**
 * Main game logic
 */

var secretWord;
var letters = [];
var knownLetters = 0;

var score = 0;
var power = 100; // Game over when power reaches zero!

function changeScore(s) {
  score += s;
  if (score < 0)
    score = 0;
  $("#score").text("Score: " + score);
}

function saveScore(name, score) {
  $.ajax( { url: "/save_score?name=" + name + "&score=" + score, cache : false }).done(function(data) {    
    window.location.replace("/"); // Go to hiscore page
  });
}

function changePower(p) {
  power += p;
  if (power > 100) {
    power = 100;
  }
  else if (power <= 0) {
    // Game over!
    power = 0;
    var dlg = $("#name-dialog");	
    dlg.find(".modal-title").text("GAME OVER!");		
    var okButton = dlg.find('.modal-footer').find('.btn-ok');
    okButton.unbind('click');
    okButton.on('click', function (e) {
      dlg.modal("hide");
      var name = dlg.find("#name-input")[0].value;
      saveScore(name, score);
    });
    dlg.modal("show");
  }	
  $("#power").text("Power: " + power);
}

function showLetters() {
  var cells = $(".word-area td");
  for (var i = 0; i < cells.length; i++) {
    $(cells[i]).text(letters[i]);
  };	
}

function correctGuess() {
  $("#applause-sound")[0].play();
  var wordArea = $(".word-area");
  wordArea.toggleClass("correctguess");
  setTimeout(function () {
    wordArea.toggleClass("correctguess");
    getNewSecretWord();
  }, 2000);
  changeScore(1);
  changePower(1);
  letters = secretWord.split("");
  showLetters();	
}

function decreasePower(i, animate) {
  changePower(-i);
  if (animate) {
    var wordArea = $(".word-area");
    wordArea.toggleClass("powerdecreased");
    setTimeout(function () {
      wordArea.toggleClass("powerdecreased");
    }, 1000);
  }
}

function getNewSecretWord() {
  $.ajax( { url: "/randomword", cache : false }).done(function(data) {
    var randomWord = JSON.parse(data);
    $("#word-description").text(randomWord.description);
    secretWord = randomWord.word;
    letters = [];
    var wordAreaTable = $(".word-area table tr");
    wordAreaTable.empty();		
    for (var i = 0; i < secretWord.length; i++) {
      letters[i] = "?";
      var tableCells = "<td></td>";
      wordAreaTable.last().append(tableCells);			
    }
    $(".word-area td").click(function() { 
      var index = $(this).index();
      if (letters[index] === "?") {
	$(".word-area td").removeClass("cell-selected");
	$(this).addClass("cell-selected");
      }
    });
    knownLetters = 0;
    showLetters();
  });
}

function skipWord() {
  letters = secretWord.split("");
  showLetters();
  $("#skip-sound")[0].play();
  decreasePower(10, true);
  setTimeout(function () {
    getNewSecretWord();
  }, 2000); // Show the skipped word for 2 seconds before getting a new one.
}

function populatePage() {
  var skipButton = $("#skip-button");
  skipButton.on('click', function () {
    skipWord();
  });

  var helpLetterButton = $("#help-letter-button");
  helpLetterButton.on('click', function () {
    changePower(-1);
    var i = Math.floor(Math.random() * (secretWord.length));
    while (letters[i] != "?") {
      // This letter is already given. Give the next one instead.		
      i = (i + 1)%secretWord.length;
    }
    letters[i] = secretWord[i];
    $("#tick-sound")[0].play();
    knownLetters++;
    showLetters();
    $(".word-area td").removeClass("cell-selected");
    if (knownLetters === secretWord.length) 
      // All letters given - same as skipping the word
      skipWord();
    else
      decreasePower(1, true);
  }); 

  // Handle keyboard input
  document.onkeypress = function (e) {		
    var c = String.fromCharCode(e.which);
    var cells = $(".word-area td");
    for (var i = 0; i < cells.length; i++) {
      if ($(cells[i]).hasClass("cell-selected")) {
	$("#help-text").css("display", "none"); // Hide help-text
	if (secretWord[i].toUpperCase() === c.toUpperCase()) {
	  // Correct letter
	  letters[i] = secretWord[i];
	  $("#tick-sound")[0].play();
	  knownLetters++;
	  showLetters();
	  if (knownLetters === secretWord.length) {
	    // All letters revealed
	    correctGuess();
	  }
	  else {
	    // Move selection to next unknown letter
	    $(cells[i]).removeClass("cell-selected");
	    for (var j = i + 1; j < cells.length; j++) {
	      if (letters[j] === "?") {
		$(cells[j]).addClass("cell-selected");
		break;
	      }
	    }
	  }
	}
	else {
	  // Wrong letter
	  decreasePower(1, false);
	  $(cells[i]).text(c);
	  $(cells[i]).addClass("wrong-letter");
	  $("#skip-sound")[0].play();
	  setTimeout(function () {
	    $(cells[i]).text("?");
	    $(cells[i]).removeClass("wrong-letter");
	  }, 2000); // Show the typed letter for 2 seconds.
	}
	break;
      }
    }		
  };

  getNewSecretWord();

  changeScore(0);
  changePower(0);
}

$(populatePage);