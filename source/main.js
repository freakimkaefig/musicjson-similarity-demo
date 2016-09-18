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

            if (typeof json1 !== 'undefined' && typeof json2 !== 'undefined') {
                document.getElementById('similarity-ms').innerHTML = MusicjsonToolbox.pitchDurationSimilarity(json1, json2, false);
                document.getElementById('similarity-gar').innerHTML = MusicjsonToolbox.pitchDurationSimilarity(json1, json2, true);
                document.getElementById('similarity-parson').innerHTML = MusicjsonToolbox.parsonSimilarity(json1, json2);
                document.getElementById('similarity-interval').innerHTML = MusicjsonToolbox.intervalSimilarity(json1, json2);
            }
        }
    })(file);


}
document.getElementById('file1').addEventListener('change', handleFileSelect, false);
document.getElementById('file2').addEventListener('change', handleFileSelect, false);

