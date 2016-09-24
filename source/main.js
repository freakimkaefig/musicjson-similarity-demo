var MusicjsonToolbox = require('musicjson-toolbox');
var musicjson2abc = require('musicjson2abc');

var parserParams = {},
  renderParams = {};
  engraverParams = {
    add_classes: true,
    staffwidth: 570,
    listener: {
      highlight: function(abcElem) {
        console.log("highlight", abcElem);
      },
      modelChanged: function(abcElem) {
        console.log("modelChanged", abcElem);
      }
    }
  },
  midiParams = {};

var json1, json2;

function recalculate() {
  if (typeof json1 !== 'undefined' && typeof json2 !== 'undefined') {
    var k = document.getElementById('k').value;
    var k1 = document.getElementById('k1').value;
    var k2 = document.getElementById('k2').value;
    var k3 = document.getElementById('k3').value;

    MusicjsonToolbox.globalK = parseFloat(k);
    MusicjsonToolbox.globalK1 = parseFloat(k1);
    MusicjsonToolbox.globalK2 = parseFloat(k2);
    MusicjsonToolbox.globalK3 = parseFloat(k3);

    document.getElementById('similarity-ms').innerHTML = MusicjsonToolbox.pitchDurationSimilarity(json1, json2, false).toFixed(3);
    document.getElementById('similarity-gar').innerHTML = MusicjsonToolbox.pitchDurationSimilarity(json1, json2, true).toFixed(3);
    document.getElementById('similarity-parson').innerHTML = MusicjsonToolbox.parsonSimilarity(json1, json2).toFixed(3);
    document.getElementById('similarity-interval').innerHTML = MusicjsonToolbox.intervalSimilarity(json1, json2).toFixed(3);
  }
}

function handleFileSelect(event) {
  var targetId = event.target.id;
  var render = event.target.dataset.render;
  var file = event.target.files[0];

  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = (function(theFile) {
    return function(e) {
      var json = JSON.parse(e.target.result);
      var abc = musicjson2abc.json2abc(json);
      ABCJS.renderAbc(render, abc, parserParams, engraverParams, renderParams);

      if (targetId === 'file1') {
        json1 = json;
      } else if (targetId === 'file2') {
        json2 = json;
      }

      recalculate();
    }
  })(file);
}

function handleKButtonClick(event) {
  document.getElementById(event.target.dataset.k).value = parseFloat(event.target.dataset.value);
  recalculate();
}

// Bind file change
document.getElementById('file1').addEventListener('change', handleFileSelect, false);
document.getElementById('file2').addEventListener('change', handleFileSelect, false);

// Bind k change
document.getElementById('k').addEventListener('keyup', recalculate, false);
document.getElementById('k1').addEventListener('keyup', recalculate, false);
document.getElementById('k2').addEventListener('keyup', recalculate, false);
document.getElementById('k3').addEventListener('keyup', recalculate, false);

// Bind k button click
var kButtons = document.getElementsByClassName('kButton');
for (var i = 0; i < kButtons.length; i++) {
  kButtons[i].addEventListener('click', handleKButtonClick, false);
}

// Set initial values
document.getElementById('k').value = MusicjsonToolbox.globalK;
document.getElementById('k1').value = MusicjsonToolbox.globalK1;
document.getElementById('k2').value = MusicjsonToolbox.globalK2;
document.getElementById('k3').value = MusicjsonToolbox.globalK3;
