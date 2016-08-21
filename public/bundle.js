(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
            var abc = musicjson2abc.json2abc(JSON.stringify(json));
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


},{"musicjson-toolbox":2,"musicjson2abc":3}],2:[function(require,module,exports){
(function() {
  'use strict';

  /**
   * The MusicJsonToolbox class implements static functions to operate with musicjson objects.
   * @exports MusicJsonToolbox
   */
  var MusicJsonToolbox = {

    /**
     * Pitch values for steps in base 12 system
     * <pre><code>
     * C  |    | D |    | E  | F  |    | G |    | A  |    | B
     * B# | C# |   | D# |    | E# | F# |   | G# |    | A# |
     *    | Db |   | Eb | Fb |    | Gb |   | Ab |    | Bb | Cb
     * 1  | 2  | 3 | 4  | 5  | 6  | 7  | 8 | 9  | 10 | 11 | 12
     * </code></pre>
     *
     * @constant
     * @type {object}
     */
    base12: {
      'C': 1,
      'D': 3,
      'E': 5,
      'F': 6,
      'G': 8,
      'A': 10,
      'B': 12
    },

    /**
     * Inverted {@link base12}
     *
     * @constant
     * @type {object}
     */
    base12Inverted: {
      1: 'C',
      3: 'D',
      5: 'E',
      6: 'F',
      8: 'G',
      10: 'A',
      12: 'B'
    },

    /**
     * Degrees by number of semitones (for major scale)
     *
     * @constant
     * @type {object}
     */
    degreesFromSemitones: {
      1: 1,
      3: 2,
      5: 3,
      6: 4,
      8: 5,
      10: 6,
      12: 7
    },

    /**
     * Weights for deg(n)-function of Mongeau-Sankoff-Measure.
     * n = number of degrees
     *
     * @constant
     * @type {object}
     */
    deg: {
      0: 0,
      1: 0.9,
      2: 0.2,
      3: 0.5,
      4: 0.1,
      5: 0.35,
      6: 0.8
    },

    /**
     * Weights for ton(m)-function of Mongeau-Sankoff-Measure.
     * m = number of semitones
     *
     * @constant
     * @type {object}
     */
    ton: {
      0: 0.6,
      1: 2.6,
      2: 2.3,
      3: 1,
      4: 1,
      5: 1.6,
      6: 1.8,
      7: 0.8,
      8: 1.3,
      9: 1.3,
      10: 2.2,
      11: 2.5
    },

    /**
     * Parameter k of Mongeau-Sankoff-Measure.
     * Represents the relative contribution of w_length and w_interval
     *
     * Can be set runtime via:
     * <pre><code>
     *   MusicJsonToolbox.globalK = 0.456;
     * </pre></code>
     *
     * @constant
     * @type {number}
     */
    globalK: 0.348,

    /**
     * Parameter k1 of adjusted Mongeau-Sankoff-Measure according to Gomez, Abad-Mota & Ruckhaus, 2007.
     * {@link http://www.music-ir.org/mirex/abstracts/2007/QBSH_SMS_gomez.pdf}
     * Used when calculating weight for substitution.
     *
     * Can be set runtime via:
     * <pre><code>
     *   MusicJsonToolbox.globalK1 = 0.5;
     * </pre></code>
     *
     * @constant
     * @type {number}
     */
    globalK1: 0.46,

    /**
     * Parameter k2 of adjusted Mongeau-Sankoff-Measure according to Gomez, Abad-Mota & Ruckhaus, 2007.
     * {@link http://www.music-ir.org/mirex/abstracts/2007/QBSH_SMS_gomez.pdf}
     *
     * Can be set at runtime via:
     * <pre><code>
     *   MusicJsonToolbox.globalK3 = 0.5;
     * </pre></code>
     *
     * @constant
     * @type {number}
     */
    globalK2: 0.22,

    /**
     * Parameter k3 of adjusted Mongeau-Sankoff-Measure according to Gomez, Abad-Mota & Ruckhaus, 2007.
     * {@link http://www.music-ir.org/mirex/abstracts/2007/QBSH_SMS_gomez.pdf}
     * Used when calculating weight for insertion and deletion.
     *
     * Can be set at runtime via:
     * <pre><code>
     *   MusicJsonToolbox.globalK3 = 0.5;
     * </pre></code>
     *
     * @constant
     * @type {number}
     */
    globalK3: 1,

    /**
     * Holds abc steps for conversion from base12 pitch values (including octaves).
     *
     * @constant
     * @type {Array}
     */
    abcStep: [
      'C,,,', '^C,,,', 'D,,,', '^D,,,', 'E,,,', 'F,,,', '^F,,,', 'G,,,', '^G,,,', 'A,,,', '^A,,,', 'B,,,', // 1
      'C,,', '^C,,', 'D,,', '^D,,', 'E,,', 'F,,', '^F,,', 'G,,', '^G,,', 'A,,', '^A,,', 'B,,', // 2
      'C,', '^C,', 'D,', '^D,', 'E,', 'F,', '^F,', 'G,', '^G,', 'A,', '^A,', 'B,', // 3
      'C', '^C', 'D', '^D', 'E', 'F', '^F', 'G', '^G', 'A', '^A', 'B', // 4
      'c', '^c', 'd', '^d', 'e', 'f', '^f', 'g', '^g', 'a', '^a', 'b', // 5
      'c\'', '^c\'', 'd\'', '^d\'', 'e\'', 'f\'', '^f\'', 'g\'', '^g\'', 'a\'', '^a\'', 'b\'', // 6
      'c\'\'', '^c\'\'', 'd\'\'', '^d\'\'', 'e\'\'', 'f\'\'', '^f\'\'', 'g\'\'', '^g\'\'', 'a\'\'', '^a\'\'', 'b\'\'', // 7
      'c\'\'\'', '^c\'\'\'', 'd\'\'\'', '^d\'\'\'', 'e\'\'\'', 'f\'\'\'', '^f\'\'\'', 'g\'\'\'', '^g\'\'\'', 'a\'\'\'', '^a\'\'\'', 'b\'\'\'' // 8
    ],

    /**
     * Holds abc accidental symbols for conversion from music json.
     *
     * @constant
     * @type {object}
     */
    abcAccidental: {
      'flat-flat': '__',
      'flat': '_',
      'natural': '=',
      'sharp': '^',
      'sharp-sharp': '^^',
      'undefined': '',
      '': ''
    },

    /**
     * Returns an array of all notes.
     * Removes rests.
     *
     * Example:
     * [ {pitch: {step, octave, alter, accidental}, rest: false, duration, type}, { ... }, ... ]
     *
     * @param {object} obj - The musicjson object
     * @param {boolean} repeat - If set to true, repeated measures are also repeated in notes output
     * @param {boolean} rests - If set to true, the resulting notes include rests
     * @returns {Array} An array containing all notes of the given object
     */
    notes: function(obj, repeat, rests) {
      var tempNotes = [];
      var repeatStart = -1;

      // loop over measures
      for (var i = 0; i < obj.measures.length; i++) {

        // add note and measure number for eventual identification
        for (var j = 0; j < obj.measures[i].notes.length; j++) {
          obj.measures[i].notes[j].measureNumber = i;
          obj.measures[i].notes[j].noteNumber = j;
        }

        // store repeat start point
        if (repeat && obj.measures[i].attributes.repeat.left) {
          repeatStart = i;
        }

        // add notes of measure
        tempNotes = tempNotes.concat(obj.measures[i].notes);

        // add repeating notes if activated
        if (repeat && obj.measures[i].attributes.repeat.right) {
          /* istanbul ignore else  */
          if (repeatStart !== -1) {
            while (repeatStart <= i) {
              tempNotes = tempNotes.concat(obj.measures[repeatStart].notes);
              repeatStart++;
            }
          }
          repeatStart = -1;
        }
      }

      // remove rests when set
      if (rests === false) {
        for (var k = 0; k < tempNotes.length; k++) {
          if ((tempNotes[k].rest === true || tempNotes[k].rest === 'true')) {
            tempNotes.splice(k, 1);
          }
        }
      }

      return tempNotes;
    },

    /**
     * Returns an array of intervals from an array of notes
     *
     * Example:
     * [ {0}, {2}, {-2}, {5}, ... ]
     * @param {Array} notes - Array of notes for which the contour should be created
     * @returns {Array} An array of notes as contour
     */
    intervals: function(notes) {
      var tempIntervals = [];

      // add initial interval '*'
      tempIntervals.push({
        value: '*',
        duration: '*',
        noteNumber: 0,
        measureNumber: 0
      });

      for (var i = 1; i < notes.length; i++) {
        // calculate differences in pitch and duration
        var pitchDiff = this.pitchDifference(notes[i-1].pitch, 0, notes[i].pitch, true, false);
        var durationDiff = this.durationDifference(notes[i-1].duration, notes[i].duration, false);

        // add interval to array
        var tempNote = {
          value: pitchDiff,
          duration: durationDiff,
          noteNumber: notes[i].noteNumber,
          measureNumber: notes[i].measureNumber
        };
        tempIntervals.push(tempNote);
      }

      return tempIntervals;
    },

    /**
     * Generate array of parson code from notes
     *
     * @param {Array} notes - Array of notes for which the contour should be created
     * @returns {Array} An array of notes as parsons code
     */
    parsons: function(notes) {
      var tempParsons = [];

      // add initial parsons item '*'
      tempParsons.push({
        value: '*',
        noteNumber: 0,
        measureNumber: 0
      });

      for (var i = 1; i < notes.length; i++) {
        var parson;
        // calculate difference in pitch
        var pitchDiff = this.pitchDifference(notes[i-1].pitch, 0, notes[i].pitch, true, false);

        // set parsons code according to pitch difference
        if (pitchDiff > 0) {
          parson = 'u';
        } else if (pitchDiff < 0) {
          parson = 'd';
        } else {
          parson = 'r';
        }

        // add parsons code item to array
        tempParsons.push({
          value: parson,
          noteNumber: notes[i].noteNumber,
          measureNumber: notes[i].measureNumber
        });
      }

      return tempParsons;
    },

    /**
     * Generates array of ngrams in specified length (based on {@link https://gist.github.com/eranbetzalel/9f16b1216931e20775ad}).
     *
     * @param {Array} array - An array of notes (returned by function 'notes')
     * @param {number} length - The length of n
     * @returns {Array} An Array of ngrams with the given length
     */
    ngrams: function(array, length) {
      var nGramsArray = [];

      for (var i = 0; i < array.length - (length - 1); i++) {
        var subNgramsArray = [];

        for (var j = 0; j < length; j++) {
          subNgramsArray.push(array[i + j]);
        }

        nGramsArray.push(subNgramsArray);
      }

      return nGramsArray;
    },

    /**
     * Get array of base 12 pitch values from array of notes
     *
     * @param {Array} notes - The array of notes
     * @param  {number} keyAdjust - Adjusting of key by circle of fifths
     * @returns {Array} The array of base 12 pitch values
     */
    pitchValues: function(notes, keyAdjust) {
      return notes.map(function(item) {
        // calculate base 12 pitch values
        return this.base12Pitch(
          item.pitch.step,
          keyAdjust,
          item.pitch.octave,
          item.pitch.alter,
          false
        );
      }.bind(this));
    },

    /**
     * Generates an array of pitch and duration values for the Mongeau & Sankoff version of melodic edit distance
     * See Mongeau, M., & Sankoff, D. (1990). Comparison of musical sequences. Computers and the Humanities, 24(3), 161–175. http://doi.org/10.1007/BF00117340
     *
     * @param {Array} notes - Array of notes (e.g. returned by  MusicJsonToolbox.notes)
     * @param {number} keyAdjust - Adjusting of key by circle of fifths
     * @param {number} divisions - The divisions of the document
     * @param {number} beatType - The documents beat type
     * @returns {Array} The correctly mapped array with pitch and duration values
     */
    pitchDurationValues: function(notes, keyAdjust, divisions, beatType) {
      return notes.map(function(item) {
        // calculate base 12 pitch value
        var base12Pitch = this.base12Pitch(
          item.pitch.step,
          keyAdjust,
          item.pitch.octave,
          item.pitch.alter,
          false
        );
        return {
          value: base12Pitch,
          rest: item.rest,
          duration: (item.duration / divisions / beatType) * 16   // normalize duration
        };
      }.bind(this));
    },

    /**
     * Adjust tempo in array of notes
     *
     * @param {Array} notes - The array of notes where tempo should be adjusted
     * @param {number} adjust - Function that returns new duration (e.g. `function(duration) { return duration * 2; }` )
     * @returns {Array} The resulting array with adjusted tempo
     */
    tempoAdjust: function(notes, adjust) {
      var adjustedNotes = [];
      for (var i = 0; i < notes.length; i++) {
        var tempNote = notes[i];
        // calculate adjust function for every note
        tempNote.duration = adjust(tempNote.duration);
        adjustedNotes.push(tempNote);
      }
      return adjustedNotes;
    },

    /**
     * Returns array of item values
     *
     * @param {Array} array - The array that should be mapped
     * @returns {Array} The mapped array
     */
    valueMapping: function(array) {
      return array.map(function(item) {
        return item.value;
      });
    },

    /**
     * Array mapping for note highlighting
     *
     * @param {Array} array - The array that should be mapped for highlighting
     * @returns {Array} The mapped array
     */
    highlightMapping: function(array) {
      return array.map(function(item) {
        return {
          measure: item.measureNumber,
          note: item.noteNumber
        };
      });
    },

    /**
     * Calculates the base 12 represented pitch
     *
     * @param {string} step - The step (c, d, e, f, g, a, b)
     * @param {number} keyAdjust - Key position in circle of fifths; if set, the pitch gets transposed to C major
     * @param {number} octave - The octave
     * @param {number} alter - The value for alter (either from accidental or key)
     * @param {boolean} withOctave - When set, the octave is taken into account, otherwise function return relative value (from 1 to 12)
     * @returns {number} The base12 pitch number
     */
    base12Pitch: function(step, keyAdjust, octave, alter, withOctave) {
      // lookup semitones in c major scale
      var ret = this.base12[step];

      // optionally add alter value (from key or accidental)
      if (alter) {
        ret += alter;
      }

      // transposition to c major
      if (keyAdjust < 0) {
        // reduce pitch to keep octave level
        ret -= Math.round(Math.abs(keyAdjust) / 2) * 12;
        while (keyAdjust < 0) {
          // add fifth (moving in circle of fifth clockwise)
          ret += 7;
          keyAdjust++;
        }
      } else {
        // increase pitch to keep octave level
        ret += Math.round(Math.abs(keyAdjust) / 2) * 12;
        while (keyAdjust > 0) {
          // subtract fifth (moving in circle of fifth contraclockwise)
          ret -= 7;
          keyAdjust--;
        }
      }

      // set base 12 value of '0' to '12'
      if (ret === 0) {
        ret = 12;
        octave--;
      }

      // add octave if activated
      if (withOctave) {
        ret += (octave * 12);
      } else {
        // reset to relative base 12 value
        while (ret > 12) {
          ret -= 12;
        }
        while (ret < 0) {
          ret += 12;
        }
      }

      return ret;
    },

    /**
     * Returns abc note from interval value
     *
     * @param {number} interval - The interval value
     * @param {number} base - The base 12 pitch the interval should be added
     * @returns {string} The abc note
     */
    interval2AbcStep: function(interval, base) {
      return this.abcStep[base + interval - 13];
    },

    /**
     * Return abc note from json note object
     *
     * @param {object} item - The item which should be converted to abc
     * @param {object|null} prevItem - The previous item or null
     * @returns {string} The abc note
     */
    pitchDuration2AbcStep: function(item, prevItem) {
      var accidental = this.abcAccidental[item.pitch.accidental];
      var pitch = this.abcStep[this.base12Pitch(item.pitch.step, 0, item.pitch.octave, 0, true) - 13];
      var duration = item.duration;
      if (prevItem !== null) {
        if (prevItem.dot) {
          duration = duration * 2;
        }
      }
      var dotted = '';
      if (item.dot) {
        duration = duration / 1.5;
        dotted = '>';
      }

      if (item.rest) {
        return 'z' + duration + dotted;
      } else {
        return accidental + pitch + duration + dotted;
      }
    },

    /**
     * Calculates difference between two pitches
     *
     * @param {object} pitch1 - The first pitch to compare
     * @param {number} keyAdjust - The position in circle of fifths of the searched notes
     * @param {object} pitch2 - The second pitch to compare
     * @param {boolean} withOctave - When set, the octave is taken into account, otherwise function return relative value (from 1 to 12)
     * @param {boolean} absolute - When set, the absolute difference is returned as Math.abs(Pitch 2 - Pitch 1)
     * @returns {number} The difference between two pitches
     */
    pitchDifference: function(pitch1, keyAdjust, pitch2, withOctave, absolute) {
      if (typeof withOctave === 'undefined') {
        withOctave = false;
      }
      if (typeof absolute === 'undefined') {
        absolute = false;
      }

      var ret = this.base12Pitch(pitch2.step, keyAdjust, parseInt(pitch2.octave), parseInt(pitch2.alter), withOctave) - this.base12Pitch(pitch1.step, keyAdjust, parseInt(pitch1.octave), parseInt(pitch1.alter), withOctave);
      if (absolute) {
        ret = Math.abs(ret);
      }

      return ret;
    },

    /**
     * Calculates difference between two durations
     *
     * @param {number} duration1 - The first duration to compare
     * @param {number} duration2 - The second duration to compare
     * @param {boolean} absolute - When set, the absolute difference is returned as Math.abs(Duration 2 - Duration 1)
     * @returns {number} The difference between two durations
     */
    durationDifference: function(duration1, duration2, absolute) {
      if (typeof absolute === 'undefined') {
        absolute = false;
      }

      var ret = duration2 - duration1;
      if (absolute) {
        ret = Math.abs(ret);
      }

      return ret;
    },

    /**
     * Returns only unique array values
     *
     * @param {Array} array - The array with possible duplicate values
     * @returns {Array} Array with only unique values
     */
    uniques: function(array) {
      var a = [];
      for (var i=0, l=array.length; i<l; i++) {
        if (a.indexOf(array[i]) === -1 && array[i] !== '') {
          a.push(array[i]);
        }
      }

      return a;
    },

    /**
     * Edit-Distance implmentation from {@link https://gist.github.com/andrei-m/982927}
     *
     * Copyright (c) 2011 Andrei Mackenzie
     * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
     * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
     * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
     *
     * @param {string|Array} a - The first string (document)
     * @param {string|Array} b - The second string (query)
     * @param {boolean} compare - The compare function which returns boolean value between two items
     * @param {number} weight - The weight function which returns numeric for weighting operations
     * @returns {number} The calculated edit distance
     */
    editDistance: function(a, b, compare, weight) {
      if (a.length === 0) {
        return 0;
      }
      if (b.length === 0) {
        return 0;
      }

      var matrix = [];

      // increment along the first column of each row
      var i;
      for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }

      // increment each column in the first row
      var j;
      for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }

      // Fill in the rest of the matrix
      for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
          if (compare(i, j)) {
            matrix[i][j] = matrix[i-1][j-1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i-1][j-1] + weight(i, j), // substitution
              matrix[i][j-1] + weight(i, j), // insertion
              matrix[i-1][j] + weight(i, j)  // deletion
            );
          }
        }
      }

      var max = Math.max(matrix[b.length][0], matrix[0][a.length]);
      return 1 - matrix[b.length][a.length] / max;
    },

    /**
     * Calculate edit distance for strings
     *
     * @param {string} a - The first string (document)
     * @param {string} b - The second string (query)
     * @returns {number} The calculated edit distance
     */
    stringEditDistance: function(a, b) {
      return this.editDistance(a, b,
        function(i, j) {
          return b.charAt(i-1) === a.charAt(j-1);
        },
        function() {
          return 1;
        }
      );
    },

    /**
     * Calculate edit distance for arrays
     *
     * @param {Array} a - The first interval array (document)
     * @param {Array} b - The second interval array (query)
     * @returns {number} The calculated edit distance
     */
    arrayEditDistance: function(a, b) {
      return this.editDistance(a, b,
        function(i, j) {
          return b[i-1] === a[j-1];
        },
        function() {
          return 1;
        }
      );
    },

    /**
     * Calculate weighted edit distance for arrays
     * The function implements improved weighting for interval differences based on consonance / dissonance
     *
     * Concepts are taken from Mongeau, M., & Sankoff, D. (1990). Comparison of musical sequences. Computers and the Humanities, 24(3), 161–175. http://doi.org/10.1007/BF00117340
     *
     * @param {Array} a - The first notes array (document), format: output of MusicJsonToolbox.pitchDurationValues
     * @param {Array} b - The second notes array (query), format: output of MusicJsonToolbox.pitchDurationValues
     * @param {boolean} adjusted - Use adjusted weighting function
     * @returns {number} The calculated edit distance
     */
    weightedEditDistance: function(a, b, adjusted) {
      if (a.length === 0) {
        return 0;
      }
      if (b.length === 0) {
        return 0;
      }

      var matrix = [];

      // increment along the first column of each row
      var i;
      for (i = 0; i <= a.length; i++) {
        // console.log(i, a[i+1].duration);
        if (i > 0) {
          matrix[i] = [parseFloat(matrix[i-1]) + this.weightDeletion(a, i, adjusted)];
        } else {
          matrix[i] = [i];
        }

      }

      // increment each column in the first row
      var j;
      for (j = 0; j <= b.length; j++) {
        if (j > 0) {
          matrix[0][j] = parseFloat(matrix[0][j-1]) + this.weightInsertion(b, j, adjusted);
        } else {
          matrix[0][j] = j;
        }
      }

      // Calculate constant F
      var maxDurationA = 0;
      var minDurationB = Infinity;
      for (i = 0; i < a.length; i++) {
        if (maxDurationA < a[i].duration) {
          maxDurationA = a[i].duration;
        }
      }
      for (j = 0; j < b.length; j++) {
        if (minDurationB > b[j].duration) {
          minDurationB = b[j].duration;
        }
      }
      var f = maxDurationA / minDurationB;

      // Calculate constant C
      var maxDurationB = 0;
      var minDurationA = Infinity;
      for (j = 0; j < b.length; j++) {
        if (maxDurationB < b[j].duration) {
          maxDurationB = b[j].duration;
        }
      }
      for (i = 0; i < a.length; i++) {
        if (minDurationA > a[i].duration) {
          minDurationA = a[i].duration;
        }
      }
      var c = maxDurationB / minDurationA;

      // Fill in the rest of the matrix
      for (i = 1; i <= a.length; i++) {
        for (j = 1; j <= b.length; j++) {
          if (a[i-1].value === b[j-1].value && a[i-1].rest === b[j-1].rest && a[i-1].duration === b[j-1].duration) {
            // Set weight to zero if note is the same
            matrix[i][j] = matrix[i-1][j-1];
          } else {

            var substitution = matrix[i-1][j-1] + this.weightSubstitution(a, b, i, j, adjusted);
            var insertion = matrix[i][j-1] + this.weightInsertion(b, j, adjusted);
            var deletion = matrix[i-1][j] + this.weightDeletion(a, i, adjusted);
            var fragmentation = this.weightFragmentation(matrix, a, b, i, j, f, adjusted);
            var consolidation = this.weightConsolidation(matrix, a, b, i, j, c, adjusted);
            var minWeight = Math.min(
              substitution,
              insertion,
              deletion,
              fragmentation,
              consolidation
            );

            matrix[i][j] = minWeight;
          }
        }
      }

      var max = -Infinity;
      for (i = 0; i < matrix.length; i++) {
        var rowMax = Math.max.apply(null, matrix[i]);
        if (rowMax > max) {
          max = rowMax;
        }
      }
      return (max - matrix[a.length][b.length]) / max;
    },

    /**
     * Calculates weight for substitution of two notes
     *
     * @param {Array} a - First array of notes (document)
     * @param {Array} b - Second array of notes (search)
     * @param {number} i - Position to compare in a (1-based)
     * @param {number} j - Position to compare in a (1-based)
     * @param {boolean} adjusted - Use adjusted weighting function
     * @returns {number} Resulting weight
     */
    weightSubstitution: function(a, b, i, j, adjusted) {
      var weightInterval = this.weightInterval(a[i-1], b[j-1], adjusted);
      var weightLength = this.weightLength(a[i-1].duration, b[j-1].duration);
      var localK = adjusted ? this.globalK1 : this.globalK;
      var weight = weightInterval + (localK * weightLength);


      return weight;
    },

    /**
     * Calculates weight for insertion of a note
     *
     * @param {Array} b - The array where the note should be inserted from
     * @param {number} j - The position of the note that should be inserted
     * @param {boolean} adjusted - Use adjusted weighting function
     * @returns {number} Resulting weight
     */
    weightInsertion: function(b, j, adjusted) {
      var localK = adjusted ? this.globalK3 : this.globalK;
      return (localK * parseFloat(b[j-1].duration));
    },

    /**
     * Calculates weight for insertion of a note
     *
     * @param {Array} a - The array where the note should be deleted from
     * @param {number} i - The position of the note that should be deleted
     * @param {boolean} adjusted - Use adjusted weighting function
     * @returns {number} Resulting weight
     */
    weightDeletion: function(a, i, adjusted) {
      var localK = adjusted ? this.globalK3 : this.globalK;
      return (localK * a[i-1].duration);
    },

    /**
     * Calculates weight for fragmentation of one note in to several others
     *
     * @param {Array} matrix - The current calculated matrix
     * @param {Array} a - First array of notes (document)
     * @param {Array} b - Second array of notes (search)
     * @param {number} i - Current position in a
     * @param {number} j - Current position in b
     * @param {number} f - Constant parameter F (calculated by length of notes in both arrays)
     * @param {boolean} adjusted - Use adjusted weighting function
     * @returns {number} The resulting weight
     */
    weightFragmentation: function(matrix, a, b, i, j, f, adjusted) {
      var x, k;
      var min = 2;
      var max = Math.min(j-1, f);
      var minWeight = Infinity;
      var localK = adjusted ? this.globalK1 : this.globalK;
      for (x = min; x <= max; x++) {
        k = x;

        var weight = matrix[i-1][j-k];
        var durations = 0;
        while (k > 0) {
          var weightInterval = this.weightInterval(a[i-1], b[j-k], adjusted);
          weight += weightInterval;
          durations += b[j-k].duration;
          k--;
        }
        var weightLength = this.weightLength(a[i-1].duration, durations);
        weight += (localK * weightLength);

        if (minWeight > weight) {
          minWeight = weight;
        }
      }

      return minWeight;
    },

    /**
     * Calculates weight for fragmentation of one several notes to one
     *
     * @param {Array} matrix - The current calculated matrix
     * @param {Array} a - First array of notes (document)
     * @param {Array} b - Second array of notes (search)
     * @param {number} i - Current position in a
     * @param {number} j - Current position in b
     * @param {number} c - Constant parameter C (calculated by length of notes in both arrays)
     * @param {boolean} adjusted - Use adjusted weighting function
     * @returns {number} The resulting weight
     */
    weightConsolidation: function(matrix, a, b, i, j, c, adjusted) {
      var x, k;
      var min = 2;
      var max = Math.min(i-1, c);
      var minWeight = Infinity;
      var localK = adjusted ? this.globalK1 : this.globalK;
      for (x = min; x <= max; x++) {
        k = x;

        var weight = matrix[i-k][j-1];
        var durations = 0;
        while (k > 0) {
          var weightInterval = this.weightInterval(a[i-k], b[j-1], adjusted);
          weight += weightInterval;
          durations += a[i-k].duration;
          k--;
        }
        var weightLength = this.weightLength(durations, b[j-1].duration);
        weight += (localK * weightLength);

        if (minWeight > weight) {
          minWeight = weight;
        }
      }

      return minWeight;
    },

    /**
     * Calculates weight for difference of pitch values
     *
     * @param {object} a - First note object (from document)
     * @param {object} b - Second note object (from search)
     * @param {boolean} adjusted - Use adjusted weighting function
     * @returns {number} The resulting weight
     */
    weightInterval: function(a, b, adjusted) {
      if ((a.rest === 'true' || a.rest === true) || (b.rest === 'true' || b.rest === true)) {
        return 0.1;
      }

      var baseA = a.value % 12;
      if (baseA === 0) {
        baseA = 12;
      }
      var baseB = b.value % 12;
      if (baseB === 0) {
        baseB = 12;
      }

      /**
       * Adjusted weight interval according to Gomez, Abad-Mota & Ruckhaus, 2007.
       * {@link http://www.music-ir.org/mirex/abstracts/2007/QBSH_SMS_gomez.pdf}
       */
      if (adjusted) {
        return Math.abs(baseB - baseA);
      }

      if (typeof this.base12Inverted[baseA] !== 'undefined' && typeof this.base12Inverted[baseB] !== 'undefined') {
        // use deg(n(m))
        var degreeA = this.degreesFromSemitones[baseA];
        var degreeB = this.degreesFromSemitones[baseB];
        return this.deg[Math.abs(degreeA - degreeB)];
      } else {
        // use ton(m)
        return this.ton[Math.abs(baseA - baseB)];
      }
    },

    /**
     * Calculates weight for difference of length
     *
     * @param {number} a - The first notes length
     * @param {number} b - The second notes length
     * @returns {number} The resulting weight
     */
    weightLength: function(a, b) {
      return Math.abs(a - b);
    },

    /**
     * Returns the fine score for similarity between searched notes and the given document.
     * Calculation based on parsons code strings
     *
     * @param {object} object - A musicjson object to search in
     * @param {string} search - A string in parsons code (e.g. '*udu')
     * @returns {number} The fine score for similarity between parsons codes (0-1)
     */
    distanceParsons: function(object, search) {
      return this.stringEditDistance(
        this.valueMapping(
          this.parsons(this.notes(object, false, false))
        ).join(''),
        search
      );
    },

    /**
     * Returns the fine score for similarity between two document.
     * Calculation based on parsons code strings
     *
     * @param {object} object1 - The first musicjson object
     * @param {object} object2 - The second musicjson object
     * @returns {number} The fine score for similarity between parsons codes (0-1)
     */
    parsonSimilarity: function(object1, object2) {
      return this.distanceParsons(
        object1,
        this.valueMapping(this.parsons(this.notes(object2, false, false))).join('')
      );
    },

    /**
     * Returns the fine score for similarity between searched notes and the given document.
     * Calculation based on pitch values
     *
     * @param {object} object - The document
     * @param {Array} search - An array of pitch values (e.g. [1, 6, 1, 6])
     * @returns {number} The fine score for similarity between pitch values (0-1)
     */
    distancePitch: function(object, search) {
      return this.arrayEditDistance(
        this.pitchValues(
          this.notes(object, false, false),
          parseInt(object.attributes.key.fifths)
        ),
        search
      );
    },

    /**
     * Returns the fine score for similarity between two document.
     * Calculation based on pitch values
     *
     * @param {object} object1 - The first musicjson object
     * @param {object} object2 - The second musicjson object
     * @returns {number} The fine score for similarity between pitch values (0-1)
     */
    pitchSimilarity: function(object1, object2) {
      return this.distancePitch(
        object1,
        this.pitchValues(this.notes(object2, false, false), parseInt(object2.attributes.key.fifths))
      );
    },

    /**
     * Returns the fine score for similarity between searched notes and the given document.
     * Calculation based on intervals
     *
     * @param {object} object - The musicjson document
     * @param {Array} search - An array of intervals (e.g. [0, 5, -5, 5])
     * @returns {number} The fine score for similarity between intervals (0-1)
     */
    distanceIntervals: function(object, search) {
      return this.arrayEditDistance(
        this.valueMapping(this.intervals(this.notes(object, false, false))),
        search
      );
    },

    /**
     * Returns the fine score for similarity between two document.
     * Calculation based on intervals
     *
     * @param {object} object1 - The first musicjson object
     * @param {object} object2 - The second musicjson object
     * @returns {number} The fine score for similarity between intervals (0-1)
     */
    intervalSimilarity: function(object1, object2) {
      return this.distanceIntervals(
        object1,
        this.valueMapping(this.intervals(this.notes(object2, false, false)))
      );
    },

    /**
     * Returns minimum edit-distance between searched notes and the given document.
     * Calculation is based on pitch and duration values.
     *
     * @param {object} object - The musicjson document
     * @param {Array} search - An array of notes (duration with divisions 16, e.g. eighth=8, quarter=16)
     * @param {boolean} adjusted - Use adjusted weighting function
     * @returns {number} The fine score for similarity between pitch & duration values (0-1)
     */
    distancePitchDuration: function(object, search, adjusted) {
      return this.weightedEditDistance(
        this.pitchDurationValues(
          this.notes(object, false, true),
          parseInt(object.attributes.key.fifths),
          parseInt(object.attributes.divisions),
          parseInt(object.attributes.time['beat-type'])
        ), search, adjusted);
    },

    /**
     * Returns the fine score for similarity between two document.
     * Calculation based on pitch and duration values
     *
     * @param {object} object1 - The first musicjson object
     * @param {object} object2 - The second musicjson object
     * @param {boolean} adjusted - Use adjusted weighting function
     * @returns {number} The fine score for similarity between pitch and duration values (0-1)
     */
    pitchDurationSimilarity: function(object1, object2, adjusted) {
      return this.distancePitchDuration(
        object1,
        this.pitchDurationValues(
          this.notes(object2, false, true),
          parseInt(object2.attributes.key.fifths),
          parseInt(object2.attributes.divisions),
          parseInt(object2.attributes.time['beat-type'])
        ),
        adjusted
      );
    },

    /**
     * Returns the fine score for similarity between searched notes and the corresponding ngrams.
     * Notes are represented in parsons code.
     *
     * @param {object} object - A musicjson object to search in
     * @param {string} search - A string in parsons code (e.g. '*udu')
     * @returns {Array} The fine score for similarity for each ngram (0-1)
     */
    distanceParsonsNgrams: function(object, search) {
      var ngrams = this.ngrams(this.parsons(this.notes(object, false, false)), search.length);
      var distances = [];

      for (var i = 0; i < ngrams.length; i++) {

        for (var j = 0; j < ngrams[i].length; j++) {
          if (j === 0) {
            // Reset first value of ngram
            ngrams[i][j].value = '*';
          }
        }

        distances.push({
          distance: this.stringEditDistance(
            this.valueMapping(ngrams[i]).join(''),
            search
          ),
          highlight: this.highlightMapping(ngrams[i])
        });
      }

      return distances;
    },

    /**
     * Returns the fine score for similarity between the searched notes and corresponding ngrams.
     * Notes are represented with pitch and duration
     *
     * @param {object} object - A musicjson object to search in
     * @param {Array} search - An array of pitch values (e.g. [1, 6, 1, 6])
     * @returns {Array} The fine score for similarity for each ngram (0-1)
     */
    distancePitchNgrams: function(object, search) {
      var keyAdjust = parseInt(object.attributes.key.fifths);
      var ngrams = this.ngrams(this.notes(object, false, false), search.length);
      var distances = [];

      for (var i = 0; i < ngrams.length; i++) {
        distances.push({
          distance: this.arrayEditDistance(this.pitchValues(ngrams[i], keyAdjust), search),
          highlight: this.highlightMapping(ngrams[i])
        });
      }

      return distances;
    },

    /**
     * Returns the fine score for similarity between the searched notes and the corresponding ngrams.
     * Notes are represented as intervals.
     *
     * @param {object} object - A musicjson object to search in
     * @param {Array} search - An array of intervals (e.g. [0, 5, -5, 5])
     * @returns {Array} The fine score for similarity for each ngram (0-1)
     */
    distanceIntervalsNgrams: function(object, search) {
      var ngrams = this.ngrams(this.intervals(this.notes(object, false, false)), search.length);
      var distances = [];

      for (var i = 0; i < ngrams.length; i++) {
        for (var j = 0; j < ngrams[i].length; j++) {
          if (j === 0) {
            // Reset first value of ngram
            ngrams[i][j].value = '*';
          }
        }

        distances.push({
          distance: this.arrayEditDistance(
            this.valueMapping(ngrams[i]),
            search
          ),
          highlight: this.highlightMapping(ngrams[i])
        });
      }

      return distances;
    },

    /**
     * Returns the fine score for similarity between the searched notes and the corresponding ngrams.
     * Notes are represented as pitch and duration values.
     *
     * @param {object} object - A musicjson object to search in
     * @param {Array} search - An array of notes ((duration with divisions 16, e.g. eighth=8, quarter=16)
     * @param {boolean} adjusted - Use adjusted weighting function
     * @returns {Array} The fine score for similarity for each ngram (0-1)
     */
    distancePitchDurationNgrams: function(object, search, adjusted) {
      var divisions = parseInt(object.attributes.divisions);
      var beatType = parseInt(object.attributes.time['beat-type']);
      var keyAdjust = parseInt(object.attributes.key.fifths);
      var ngrams = this.ngrams(this.notes(object, false, true), search.length * 2);
      var distances = [];

      for (var i = 0; i < ngrams.length; i++) {

        distances.push({
          distance: this.weightedEditDistance(
            this.pitchDurationValues(
              ngrams[i],
              keyAdjust,
              divisions,
              beatType
            ), search, adjusted),
          highlight: this.highlightMapping(ngrams[i])
        });
      }

      return distances;
    }
  };



  // =============================
  // ========== EXPORTS ==========
  // =============================
  // amd
  /* istanbul ignore next */
  if (typeof define !== 'undefined' && define !== null && define.amd) {
    define(function () {
      return MusicJsonToolbox;
    });
  } else if (typeof module !== 'undefined' && module !== null) { // commonjs
    module.exports = MusicJsonToolbox;
  } else if (typeof self !== 'undefined' && typeof self.postMessage === 'function' && typeof self.importScripts === 'function') { // web worker
    self.MusicJsonToolbox = MusicJsonToolbox;
  } else if (typeof window !== 'undefined' && window !== null) { // browser main thread
    window.MusicJsonToolbox = MusicJsonToolbox;
  }
}());

},{}],3:[function(require,module,exports){
var circleOfFifths = {
  "major": {
    "-7": "Cb",
    "-6": "Gb",
    "-5": "Db",
    "-4": "Ab",
    "-3": "Eb",
    "-2": "Bb",
    "-1": "F",
    "0": "C",
    "1": "G",
    "2": "D",
    "3": "A",
    "4": "E",
    "5": "B",
    "6": "F#",
    "7": "C#"
  },
  "minor": {
    "-7": "Abm",
    "-6": "Ebm",
    "-5": "Bbm",
    "-4": "Fm",
    "-3": "Cm",
    "-2": "Gm",
    "-1": "Dm",
    "0" : "Am",
    "1" : "Em",
    "2" : "Bm",
    "3" : "F#m",
    "4" : "C#m",
    "5" : "G#m",
    "6" : "D#m",
    "7" : "A#m"
  }
};
var accidental = {
  "json": {
    "flat-flat": "__",
    "flat": "_",
    "natural": "=",
    "sharp" : "^",
    "sharp-sharp" : "^^",
    "undefined" : ""
  },
  "abc": {
    "flat": -1,
    "sharp": 1
  }
};
var pitches = {
  "json": {
    "1": {
      "A": "A,,,",
      "B": "B,,,",
      "C": "C,,,",
      "D": "D,,,",
      "E": "E,,,",
      "F": "F,,,",
      "G": "G,,,"
    },
    "2": {
      "A": "A,,",
      "B": "B,,",
      "C": "C,,",
      "D": "D,,",
      "E": "E,,",
      "F": "F,,",
      "G": "G,,"
    },
    "3": {
      "A": "A,",
      "B": "B,",
      "C": "C,",
      "D": "D,",
      "E": "E,",
      "F": "F,",
      "G": "G,"
    },
    "4": {
      "A": "A",
      "B": "B",
      "C": "C",
      "D": "D",
      "E": "E",
      "F": "F",
      "G": "G"
    },
    "5": {
      "A": "a",
      "B": "b",
      "C": "c",
      "D": "d",
      "E": "e",
      "F": "f",
      "G": "g"
    },
    "6": {
      "A": "a'",
      "B": "b'",
      "C": "c'",
      "D": "d'",
      "E": "e'",
      "F": "f'",
      "G": "g'"
    },
    "7": {
      "A": "a''",
      "B": "b''",
      "C": "c''",
      "D": "d''",
      "E": "e''",
      "F": "f''",
      "G": "g''"
    },
    "8": {
      "A": "a'''",
      "B": "b'''",
      "C": "c'''",
      "D": "d'''",
      "E": "e'''",
      "F": "f'''",
      "G": "g'''"
    }
  },
  "abc": {
    "0": "C",
    "1": "D",
    "2": "E",
    "3": "F",
    "4": "G",
    "5": "A",
    "6": "B"
  }
};
var durations = [
  {
    "type": "whole",
    "duration": 1
  },
  {
    "type": "half",
    "duration": 0.5
  },
  {
    "type": "quarter",
    "duration": 0.25
  },
  {
    "type": "eighth",
    "duration": 0.125
  },
  {
    "type": "16th",
    "duration": 0.0625
  },
  {
    "type": "32th",
    "duration": 0.03125
  },
  {
    "type": "64th",
    "duration": 0.015625
  }
];
var clefs = {
  "G": "treble",
  "F": "bass",
  "C": "alto"
};

var Parser = require('./lib/abc_parser');

/**
 * Returns the abc notation string from given input
 * @param {object} input - The parsed input from input file
 * @returns {string}
 */
function convertJsonToAbc(input) {
  var outputData = "";
  outputData += "X:1\n";
  outputData += "T:"
    + input.id
    + "\n";
  outputData += "M:"
    + input.attributes.time.beats
    + "/"
    + input.attributes.time["beat-type"]
    + "\n";
  outputData += "L:"
    + "1/"
    + (input.attributes.divisions * input.attributes.time["beat-type"])
    + "\n";
  outputData += "K:"
    + getAbcKey(input.attributes.key.fifths, input.attributes.key.mode)
    + "\n";
  outputData += "K:"
    + getAbcClef(input.attributes.clef.sign)
    + "\n";

  for (var i = 0; i < input.measures.length; i++) {
    if (i % 4 === 0 && i > 0) { // 4 measures per line
      outputData += "\n";
      outputData += "|";
    }
    var measure = input.measures[i];
    if (measure.attributes.repeat.left === true || measure.attributes.repeat.left === 'true') {
      outputData += ":";
    }

    for (var j = 0; j < measure.notes.length; j++) {

      outputData += getAbcNote(measure.notes[j-1], measure.notes[j]);
    }

    if (measure.attributes.repeat.right === true || measure.attributes.repeat.right === 'true') {
      outputData += ":";
    }
    outputData += "|";

  }

  return outputData;
}

/**
 * Returns the abc notation string from given input
 * @param {object} input - The parsed input from input file
 * @returns {string}
 */
function convertAbcToJson(input) {
  var outputData = {};
  var parser = new Parser();
  parser.parse(input);
  var tune = parser.getTune();
  outputData = createJsonFromLines(tune);
  outputData.id = getJsonId(input);

  return JSON.stringify(outputData);
}

function convertXmlToJson(input, id) {
  var outputData = {};
  outputData.id = id;
  outputData.measures = [];

  var score = input['score-partwise'].part;
  // console.log(score);
  if (score instanceof Array) {
    throw new Error('Multi-Part data is not supported');
  }

  var measures = score.measure;
  for (var i = 0; i < measures.length; i++) {
    // console.log(measures[i]);
    if (measures[i].hasOwnProperty('attributes')) {
      outputData.attributes = parseXmlAttributes(measures[i].attributes);
    }
    outputData.measures.push({
      attributes: {
        repeat: {
          left: false,
          right: false
        }
      },
      notes: parseXmlNotes(measures[i].note)
    });
  }

  return JSON.stringify(outputData);
}

/**
 * Returns the key for abc notation from given fifths
 * @param {number} fifths - The position inside the circle of fifths
 * @param {string|undefined} mode - The mode (major / minor)
 * @returns {string}
 */
function getAbcKey(fifths, mode) {
  if (typeof mode === 'undefined' || mode === null) mode = 'major';
  return circleOfFifths[mode][fifths];
}

/**
 * Returns the key for abc notation from given fifths
 * @param {string} sign - The clef sign
 * @returns {string}
 */
function getAbcClef(sign) {
  return clefs[sign];
}

/**
 * Returns a note in abc notation from given note object (JSON)
 * @param {object} prevNote - The previous note
 * @param {object} curNote - The note that should be transformed to abc
 * @returns {string}
 */
function getAbcNote(prevNote, curNote) {
  var _accidental = '';
  if (typeof curNote.pitch.accidental !== 'undefined' && parseInt(curNote.pitch.accidental) !== 0) {
    _accidental = accidental.json[curNote.pitch.accidental];
  }
  var _pitch = pitches.json[parseInt(curNote.pitch.octave)][curNote.pitch.step];
  var _duration = parseInt(curNote.duration);
  if (typeof prevNote !== 'undefined') {
    if (prevNote.dot) {
      _duration = _duration * 2;
    }
  }
  var _dotted = '';
  if (curNote.dot === true || curNote.dot === 'true') {
    _dotted = '>';
    _duration = _duration / 1.5;
  }

  // check if rest
  if (curNote.rest === true || curNote.rest === 'true') {
    // return rest as abc
    return "z" + _duration + _dotted;
  } else {
    // return note as abc
    return _accidental + _pitch + _duration + _dotted;
  }
}

/**
 * Get id from abc string
 * @param {String} data - The abc string
 * @returns {string}
 */
var getJsonId = function getJSONId(data) {
  var lines = data.split('\n');
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('T:') > -1) {
      return lines[i].substr(lines[i].indexOf(':') + 1, lines[i].length);
    }
  }
  throw new Error('Could not determine "T:" field');
};

/**
 * Creates json object from abc tunes object
 * @param {object} tune - The parsed tune object
 * @returns {object}
 */
var createJsonFromLines = function(tune) {
  var ret = {
    attributes: {
      divisions: 1 /tune.getBeatLength(),
      clef: {
        line: 2
      },
      key: {},
      time: {}
    }
  };
  var measures = [];
  var measureCounter = 0;
  var barlineCounter = 0;

  // parse lines
  for (var l = 0; l < tune.lines.length; l++) {
    for (var s = 0; s < tune.lines[l].staff.length; s++) {
      var staff = tune.lines[l].staff[s];

      // parse default clef, key, meter
      if (l === 0 && s === 0) {
        ret.attributes.clef.sign = getKeyByValue(clefs, staff.clef.type);
        ret.attributes.clef.line = staff.clef.clefPos / 2;
        ret.attributes.key.fifths = parseInt(getKeyByValue(circleOfFifths, staff.key.root));
        ret.attributes.time.beats = staff.meter.value[0].num;
        ret.attributes.time['beat-type'] = staff.meter.value[0].den;
      }

      for (var v = 0; v < staff.voices.length; v++) {
        for (var t = 0; t < staff.voices[v].length; t++) {
          var token = staff.voices[v][t];

          // init measure if none exists
          if (measures[measureCounter] === undefined) {
            measures[measureCounter] = new Measure();
          }

          switch (token.el_type) {
            case "note":
              measures[measureCounter].addNote(token, ret.attributes.divisions, ret.attributes.time['beat-type']);
              break;
            case "bar":
              if (token.type === 'bar_right_repeat') {
                measures[measureCounter].setRepeatRight();
              }
              measureCounter++;
              if (measures[measureCounter] === undefined) {
                measures[measureCounter] = new Measure();
              }
              if (token.type === 'bar_left_repeat') {
                measures[measureCounter].setRepeatLeft();
              }
              break;
            default:
              console.log(token);
              break;
          }
        }
      }
    }
  }

  // put measures together
  ret.measures = [];
  for (var i = 0; i < measures.length; i++) {
    var measure = measures[i].get();
    if (measure.notes.length > 0) {
      ret.measures.push(measure);
    }
  }
  return ret;
};

/**
 * Constructor for measure objects
 * @constructor
 */
var Measure = function() {
  var attributes = {
    repeat: {
      left: false,
      right: false
    }
  };
  var notes = [];

  /**
   * Set repeat left for measure
   */
  this.setRepeatLeft = function () {
    attributes.repeat.left = true;
  };

  /**
   * Set repeat right for measure
   */
  this.setRepeatRight = function () {
    attributes.repeat.right = true;
  };

  /**
   * Add note to measure
   * @param {object} note - The note object
   * @param {Number} divisions - The calculated divisions
   * @param {Number} beatType - The beat type
   */
  this.addNote = function(note, divisions, beatType) {
    var _note = {pitch:{}};
    var _octave = 5, _step, _alter = 0;
    if (note.hasOwnProperty('pitches')) {
      _octave--;
      _step = note.pitches[0].pitch;
      while (_step > 6) {
        _octave++;
        _step -= 7;
      }
      while (_step < 0) {
        _octave--;
        _step +=7
      }
      _note.pitch.step = pitches.abc[_step];
      _note.rest = false;
      if (note.pitches[0].hasOwnProperty('accidental')) {
        _alter = accidental.abc[note.pitches[0].accidental];
        _note.pitch.accidental = note.pitches[0].accidental;
      }
    } else {
      _note.pitch.step = "C";
      _note.pitch.octave = 5;
      _note.rest = true;
      _note.pitch.alter = 0;
    }
    _note.pitch.octave = _octave;
    _note.pitch.alter = _alter;

    for (var i = 0; i < durations.length; i++) {
      if (typeof durations[i+1] !== 'undefined') {
        if (durations[i].duration > note.duration && durations[i+1].duration <= note.duration) {
          var diff = note.duration - durations[i+1].duration;
          _note.duration = durations[i+1].duration * divisions * beatType;
          _note.type = durations[i+1].type;
          if (diff > 0) {
            if ((diff / durations[i+1].duration) === 0.5) {
              _note.dot = true;
            } else {
              throw new Error('Unknown duration: ' + note.duration);
            }
          }
          break;
        }
      } else {
        throw new Error('Unknown duration: ' + note.duration);
      }
    }

    notes.push(_note);
  };

  /**
   * Get measure object
   * @returns {{attributes: {repeat: {left: boolean, right: boolean}}, notes: Array}}
   */
  this.get = function() {
    return {
      attributes: attributes,
      notes: notes
    };
  };
};

/**
 * Get object key by value
 * @param {object} object - The object to search in
 * @param {string} value - The value to search for
 * @returns {string}
 */
var getKeyByValue = function(object, value) {
  for (var key in object) {
    if (!object.hasOwnProperty(key)) continue;
    if (typeof object[key] === 'object') {
      return getKeyByValue(object[key], value);
    } else {
      if (object[key] == value) return key;
    }
  }
};

var parseXmlAttributes = function(attributes) {
  var ret = {
    'clef': {
      'line': 2,
      'sign': 'G'
    },
    'key': {
      'fifths': 0
    },
    'time': {
      'beats': 4,
      'beat-type': 4
    },
    'divisions': 1
  };

  for (var i = 0; i < attributes.length; i++) {
    if (attributes[i].hasOwnProperty('divisions')) {
      ret.divisions = parseInt(attributes[i].divisions);
    }
    if (attributes[i].hasOwnProperty('key')) {
      ret.key.fifths = parseInt(attributes[i].key.fifths);
      ret.key.mode = parseInt(attributes[i].key.mode);
    }
    if (attributes[i].hasOwnProperty('time')) {
      ret.time.beats = parseInt(attributes[i].time.beats);
      ret.time['beat-type'] = parseInt(attributes[i].time['beat-type']);
    }
  }

  return ret;
};

var parseXmlNotes = function(notes) {
  var ret = [];
  if (!(notes instanceof Array)) {
    notes = [notes];
  }

  for (var i = 0; i < notes.length; i++) {
    var tempNote = {
      pitch: {
        step: 'C',
        octave: 5,
        alter: 0
      },
      rest: false,
      duration: 2,
      type: 'quarter'
    };
    if (typeof notes[i].pitch !== 'undefined') {
      if (typeof notes[i].pitch.step !== 'undefined') tempNote.pitch.step = notes[i].pitch.step;
      if (typeof notes[i].pitch.octave !== 'undefined') tempNote.pitch.octave = parseInt(notes[i].pitch.octave);
      if (typeof notes[i].pitch.alter !== 'undefined') tempNote.pitch.alter = parseInt(notes[i].pitch.alter);
      if (typeof notes[i].pitch.accidental !== 'undefined') tempNote.pitch.accidental = notes[i].pitch.accidental;
    }
    if (typeof notes[i].rest !== 'undefined') tempNote.rest = notes[i].rest;
    if (typeof notes[i].dot !== 'undefined') tempNote.dot = notes[i].dot;
    if (typeof notes[i].duration !== 'undefined') tempNote.duration = parseInt(notes[i].duration);
    if (typeof notes[i].type !== 'undefined') tempNote.type = notes[i].type;
    ret.push(tempNote);
  }

  return ret;
};

/**
 * Returns a string in abc notation from given data
 * @param {object} data - The JSON string data that should be transformed to abc
 * @returns {string}
 */
exports.json2abc = function(data) {
  return convertJsonToAbc(JSON.parse(data));
};

/**
 * Returns a string in json notation from given abc data
 * @param {object} data - The abc string that should be transformed to json
 * @returns {string}
 */
exports.abc2json = function(data) {
  return convertAbcToJson(data);
};

/**
 * Returns a string in json notation from given xml data
 * @param {object} data - The music xml that should be transformed to json
 * @returns {string}
 */
exports.xml2json = function(data, id) {
  return convertXmlToJson(data, id);
};

},{"./lib/abc_parser":5}],4:[function(require,module,exports){
var Common = require('../parse/Common');
var KeyVoice = require('../parse/KeyVoice');

module.exports = function() {
  this.getBeatLength = function() {
    for (var i = 0; i < this.lines.length; i++) {
      if (this.lines[i].staff) {
        for (var j = 0; j < this.lines[i].staff.length; j++) {
          if (this.lines[i].staff[j].meter) {
            var meter = this.lines[i].staff[j].meter;
            if (meter.type === "specified") {
              if (meter.value.length > 0) {
                var num = parseInt(meter.value[0].num, 10);
                var den = parseInt(meter.value[0].den, 10);
                if (num === 6 && den === 8) return 3/8;
                if (num === 9 && den === 8) return 3/8;
                if (num === 12 && den === 8) return 3/8;
                return 1/den;
              }
              else
                return null;
            } else if (meter.type === 'cut_time') {
              return 1/2;
            } else {
              return 1/4; // TODO-PER: this works for common time, but not for the ancient meters.
            }
          }
        }
      }
    }
    return null;
  };

  this.reset = function () {
    this.version = "1.0.1";
    this.media = "screen";
    this.metaText = {};
    this.formatting = {};
    this.lines = [];
    this.staffNum = 0;
    this.voiceNum = 0;
    this.lineNum = 0;
  };

  this.cleanUp = function(defWidth, defLength, barsperstaff, staffnonote, currSlur) {
    this.closeLine();	// Close the last line.

    // Remove any blank lines
    var anyDeleted = false;
    var i, s, v;
    for (i = 0; i < this.lines.length; i++) {
      if (this.lines[i].staff !== undefined) {
        var hasAny = false;
        for (s = 0; s < this.lines[i].staff.length; s++) {
          if (this.lines[i].staff[s] === undefined) {
            anyDeleted = true;
            this.lines[i].staff[s] = null;
            //this.lines[i].staff[s] = { voices: []};	// TODO-PER: There was a part missing in the abc music. How should we recover?
          } else {
            for (v = 0; v < this.lines[i].staff[s].voices.length; v++) {
              if (this.lines[i].staff[s].voices[v] === undefined)
                this.lines[i].staff[s].voices[v] = [];	// TODO-PER: There was a part missing in the abc music. How should we recover?
              else
              if (this.containsNotes(this.lines[i].staff[s].voices[v])) hasAny = true;
            }
          }
        }
        if (!hasAny) {
          this.lines[i] = null;
          anyDeleted = true;
        }
      }
    }
    if (anyDeleted) {
      this.lines = Common.compact(this.lines);
      Common.each(this.lines, function(line) {
        if (line.staff)
          line.staff = Common.compact(line.staff);
      });
    }

    // if we exceeded the number of bars allowed on a line, then force a new line
    if (barsperstaff) {
      for (i = 0; i < this.lines.length; i++) {
        if (this.lines[i].staff !== undefined) {
          for (s = 0; s < this.lines[i].staff.length; s++) {
            for (v = 0; v < this.lines[i].staff[s].voices.length; v++) {
              var barNumThisLine = 0;
              for (var n = 0; n < this.lines[i].staff[s].voices[v].length; n++) {
                if (this.lines[i].staff[s].voices[v][n].el_type === 'bar') {
                  barNumThisLine++;
                  if (barNumThisLine >= barsperstaff) {
                    // push everything else to the next line, if there is anything else,
                    // and there is a next line. If there isn't a next line, create one.
                    if (n < this.lines[i].staff[s].voices[v].length - 1) {
                      if (i === this.lines.length - 1) {
                        var cp = JSON.parse(JSON.stringify(this.lines[i]));
                        this.lines.push(Common.clone(cp));
                        for (var ss = 0; ss < this.lines[i+1].staff.length; ss++) {
                          for (var vv = 0; vv < this.lines[i+1].staff[ss].voices.length; vv++)
                            this.lines[i+1].staff[ss].voices[vv] = [];
                        }
                      }
                      var startElement = n + 1;
                      var section = this.lines[i].staff[s].voices[v].slice(startElement);
                      this.lines[i].staff[s].voices[v] = this.lines[i].staff[s].voices[v].slice(0, startElement);
                      this.lines[i+1].staff[s].voices[v] = section.concat(this.lines[i+1].staff[s].voices[v]);
                    }
                  }
                }
              }

            }
          }
        }
      }
    }

    // If we were passed staffnonote, then we want to get rid of all staffs that contain only rests.
    if (barsperstaff) {
      anyDeleted = false;
      for (i = 0; i < this.lines.length; i++) {
        if (this.lines[i].staff !== undefined) {
          for (s = 0; s < this.lines[i].staff.length; s++) {
            var keepThis = false;
            for (v = 0; v < this.lines[i].staff[s].voices.length; v++) {
              if (this.containsNotesStrict(this.lines[i].staff[s].voices[v])) {
                keepThis = true;
              }
            }
            if (!keepThis) {
              anyDeleted = true;
              this.lines[i].staff[s] = null;
            }
          }
        }
      }
      if (anyDeleted) {
        Common.each(this.lines, function(line) {
          if (line.staff)
            line.staff = Common.compact(line.staff);
        });
      }
    }

    // Remove the temporary working variables
    for (i = 0; i < this.lines.length; i++) {
      if (this.lines[i].staff) {
        for (s = 0; s < this.lines[i].staff.length; s++)
          delete this.lines[i].staff[s].workingClef;
      }
    }

    function cleanUpSlursInLine(line) {
      var x;
//			var lyr = null;	// TODO-PER: debugging.

      var addEndSlur = function(obj, num, chordPos) {
        if (currSlur[chordPos] === undefined) {
          // There isn't an exact match for note position, but we'll take any other open slur.
          for (x = 0; x < currSlur.length; x++) {
            if (currSlur[x] !== undefined) {
              chordPos = x;
              break;
            }
          }
          if (currSlur[chordPos] === undefined) {
            var offNum = chordPos*100+1;
            Common.each(obj.endSlur, function(x) { if (offNum === x) --offNum; });
            currSlur[chordPos] = [offNum];
          }
        }
        var slurNum;
        for (var i = 0; i < num; i++) {
          slurNum = currSlur[chordPos].pop();
          obj.endSlur.push(slurNum);
//					lyr.syllable += '<' + slurNum;	// TODO-PER: debugging
        }
        if (currSlur[chordPos].length === 0)
          delete currSlur[chordPos];
        return slurNum;
      };

      var addStartSlur = function(obj, num, chordPos, usedNums) {
        obj.startSlur = [];
        if (currSlur[chordPos] === undefined) {
          currSlur[chordPos] = [];
        }
        var nextNum = chordPos*100+1;
        for (var i = 0; i < num; i++) {
          if (usedNums) {
            Common.each(usedNums, function(x) { if (nextNum === x) ++nextNum; });
            Common.each(usedNums, function(x) { if (nextNum === x) ++nextNum; });
            Common.each(usedNums, function(x) { if (nextNum === x) ++nextNum; });
          }
          Common.each(currSlur[chordPos], function(x) { if (nextNum === x) ++nextNum; });
          Common.each(currSlur[chordPos], function(x) { if (nextNum === x) ++nextNum; });

          currSlur[chordPos].push(nextNum);
          obj.startSlur.push({ label: nextNum });
//					lyr.syllable += ' ' + nextNum + '>';	// TODO-PER:debugging
          nextNum++;
        }
      };

      for (var i = 0; i < line.length; i++) {
        var el = line[i];
//				if (el.lyric === undefined)	// TODO-PER: debugging
//					el.lyric = [{ divider: '-' }];	// TODO-PER: debugging
//				lyr = el.lyric[0];	// TODO-PER: debugging
//				lyr.syllable = '';	// TODO-PER: debugging
        if (el.el_type === 'note') {
          if (el.gracenotes) {
            for (var g = 0; g < el.gracenotes.length; g++) {
              if (el.gracenotes[g].endSlur) {
                var gg = el.gracenotes[g].endSlur;
                el.gracenotes[g].endSlur = [];
                for (var ggg = 0; ggg < gg; ggg++)
                  addEndSlur(el.gracenotes[g], 1, 20);
              }
              if (el.gracenotes[g].startSlur) {
                x = el.gracenotes[g].startSlur;
                addStartSlur(el.gracenotes[g], x, 20);
              }
            }
          }
          if (el.endSlur) {
            x = el.endSlur;
            el.endSlur = [];
            addEndSlur(el, x, 0);
          }
          if (el.startSlur) {
            x = el.startSlur;
            addStartSlur(el, x, 0);
          }
          if (el.pitches) {
            var usedNums = [];
            for (var p = 0; p < el.pitches.length; p++) {
              if (el.pitches[p].endSlur) {
                var k = el.pitches[p].endSlur;
                el.pitches[p].endSlur = [];
                for (var j = 0; j < k; j++) {
                  var slurNum = addEndSlur(el.pitches[p], 1, p+1);
                  usedNums.push(slurNum);
                }
              }
            }
            for (p = 0; p < el.pitches.length; p++) {
              if (el.pitches[p].startSlur) {
                x = el.pitches[p].startSlur;
                addStartSlur(el.pitches[p], x, p+1, usedNums);
              }
            }
            // Correct for the weird gracenote case where ({g}a) should match.
            // The end slur was already assigned to the note, and needs to be moved to the first note of the graces.
            if (el.gracenotes && el.pitches[0].endSlur && el.pitches[0].endSlur[0] === 100 && el.pitches[0].startSlur) {
              if (el.gracenotes[0].endSlur)
                el.gracenotes[0].endSlur.push(el.pitches[0].startSlur[0].label);
              else
                el.gracenotes[0].endSlur = [el.pitches[0].startSlur[0].label];
              if (el.pitches[0].endSlur.length === 1)
                delete el.pitches[0].endSlur;
              else if (el.pitches[0].endSlur[0] === 100)
                el.pitches[0].endSlur.shift();
              else if (el.pitches[0].endSlur[el.pitches[0].endSlur.length-1] === 100)
                el.pitches[0].endSlur.pop();
              if (currSlur[1].length === 1)
                delete currSlur[1];
              else
                currSlur[1].pop();
            }
          }
        }
      }
    }

    // TODO-PER: This could be done faster as we go instead of as the last step.
    function fixClefPlacement(el) {
      KeyVoice.fixClef(el);
      //if (el.el_type === 'clef') {
//				var min = -2;
//				var max = 5;
//				switch(el.type) {
//					case 'treble+8':
//					case 'treble-8':
//						break;
//					case 'bass':
//					case 'bass+8':
//					case 'bass-8':
//						el.verticalPos = 20 + el.verticalPos; min += 6; max += 6;
//						break;
//					case 'tenor':
//					case 'tenor+8':
//					case 'tenor-8':
//						el.verticalPos = - el.verticalPos; min = -40; max = 40;
////						el.verticalPos+=2; min += 6; max += 6;
//						break;
//					case 'alto':
//					case 'alto+8':
//					case 'alto-8':
//						el.verticalPos = - el.verticalPos; min = -40; max = 40;
////						el.verticalPos-=2; min += 4; max += 4;
//						break;
//				}
//				if (el.verticalPos < min) {
//					while (el.verticalPos < min)
//						el.verticalPos += 7;
//				} else if (el.verticalPos > max) {
//					while (el.verticalPos > max)
//						el.verticalPos -= 7;
//				}
      //}
    }

    for (this.lineNum = 0; this.lineNum < this.lines.length; this.lineNum++) {
      if (this.lines[this.lineNum].staff) for (this.staffNum = 0; this.staffNum < this.lines[this.lineNum].staff.length; this.staffNum++) {
        if (this.lines[this.lineNum].staff[this.staffNum].clef)
          fixClefPlacement(this.lines[this.lineNum].staff[this.staffNum].clef);
        for (this.voiceNum = 0; this.voiceNum < this.lines[this.lineNum].staff[this.staffNum].voices.length; this.voiceNum++) {
//					var el = this.getLastNote();
//					if (el) el.end_beam = true;
          cleanUpSlursInLine(this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum]);
          for (var j = 0; j < this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum].length; j++)
            if (this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum][j].el_type === 'clef')
              fixClefPlacement(this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum][j]);
        }
      }
    }

    if (!this.formatting.pagewidth)
      this.formatting.pagewidth = defWidth;
    if (!this.formatting.pageheight)
      this.formatting.pageheight = defLength;

    // Remove temporary variables that the outside doesn't need to know about
    delete this.staffNum;
    delete this.voiceNum;
    delete this.lineNum;
    delete this.potentialStartBeam;
    delete this.potentialEndBeam;
    delete this.vskipPending;

    return currSlur;
  };

  this.reset();

  this.getLastNote = function() {
    if (this.lines[this.lineNum] && this.lines[this.lineNum].staff && this.lines[this.lineNum].staff[this.staffNum] &&
      this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum]) {
      for (var i = this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum].length-1; i >= 0; i--) {
        var el = this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum][i];
        if (el.el_type === 'note') {
          return el;
        }
      }
    }
    return null;
  };

  this.addTieToLastNote = function() {
    // TODO-PER: if this is a chord, which note?
    var el = this.getLastNote();
    if (el && el.pitches && el.pitches.length > 0) {
      el.pitches[0].startTie = {};
      return true;
    }
    return false;
  };

  this.getDuration = function(el) {
    if (el.duration) return el.duration;
    //if (el.pitches && el.pitches.length > 0) return el.pitches[0].duration;
    return 0;
  };

  this.closeLine = function() {
    if (this.potentialStartBeam && this.potentialEndBeam) {
      this.potentialStartBeam.startBeam = true;
      this.potentialEndBeam.endBeam = true;
    }
    delete this.potentialStartBeam;
    delete this.potentialEndBeam;
  };

  this.appendElement = function(type, startChar, endChar, hashParams)
  {
    var This = this;
    var pushNote = function(hp) {
      if (hp.pitches !== undefined) {
        var mid = This.lines[This.lineNum].staff[This.staffNum].workingClef.verticalPos;
        Common.each(hp.pitches, function(p) { p.verticalPos = p.pitch - mid; });
      }
      if (hp.gracenotes !== undefined) {
        var mid2 = This.lines[This.lineNum].staff[This.staffNum].workingClef.verticalPos;
        Common.each(hp.gracenotes, function(p) { p.verticalPos = p.pitch - mid2; });
      }
      This.lines[This.lineNum].staff[This.staffNum].voices[This.voiceNum].push(hp);
    };
    hashParams.el_type = type;
    if (startChar !== null)
      hashParams.startChar = startChar;
    if (endChar !== null)
      hashParams.endChar = endChar;
    var endBeamHere = function() {
      This.potentialStartBeam.startBeam = true;
      hashParams.endBeam = true;
      delete This.potentialStartBeam;
      delete This.potentialEndBeam;
    };
    var endBeamLast = function() {
      if (This.potentialStartBeam !== undefined && This.potentialEndBeam !== undefined) {	// Do we have a set of notes to beam?
        This.potentialStartBeam.startBeam = true;
        This.potentialEndBeam.endBeam = true;
      }
      delete This.potentialStartBeam;
      delete This.potentialEndBeam;
    };
    if (type === 'note') { // && (hashParams.rest !== undefined || hashParams.end_beam === undefined)) {
      // Now, add the startBeam and endBeam where it is needed.
      // end_beam is already set on the places where there is a forced end_beam. We'll remove that here after using that info.
      // this.potentialStartBeam either points to null or the start beam.
      // this.potentialEndBeam either points to null or the start beam.
      // If we have a beam break (note is longer than a quarter, or an end_beam is on this element), then set the beam if we have one.
      // reset the variables for the next notes.
      var dur = This.getDuration(hashParams);
      if (dur >= 0.25) {	// The beam ends on the note before this.
        endBeamLast();
      } else if (hashParams.force_end_beam_last && This.potentialStartBeam !== undefined) {
        endBeamLast();
      } else if (hashParams.end_beam && This.potentialStartBeam !== undefined) {	// the beam is forced to end on this note, probably because of a space in the ABC
        if (hashParams.rest === undefined)
          endBeamHere();
        else
          endBeamLast();
      } else if (hashParams.rest === undefined) {	// this a short note and we aren't about to end the beam
        if (This.potentialStartBeam === undefined) {	// We aren't collecting notes for a beam, so start here.
          if (!hashParams.end_beam) {
            This.potentialStartBeam = hashParams;
            delete This.potentialEndBeam;
          }
        } else {
          This.potentialEndBeam = hashParams;	// Continue the beaming, look for the end next note.
        }
      }

      //  end_beam goes on rests and notes which precede rests _except_ when a rest (or set of adjacent rests) has normal notes on both sides (no spaces)
//			if (hashParams.rest !== undefined)
//			{
//				hashParams.end_beam = true;
//				var el2 = this.getLastNote();
//				if (el2) el2.end_beam = true;
//				// TODO-PER: implement exception mentioned in the comment.
//			}
    } else {	// It's not a note, so there definitely isn't beaming after it.
      endBeamLast();
    }
    delete hashParams.end_beam;	// We don't want this temporary variable hanging around.
    delete hashParams.force_end_beam_last;	// We don't want this temporary variable hanging around.
    pushNote(hashParams);
  };

  this.appendStartingElement = function(type, startChar, endChar, hashParams2)
  {
    // If we're in the middle of beaming, then end the beam.
    this.closeLine();

    // We only ever want implied naturals the first time.
    var impliedNaturals;
    if (type === 'key') {
      impliedNaturals = hashParams2.impliedNaturals;
      delete hashParams2.impliedNaturals;
    }

    // Clone the object because it will be sticking around for the next line and we don't want the extra fields in it.
    var hashParams = Common.clone(hashParams2);

    // If this is a clef type, then we replace the working clef on the line. This is kept separate from
    // the clef in case there is an inline clef field. We need to know what the current position for
    // the note is.
    if (type === 'clef')
      this.lines[this.lineNum].staff[this.staffNum].workingClef = hashParams;

    // If this is the first item in this staff, then we might have to initialize the staff, first.
    if (this.lines[this.lineNum].staff.length <= this.staffNum) {
      this.lines[this.lineNum].staff[this.staffNum] = {};
      this.lines[this.lineNum].staff[this.staffNum].clef = Common.clone(this.lines[this.lineNum].staff[0].clef);
      this.lines[this.lineNum].staff[this.staffNum].key = Common.clone(this.lines[this.lineNum].staff[0].key);
      this.lines[this.lineNum].staff[this.staffNum].meter = Common.clone(this.lines[this.lineNum].staff[0].meter);
      this.lines[this.lineNum].staff[this.staffNum].workingClef = Common.clone(this.lines[this.lineNum].staff[0].workingClef);
      this.lines[this.lineNum].staff[this.staffNum].voices = [[]];
    }

    // These elements should not be added twice, so if the element exists on this line without a note or bar before it, just replace the staff version.
    var voice = this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum];
    for (var i = 0; i < voice.length; i++) {
      if (voice[i].el_type === 'note' || voice[i].el_type === 'bar') {
        hashParams.el_type = type;
        hashParams.startChar = startChar;
        hashParams.endChar = endChar;
        if (impliedNaturals)
          hashParams.accidentals = impliedNaturals.concat(hashParams.accidentals);
        voice.push(hashParams);
        return;
      }
      if (voice[i].el_type === type) {
        hashParams.el_type = type;
        hashParams.startChar = startChar;
        hashParams.endChar = endChar;
        if (impliedNaturals)
          hashParams.accidentals = impliedNaturals.concat(hashParams.accidentals);
        voice[i] = hashParams;
        return;
      }
    }
    // We didn't see either that type or a note, so replace the element to the staff.
    this.lines[this.lineNum].staff[this.staffNum][type] = hashParams2;
  };

  this.getNumLines = function() {
    return this.lines.length;
  };

  this.pushLine = function(hash) {
    if (this.vskipPending) {
      hash.vskip = this.vskipPending;
      delete this.vskipPending;
    }
    this.lines.push(hash);
  };

  this.addSubtitle = function(str) {
    this.pushLine({subtitle: str});
  };

  this.addSpacing = function(num) {
    this.vskipPending = num;
  };

  this.addNewPage = function(num) {
    this.pushLine({newpage: num});
  };

  this.addSeparator = function(spaceAbove, spaceBelow, lineLength) {
    this.pushLine({separator: {spaceAbove: spaceAbove, spaceBelow: spaceBelow, lineLength: lineLength}});
  };

  this.addText = function(str) {
    this.pushLine({text: str});
  };

  this.addCentered = function(str) {
    this.pushLine({text: [{text: str, center: true }]});
  };

  this.containsNotes = function(voice) {
    for (var i = 0; i < voice.length; i++) {
      if (voice[i].el_type === 'note' || voice[i].el_type === 'bar')
        return true;
    }
    return false;
  };

  this.containsNotesStrict = function(voice) {
    for (var i = 0; i < voice.length; i++) {
      if (voice[i].el_type === 'note' && voice[i].rest === undefined)
        return true;
    }
    return false;
  };

//	anyVoiceContainsNotes: function(line) {
//		for (var i = 0; i < line.staff.voices.length; i++) {
//			if (this.containsNotes(line.staff.voices[i]))
//				return true;
//		}
//		return false;
//	},

  this.startNewLine = function(params) {
    // If the pointed to line doesn't exist, just create that. If the line does exist, but doesn't have any music on it, just use it.
    // If it does exist and has music, then increment the line number. If the new element doesn't exist, create it.
    var This = this;
    this.closeLine();	// Close the previous line.
    var createVoice = function(params) {
      This.lines[This.lineNum].staff[This.staffNum].voices[This.voiceNum] = [];
      if (This.isFirstLine(This.lineNum)) {
        if (params.name) {if (!This.lines[This.lineNum].staff[This.staffNum].title) This.lines[This.lineNum].staff[This.staffNum].title = [];This.lines[This.lineNum].staff[This.staffNum].title[This.voiceNum] = params.name;}
      } else {
        if (params.subname) {if (!This.lines[This.lineNum].staff[This.staffNum].title) This.lines[This.lineNum].staff[This.staffNum].title = [];This.lines[This.lineNum].staff[This.staffNum].title[This.voiceNum] = params.subname;}
      }
      if (params.style)
        This.appendElement('style', null, null, {head: params.style});
      if (params.stem)
        This.appendElement('stem', null, null, {direction: params.stem});
      else if (This.voiceNum > 0) {
        if (This.lines[This.lineNum].staff[This.staffNum].voices[0]!== undefined) {
          var found = false;
          for (var i = 0; i < This.lines[This.lineNum].staff[This.staffNum].voices[0].length; i++) {
            if (This.lines[This.lineNum].staff[This.staffNum].voices[0].el_type === 'stem')
              found = true;
          }
          if (!found) {
            var stem = { el_type: 'stem', direction: 'up' };
            This.lines[This.lineNum].staff[This.staffNum].voices[0].splice(0,0,stem);
          }
        }
        This.appendElement('stem', null, null, {direction: 'down'});
      }
      if (params.scale)
        This.appendElement('scale', null, null, { size: params.scale} );
    };
    var createStaff = function(params) {
      This.lines[This.lineNum].staff[This.staffNum] = {voices: [ ], clef: params.clef, key: params.key, workingClef: params.clef };
      if (params.vocalfont) This.lines[This.lineNum].staff[This.staffNum].vocalfont = params.vocalfont;
      if (params.bracket) This.lines[This.lineNum].staff[This.staffNum].bracket = params.bracket;
      if (params.brace) This.lines[This.lineNum].staff[This.staffNum].brace = params.brace;
      if (params.connectBarLines) This.lines[This.lineNum].staff[This.staffNum].connectBarLines = params.connectBarLines;
      createVoice(params);
      // Some stuff just happens for the first voice
      if (params.part)
        This.appendElement('part', params.startChar, params.endChar, {title: params.part});
      if (params.meter !== undefined) This.lines[This.lineNum].staff[This.staffNum].meter = params.meter;
    };
    var createLine = function(params) {
      This.lines[This.lineNum] = {staff: []};
      createStaff(params);
    };
    if (this.lines[this.lineNum] === undefined) createLine(params);
    else if (this.lines[this.lineNum].staff === undefined) {
      this.lineNum++;
      this.startNewLine(params);
    } else if (this.lines[this.lineNum].staff[this.staffNum] === undefined) createStaff(params);
    else if (this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum] === undefined) createVoice(params);
    else if (!this.containsNotes(this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum])) return;
    else {
      this.lineNum++;
      this.startNewLine(params);
    }
  };

  this.hasBeginMusic = function() {
    return this.lines.length > 0;
  };

  this.isFirstLine = function(index) {
    for (var i = index-1; i >= 0; i--) {
      if (this.lines[i].staff !== undefined) return false;
    }
    return true;
  };

  this.getCurrentVoice = function() {
    if (this.lines[this.lineNum] !== undefined && this.lines[this.lineNum].staff[this.staffNum] !== undefined && this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum] !== undefined)
      return this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum];
    else return null;
  };

  this.setCurrentVoice = function(staffNum, voiceNum) {
    this.staffNum = staffNum;
    this.voiceNum = voiceNum;
    for (var i = 0; i < this.lines.length; i++) {
      if (this.lines[i].staff) {
        if (this.lines[i].staff[staffNum] === undefined || this.lines[i].staff[staffNum].voices[voiceNum] === undefined ||
          !this.containsNotes(this.lines[i].staff[staffNum].voices[voiceNum] )) {
          this.lineNum =  i;
          return;
        }
      }
    }
    this.lineNum =  i;
  };

  this.addMetaText = function(key, value) {
    if (this.metaText[key] === undefined)
      this.metaText[key] = value;
    else
      this.metaText[key] += "\n" + value;
  };

  this.addMetaTextArray = function(key, value) {
    if (this.metaText[key] === undefined)
      this.metaText[key] = [value];
    else
      this.metaText[key].push(value);
  };
  this.addMetaTextObj = function(key, value) {
    this.metaText[key] = value;
  };
};
},{"../parse/Common":6,"../parse/KeyVoice":9}],5:[function(require,module,exports){
var Common = require('./parse/Common');
var Tokenizer = require('./parse/Tokenizer');
var Tune = require('./data/Tune');
var Header = require('./parse/Header');
var Directive = require('./parse/Directive');
var KeyVoice = require('./parse/KeyVoice');


module.exports = function() {
  "use strict";
  var tune = new Tune();
  var tokenizer = new Tokenizer();

  this.getTune = function() {
    return tune;
  };

  function addPositioning(el, type, value) {
    if (!el.positioning) el.positioning = {};
    el.positioning[type] = value;
  }

  function addFont(el, type, value) {
    if (!el.fonts) el.fonts = {};
    el.fonts[type] = value;
  }

  var multilineVars = {
    reset: function() {
      for (var property in this) {
        if (this.hasOwnProperty(property) && typeof this[property] !== "function") {
          delete this[property];
        }
      }
      this.iChar = 0;
      this.key = {accidentals: [], root: 'none', acc: '', mode: '' };
      this.meter = {type: 'specified', value: [{num: '4', den: '4'}]};	// if no meter is specified, there is an implied one.
      this.origMeter = {type: 'specified', value: [{num: '4', den: '4'}]};	// this is for new voices that are created after we set the meter.
      this.hasMainTitle = false;
      this.default_length = 0.125;
      this.clef = { type: 'treble', verticalPos: 0 };
      this.next_note_duration = 0;
      this.start_new_line = true;
      this.is_in_header = true;
      this.is_in_history = false;
      this.partForNextLine = "";
      this.havent_set_length = true;
      this.voices = {};
      this.staves = [];
      this.macros = {};
      this.currBarNumber = 1;
      this.inTextBlock = false;
      this.inPsBlock = false;
      this.ignoredDecorations = [];
      this.textBlock = "";
      this.score_is_present = false;	// Can't have original V: lines when there is the score directive
      this.inEnding = false;
      this.inTie = false;
      this.inTieChord = {};
      this.vocalPosition = "auto";
      this.dynamicPosition = "auto";
      this.chordPosition = "auto";
      this.ornamentPosition = "auto";
      this.volumePosition = "auto";
      this.openSlurs = [];
    },
    differentFont: function(type, defaultFonts) {
      if (this[type].decoration !== defaultFonts[type].decoration) return true;
      if (this[type].face !== defaultFonts[type].face) return true;
      if (this[type].size !== defaultFonts[type].size) return true;
      if (this[type].style !== defaultFonts[type].style) return true;
      if (this[type].weight !== defaultFonts[type].weight) return true;
      return false;
    },
    addFormattingOptions: function(el, defaultFonts, elType) {
      if (elType === 'note') {
        if (this.vocalPosition !== 'auto') addPositioning(el, 'vocalPosition', this.vocalPosition);
        if (this.dynamicPosition !== 'auto') addPositioning(el, 'dynamicPosition', this.dynamicPosition);
        if (this.chordPosition !== 'auto') addPositioning(el, 'chordPosition', this.chordPosition);
        if (this.ornamentPosition !== 'auto') addPositioning(el, 'ornamentPosition', this.ornamentPosition);
        if (this.volumePosition !== 'auto') addPositioning(el, 'volumePosition', this.volumePosition);
        if (this.differentFont("annotationfont", defaultFonts)) addFont(el, 'annotationfont', this.annotationfont);
        if (this.differentFont("gchordfont", defaultFonts)) addFont(el, 'gchordfont', this.gchordfont);
        if (this.differentFont("vocalfont", defaultFonts)) addFont(el, 'vocalfont', this.vocalfont);
      } else if (elType === 'bar') {
        if (this.dynamicPosition !== 'auto') addPositioning(el, 'dynamicPosition', this.dynamicPosition);
        if (this.chordPosition !== 'auto') addPositioning(el, 'chordPosition', this.chordPosition);
        if (this.ornamentPosition !== 'auto') addPositioning(el, 'ornamentPosition', this.ornamentPosition);
        if (this.volumePosition !== 'auto') addPositioning(el, 'volumePosition', this.volumePosition);
        if (this.differentFont("measurefont", defaultFonts)) addFont(el, 'measurefont', this.measurefont);
        if (this.differentFont("repeatfont", defaultFonts)) addFont(el, 'repeatfont', this.repeatfont);
      }
    }
  };

  var addWarning = function(str) {
    if (!multilineVars.warnings)
      multilineVars.warnings = [];
    multilineVars.warnings.push(str);
  };

  var encode = function(str) {
    var ret = Common.gsub(str, '\x12', ' ');
    ret = Common.gsub(ret, '&', '&amp;');
    ret = Common.gsub(ret, '<', '&lt;');
    return Common.gsub(ret, '>', '&gt;');
  };

  var warn = function(str, line, col_num) {
    if (!line) line = " ";
    var bad_char = line.charAt(col_num);
    if (bad_char === ' ')
      bad_char = "SPACE";
    var clean_line = encode(line.substring(0, col_num)) +
      '<span style="text-decoration:underline;font-size:1.3em;font-weight:bold;">' + bad_char + '</span>' +
      encode(line.substring(col_num+1));
    addWarning("Music Line:" + tune.getNumLines() + ":" + (col_num+1) + ': ' + str + ":  " + clean_line);
  };
  var header = new Header(tokenizer, warn, multilineVars, tune);

  this.getWarnings = function() {
    return multilineVars.warnings;
  };

  var letter_to_chord = function(line, i)
  {
    if (line.charAt(i) === '"')
    {
      var chord = tokenizer.getBrackettedSubstring(line, i, 5);
      if (!chord[2])
        warn("Missing the closing quote while parsing the chord symbol", line , i);
      // If it starts with ^, then the chord appears above.
      // If it starts with _ then the chord appears below.
      // (note that the 2.0 draft standard defines them as not chords, but annotations and also defines @.)
      if (chord[0] > 0 && chord[1].length > 0 && chord[1].charAt(0) === '^') {
        chord[1] = chord[1].substring(1);
        chord[2] = 'above';
      } else if (chord[0] > 0 && chord[1].length > 0 && chord[1].charAt(0) === '_') {
        chord[1] = chord[1].substring(1);
        chord[2] = 'below';
      } else if (chord[0] > 0 && chord[1].length > 0 && chord[1].charAt(0) === '<') {
        chord[1] = chord[1].substring(1);
        chord[2] = 'left';
      } else if (chord[0] > 0 && chord[1].length > 0 && chord[1].charAt(0) === '>') {
        chord[1] = chord[1].substring(1);
        chord[2] = 'right';
      } else if (chord[0] > 0 && chord[1].length > 0 && chord[1].charAt(0) === '@') {
        // @-15,5.7
        chord[1] = chord[1].substring(1);
        var x = tokenizer.getFloat(chord[1]);
        if (x.digits === 0)
          warn("Missing first position in absolutely positioned annotation.", line , i);
        chord[1] = chord[1].substring(x.digits);
        if (chord[1][0] !== ',')
          warn("Missing comma absolutely positioned annotation.", line , i);
        chord[1] = chord[1].substring(1);
        var y = tokenizer.getFloat(chord[1]);
        if (y.digits === 0)
          warn("Missing second position in absolutely positioned annotation.", line , i);
        chord[1] = chord[1].substring(y.digits);
        var ws = tokenizer.skipWhiteSpace(chord[1]);
        chord[1] = chord[1].substring(ws);
        chord[2] = null;
        chord[3] = { x: x.value, y: y.value };
      } else {
        chord[1] = chord[1].replace(/([ABCDEFG])b/g, "$1♭");
        chord[1] = chord[1].replace(/([ABCDEFG])#/g, "$1♯");
        chord[2] = 'default';
      }
      return chord;
    }
    return [0, ""];
  };

  var legalAccents = [ "trill", "lowermordent", "uppermordent", "mordent", "pralltriller", "accent",
    "fermata", "invertedfermata", "tenuto", "0", "1", "2", "3", "4", "5", "+", "wedge",
    "open", "thumb", "snap", "turn", "roll", "breath", "shortphrase", "mediumphrase", "longphrase",
    "segno", "coda", "D.S.", "D.C.", "fine",
    "slide", "^", "marcato",
    "upbow", "downbow", "/", "//", "///", "////", "trem1", "trem2", "trem3", "trem4",
    "turnx", "invertedturn", "invertedturnx", "trill(", "trill)", "arpeggio", "xstem", "mark", "umarcato",
    "style=normal", "style=harmonic", "style=rhythm", "style=x"
  ];
  var volumeDecorations = [ "p", "pp", "f", "ff", "mf", "mp", "ppp", "pppp",  "fff", "ffff", "sfz" ];
  var dynamicDecorations = ["crescendo(", "crescendo)", "diminuendo(", "diminuendo)"];

  var accentPseudonyms = [ ["<", "accent"], [">", "accent"], ["tr", "trill"],
    ["plus", "+"], [ "emphasis", "accent"],
    [ "^", "umarcato" ], [ "marcato", "umarcato" ] ];
  var accentDynamicPseudonyms = [ ["<(", "crescendo("], ["<)", "crescendo)"],
    [">(", "diminuendo("], [">)", "diminuendo)"] ];
  var letter_to_accent = function(line, i)
  {
    var macro = multilineVars.macros[line.charAt(i)];

    if (macro !== undefined) {
      if (macro.charAt(0) === '!' || macro.charAt(0) === '+')
        macro = macro.substring(1);
      if (macro.charAt(macro.length-1) === '!' || macro.charAt(macro.length-1) === '+')
        macro = macro.substring(0, macro.length-1);
      if (Common.detect(legalAccents, function(acc) {
          return (macro === acc);
        }))
        return [ 1, macro ];
      else if (Common.detect(volumeDecorations, function(acc) {
          return (macro === acc);
        })) {
        if (multilineVars.volumePosition === 'hidden')
          macro = "";
        return [1, macro];
      } else if (Common.detect(dynamicDecorations, function(acc) {
          if (multilineVars.dynamicPosition === 'hidden')
            macro = "";
          return (macro === acc);
        })) {
        return [1, macro];
      } else {
        if (!Common.detect(multilineVars.ignoredDecorations, function(dec) {
            return (macro === dec);
          }))
          warn("Unknown macro: " + macro, line, i);
        return [1, '' ];
      }
    }
    switch (line.charAt(i))
    {
      case '.':return [1, 'staccato'];
      case 'u':return [1, 'upbow'];
      case 'v':return [1, 'downbow'];
      case '~':return [1, 'irishroll'];
      case '!':
      case '+':
        var ret = tokenizer.getBrackettedSubstring(line, i, 5);
        // Be sure that the accent is recognizable.
        if (ret[1].length > 0 && (ret[1].charAt(0) === '^' || ret[1].charAt(0) ==='_'))
          ret[1] = ret[1].substring(1);	// TODO-PER: The test files have indicators forcing the ornament to the top or bottom, but that isn't in the standard. We'll just ignore them.
        if (Common.detect(legalAccents, function(acc) {
            return (ret[1] === acc);
          }))
          return ret;
        if (Common.detect(volumeDecorations, function(acc) {
            return (ret[1] === acc);
          })) {
          if (multilineVars.volumePosition === 'hidden' )
            ret[1] = '';
          return ret;
        }
        if (Common.detect(dynamicDecorations, function(acc) {
            return (ret[1] === acc);
          })) {
          if (multilineVars.dynamicPosition === 'hidden' )
            ret[1] = '';
          return ret;
        }

        if (Common.detect(accentPseudonyms, function(acc) {
            if (ret[1] === acc[0]) {
              ret[1] = acc[1];
              return true;
            } else
              return false;
          }))
          return ret;

        if (Common.detect(accentDynamicPseudonyms, function(acc) {
            if (ret[1] === acc[0]) {
              ret[1] = acc[1];
              return true;
            } else
              return false;
          })) {
          if (multilineVars.dynamicPosition === 'hidden' )
            ret[1] = '';
          return ret;
        }
        // We didn't find the accent in the list, so consume the space, but don't return an accent.
        // Although it is possible that ! was used as a line break, so accept that.
        if (line.charAt(i) === '!' && (ret[0] === 1 || line.charAt(i+ret[0]-1) !== '!'))
          return [1, null ];
        warn("Unknown decoration: " + ret[1], line, i);
        ret[1] = "";
        return ret;
      case 'H':return [1, 'fermata'];
      case 'J':return [1, 'slide'];
      case 'L':return [1, 'accent'];
      case 'M':return [1, 'mordent'];
      case 'O':return[1, 'coda'];
      case 'P':return[1, 'pralltriller'];
      case 'R':return [1, 'roll'];
      case 'S':return [1, 'segno'];
      case 'T':return [1, 'trill'];
    }
    return [0, 0];
  };

  var letter_to_spacer = function(line, i)
  {
    var start = i;
    while (tokenizer.isWhiteSpace(line.charAt(i)))
      i++;
    return [ i-start ];
  };

  // returns the class of the bar line
  // the number of the repeat
  // and the number of characters used up
  // if 0 is returned, then the next element was not a bar line
  var letter_to_bar = function(line, curr_pos)
  {
    var ret = tokenizer.getBarLine(line, curr_pos);
    if (ret.len === 0)
      return [0,""];
    if (ret.warn) {
      warn(ret.warn, line, curr_pos);
      return [ret.len,""];
    }

    // Now see if this is a repeated ending
    // A repeated ending is all of the characters 1,2,3,4,5,6,7,8,9,0,-, and comma
    // It can also optionally start with '[', which is ignored.
    // Also, it can have white space before the '['.
    for (var ws = 0; ws < line.length; ws++)
      if (line.charAt(curr_pos + ret.len + ws) !== ' ')
        break;
    var orig_bar_len = ret.len;
    if (line.charAt(curr_pos+ret.len+ws) === '[') {
      ret.len += ws + 1;
    }

    // It can also be a quoted string. It is unclear whether that construct requires '[', but it seems like it would. otherwise it would be confused with a regular chord.
    if (line.charAt(curr_pos+ret.len) === '"' && line.charAt(curr_pos+ret.len-1) === '[') {
      var ending = tokenizer.getBrackettedSubstring(line, curr_pos+ret.len, 5);
      return [ret.len+ending[0], ret.token, ending[1]];
    }
    var retRep = tokenizer.getTokenOf(line.substring(curr_pos+ret.len), "1234567890-,");
    if (retRep.len === 0 || retRep.token[0] === '-')
      return [orig_bar_len, ret.token];

    return [ret.len+retRep.len, ret.token, retRep.token];
  };

  var letter_to_open_slurs_and_triplets =  function(line, i) {
    // consume spaces, and look for all the open parens. If there is a number after the open paren,
    // that is a triplet. Otherwise that is a slur. Collect all the slurs and the first triplet.
    var ret = {};
    var start = i;
    while (line.charAt(i) === '(' || tokenizer.isWhiteSpace(line.charAt(i))) {
      if (line.charAt(i) === '(') {
        if (i+1 < line.length && (line.charAt(i+1) >= '2' && line.charAt(i+1) <= '9')) {
          if (ret.triplet !== undefined)
            warn("Can't nest triplets", line, i);
          else {
            ret.triplet = line.charAt(i+1) - '0';
            if (i+2 < line.length && line.charAt(i+2) === ':') {
              // We are expecting "(p:q:r" or "(p:q" or "(p::r" we are only interested in the first number (p) and the number of notes (r)
              // if r is missing, then it is equal to p.
              if (i+3 < line.length && line.charAt(i+3) === ':') {
                if (i+4 < line.length && (line.charAt(i+4) >= '1' && line.charAt(i+4) <= '9')) {
                  ret.num_notes = line.charAt(i+4) - '0';
                  i += 3;
                } else
                  warn("expected number after the two colons after the triplet to mark the duration", line, i);
              } else if (i+3 < line.length && (line.charAt(i+3) >= '1' && line.charAt(i+3) <= '9')) {
                // ignore this middle number
                if (i+4 < line.length && line.charAt(i+4) === ':') {
                  if (i+5 < line.length && (line.charAt(i+5) >= '1' && line.charAt(i+5) <= '9')) {
                    ret.num_notes = line.charAt(i+5) - '0';
                    i += 4;
                  }
                } else {
                  ret.num_notes = ret.triplet;
                  i += 3;
                }
              } else
                warn("expected number after the triplet to mark the duration", line, i);
            }
          }
          i++;
        }
        else {
          if (ret.startSlur === undefined)
            ret.startSlur = 1;
          else
            ret.startSlur++;
        }
      }
      i++;
    }
    ret.consumed = i-start;
    return ret;
  };

  var addWords = function(line, words) {
    if (!line) { warn("Can't add words before the first line of music", line, 0); return; }
    words = Common.strip(words);
    if (words.charAt(words.length-1) !== '-')
      words = words + ' ';	// Just makes it easier to parse below, since every word has a divider after it.
    var word_list = [];
    // first make a list of words from the string we are passed. A word is divided on either a space or dash.
    var last_divider = 0;
    var replace = false;
    var addWord = function(i) {
      var word = Common.strip(words.substring(last_divider, i));
      last_divider = i+1;
      if (word.length > 0) {
        if (replace)
          word = Common.gsub(word,'~', ' ');
        var div = words.charAt(i);
        if (div !== '_' && div !== '-')
          div = ' ';
        word_list.push({syllable: tokenizer.translateString(word), divider: div});
        replace = false;
        return true;
      }
      return false;
    };
    for (var i = 0; i < words.length; i++) {
      switch (words.charAt(i)) {
        case ' ':
        case '\x12':
          addWord(i);
          break;
        case '-':
          if (!addWord(i) && word_list.length > 0) {
            Common.last(word_list).divider = '-';
            word_list.push({skip: true, to: 'next'});
          }
          break;
        case '_':
          addWord(i);
          word_list.push({skip: true, to: 'slur'});
          break;
        case '*':
          addWord(i);
          word_list.push({skip: true, to: 'next'});
          break;
        case '|':
          addWord(i);
          word_list.push({skip: true, to: 'bar'});
          break;
        case '~':
          replace = true;
          break;
      }
    }

    var inSlur = false;
    Common.each(line, function(el) {
      if (word_list.length !== 0) {
        if (word_list[0].skip) {
          switch (word_list[0].to) {
            case 'next': if (el.el_type === 'note' && el.pitches !== null && !inSlur) word_list.shift(); break;
            case 'slur': if (el.el_type === 'note' && el.pitches !== null) word_list.shift(); break;
            case 'bar': if (el.el_type === 'bar') word_list.shift(); break;
          }
        } else {
          if (el.el_type === 'note' && el.rest === undefined && !inSlur) {
            var lyric = word_list.shift();
            if (el.lyric === undefined)
              el.lyric = [ lyric ];
            else
              el.lyric.push(lyric);
          }
        }
      }
    });
  };

  var addSymbols = function(line, words) {
    // TODO-PER: Currently copied from w: line. This needs to be read as symbols instead.
    if (!line) { warn("Can't add symbols before the first line of music", line, 0); return; }
    words = Common.strip(words);
    if (words.charAt(words.length-1) !== '-')
      words = words + ' ';	// Just makes it easier to parse below, since every word has a divider after it.
    var word_list = [];
    // first make a list of words from the string we are passed. A word is divided on either a space or dash.
    var last_divider = 0;
    var replace = false;
    var addWord = function(i) {
      var word = Common.strip(words.substring(last_divider, i));
      last_divider = i+1;
      if (word.length > 0) {
        if (replace)
          word = Common.gsub(word, '~', ' ');
        var div = words.charAt(i);
        if (div !== '_' && div !== '-')
          div = ' ';
        word_list.push({syllable: tokenizer.translateString(word), divider: div});
        replace = false;
        return true;
      }
      return false;
    };
    for (var i = 0; i < words.length; i++) {
      switch (words.charAt(i)) {
        case ' ':
        case '\x12':
          addWord(i);
          break;
        case '-':
          if (!addWord(i) && word_list.length > 0) {
            Common.last(word_list).divider = '-';
            word_list.push({skip: true, to: 'next'});
          }
          break;
        case '_':
          addWord(i);
          word_list.push({skip: true, to: 'slur'});
          break;
        case '*':
          addWord(i);
          word_list.push({skip: true, to: 'next'});
          break;
        case '|':
          addWord(i);
          word_list.push({skip: true, to: 'bar'});
          break;
        case '~':
          replace = true;
          break;
      }
    }

    var inSlur = false;
    Common.each(line, function(el) {
      if (word_list.length !== 0) {
        if (word_list[0].skip) {
          switch (word_list[0].to) {
            case 'next': if (el.el_type === 'note' && el.pitches !== null && !inSlur) word_list.shift(); break;
            case 'slur': if (el.el_type === 'note' && el.pitches !== null) word_list.shift(); break;
            case 'bar': if (el.el_type === 'bar') word_list.shift(); break;
          }
        } else {
          if (el.el_type === 'note' && el.rest === undefined && !inSlur) {
            var lyric = word_list.shift();
            if (el.lyric === undefined)
              el.lyric = [ lyric ];
            else
              el.lyric.push(lyric);
          }
        }
      }
    });
  };

  var getBrokenRhythm = function(line, index) {
    switch (line.charAt(index)) {
      case '>':
        if (index < line.length - 1 && line.charAt(index+1) === '>')	// double >>
          return [2, 1.75, 0.25];
        else
          return [1, 1.5, 0.5];
        break;
      case '<':
        if (index < line.length - 1 && line.charAt(index+1) === '<')	// double <<
          return [2, 0.25, 1.75];
        else
          return [1, 0.5, 1.5];
        break;
    }
    return null;
  };

  // TODO-PER: make this a method in el.
  var addEndBeam = function(el) {
    if (el.duration !== undefined && el.duration < 0.25)
      el.end_beam = true;
    return el;
  };

  var pitches = {A: 5, B: 6, C: 0, D: 1, E: 2, F: 3, G: 4, a: 12, b: 13, c: 7, d: 8, e: 9, f: 10, g: 11};
  var rests = {x: 'invisible', y: 'spacer', z: 'rest', Z: 'multimeasure' };
  var getCoreNote = function(line, index, el, canHaveBrokenRhythm) {
    //var el = { startChar: index };
    var isComplete = function(state) {
      return (state === 'octave' || state === 'duration' || state === 'Zduration' || state === 'broken_rhythm' || state === 'end_slur');
    };
    var state = 'startSlur';
    var durationSetByPreviousNote = false;
    while (1) {
      switch(line.charAt(index)) {
        case '(':
          if (state === 'startSlur') {
            if (el.startSlur === undefined) el.startSlur = 1; else el.startSlur++;
          } else if (isComplete(state)) {el.endChar = index;return el;}
          else return null;
          break;
        case ')':
          if (isComplete(state)) {
            if (el.endSlur === undefined) el.endSlur = 1; else el.endSlur++;
          } else return null;
          break;
        case '^':
          if (state === 'startSlur') {el.accidental = 'sharp';state = 'sharp2';}
          else if (state === 'sharp2') {el.accidental = 'dblsharp';state = 'pitch';}
          else if (isComplete(state)) {el.endChar = index;return el;}
          else return null;
          break;
        case '_':
          if (state === 'startSlur') {el.accidental = 'flat';state = 'flat2';}
          else if (state === 'flat2') {el.accidental = 'dblflat';state = 'pitch';}
          else if (isComplete(state)) {el.endChar = index;return el;}
          else return null;
          break;
        case '=':
          if (state === 'startSlur') {el.accidental = 'natural';state = 'pitch';}
          else if (isComplete(state)) {el.endChar = index;return el;}
          else return null;
          break;
        case 'A':
        case 'B':
        case 'C':
        case 'D':
        case 'E':
        case 'F':
        case 'G':
        case 'a':
        case 'b':
        case 'c':
        case 'd':
        case 'e':
        case 'f':
        case 'g':
          if (state === 'startSlur' || state === 'sharp2' || state === 'flat2' || state === 'pitch') {
            el.pitch = pitches[line.charAt(index)];
            state = 'octave';
            // At this point we have a valid note. The rest is optional. Set the duration in case we don't get one below
            if (canHaveBrokenRhythm && multilineVars.next_note_duration !== 0) {
              el.duration = multilineVars.default_length * multilineVars.next_note_duration;
              multilineVars.next_note_duration = 0;
              durationSetByPreviousNote = true;
            } else
              el.duration = multilineVars.default_length;
          } else if (isComplete(state)) {el.endChar = index;return el;}
          else return null;
          break;
        case ',':
          if (state === 'octave') {el.pitch -= 7;}
          else if (isComplete(state)) {el.endChar = index;return el;}
          else return null;
          break;
        case '\'':
          if (state === 'octave') {el.pitch += 7;}
          else if (isComplete(state)) {el.endChar = index;return el;}
          else return null;
          break;
        case 'x':
        case 'y':
        case 'z':
        case 'Z':
          if (state === 'startSlur') {
            el.rest = { type: rests[line.charAt(index)] };
            // There shouldn't be some of the properties that notes have. If some sneak in due to bad syntax in the abc file,
            // just nix them here.
            delete el.accidental;
            delete el.startSlur;
            delete el.startTie;
            delete el.endSlur;
            delete el.endTie;
            delete el.end_beam;
            delete el.grace_notes;
            // At this point we have a valid note. The rest is optional. Set the duration in case we don't get one below
            if (el.rest.type === 'multimeasure') {
              el.duration = 1;
              state = 'Zduration';
            } else {
              if (canHaveBrokenRhythm && multilineVars.next_note_duration !== 0) {
                el.duration = multilineVars.default_length * multilineVars.next_note_duration;
                multilineVars.next_note_duration = 0;
                durationSetByPreviousNote = true;
              } else
                el.duration = multilineVars.default_length;
              state = 'duration';
            }
          } else if (isComplete(state)) {el.endChar = index;return el;}
          else return null;
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
        case '0':
        case '/':
          if (state === 'octave' || state === 'duration') {
            var fraction = tokenizer.getFraction(line, index);
            //if (!durationSetByPreviousNote)
            el.duration = el.duration * fraction.value;
            // TODO-PER: We can test the returned duration here and give a warning if it isn't the one expected.
            el.endChar = fraction.index;
            while (fraction.index < line.length && (tokenizer.isWhiteSpace(line.charAt(fraction.index)) || line.charAt(fraction.index) === '-')) {
              if (line.charAt(fraction.index) === '-')
                el.startTie = {};
              else
                el = addEndBeam(el);
              fraction.index++;
            }
            index = fraction.index-1;
            state = 'broken_rhythm';
          } else if (state === 'sharp2') {
            el.accidental = 'quartersharp';state = 'pitch';
          } else if (state === 'flat2') {
            el.accidental = 'quarterflat';state = 'pitch';
          } else if (state === 'Zduration') {
            var num = tokenizer.getNumber(line, index);
            el.duration = num.num;
            el.endChar = num.index;
            return el;
          } else return null;
          break;
        case '-':
          if (state === 'startSlur') {
            // This is the first character, so it must have been meant for the previous note. Correct that here.
            tune.addTieToLastNote();
            el.endTie = true;
          } else if (state === 'octave' || state === 'duration' || state === 'end_slur') {
            el.startTie = {};
            if (!durationSetByPreviousNote && canHaveBrokenRhythm)
              state = 'broken_rhythm';
            else {
              // Peek ahead to the next character. If it is a space, then we have an end beam.
              if (tokenizer.isWhiteSpace(line.charAt(index + 1)))
                addEndBeam(el);
              el.endChar = index+1;
              return el;
            }
          } else if (state === 'broken_rhythm') {el.endChar = index;return el;}
          else return null;
          break;
        case ' ':
        case '\t':
          if (isComplete(state)) {
            el.end_beam = true;
            // look ahead to see if there is a tie
            do {
              if (line.charAt(index) === '-')
                el.startTie = {};
              index++;
            } while (index < line.length && (tokenizer.isWhiteSpace(line.charAt(index)) || line.charAt(index) === '-'));
            el.endChar = index;
            if (!durationSetByPreviousNote && canHaveBrokenRhythm && (line.charAt(index) === '<' || line.charAt(index) === '>')) {	// TODO-PER: Don't need the test for < and >, but that makes the endChar work out for the regression test.
              index--;
              state = 'broken_rhythm';
            } else
              return el;
          }
          else return null;
          break;
        case '>':
        case '<':
          if (isComplete(state)) {
            if (canHaveBrokenRhythm) {
              var br2 = getBrokenRhythm(line, index);
              index += br2[0] - 1;	// index gets incremented below, so we'll let that happen
              multilineVars.next_note_duration = br2[2];
              el.duration = br2[1]*el.duration;
              state = 'end_slur';
            } else {
              el.endChar = index;
              return el;
            }
          } else
            return null;
          break;
        default:
          if (isComplete(state)) {
            el.endChar = index;
            return el;
          }
          return null;
      }
      index++;
      if (index === line.length) {
        if (isComplete(state)) {el.endChar = index;return el;}
        else return null;
      }
    }
    return null;
  };

  function startNewLine() {
    var params = { startChar: -1, endChar: -1};
    if (multilineVars.partForNextLine.length)
      params.part = multilineVars.partForNextLine;
    params.clef = multilineVars.currentVoice && multilineVars.staves[multilineVars.currentVoice.staffNum].clef !== undefined ? Common.clone(multilineVars.staves[multilineVars.currentVoice.staffNum].clef) : Common.clone(multilineVars.clef) ;
    params.key = KeyVoice.deepCopyKey(multilineVars.key);
    KeyVoice.addPosToKey(params.clef, params.key);
    if (multilineVars.meter !== null) {
      if (multilineVars.currentVoice) {
        Common.each(multilineVars.staves, function(st) {
          st.meter = multilineVars.meter;
        });
        params.meter = multilineVars.staves[multilineVars.currentVoice.staffNum].meter;
        multilineVars.staves[multilineVars.currentVoice.staffNum].meter = null;
      } else
        params.meter = multilineVars.meter;
      multilineVars.meter = null;
    } else if (multilineVars.currentVoice && multilineVars.staves[multilineVars.currentVoice.staffNum].meter) {
      // Make sure that each voice gets the meter marking.
      params.meter = multilineVars.staves[multilineVars.currentVoice.staffNum].meter;
      multilineVars.staves[multilineVars.currentVoice.staffNum].meter = null;
    }
    if (multilineVars.currentVoice && multilineVars.currentVoice.name)
      params.name = multilineVars.currentVoice.name;
    if (multilineVars.vocalfont)
      params.vocalfont = multilineVars.vocalfont;
    if (multilineVars.style)
      params.style = multilineVars.style;
    if (multilineVars.currentVoice) {
      var staff = multilineVars.staves[multilineVars.currentVoice.staffNum];
      if (staff.brace) params.brace = staff.brace;
      if (staff.bracket) params.bracket = staff.bracket;
      if (staff.connectBarLines) params.connectBarLines = staff.connectBarLines;
      if (staff.name) params.name = staff.name[multilineVars.currentVoice.index];
      if (staff.subname) params.subname = staff.subname[multilineVars.currentVoice.index];
      if (multilineVars.currentVoice.stem)
        params.stem = multilineVars.currentVoice.stem;
      if (multilineVars.currentVoice.scale)
        params.scale = multilineVars.currentVoice.scale;
      if (multilineVars.currentVoice.style)
        params.style = multilineVars.currentVoice.style;
    }
    tune.startNewLine(params);

    multilineVars.partForNextLine = "";
    if (multilineVars.currentVoice === undefined || (multilineVars.currentVoice.staffNum === multilineVars.staves.length-1 && multilineVars.staves[multilineVars.currentVoice.staffNum].numVoices-1 === multilineVars.currentVoice.index)) {
      //multilineVars.meter = null;
      if (multilineVars.barNumbers === 0)
        multilineVars.barNumOnNextNote = multilineVars.currBarNumber;
    }
  }

  var letter_to_grace =  function(line, i) {
    // Grace notes are an array of: startslur, note, endslur, space; where note is accidental, pitch, duration
    if (line.charAt(i) === '{') {
      // fetch the gracenotes string and consume that into the array
      var gra = tokenizer.getBrackettedSubstring(line, i, 1, '}');
      if (!gra[2])
        warn("Missing the closing '}' while parsing grace note", line, i);
      // If there is a slur after the grace construction, then move it to the last note inside the grace construction
      if (line[i+gra[0]] === ')') {
        gra[0]++;
        gra[1] += ')';
      }

      var gracenotes = [];
      var ii = 0;
      var inTie = false;
      while (ii < gra[1].length) {
        var acciaccatura = false;
        if (gra[1].charAt(ii) === '/') {
          acciaccatura = true;
          ii++;
        }
        var note = getCoreNote(gra[1], ii, {}, false);
        if (note !== null) {
          // The grace note durations should not be affected by the default length: they should be based on 1/16, so if that isn't the default, then multiply here.
          note.duration = note.duration / (multilineVars.default_length * 8);
          if (acciaccatura)
            note.acciaccatura = true;
          gracenotes.push(note);

          if (inTie) {
            note.endTie = true;
            inTie = false;
          }
          if (note.startTie)
            inTie = true;

          ii  = note.endChar;
          delete note.endChar;
        }
        else {
          // We shouldn't get anything but notes or a space here, so report an error
          if (gra[1].charAt(ii) === ' ') {
            if (gracenotes.length > 0)
              gracenotes[gracenotes.length-1].end_beam = true;
          } else
            warn("Unknown character '" + gra[1].charAt(ii) + "' while parsing grace note", line, i);
          ii++;
        }
      }
      if (gracenotes.length)
        return [gra[0], gracenotes];
    }
    return [ 0 ];
  };

  function durationOfMeasure(multilineVars) {
    // TODO-PER: This could be more complicated if one of the unusual measures is used.
    var meter = multilineVars.origMeter;
    if (!meter || meter.type !== 'specified')
      return 1;
    if (!meter.value || meter.value.length === 0)
      return 1;
    return parseInt(meter.value[0].num, 10) / parseInt(meter.value[0].den, 10);
  }

  //
  // Parse line of music
  //
  // This is a stream of <(bar-marking|header|note-group)...> in any order, with optional spaces between each element
  // core-note is <open-slur, accidental, pitch:required, octave, duration, close-slur&|tie> with no spaces within that
  // chord is <open-bracket:required, core-note:required... close-bracket:required duration> with no spaces within that
  // grace-notes is <open-brace:required, (open-slur|core-note:required|close-slur)..., close-brace:required> spaces are allowed
  // note-group is <grace-notes, chord symbols&|decorations..., grace-notes, slur&|triplet, chord|core-note, end-slur|tie> spaces are allowed between items
  // bar-marking is <ampersand> or <chord symbols&|decorations..., bar:required> spaces allowed
  // header is <open-bracket:required, K|M|L|V:required, colon:required, field:required, close-bracket:required> spaces can occur between the colon, in the field, and before the close bracket
  // header can also be the only thing on a line. This is true even if it is a continuation line. In this case the brackets are not required.
  // a space is a back-tick, a space, or a tab. If it is a back-tick, then there is no end-beam.

  // Line preprocessing: anything after a % is ignored (the double %% should have been taken care of before this)
  // Then, all leading and trailing spaces are ignored.
  // If there was a line continuation, the \n was replaced by a \r and the \ was replaced by a space. This allows the construct
  // of having a header mid-line conceptually, but actually be at the start of the line. This is equivolent to putting the header in [ ].

  // TODO-PER: How to handle ! for line break?
  // TODO-PER: dots before bar, dots before slur
  // TODO-PER: U: redefinable symbols.

  // Ambiguous symbols:
  // "[" can be the start of a chord, the start of a header element or part of a bar line.
  // --- if it is immediately followed by "|", it is a bar line
  // --- if it is immediately followed by K: L: M: V: it is a header (note: there are other headers mentioned in the standard, but I'm not sure how they would be used.)
  // --- otherwise it is the beginning of a chord
  // "(" can be the start of a slur or a triplet
  // --- if it is followed by a number from 2-9, then it is a triplet
  // --- otherwise it is a slur
  // "]"
  // --- if there is a chord open, then this is the close
  // --- if it is after a [|, then it is an invisible bar line
  // --- otherwise, it is par of a bar
  // "." can be a bar modifier or a slur modifier, or a decoration
  // --- if it comes immediately before a bar, it is a bar modifier
  // --- if it comes immediately before a slur, it is a slur modifier
  // --- otherwise it is a decoration for the next note.
  // number:
  // --- if it is after a bar, with no space, it is an ending marker
  // --- if it is after a ( with no space, it is a triplet count
  // --- if it is after a pitch or octave or slash, then it is a duration

  // Unambiguous symbols (except inside quoted strings):
  // vertical-bar, colon: part of a bar
  // ABCDEFGabcdefg: pitch
  // xyzZ: rest
  // comma, prime: octave
  // close-paren: end-slur
  // hyphen: tie
  // tilde, v, u, bang, plus, THLMPSO: decoration
  // carat, underscore, equal: accidental
  // ampersand: time reset
  // open-curly, close-curly: grace notes
  // double-quote: chord symbol
  // less-than, greater-than, slash: duration
  // back-tick, space, tab: space
  var nonDecorations = "ABCDEFGabcdefgxyzZ[]|^_{";	// use this to prescreen so we don't have to look for a decoration at every note.

  var parseRegularMusicLine = function(line) {
    header.resolveTempo();
    multilineVars.is_in_header = false;	// We should have gotten a key header by now, but just in case, this is definitely out of the header.
    var i = 0;
    var startOfLine = multilineVars.iChar;
    //multilineVars.havent_set_length = false;	// To late to set this now.
    // see if there is nothing but a comment on this line. If so, just ignore it. A full line comment is optional white space followed by %
    while (tokenizer.isWhiteSpace(line.charAt(i)) && i < line.length) {
      i++;
    }
    if (i === line.length || line.charAt(i) === '%') {
      return;

    }
    // Start with the standard staff, clef and key symbols on each line
    var delayStartNewLine = multilineVars.start_new_line;
    if (multilineVars.continueall === undefined)
      multilineVars.start_new_line = true;
    else
      multilineVars.start_new_line = false;
    var tripletNotesLeft = 0;

    // See if the line starts with a header field
    var retHeader = header.letter_to_body_header(line, i);
    if (retHeader[0] > 0) {
      i += retHeader[0];
      // TODO-PER: Handle inline headers
    }
    var el = { };

    while (i < line.length)
    {
      var startI = i;
      if (line.charAt(i) === '%')
        break;

      var retInlineHeader = header.letter_to_inline_header(line, i);
      if (retInlineHeader[0] > 0) {
        i += retInlineHeader[0];
        // TODO-PER: Handle inline headers
        //multilineVars.start_new_line = false;
      } else {
        // Wait until here to actually start the line because we know we're past the inline statements.
        if (delayStartNewLine) {
          startNewLine();
          delayStartNewLine = false;
        }

        // We need to decide if the following characters are a bar-marking or a note-group.
        // Unfortunately, that is ambiguous. Both can contain chord symbols and decorations.
        // If there is a grace note either before or after the chord symbols and decorations, then it is definitely a note-group.
        // If there is a bar marker, it is definitely a bar-marking.
        // If there is either a core-note or chord, it is definitely a note-group.
        // So, loop while we find grace-notes, chords-symbols, or decorations. [It is an error to have more than one grace-note group in a row; the others can be multiple]
        // Then, if there is a grace-note, we know where to go.
        // Else see if we have a chord, core-note, slur, triplet, or bar.

        var ret;
        while (1) {
          ret = tokenizer.eatWhiteSpace(line, i);
          if (ret > 0) {
            i += ret;
          }
          if (i > 0 && line.charAt(i-1) === '\x12') {
            // there is one case where a line continuation isn't the same as being on the same line, and that is if the next character after it is a header.
            ret = header.letter_to_body_header(line, i);
            if (ret[0] > 0) {
              // TODO: insert header here
              i = ret[0];
              multilineVars.start_new_line = false;
            }
          }
          // gather all the grace notes, chord symbols and decorations
          ret = letter_to_spacer(line, i);
          if (ret[0] > 0) {
            i += ret[0];
          }

          ret = letter_to_chord(line, i);
          if (ret[0] > 0) {
            // There could be more than one chord here if they have different positions.
            // If two chords have the same position, then connect them with newline.
            if (!el.chord)
              el.chord = [];
            var chordName = tokenizer.translateString(ret[1]);
            chordName = chordName.replace(/;/g, "\n");
            var addedChord = false;
            for (var ci = 0; ci < el.chord.length; ci++) {
              if (el.chord[ci].position === ret[2]) {
                addedChord = true;
                el.chord[ci].name += "\n" + chordName;
              }
            }
            if (addedChord === false) {
              if (ret[2] === null && ret[3])
                el.chord.push({name: chordName, rel_position: ret[3]});
              else
                el.chord.push({name: chordName, position: ret[2]});
            }

            i += ret[0];
            var ii = tokenizer.skipWhiteSpace(line.substring(i));
            if (ii > 0)
              el.force_end_beam_last = true;
            i += ii;
          } else {
            if (nonDecorations.indexOf(line.charAt(i)) === -1)
              ret = letter_to_accent(line, i);
            else ret = [ 0 ];
            if (ret[0] > 0) {
              if (ret[1] === null) {
                if (i + 1 < line.length)
                  startNewLine();	// There was a ! in the middle of the line. Start a new line if there is anything after it.
              } else if (ret[1].length > 0) {
                if (ret[1].indexOf("style=") === 0) {
                  el.style = ret[1].substr(6);
                } else {
                  if (el.decoration === undefined)
                    el.decoration = [];
                  el.decoration.push(ret[1]);
                }
              }
              i += ret[0];
            } else {
              ret = letter_to_grace(line, i);
              // TODO-PER: Be sure there aren't already grace notes defined. That is an error.
              if (ret[0] > 0) {
                el.gracenotes = ret[1];
                i += ret[0];
              } else
                break;
            }
          }
        }

        ret = letter_to_bar(line, i);
        if (ret[0] > 0) {
          // This is definitely a bar
          if (el.gracenotes !== undefined) {
            // Attach the grace note to an invisible note
            el.rest = { type: 'spacer' };
            el.duration = 0.125; // TODO-PER: I don't think the duration of this matters much, but figure out if it does.
            multilineVars.addFormattingOptions(el, tune.formatting, 'note');
            tune.appendElement('note', startOfLine+i, startOfLine+i+ret[0], el);
            multilineVars.measureNotEmpty = true;
            el = {};
          }
          var bar = {type: ret[1]};
          if (bar.type.length === 0)
            warn("Unknown bar type", line, i);
          else {
            if (multilineVars.inEnding && bar.type !== 'bar_thin') {
              bar.endEnding = true;
              multilineVars.inEnding = false;
            }
            if (ret[2]) {
              bar.startEnding = ret[2];
              if (multilineVars.inEnding)
                bar.endEnding = true;
              multilineVars.inEnding = true;
            }
            if (el.decoration !== undefined)
              bar.decoration = el.decoration;
            if (el.chord !== undefined)
              bar.chord = el.chord;
            if (bar.startEnding && multilineVars.barFirstEndingNum === undefined)
              multilineVars.barFirstEndingNum = multilineVars.currBarNumber;
            else if (bar.startEnding && bar.endEnding && multilineVars.barFirstEndingNum)
              multilineVars.currBarNumber = multilineVars.barFirstEndingNum;
            else if (bar.endEnding)
              multilineVars.barFirstEndingNum = undefined;
            if (bar.type !== 'bar_invisible' && multilineVars.measureNotEmpty) {
              multilineVars.currBarNumber++;
              if (multilineVars.barNumbers && multilineVars.currBarNumber % multilineVars.barNumbers === 0)
                multilineVars.barNumOnNextNote = multilineVars.currBarNumber;
            }
            multilineVars.addFormattingOptions(el, tune.formatting, 'bar');
            tune.appendElement('bar', startOfLine+i, startOfLine+i+ret[0], bar);
            multilineVars.measureNotEmpty = false;
            el = {};
          }
          i += ret[0];
        } else if (line[i] === '&') {	// backtrack to beginning of measure
          warn("Overlay not yet supported", line, i);
          i++;

        } else {
          // This is definitely a note group
          //
          // Look for as many open slurs and triplets as there are. (Note: only the first triplet is valid.)
          ret = letter_to_open_slurs_and_triplets(line, i);
          if (ret.consumed > 0) {
            if (ret.startSlur !== undefined)
              el.startSlur = ret.startSlur;
            if (ret.triplet !== undefined) {
              if (tripletNotesLeft > 0)
                warn("Can't nest triplets", line, i);
              else {
                el.startTriplet = ret.triplet;
                tripletNotesLeft = ret.num_notes === undefined ? ret.triplet : ret.num_notes;
              }
            }
            i += ret.consumed;
          }

          // handle chords.
          if (line.charAt(i) === '[') {
            var chordStartChar = i;
            i++;
            var chordDuration = null;

            var done = false;
            while (!done) {
              var chordNote = getCoreNote(line, i, {}, false);
              if (chordNote !== null) {
                if (chordNote.end_beam) {
                  el.end_beam = true;
                  delete chordNote.end_beam;
                }
                if (el.pitches === undefined) {
                  el.duration = chordNote.duration;
                  el.pitches = [ chordNote ];
                } else	// Just ignore the note lengths of all but the first note. The standard isn't clear here, but this seems less confusing.
                  el.pitches.push(chordNote);
                delete chordNote.duration;

                if (multilineVars.inTieChord[el.pitches.length]) {
                  chordNote.endTie = true;
                  multilineVars.inTieChord[el.pitches.length] = undefined;
                }
                if (chordNote.startTie)
                  multilineVars.inTieChord[el.pitches.length] = true;

                i  = chordNote.endChar;
                delete chordNote.endChar;
              } else if (line.charAt(i) === ' ') {
                // Spaces are not allowed in chords, but we can recover from it by ignoring it.
                warn("Spaces are not allowed in chords", line, i);
                i++;
              } else {
                if (i < line.length && line.charAt(i) === ']') {
                  // consume the close bracket
                  i++;

                  if (multilineVars.next_note_duration !== 0) {
                    el.duration = el.duration * multilineVars.next_note_duration;
                    multilineVars.next_note_duration = 0;
                  }

                  if (multilineVars.inTie) {
                    Common.each(el.pitches, function(pitch) { pitch.endTie = true; });
                    multilineVars.inTie = false;
                  }

                  if (tripletNotesLeft > 0) {
                    tripletNotesLeft--;
                    if (tripletNotesLeft === 0) {
                      el.endTriplet = true;
                    }
                  }

                  var postChordDone = false;
                  while (i < line.length && !postChordDone) {
                    switch (line.charAt(i)) {
                      case ' ':
                      case '\t':
                        addEndBeam(el);
                        break;
                      case ')':
                        if (el.endSlur === undefined) el.endSlur = 1; else el.endSlur++;
                        break;
                      case '-':
                        Common.each(el.pitches, function(pitch) { pitch.startTie = {}; });
                        multilineVars.inTie = true;
                        break;
                      case '>':
                      case '<':
                        var br2 = getBrokenRhythm(line, i);
                        i += br2[0] - 1;	// index gets incremented below, so we'll let that happen
                        multilineVars.next_note_duration = br2[2];
                        if (chordDuration)
                          chordDuration = chordDuration * br2[1];
                        else
                          chordDuration = br2[1];
                        break;
                      case '1':
                      case '2':
                      case '3':
                      case '4':
                      case '5':
                      case '6':
                      case '7':
                      case '8':
                      case '9':
                      case '/':
                        var fraction = tokenizer.getFraction(line, i);
                        chordDuration = fraction.value;
                        i = fraction.index;
                        if (line.charAt(i) === '-' || line.charAt(i) === ')' || line.charAt(i) === ' ' || line.charAt(i) === '<' || line.charAt(i) === '>')
                          i--; // Subtracting one because one is automatically added below
                        else
                          postChordDone = true;
                        break;
                      default:
                        postChordDone = true;
                        break;
                    }
                    if (!postChordDone) {
                      i++;
                    }
                  }
                } else
                  warn("Expected ']' to end the chords", line, i);

                if (el.pitches !== undefined) {
                  if (chordDuration !== null) {
                    el.duration = el.duration * chordDuration;
                  }
                  if (multilineVars.barNumOnNextNote) {
                    el.barNumber = multilineVars.barNumOnNextNote;
                    multilineVars.barNumOnNextNote = null;
                  }
                  multilineVars.addFormattingOptions(el, tune.formatting, 'note');
                  tune.appendElement('note', startOfLine+chordStartChar, startOfLine+i, el);
                  multilineVars.measureNotEmpty = true;
                  el = {};
                }
                done = true;
              }
            }

          } else {
            // Single pitch
            var el2 = {};
            var core = getCoreNote(line, i, el2, true);
            if (el2.endTie !== undefined) multilineVars.inTie = true;
            if (core !== null) {
              if (core.pitch !== undefined) {
                el.pitches = [ { } ];
                // TODO-PER: straighten this out so there is not so much copying: getCoreNote shouldn't change e'
                if (core.accidental !== undefined) el.pitches[0].accidental = core.accidental;
                el.pitches[0].pitch = core.pitch;
                if (core.endSlur !== undefined) el.pitches[0].endSlur = core.endSlur;
                if (core.endTie !== undefined) el.pitches[0].endTie = core.endTie;
                if (core.startSlur !== undefined) el.pitches[0].startSlur = core.startSlur;
                if (el.startSlur !== undefined) el.pitches[0].startSlur = el.startSlur;
                if (core.startTie !== undefined) el.pitches[0].startTie = core.startTie;
                if (el.startTie !== undefined) el.pitches[0].startTie = el.startTie;
              } else {
                el.rest = core.rest;
                if (core.endSlur !== undefined) el.endSlur = core.endSlur;
                if (core.endTie !== undefined) el.rest.endTie = core.endTie;
                if (core.startSlur !== undefined) el.startSlur = core.startSlur;
                if (core.startTie !== undefined) el.rest.startTie = core.startTie;
                if (el.startTie !== undefined) el.rest.startTie = el.startTie;
              }

              if (core.chord !== undefined) el.chord = core.chord;
              if (core.duration !== undefined) el.duration = core.duration;
              if (core.decoration !== undefined) el.decoration = core.decoration;
              if (core.graceNotes !== undefined) el.graceNotes = core.graceNotes;
              delete el.startSlur;
              if (multilineVars.inTie) {
                if (el.pitches !== undefined) {
                  el.pitches[0].endTie = true;
                  multilineVars.inTie = false;
                } else if (el.rest.type !== 'spacer') {
                  el.rest.endTie = true;
                  multilineVars.inTie = false;
                }
              }
              if (core.startTie || el.startTie)
                multilineVars.inTie = true;
              i  = core.endChar;

              if (tripletNotesLeft > 0) {
                tripletNotesLeft--;
                if (tripletNotesLeft === 0) {
                  el.endTriplet = true;
                }
              }

              if (core.end_beam)
                addEndBeam(el);

              // If there is a whole rest, then it should be the duration of the measure, not it's own duration. We need to special case it.
              if (el.rest && el.rest.type === 'rest' && el.duration === 1) {
                el.rest.type = 'whole';

                el.duration = durationOfMeasure(multilineVars);
              }

              if (multilineVars.barNumOnNextNote) {
                el.barNumber = multilineVars.barNumOnNextNote;
                multilineVars.barNumOnNextNote = null;
              }
              multilineVars.addFormattingOptions(el, tune.formatting, 'note');
              tune.appendElement('note', startOfLine+startI, startOfLine+i, el);
              multilineVars.measureNotEmpty = true;
              el = {};
            }
          }

          if (i === startI) {	// don't know what this is, so ignore it.
            if (line.charAt(i) !== ' ' && line.charAt(i) !== '`')
              warn("Unknown character ignored", line, i);
            i++;
          }
        }
      }
    }
  };

  var parseLine = function(line) {
    var ret = header.parseHeader(line);
    if (ret.regular)
      parseRegularMusicLine(ret.str);
    if (ret.newline && multilineVars.continueall === undefined)
      startNewLine();
    if (ret.words)
      addWords(tune.getCurrentVoice(), line.substring(2));
    if (ret.symbols)
      addSymbols(tune.getCurrentVoice(), line.substring(2));
    if (ret.recurse)
      parseLine(ret.str);
  };

  this.parse = function(strTune, switches) {
    // the switches are optional and cause a difference in the way the tune is parsed.
    // switches.header_only : stop parsing when the header is finished
    // switches.stop_on_warning : stop at the first warning encountered.
    // switches.print: format for the page instead of the browser.
    // switches.format: a hash of the desired formatting commands.
    if (!switches) switches = {};
    tune.reset();
    if (switches.print)
      tune.media = 'print';
    multilineVars.reset();
    header.reset(tokenizer, warn, multilineVars, tune);

    // Take care of whatever line endings come our way
    strTune = Common.gsub(strTune, '\r\n', '\n');
    strTune = Common.gsub(strTune, '\r', '\n');
    strTune += '\n';	// Tacked on temporarily to make the last line continuation work
    strTune = strTune.replace(/\n\\.*\n/g, "\n");	// get rid of latex commands.
    var continuationReplacement = function(all, backslash, comment){
      var spaces = "                                                                                                                                                                                                     ";
      var padding = comment ? spaces.substring(0, comment.length) : "";
      return backslash + " \x12" + padding;
    };
    strTune = strTune.replace(/\\([ \t]*)(%.*)*\n/g, continuationReplacement);	// take care of line continuations right away, but keep the same number of characters
    var lines = strTune.split('\n');
    if (Common.last(lines).length === 0)	// remove the blank line we added above.
      lines.pop();
    try {
      if (switches.format) {
        Directive.globalFormatting(switches.format);
      }
      Common.each(lines,  function(line) {
        if (switches.header_only && multilineVars.is_in_header === false)
          throw "normal_abort";
        if (switches.stop_on_warning && multilineVars.warnings)
          throw "normal_abort";
        if (multilineVars.is_in_history) {
          if (line.charAt(1) === ':') {
            multilineVars.is_in_history = false;
            parseLine(line);
          } else
            tune.addMetaText("history", tokenizer.translateString(tokenizer.stripComment(line)));
        } else if (multilineVars.inTextBlock) {
          if (Common.startsWith(line, "%%endtext")) {
            //tune.addMetaText("textBlock", multilineVars.textBlock);
            tune.addText(multilineVars.textBlock);
            multilineVars.inTextBlock = false;
          }
          else {
            if (Common.startsWith(line, "%%"))
              multilineVars.textBlock += ' ' + line.substring(2);
            else
              multilineVars.textBlock += ' ' + line;
          }
        } else if (multilineVars.inPsBlock) {
          if (Common.startsWith(line, "%%endps")) {
            // Just ignore postscript
            multilineVars.inPsBlock = false;
          }
          else
            multilineVars.textBlock += ' ' + line;
        } else
          parseLine(line);
        multilineVars.iChar += line.length + 1;
      });
      var ph = 11*72;
      var pl = 8.5*72;
      switch (multilineVars.papersize) {
        //case "letter": ph = 11*72; pl = 8.5*72; break;
        case "legal": ph = 14*72; pl = 8.5*72; break;
        case "A4": ph = 11.7*72; pl = 8.3*72; break;
      }
      if (multilineVars.landscape) {
        var x = ph;
        ph = pl;
        pl = x;
      }
      multilineVars.openSlurs = tune.cleanUp(pl, ph, multilineVars.barsperstaff, multilineVars.staffnonote, multilineVars.openSlurs);
    } catch (err) {
      if (err !== "normal_abort")
        throw err;
    }
  };
};
},{"./data/Tune":4,"./parse/Common":6,"./parse/Directive":7,"./parse/Header":8,"./parse/KeyVoice":9,"./parse/Tokenizer":10}],6:[function(require,module,exports){
exports.clone = function(source) {
  var destination = {};
  for (var property in source)
    if (source.hasOwnProperty(property))
      destination[property] = source[property];
  return destination;
};

exports.gsub = function(source, pattern, replacement) {
  return source.split(pattern).join(replacement);
};

exports.strip = function(str) {
  return str.replace(/^\s+/, '').replace(/\s+$/, '');
};

exports.startsWith = function(str, pattern) {
  return str.indexOf(pattern) === 0;
};

exports.endsWith = function(str, pattern) {
  var d = str.length - pattern.length;
  return d >= 0 && str.lastIndexOf(pattern) === d;
};

exports.each = function(arr, iterator, context) {
  for (var i = 0, length = arr.length; i < length; i++)
    iterator.apply(context, [arr[i],i]);
};

exports.last = function(arr) {
  if (arr.length === 0)
    return null;
  return arr[arr.length-1];
};

exports.compact = function(arr) {
  var output = [];
  for (var i = 0; i < arr.length; i++) {
    if (arr[i])
      output.push(arr[i]);
  }
  return output;
};

exports.detect = function(arr, iterator) {
  for (var i = 0; i < arr.length; i++) {
    if (iterator(arr[i]))
      return true;
  }
  return false;
};
},{}],7:[function(require,module,exports){
var tokenizer;
var warn;
var multilineVars;
var tune;

exports.initialize = function(tokenizer_, warn_, multilineVars_, tune_) {
  tokenizer = tokenizer_;
  warn = warn_;
  multilineVars = multilineVars_;
  tune = tune_;
  initializeFonts();
};

function initializeFonts() {
  multilineVars.annotationfont  = { face: "Helvetica", size: 12, weight: "normal", style: "normal", decoration: "none" };
  multilineVars.gchordfont  = { face: "Helvetica", size: 12, weight: "normal", style: "normal", decoration: "none" };
  multilineVars.historyfont  = { face: "\"Times New Roman\"", size: 16, weight: "normal", style: "normal", decoration: "none" };
  multilineVars.infofont  = { face: "\"Times New Roman\"", size: 14, weight: "normal", style: "italic", decoration: "none" };
  multilineVars.measurefont  = { face: "\"Times New Roman\"", size: 14, weight: "normal", style: "italic", decoration: "none" };
  multilineVars.partsfont  = { face: "\"Times New Roman\"", size: 15, weight: "normal", style: "normal", decoration: "none" };
  multilineVars.repeatfont  = { face: "\"Times New Roman\"", size: 13, weight: "normal", style: "normal", decoration: "none" };
  multilineVars.textfont  = { face: "\"Times New Roman\"", size: 16, weight: "normal", style: "normal", decoration: "none" };
  multilineVars.vocalfont  = { face: "\"Times New Roman\"", size: 13, weight: "bold", style: "normal", decoration: "none" };
  multilineVars.wordsfont  = { face: "\"Times New Roman\"", size: 16, weight: "normal", style: "normal", decoration: "none" };

  // These fonts are global for the entire tune.
  tune.formatting.composerfont  = { face: "\"Times New Roman\"", size: 14, weight: "normal", style: "italic", decoration: "none" };
  tune.formatting.subtitlefont  = { face: "\"Times New Roman\"", size: 16, weight: "normal", style: "normal", decoration: "none" };
  tune.formatting.tempofont  = { face: "\"Times New Roman\"", size: 15, weight: "bold", style: "normal", decoration: "none" };
  tune.formatting.titlefont  = { face: "\"Times New Roman\"", size: 20, weight: "normal", style: "normal", decoration: "none" };
  tune.formatting.footerfont  = { face: "\"Times New Roman\"", size: 12, weight: "normal", style: "normal", decoration: "none" };
  tune.formatting.headerfont  = { face: "\"Times New Roman\"", size: 12, weight: "normal", style: "normal", decoration: "none" };
  tune.formatting.voicefont  = { face: "\"Times New Roman\"", size: 13, weight: "bold", style: "normal", decoration: "none" };

  // these are the default fonts for these element types. In the printer, these fonts might change as the tune progresses.
  tune.formatting.annotationfont  = multilineVars.annotationfont;
  tune.formatting.gchordfont  = multilineVars.gchordfont;
  tune.formatting.historyfont  = multilineVars.historyfont;
  tune.formatting.infofont  = multilineVars.infofont;
  tune.formatting.measurefont  = multilineVars.measurefont;
  tune.formatting.partsfont  = multilineVars.partsfont;
  tune.formatting.repeatfont  = multilineVars.repeatfont;
  tune.formatting.textfont  = multilineVars.textfont;
  tune.formatting.vocalfont  = multilineVars.vocalfont;
  tune.formatting.wordsfont  = multilineVars.wordsfont;
}

var fontTypeCanHaveBox = { gchordfont: true, measurefont: true, partsfont: true };

var fontTranslation = function(fontFace) {
  // This translates Postscript fonts for a web alternative.
  // Note that the postscript fonts contain italic and bold info in them, so what is returned is a hash.

  switch (fontFace) {
    case "Arial-Italic":
      return { face: "Arial", weight: "normal", style: "italic", decoration: "none" };
    case "Arial-Bold":
      return { face: "Arial", weight: "bold", style: "normal", decoration: "none" };
    case "Bookman-Demi":
      return { face: "Bookman,serif", weight: "bold", style: "normal", decoration: "none" };
    case "Bookman-DemiItalic":
      return { face: "Bookman,serif", weight: "bold", style: "italic", decoration: "none" };
    case "Bookman-Light":
      return { face: "Bookman,serif", weight: "normal", style: "normal", decoration: "none" };
    case "Bookman-LightItalic":
      return { face: "Bookman,serif", weight: "normal", style: "italic", decoration: "none" };
    case "Courier":
      return { face: "\"Courier New\"", weight: "normal", style: "normal", decoration: "none" };
    case "Courier-Oblique":
      return { face: "\"Courier New\"", weight: "normal", style: "italic", decoration: "none" };
    case "Courier-Bold":
      return { face: "\"Courier New\"", weight: "bold", style: "normal", decoration: "none" };
    case "Courier-BoldOblique":
      return { face: "\"Courier New\"", weight: "bold", style: "italic", decoration: "none" };
    case "AvantGarde-Book":
      return { face: "AvantGarde,Arial", weight: "normal", style: "normal", decoration: "none" };
    case "AvantGarde-BookOblique":
      return { face: "AvantGarde,Arial", weight: "normal", style: "italic", decoration: "none" };
    case "AvantGarde-Demi":
    case "Avant-Garde-Demi":
      return { face: "AvantGarde,Arial", weight: "bold", style: "normal", decoration: "none" };
    case "AvantGarde-DemiOblique":
      return { face: "AvantGarde,Arial", weight: "bold", style: "italic", decoration: "none" };
    case "Helvetica-Oblique":
      return { face: "Helvetica", weight: "normal", style: "italic", decoration: "none" };
    case "Helvetica-Bold":
      return { face: "Helvetica", weight: "bold", style: "normal", decoration: "none" };
    case "Helvetica-BoldOblique":
      return { face: "Helvetica", weight: "bold", style: "italic", decoration: "none" };
    case "Helvetica-Narrow":
      return { face: "\"Helvetica Narrow\",Helvetica", weight: "normal", style: "normal", decoration: "none" };
    case "Helvetica-Narrow-Oblique":
      return { face: "\"Helvetica Narrow\",Helvetica", weight: "normal", style: "italic", decoration: "none" };
    case "Helvetica-Narrow-Bold":
      return { face: "\"Helvetica Narrow\",Helvetica", weight: "bold", style: "normal", decoration: "none" };
    case "Helvetica-Narrow-BoldOblique":
      return { face: "\"Helvetica Narrow\",Helvetica", weight: "bold", style: "italic", decoration: "none" };
    case "Palatino-Roman":
      return { face: "Palatino", weight: "normal", style: "normal", decoration: "none" };
    case "Palatino-Italic":
      return { face: "Palatino", weight: "normal", style: "italic", decoration: "none" };
    case "Palatino-Bold":
      return { face: "Palatino", weight: "bold", style: "normal", decoration: "none" };
    case "Palatino-BoldItalic":
      return { face: "Palatino", weight: "bold", style: "italic", decoration: "none" };
    case "NewCenturySchlbk-Roman":
      return { face: "\"New Century\",serif", weight: "normal", style: "normal", decoration: "none" };
    case "NewCenturySchlbk-Italic":
      return { face: "\"New Century\",serif", weight: "normal", style: "italic", decoration: "none" };
    case "NewCenturySchlbk-Bold":
      return { face: "\"New Century\",serif", weight: "bold", style: "normal", decoration: "none" };
    case "NewCenturySchlbk-BoldItalic":
      return { face: "\"New Century\",serif", weight: "bold", style: "italic", decoration: "none" };
    case "Times":
    case "Times-Roman":
    case "Times-Narrow":
    case "Times-Courier":
    case "Times-New-Roman":
      return { face: "\"Times New Roman\"", weight: "normal", style: "normal", decoration: "none" };
    case "Times-Italic":
    case "Times-Italics":
      return { face: "\"Times New Roman\"", weight: "normal", style: "italic", decoration: "none" };
    case "Times-Bold":
      return { face: "\"Times New Roman\"", weight: "bold", style: "normal", decoration: "none" };
    case "Times-BoldItalic":
      return { face: "\"Times New Roman\"", weight: "bold", style: "italic", decoration: "none" };
    case "ZapfChancery-MediumItalic":
      return { face: "\"Zapf Chancery\",cursive,serif", weight: "normal", style: "normal", decoration: "none" };
    default:
      return null;
  }
};

var getFontParameter = function(tokens, currentSetting, str, position, cmd) {
  // Every font parameter has the following format:
  // <face> <utf8> <size> <modifiers> <box>
  // Where:
  // face: either a standard web font name, or a postscript font, enumerated in fontTranslation. This could also be an * or be missing if the face shouldn't change.
  // utf8: This is optional, and specifies utf8. That's all that is supported so the field is just silently ignored.
  // size: The size, in pixels. This may be omitted if the size is not changing.
  // modifiers: zero or more of "bold", "italic", "underline"
  // box: Only applies to the measure numbers, gchords, and the parts. If present, then a box is drawn around the characters.
  // If face is present, then all the modifiers are cleared. If face is absent, then the modifiers are illegal.
  // The face can be a single word, a set of words separated by hyphens, or a quoted string.
  //
  // So, in practicality, there are three types of font definitions: a number only, an asterisk and a number only, or the full definition (with an optional size).
  function processNumberOnly() {
    var size = parseInt(tokens[0].token);
    tokens.shift();
    if (!currentSetting) {
      warn("Can't set just the size of the font since there is no default value.", str, position);
      return { face: "\"Times New Roman\"", weight: "normal", style: "normal", decoration: "none", size: size};
    }
    if (tokens.length === 0) {
      return { face: currentSetting.face, weight: currentSetting.weight, style: currentSetting.style, decoration: currentSetting.decoration, size: size};
    }
    if (tokens.length === 1 && tokens[0].token === "box" && fontTypeCanHaveBox[cmd])
      return { face: currentSetting.face, weight: currentSetting.weight, style: currentSetting.style, decoration: currentSetting.decoration, size: size, box: true};
    warn("Extra parameters in font definition.", str, position);
    return { face: currentSetting.face, weight: currentSetting.weight, style: currentSetting.style, decoration: currentSetting.decoration, size: size};
  }

  // format 1: asterisk and number only
  if (tokens[0].token === '*') {
    tokens.shift();
    if (tokens[0].type === 'number')
      return processNumberOnly();
    else {
      warn("Expected font size number after *.", str, position);
    }
  }

  // format 2: number only
  if (tokens[0].type === 'number') {
    return processNumberOnly();
  }

  // format 3: whole definition
  var face = [];
  var size;
  var weight = "normal";
  var style = "normal";
  var decoration = "none";
  var box = false;
  var state = 'face';
  var hyphenLast = false;
  while (tokens.length) {
    var currToken = tokens.shift();
    var word = currToken.token.toLowerCase();
    switch (state) {
      case 'face':
        if (hyphenLast || (word !== 'utf' && currToken.type !== 'number' && word !== "bold" && word !== "italic" && word !== "underline" && word !== "box")) {
          if (face.length > 0 && currToken.token === '-') {
            hyphenLast = true;
            face[face.length-1] = face[face.length-1] + currToken.token;
          }
          else {
            if (hyphenLast) {
              hyphenLast = false;
              face[face.length-1] = face[face.length-1] + currToken.token;
            } else
              face.push(currToken.token);
          }
        } else {
          if (currToken.type === 'number') {
            if (size) {
              warn("Font size specified twice in font definition.", str, position);
            } else {
              size = currToken.token;
            }
            state = 'modifier';
          } else if (word === "bold")
            weight = "bold";
          else if (word === "italic")
            style = "italic";
          else if (word === "underline")
            decoration = "underline";
          else if (word === "box") {
            if (fontTypeCanHaveBox[cmd])
              box = true;
            else
              warn("This font style doesn't support \"box\"", str, position);
            state = "finished";
          } else if (word === "utf") {
            currToken = tokens.shift(); // this gets rid of the "8" after "utf"
            state = "size";
          } else
            warn("Unknown parameter " + currToken.token + " in font definition.", str, position);
        }
        break;
      case "size":
        if (currToken.type === 'number') {
          if (size) {
            warn("Font size specified twice in font definition.", str, position);
          } else {
            size = currToken.token;
          }
        } else {
          warn("Expected font size in font definition.", str, position);
        }
        state = 'modifier';
        break;
      case "modifier":
        if (word === "bold")
          weight = "bold";
        else if (word === "italic")
          style = "italic";
        else if (word === "underline")
          decoration = "underline";
        else if (word === "box") {
          if (fontTypeCanHaveBox[cmd])
            box = true;
          else
            warn("This font style doesn't support \"box\"", str, position);
          state = "finished";
        } else
          warn("Unknown parameter " + currToken.token + " in font definition.", str, position);
        break;
      case "finished":
        warn("Extra characters found after \"box\" in font definition.", str, position);
        break;
    }
  }

  if (size === undefined) {
    if (!currentSetting) {
      warn("Must specify the size of the font since there is no default value.", str, position);
      size = 12;
    } else
      size = currentSetting.size;
  } else
    size = parseFloat(size);

  face = face.join(' ');
  var psFont = fontTranslation(face);
  var font = {};
  if (psFont) {
    font.face = psFont.face;
    font.weight = psFont.weight;
    font.style = psFont.style;
    font.decoration = psFont.decoration;
    font.size = size;
    if (box)
      font.box = true;
    return font;
  }
  font.face = face;
  font.weight = weight;
  font.style = style;
  font.decoration = decoration;
  font.size = size;
  if (box)
    font.box = true;
  return font;
};

var getChangingFont = function(cmd, tokens, str) {
  if (tokens.length === 0)
    return "Directive \"" + cmd + "\" requires a font as a parameter.";
  multilineVars[cmd] = getFontParameter(tokens, multilineVars[cmd], str, 0, cmd);
  if (multilineVars.is_in_header) // If the font appears in the header, then it becomes the default font.
    tune.formatting[cmd] = multilineVars[cmd];
  return null;
};
var getGlobalFont = function(cmd, tokens, str) {
  if (tokens.length === 0)
    return "Directive \"" + cmd + "\" requires a font as a parameter.";
  tune.formatting[cmd] = getFontParameter(tokens, tune.formatting[cmd], str, 0, cmd);
  return null;
};

var setScale = function(cmd, tokens) {
  var scratch = "";
  window.ABCJS.parse.each(tokens, function(tok) {
    scratch += tok.token;
  });
  var num = parseFloat(scratch);
  if (isNaN(num) || num === 0)
    return "Directive \"" + cmd + "\" requires a number as a parameter.";
  tune.formatting.scale = num;

};

var getRequiredMeasurement = function(cmd, tokens) {
  var points = tokenizer.getMeasurement(tokens);
  if (points.used === 0 || tokens.length !== 0)
    return { error: "Directive \"" + cmd + "\" requires a measurement as a parameter."};
  return points.value;
};
var oneParameterMeasurement = function(cmd, tokens) {
  var points = tokenizer.getMeasurement(tokens);
  if (points.used === 0 || tokens.length !== 0)
    return "Directive \"" + cmd + "\" requires a measurement as a parameter.";
  tune.formatting[cmd] = points.value;
  return null;
};

var addMultilineVar = function(key, cmd, tokens, min, max) {
  if (tokens.length !== 1 || tokens[0].type !== 'number')
    return "Directive \"" + cmd + "\" requires a number as a parameter.";
  var i = tokens[0].intt;
  if (min !== undefined && i < min)
    return "Directive \"" + cmd + "\" requires a number greater than or equal to " + min + " as a parameter.";
  if (max !== undefined && i > max)
    return "Directive \"" + cmd + "\" requires a number less than or equal to " + max + " as a parameter.";
  multilineVars[key] = i;
  return null;
};

var addMultilineVarBool = function(key, cmd, tokens) {
  var str = addMultilineVar(key, cmd, tokens, 0, 1);
  if (str !== null) return str;
  multilineVars[key] = (multilineVars[key] === 1);
  return null;
};

var addMultilineVarOneParamChoice = function(key, cmd, tokens, choices) {
  if (tokens.length !== 1)
    return "Directive \"" + cmd + "\" requires one of [ " + choices.join(", ") + " ] as a parameter.";
  var choice = tokens[0].token;
  var found = false;
  for (var i = 0; !found && i < choices.length; i++) {
    if (choices[i] === choice)
      found = true;
  }
  if (!found)
    return "Directive \"" + cmd + "\" requires one of [ " + choices.join(", ") + " ] as a parameter.";
  multilineVars[key] = choice;
  return null;
};

exports.parseFontChangeLine = function(textstr) {
  var textParts = textstr.split('$');
  if (textParts.length > 1 && multilineVars.setfont) {
    var textarr = [ { text: textParts[0] }];
    for (var i = 1; i < textParts.length; i++) {
      if (textParts[i].charAt(0) === '0')
        textarr.push({ text: textParts[i].substring(1) });
      else if (textParts[i].charAt(0) === '1' && multilineVars.setfont[1])
        textarr.push({font: multilineVars.setfont[1], text: textParts[i].substring(1) });
      else if (textParts[i].charAt(0) === '2' && multilineVars.setfont[2])
        textarr.push({font: multilineVars.setfont[2], text: textParts[i].substring(1) });
      else if (textParts[i].charAt(0) === '3' && multilineVars.setfont[3])
        textarr.push({font: multilineVars.setfont[3], text: textParts[i].substring(1) });
      else if (textParts[i].charAt(0) === '4' && multilineVars.setfont[4])
        textarr.push({font: multilineVars.setfont[4], text: textParts[i].substring(1) });
      else
        textarr[textarr.length-1].text += '$' + textParts[i];
    }
    if (textarr.length > 1)
      return textarr;
  }
  return textstr;
};

var positionChoices = [ 'auto', 'above', 'below', 'hidden' ];
exports.addDirective = function(str) {
  var tokens = tokenizer.tokenize(str, 0, str.length);	// 3 or more % in a row, or just spaces after %% is just a comment
  if (tokens.length === 0 || tokens[0].type !== 'alpha') return null;
  var restOfString = str.substring(str.indexOf(tokens[0].token)+tokens[0].token.length);
  restOfString = tokenizer.stripComment(restOfString);
  var cmd = tokens.shift().token.toLowerCase();
  var scratch = "";
  switch (cmd)
  {
    // The following directives were added to abc_parser_lint, but haven't been implemented here.
    // Most of them are direct translations from the directives that will be parsed in. See abcm2ps's format.txt for info on each of these.
    //					alignbars: { type: "number", optional: true },
    //					aligncomposer: { type: "string", Enum: [ 'left', 'center','right' ], optional: true },
    //					bstemdown: { type: "boolean", optional: true },
    //					continueall: { type: "boolean", optional: true },
    //					dynalign: { type: "boolean", optional: true },
    //					exprabove: { type: "boolean", optional: true },
    //					exprbelow: { type: "boolean", optional: true },
    //					flatbeams: { type: "boolean", optional: true },
    //					gchordbox: { type: "boolean", optional: true },
    //					graceslurs: { type: "boolean", optional: true },
    //					gracespacebefore: { type: "number", optional: true },
    //					gracespaceinside: { type: "number", optional: true },
    //					gracespaceafter: { type: "number", optional: true },
    //					infospace: { type: "number", optional: true },
    //					lineskipfac: { type: "number", optional: true },
    //					maxshrink: { type: "number", optional: true },
    //					maxstaffsep: { type: "number", optional: true },
    //					maxsysstaffsep: { type: "number", optional: true },
    //					notespacingfactor: { type: "number", optional: true },
    //					parskipfac: { type: "number", optional: true },
    //					slurheight: { type: "number", optional: true },
    //					splittune: { type: "boolean", optional: true },
    //					squarebreve: { type: "boolean", optional: true },
    //					stemheight: { type: "number", optional: true },
    //					straightflags: { type: "boolean", optional: true },
    //					stretchstaff: { type: "boolean", optional: true },
    //					titleformat: { type: "string", optional: true },
    case "bagpipes":tune.formatting.bagpipes = true;break;
    case "landscape":multilineVars.landscape = true;break;
    case "papersize":multilineVars.papersize = restOfString;break;
    case "slurgraces":tune.formatting.slurgraces = true;break;
    case "stretchlast":tune.formatting.stretchlast = true;break;
    case "titlecaps":multilineVars.titlecaps = true;break;
    case "titleleft":tune.formatting.titleleft = true;break;
    case "measurebox":tune.formatting.measurebox = true;break;

    case "vocal": return addMultilineVarOneParamChoice("vocalPosition", cmd, tokens, positionChoices);
    case "dynamic": return addMultilineVarOneParamChoice("dynamicPosition", cmd, tokens, positionChoices);
    case "gchord": return addMultilineVarOneParamChoice("chordPosition", cmd, tokens, positionChoices);
    case "ornament": return addMultilineVarOneParamChoice("ornamentPosition", cmd, tokens, positionChoices);
    case "volume": return addMultilineVarOneParamChoice("volumePosition", cmd, tokens, positionChoices);

    case "botmargin":
    case "botspace":
    case "composerspace":
    case "indent":
    case "leftmargin":
    case "linesep":
    case "musicspace":
    case "partsspace":
    case "pageheight":
    case "pagewidth":
    case "rightmargin":
    case "staffsep":
    case "staffwidth":
    case "subtitlespace":
    case "sysstaffsep":
    case "systemsep":
    case "textspace":
    case "titlespace":
    case "topmargin":
    case "topspace":
    case "vocalspace":
    case "wordsspace":
      return oneParameterMeasurement(cmd, tokens);
    case "vskip":
      var vskip = getRequiredMeasurement(cmd, tokens);
      if (vskip.error)
        return vskip.error;
      tune.addSpacing(vskip);
      return null;
    case "scale":
      setScale(cmd, tokens);
      break;
    case "sep":
      if (tokens.length === 0)
        tune.addSeparator();
      else {
        var points = tokenizer.getMeasurement(tokens);
        if (points.used === 0)
          return "Directive \"" + cmd + "\" requires 3 numbers: space above, space below, length of line";
        var spaceAbove = points.value;

        points = tokenizer.getMeasurement(tokens);
        if (points.used === 0)
          return "Directive \"" + cmd + "\" requires 3 numbers: space above, space below, length of line";
        var spaceBelow = points.value;

        points = tokenizer.getMeasurement(tokens);
        if (points.used === 0 || tokens.length !== 0)
          return "Directive \"" + cmd + "\" requires 3 numbers: space above, space below, length of line";
        var lenLine = points.value;
        tune.addSeparator(spaceAbove, spaceBelow, lenLine);
      }
      break;
    case "barsperstaff":
      scratch = addMultilineVar('barsperstaff', cmd, tokens);
      if (scratch !== null) return scratch;
      break;
    case "staffnonote":
      scratch = addMultilineVarBool('staffnonote', cmd, tokens);
      if (scratch !== null) return scratch;
      break;
    case "printtempo":
      scratch = addMultilineVarBool('printTempo', cmd, tokens);
      if (scratch !== null) return scratch;
      break;
    case "partsbox":
      scratch = addMultilineVarBool('partsBox', cmd, tokens);
      if (scratch !== null) return scratch;
      break;
    case "measurenb":
    case "barnumbers":
      scratch = addMultilineVar('barNumbers', cmd, tokens);
      if (scratch !== null) return scratch;
      break;
    case "begintext":
      multilineVars.inTextBlock = true;
      break;
    case "continueall":
      multilineVars.continueall = true;
      break;
    case "beginps":
      multilineVars.inPsBlock = true;
      warn("Postscript ignored", str, 0);
      break;
    case "deco":
      if (restOfString.length > 0)
        multilineVars.ignoredDecorations.push(restOfString.substring(0, restOfString.indexOf(' ')));
      warn("Decoration redefinition ignored", str, 0);
      break;
    case "text":
      var textstr = tokenizer.translateString(restOfString);
      tune.addText(this.parseFontChangeLine(textstr));
      break;
    case "center":
      var centerstr = tokenizer.translateString(restOfString);
      tune.addCentered(this.parseFontChangeLine(centerstr));
      break;
    case "font":
      // don't need to do anything for this; it is a useless directive
      break;
    case "setfont":
      var sfTokens = tokenizer.tokenize(restOfString, 0, restOfString.length);
//				var sfDone = false;
      if (sfTokens.length >= 4) {
        if (sfTokens[0].token === '-' && sfTokens[1].type === 'number') {
          var sfNum = parseInt(sfTokens[1].token);
          if (sfNum >= 1 && sfNum <= 4) {
            if (!multilineVars.setfont)
              multilineVars.setfont = [];
            sfTokens.shift();
            sfTokens.shift();
            multilineVars.setfont[sfNum] = getFontParameter(sfTokens, multilineVars.setfont[sfNum], str, 0, 'setfont');
//							var sfSize = sfTokens.pop();
//							if (sfSize.type === 'number') {
//								sfSize = parseInt(sfSize.token);
//								var sfFontName = '';
//								for (var sfi = 2; sfi < sfTokens.length; sfi++)
//									sfFontName += sfTokens[sfi].token;
//								multilineVars.setfont[sfNum] = { face: sfFontName, size: sfSize };
//								sfDone = true;
//							}
          }
        }
      }
//				if (!sfDone)
//					return "Bad parameters: " + cmd;
      break;
    case "gchordfont":
    case "partsfont":
    case "vocalfont":
    case "textfont":
    case "annotationfont":
    case "historyfont":
    case "infofont":
    case "measurefont":
    case "repeatfont":
    case "wordsfont":
      return getChangingFont(cmd, tokens, str);
    case "composerfont":
    case "subtitlefont":
    case "tempofont":
    case "titlefont":
    case "voicefont":
    case "footerfont":
    case "headerfont":
      return getGlobalFont(cmd, tokens, str);
    case "barlabelfont":
    case "barnumberfont":
    case "barnumfont":
      return getChangingFont("measurefont", tokens, str);
    case "staves":
    case "score":
      multilineVars.score_is_present = true;
      var addVoice = function(id, newStaff, bracket, brace, continueBar) {
        if (newStaff || multilineVars.staves.length === 0) {
          multilineVars.staves.push({index: multilineVars.staves.length, numVoices: 0});
        }
        var staff = window.ABCJS.parse.last(multilineVars.staves);
        if (bracket !== undefined) staff.bracket = bracket;
        if (brace !== undefined) staff.brace = brace;
        if (continueBar) staff.connectBarLines = 'end';
        if (multilineVars.voices[id] === undefined) {
          multilineVars.voices[id] = {staffNum: staff.index, index: staff.numVoices};
          staff.numVoices++;
        }
      };

      var openParen = false;
      var openBracket = false;
      var openBrace = false;
      var justOpenParen = false;
      var justOpenBracket = false;
      var justOpenBrace = false;
      var continueBar = false;
      var lastVoice;
      var addContinueBar = function() {
        continueBar = true;
        if (lastVoice) {
          var ty = 'start';
          if (lastVoice.staffNum > 0) {
            if (multilineVars.staves[lastVoice.staffNum-1].connectBarLines === 'start' ||
              multilineVars.staves[lastVoice.staffNum-1].connectBarLines === 'continue')
              ty = 'continue';
          }
          multilineVars.staves[lastVoice.staffNum].connectBarLines = ty;
        }
      };
      while (tokens.length) {
        var t = tokens.shift();
        switch (t.token) {
          case '(':
            if (openParen) warn("Can't nest parenthesis in %%score", str, t.start);
            else {openParen = true;justOpenParen = true;}
            break;
          case ')':
            if (!openParen || justOpenParen) warn("Unexpected close parenthesis in %%score", str, t.start);
            else openParen = false;
            break;
          case '[':
            if (openBracket) warn("Can't nest brackets in %%score", str, t.start);
            else {openBracket = true;justOpenBracket = true;}
            break;
          case ']':
            if (!openBracket || justOpenBracket) warn("Unexpected close bracket in %%score", str, t.start);
            else {openBracket = false;multilineVars.staves[lastVoice.staffNum].bracket = 'end';}
            break;
          case '{':
            if (openBrace ) warn("Can't nest braces in %%score", str, t.start);
            else {openBrace = true;justOpenBrace = true;}
            break;
          case '}':
            if (!openBrace || justOpenBrace) warn("Unexpected close brace in %%score", str, t.start);
            else {openBrace = false;multilineVars.staves[lastVoice.staffNum].brace = 'end';}
            break;
          case '|':
            addContinueBar();
            break;
          default:
            var vc = "";
            while (t.type === 'alpha' || t.type === 'number') {
              vc += t.token;
              if (t.continueId)
                t = tokens.shift();
              else
                break;
            }
            var newStaff = !openParen || justOpenParen;
            var bracket = justOpenBracket ? 'start' : openBracket ? 'continue' : undefined;
            var brace = justOpenBrace ? 'start' : openBrace ? 'continue' : undefined;
            addVoice(vc, newStaff, bracket, brace, continueBar);
            justOpenParen = false;
            justOpenBracket = false;
            justOpenBrace = false;
            continueBar = false;
            lastVoice = multilineVars.voices[vc];
            if (cmd === 'staves')
              addContinueBar();
            break;
        }
      }
      break;

    case "newpage":
      var pgNum = tokenizer.getInt(restOfString);
      tune.addNewPage(pgNum.digits === 0 ? -1 : pgNum.value);
      break;

    case "abc":
      var arr = restOfString.split(' ');
      switch (arr[0]) {
        case "-copyright":
        case "-creator":
        case "-edited-by":
        case "-version":
        case "-charset":
          var subCmd = arr.shift();
          tune.addMetaText(cmd+subCmd, arr.join(' '));
          break;
        default:
          return "Unknown directive: " + cmd+arr[0];
      }
      break;
    case "header":
    case "footer":
      var footerStr = tokenizer.getMeat(restOfString, 0, restOfString.length);
      footerStr = restOfString.substring(footerStr.start, footerStr.end);
      if (footerStr.charAt(0) === '"' && footerStr.charAt(footerStr.length-1) === '"' )
        footerStr = footerStr.substring(1, footerStr.length-1);
      var footerArr = footerStr.split('\t');
      var footer = {};
      if (footerArr.length === 1)
        footer = { left: "", center: footerArr[0], right: "" };
      else if (footerArr.length === 2)
        footer = { left: footerArr[0], center: footerArr[1], right: "" };
      else
        footer = { left: footerArr[0], center: footerArr[1], right: footerArr[2] };
      if (footerArr.length > 3)
        warn("Too many tabs in " + cmd + ": " + footerArr.length + " found.", restOfString, 0);

      tune.addMetaTextObj(cmd, footer);
      break;

    case "midi":
      var midi = tokenizer.tokenize(restOfString, 0, restOfString.length);
      if (midi.length > 0 && midi[0].token === '=')
        midi.shift();
      if (midi.length === 0)
        warn("Expected midi command", restOfString, 0);
      else {
        //				var midiCmd = restOfString.split(' ')[0];
        //				var midiParam = restOfString.substring(midiCmd.length+1);
        var getNextMidiParam =  function(midiToks) {
          if (midiToks.length > 0) {
            var t = midiToks.shift();
            var p = t.token;
            if (t.type === "number")
              p = t.intt;
            return p;
          }
          else
            return null;
        };
        // TODO-PER: make sure the command is legal
        if (tune.formatting[cmd] === undefined)
          tune.formatting[cmd] = {};
        var midi_cmd = midi.shift().token;
        var midi_param = true;
        if (midi_cmd === 'program') {
          var p1 = getNextMidiParam(midi);
          if (p1) {
            var p2 = getNextMidiParam(midi);
            // NOTE: The program number has an off by one error in ABC, so we add one here.
            if (p2)
              midi_param = { channel: p1, program: p2};
            else
              midi_param = { program: p1};
          }
        } else {
          // TODO-PER: handle the params for all MIDI commands
          var p = getNextMidiParam(midi);
          if (p !== null)
            midi_param = p;
        }
        tune.formatting[cmd][midi_cmd] = midi_param;
        // TODO-PER: save all the parameters, not just the first.
      }
      //%%MIDI barlines: deactivates %%nobarlines.
      //%%MIDI bassprog n
      //%%MIDI bassvol n
      //%%MIDI beat ⟨int1⟩ ⟨int2⟩ ⟨int3⟩ ⟨int4⟩: controls the volumes of the notes in a measure. The first note in a bar has volume ⟨int1⟩; other ‘strong’ notes have volume ⟨int2⟩ and all the rest have volume ⟨int3⟩. These values must be in the range 0–127. The parameter ⟨int4⟩ determines which notes are ‘strong’. If the time signature is x/y, then each note is given a position number k = 0, 1, 2. . . x-1 within each bar. If k is a multiple of ⟨int4⟩, then the note is ‘strong’.
      //%%MIDI beataccents: reverts to normally emphasised notes. See also %%MIDI nobeat-
      //%%MIDI beatmod ⟨int⟩: increments the velocities as defined by %%MIDI beat
      //%%MIDI beatstring ⟨string⟩: similar to %%MIDI beat, but indicated with an fmp string.
      //%%MIDI c ⟨int⟩: specifies the MIDI pitch which corresponds to	. The default is 60.
      //%%MIDI channel ⟨int⟩: selects the melody channel ⟨int⟩ (1–16).
      //%%MIDI chordattack ⟨int⟩: delays the start of chord notes by ⟨int⟩ MIDI units.
      //%%MIDI chordname ⟨string int1 int2 int3 int4 int5 int6⟩: defines new chords or re-defines existing ones as was seen in Section 12.8.
      //%%MIDI chordprog 20 % Church organ
      //%%MIDI chordvol ⟨int⟩: sets the volume (velocity) of the chord notes to ⟨int⟩ (0–127).
      //%%MIDI control ⟨bass/chord⟩ ⟨int1 int2⟩: generates a MIDI control event. If %%control is followed by ⟨bass⟩ or ⟨chord⟩, the event apply to the bass or chord channel, otherwise it will be applied to the melody channel. ⟨int1⟩ is the MIDI control number (0–127) and ⟨int2⟩ the value (0–127).
      //%%MIDI deltaloudness⟨int⟩: bydefault,!crescendo!and!dimuendo!modifythebe- at variables ⟨vol1⟩ ⟨vol2⟩ ⟨vol3⟩ 15 volume units. This command allows the user to change this default.
      //%%MIDI drone ⟨int1 int2 int3 int4 int5⟩: specifies a two-note drone accompaniment. ⟨int1⟩ is the drone MIDI instrument, ⟨int2⟩ the MIDI pitch 1, ⟨int3⟩ the MIDI pitch 2, ⟨int4⟩ the MIDI volume 1, ⟨int5⟩ the MIDI volume 2. Default values are 70 45 33 80 80.
      //%%MIDI droneoff: turns the drone accompaniment off.
      //%%MIDI droneon: turns the drone accompaniment on.
      //%%MIDI drum string [drum programs] [drum velocities]
      //%%MIDI drumbars ⟨int⟩: specifies the number of bars over which a drum pattern string is spread. Default is 1.
      //%%MIDI drummap ⟨str⟩ ⟨int⟩: associates the note ⟨str⟩ (in ABC notation) to the a percussion instrument, as listed in Section H.2.
      //%%MIDI drumoff turns drum accompaniment off.
      //%%MIDI drumon turns drum accompaniment on.
      //%%MIDI fermatafixed: expands a !fermata! by one unit length; that is, GC3 becomes
      //%%MIDI fermataproportional: doubles the length of a note preceded by !fermata!;
      //%%MIDI gchord string
      //%%MIDI gchord str
      //%%MIDI gchordon
      //%%MIDI gchordoff
      //%%MIDI grace ⟨float⟩: sets the fraction of the next note that grace notes will take up. ⟨float⟩ must be a fraction such as 1/6.
      //%%MIDI gracedivider ⟨int⟩: sets the grace note length as 1/⟨int⟩th of the following note.
      //%%MIDI makechordchannels⟨int⟩: thisisaverycomplexcommandusedinchordscon-
      //%%MIDI nobarlines
      //%%MIDI nobeataccents: forces the ⟨int2⟩ volume (see %%MIDI beat) for each note in a bar, regardless of their position.
      //%%MIDI noportamento: turns off the portamento controller on the current channel.
      //%%MIDI pitchbend [bass/chord] <high byte> <low byte>
      //%%MIDI program 2 75
      //%%MIDI portamento ⟨int⟩: turns on the portamento controller on the current channel and set it to ⟨int⟩. Experts only.
      //%%MIDI randomchordattack: delays the start of chord notes by a random number of MIDI units.
      //%%MIDI ratio n m
      //%%MIDI rtranspose ⟨int1⟩: transposes relatively to a prior %%transpose command by ⟨int1⟩ semitones; the total transposition will be ⟨int1 + int2⟩ semitones.
      //%%MIDI temperament ⟨int1⟩ ⟨int2⟩: TO BE WRITTEN
      //%%MIDI temperamentlinear ⟨float1 float2⟩: changes the temperament of the scale. ⟨fl- oat1⟩ specifies the size of an octave in cents of a semitone, or 1/1200 of an octave. ⟨float2⟩ specifies in the size of a fifth (normally 700 cents).
      //%%MIDI temperamentnormal: restores normal temperament.
      //%%MIDI transpose n
      //%%MIDI voice [<ID>] [instrument=<integer> [bank=<integer>]] [mute]
      break;

    case "playtempo":
    case "auquality":
    case "continuous":
    case "nobarcheck":
      // TODO-PER: Actually handle the parameters of these
      tune.formatting[cmd] = restOfString;
      break;
    default:
      return "Unknown directive: " + cmd;
  }
  return null;
};
exports.globalFormatting = function(formatHash) {
  for (var cmd in formatHash) {
    if (formatHash.hasOwnProperty(cmd)) {
      var value = ''+formatHash[cmd];
      var tokens = tokenizer.tokenize(value, 0, value.length);
      var scratch;
      switch (cmd) {
        case "titlefont":
        case "gchordfont":
          getChangingFont(cmd, tokens, value);
          break;
        case "scale":
          setScale(cmd, tokens);
          break;
        case "partsbox":
          scratch = addMultilineVarBool('partsBox', cmd, tokens);
          if (scratch !== null) warn(scratch);
          break;
        default:
          warn("Formatting directive unrecognized: ", cmd, 0);
      }
    }
  }
};
},{}],8:[function(require,module,exports){
var Common = require('./Common');
var KeyVoice = require('./KeyVoice');
var Directive = require('./Directive');

module.exports = function(tokenizer, warn, multilineVars, tune) {
  this.reset = function(tokenizer, warn, multilineVars, tune) {
    KeyVoice.initialize(tokenizer, warn, multilineVars, tune);
    Directive.initialize(tokenizer, warn, multilineVars, tune);
  };
  this.reset(tokenizer, warn, multilineVars, tune);

  this.setTitle = function(title) {
    if (multilineVars.hasMainTitle)
      tune.addSubtitle(tokenizer.translateString(tokenizer.stripComment(title)));	// display secondary title
    else
    {
      tune.addMetaText("title", tokenizer.translateString(tokenizer.theReverser(tokenizer.stripComment(title))));
      multilineVars.hasMainTitle = true;
    }
  };

  this.setMeter = function(line) {
    line = tokenizer.stripComment(line);
    if (line === 'C') {
      if (multilineVars.havent_set_length === true)
        multilineVars.default_length = 0.125;
      return {type: 'common_time'};
    } else if (line === 'C|') {
      if (multilineVars.havent_set_length === true)
        multilineVars.default_length = 0.125;
      return {type: 'cut_time'};
    } else if (line === 'o') {
      if (multilineVars.havent_set_length === true)
        multilineVars.default_length = 0.125;
      return {type: 'tempus_perfectum'};
    } else if (line === 'c') {
      if (multilineVars.havent_set_length === true)
        multilineVars.default_length = 0.125;
      return {type: 'tempus_imperfectum'};
    } else if (line === 'o.') {
      if (multilineVars.havent_set_length === true)
        multilineVars.default_length = 0.125;
      return {type: 'tempus_perfectum_prolatio'};
    } else if (line === 'c.') {
      if (multilineVars.havent_set_length === true)
        multilineVars.default_length = 0.125;
      return {type: 'tempus_imperfectum_prolatio'};
    } else if (line.length === 0 || line.toLowerCase() === 'none') {
      if (multilineVars.havent_set_length === true)
        multilineVars.default_length = 0.125;
      return null;
    }
    else
    {
      var tokens = tokenizer.tokenize(line, 0, line.length);
      // the form is [open_paren] decimal [ plus|dot decimal ]... [close_paren] slash decimal [plus same_as_before]
      try {
        var parseNum = function() {
          // handles this much: [open_paren] decimal [ plus|dot decimal ]... [close_paren]
          var ret = {value: 0, num: ""};

          var tok = tokens.shift();
          if (tok.token === '(')
            tok = tokens.shift();
          while (1) {
            if (tok.type !== 'number') throw "Expected top number of meter";
            ret.value += parseInt(tok.token);
            ret.num += tok.token;
            if (tokens.length === 0 || tokens[0].token === '/') return ret;
            tok = tokens.shift();
            if (tok.token === ')') {
              if (tokens.length === 0 || tokens[0].token === '/') return ret;
              throw "Unexpected paren in meter";
            }
            if (tok.token !== '.' && tok.token !== '+') throw "Expected top number of meter";
            ret.num += tok.token;
            if (tokens.length === 0) throw "Expected top number of meter";
            tok = tokens.shift();
          }
          return ret;	// just to suppress warning
        };

        var parseFraction = function() {
          // handles this much: parseNum slash decimal
          var ret = parseNum();
          if (tokens.length === 0) return ret;
          var tok = tokens.shift();
          if (tok.token !== '/') throw "Expected slash in meter";
          tok = tokens.shift();
          if (tok.type !== 'number') throw "Expected bottom number of meter";
          ret.den = tok.token;
          ret.value = ret.value / parseInt(ret.den);
          return ret;
        };

        if (tokens.length === 0) throw "Expected meter definition in M: line";
        var meter = {type: 'specified', value: [ ]};
        var totalLength = 0;
        while (1) {
          var ret = parseFraction();
          totalLength += ret.value;
          var mv = { num: ret.num };
          if (ret.den !== undefined)
            mv.den = ret.den;
          meter.value.push(mv);
          if (tokens.length === 0) break;
          //var tok = tokens.shift();
          //if (tok.token !== '+') throw "Extra characters in M: line";
        }

        if (multilineVars.havent_set_length === true) {
          multilineVars.default_length = totalLength < 0.75 ? 0.0625 : 0.125;
        }
        return meter;
      } catch (e) {
        warn(e, line, 0);
      }
    }
    return null;
  };

  this.calcTempo = function(relTempo) {
    var dur = 1/4;
    if (multilineVars.meter && multilineVars.meter.type === 'specified') {
      dur = 1 / parseInt(multilineVars.meter.value[0].den);
    } else if (multilineVars.origMeter && multilineVars.origMeter.type === 'specified') {
      dur = 1 / parseInt(multilineVars.origMeter.value[0].den);
    }
    //var dur = multilineVars.default_length ? multilineVars.default_length : 1;
    for (var i = 0; i < relTempo.duration; i++)
      relTempo.duration[i] = dur * relTempo.duration[i];
    return relTempo;
  };

  this.resolveTempo = function() {
    if (multilineVars.tempo) {	// If there's a tempo waiting to be resolved
      this.calcTempo(multilineVars.tempo);
      tune.metaText.tempo = multilineVars.tempo;
      delete multilineVars.tempo;
    }
  };

  this.addUserDefinition = function(line, start, end) {
    var equals = line.indexOf('=', start);
    if (equals === -1) {
      warn("Need an = in a macro definition", line, start);
      return;
    }

    var before = Common.strip(line.substring(start, equals));
    var after = Common.strip(line.substring(equals+1));

    if (before.length !== 1) {
      warn("Macro definitions can only be one character", line, start);
      return;
    }
    var legalChars = "HIJKLMNOPQRSTUVWXYhijklmnopqrstuvw~";
    if (legalChars.indexOf(before) === -1) {
      warn("Macro definitions must be H-Y, h-w, or tilde", line, start);
      return;
    }
    if (after.length === 0) {
      warn("Missing macro definition", line, start);
      return;
    }
    if (multilineVars.macros === undefined)
      multilineVars.macros = {};
    multilineVars.macros[before] = after;
  };

  this.setDefaultLength = function(line, start, end) {
    var len = Common.gsub(line.substring(start, end), " ", "");
    var len_arr = len.split('/');
    if (len_arr.length === 2) {
      var n = parseInt(len_arr[0]);
      var d = parseInt(len_arr[1]);
      if (d > 0) {
        multilineVars.default_length = n / d;	// a whole note is 1
        multilineVars.havent_set_length = false;
      }
    }
  };

  this.setTempo = function(line, start, end) {
    //Q - tempo; can be used to specify the notes per minute, e.g. If
    //the meter denominator is a 4 note then Q:120 or Q:C=120
    //is 120 quarter notes per minute. Similarly  Q:C3=40 would be 40
    //dotted half notes per minute. An absolute tempo may also be
    //set, e.g. Q:1/8=120 is 120 eighth notes per minute,
    //irrespective of the meter's denominator.
    //
    // This is either a number, "C=number", "Cnumber=number", or fraction [fraction...]=number
    // It depends on the M: field, which may either not be present, or may appear after this.
    // If M: is not present, an eighth note is used.
    // That means that this field can't be calculated until the end, if it is the first three types, since we don't know if we'll see an M: field.
    // So, if it is the fourth type, set it here, otherwise, save the info in the multilineVars.
    // The temporary variables we keep are the duration and the bpm. In the first two forms, the duration is 1.
    // In addition, a quoted string may both precede and follow. If a quoted string is present, then the duration part is optional.
    try {
      var tokens = tokenizer.tokenize(line, start, end);

      if (tokens.length === 0) throw "Missing parameter in Q: field";

      var tempo = {};
      var delaySet = true;
      var token = tokens.shift();
      if (token.type === 'quote') {
        tempo.preString = token.token;
        token = tokens.shift();
        if (tokens.length === 0) {	// It's ok to just get a string for the tempo
          return {type: 'immediate', tempo: tempo};
        }
      }
      if (token.type === 'alpha' && token.token === 'C')	 { // either type 2 or type 3
        if (tokens.length === 0) throw "Missing tempo after C in Q: field";
        token = tokens.shift();
        if (token.type === 'punct' && token.token === '=') {
          // This is a type 2 format. The duration is an implied 1
          if (tokens.length === 0) throw "Missing tempo after = in Q: field";
          token = tokens.shift();
          if (token.type !== 'number') throw "Expected number after = in Q: field";
          tempo.duration = [1];
          tempo.bpm = parseInt(token.token);
        } else if (token.type === 'number') {
          // This is a type 3 format.
          tempo.duration = [parseInt(token.token)];
          if (tokens.length === 0) throw "Missing = after duration in Q: field";
          token = tokens.shift();
          if (token.type !== 'punct' || token.token !== '=') throw "Expected = after duration in Q: field";
          if (tokens.length === 0) throw "Missing tempo after = in Q: field";
          token = tokens.shift();
          if (token.type !== 'number') throw "Expected number after = in Q: field";
          tempo.bpm = parseInt(token.token);
        } else throw "Expected number or equal after C in Q: field";

      } else if (token.type === 'number') {	// either type 1 or type 4
        var num = parseInt(token.token);
        if (tokens.length === 0 || tokens[0].type === 'quote') {
          // This is type 1
          tempo.duration = [1];
          tempo.bpm = num;
        } else {	// This is type 4
          delaySet = false;
          token = tokens.shift();
          if (token.type !== 'punct' && token.token !== '/') throw "Expected fraction in Q: field";
          token = tokens.shift();
          if (token.type !== 'number') throw "Expected fraction in Q: field";
          var den = parseInt(token.token);
          tempo.duration = [num/den];
          // We got the first fraction, keep getting more as long as we find them.
          while (tokens.length > 0  && tokens[0].token !== '=' && tokens[0].type !== 'quote') {
            token = tokens.shift();
            if (token.type !== 'number') throw "Expected fraction in Q: field";
            num = parseInt(token.token);
            token = tokens.shift();
            if (token.type !== 'punct' && token.token !== '/') throw "Expected fraction in Q: field";
            token = tokens.shift();
            if (token.type !== 'number') throw "Expected fraction in Q: field";
            den = parseInt(token.token);
            tempo.duration.push(num/den);
          }
          token = tokens.shift();
          if (token.type !== 'punct' && token.token !== '=') throw "Expected = in Q: field";
          token = tokens.shift();
          if (token.type !== 'number') throw "Expected tempo in Q: field";
          tempo.bpm = parseInt(token.token);
        }
      } else throw "Unknown value in Q: field";
      if (tokens.length !== 0) {
        token = tokens.shift();
        if (token.type === 'quote') {
          tempo.postString = token.token;
          token = tokens.shift();
        }
        if (tokens.length !== 0) throw "Unexpected string at end of Q: field";
      }
      if (multilineVars.printTempo === false)
        tempo.suppress = true;
      return {type: delaySet?'delaySet':'immediate', tempo: tempo};
    } catch (msg) {
      warn(msg, line, start);
      return {type: 'none'};
    }
  };

  this.letter_to_inline_header = function(line, i)
  {
    var ws = tokenizer.eatWhiteSpace(line, i);
    i +=ws;
    if (line.length >= i+5 && line.charAt(i) === '[' && line.charAt(i+2) === ':') {
      var e = line.indexOf(']', i);
      switch(line.substring(i, i+3))
      {
        case "[I:":
          var err = Directive.addDirective(line.substring(i+3, e));
          if (err) warn(err, line, i);
          return [ e-i+1+ws ];
        case "[M:":
          var meter = this.setMeter(line.substring(i+3, e));
          if (tune.hasBeginMusic() && meter)
            tune.appendStartingElement('meter', -1, -1, meter);
          else
            multilineVars.meter = meter;
          return [ e-i+1+ws ];
        case "[K:":
          var result = KeyVoice.parseKey(line.substring(i+3, e));
          if (result.foundClef && tune.hasBeginMusic())
            tune.appendStartingElement('clef', -1, -1, multilineVars.clef);
          if (result.foundKey && tune.hasBeginMusic())
            tune.appendStartingElement('key', -1, -1, KeyVoice.fixKey(multilineVars.clef, multilineVars.key));
          return [ e-i+1+ws ];
        case "[P:":
          if (tune.lines.length <= tune.lineNum)
            multilineVars.partForNextLine = line.substring(i+3, e);
          else
            tune.appendElement('part', -1, -1, {title: line.substring(i+3, e)});
          return [ e-i+1+ws ];
        case "[L:":
          this.setDefaultLength(line, i+3, e);
          return [ e-i+1+ws ];
        case "[Q:":
          if (e > 0) {
            var tempo = this.setTempo(line, i+3, e);
            if (tempo.type === 'delaySet') tune.appendElement('tempo', -1, -1, this.calcTempo(tempo.tempo));
            else if (tempo.type === 'immediate') tune.appendElement('tempo', -1, -1, tempo.tempo);
            return [ e-i+1+ws, line.charAt(i+1), line.substring(i+3, e)];
          }
          break;
        case "[V:":
          if (e > 0) {
            KeyVoice.parseVoice(line, i+3, e);
            //startNewLine();
            return [ e-i+1+ws, line.charAt(i+1), line.substring(i+3, e)];
          }
          break;

        default:
        // TODO: complain about unhandled header
      }
    }
    return [ 0 ];
  };

  this.letter_to_body_header = function(line, i)
  {
    if (line.length >= i+3) {
      switch(line.substring(i, i+2))
      {
        case "I:":
          var err = Directive.addDirective(line.substring(i+2));
          if (err) warn(err, line, i);
          return [ line.length ];
        case "M:":
          var meter = this.setMeter(line.substring(i+2));
          if (tune.hasBeginMusic() && meter)
            tune.appendStartingElement('meter', -1, -1, meter);
          return [ line.length ];
        case "K:":
          var result = KeyVoice.parseKey(line.substring(i+2));
          if (result.foundClef && tune.hasBeginMusic())
            tune.appendStartingElement('clef', -1, -1, multilineVars.clef);
          if (result.foundKey && tune.hasBeginMusic())
            tune.appendStartingElement('key', -1, -1, KeyVoice.fixKey(multilineVars.clef, multilineVars.key));
          return [ line.length ];
        case "P:":
          if (tune.hasBeginMusic())
            tune.appendElement('part', -1, -1, {title: line.substring(i+2)});
          return [ line.length ];
        case "L:":
          this.setDefaultLength(line, i+2, line.length);
          return [ line.length ];
        case "Q:":
          var e = line.indexOf('\x12', i+2);
          if (e === -1) e = line.length;
          var tempo = this.setTempo(line, i+2, e);
          if (tempo.type === 'delaySet') tune.appendElement('tempo', -1, -1, this.calcTempo(tempo.tempo));
          else if (tempo.type === 'immediate') tune.appendElement('tempo', -1, -1, tempo.tempo);
          return [ e, line.charAt(i), Common.strip(line.substring(i+2))];
        case "V:":
          KeyVoice.parseVoice(line, 2, line.length);
//						startNewLine();
          return [ line.length, line.charAt(i), window.ABCJS.parse(line.substring(i+2))];
        default:
        // TODO: complain about unhandled header
      }
    }
    return [ 0 ];
  };

  var metaTextHeaders = {
    A: 'author',
    B: 'book',
    C: 'composer',
    D: 'discography',
    F: 'url',
    G: 'group',
    I: 'instruction',
    N: 'notes',
    O: 'origin',
    R: 'rhythm',
    S: 'source',
    W: 'unalignedWords',
    Z: 'transcription'
  };

  this.parseHeader = function(line) {
    if (Common.startsWith(line, '%%')) {
      var err = Directive.addDirective(line.substring(2));
      if (err) warn(err, line, 2);
      return {};
    }
    var i = line.indexOf('%');
    if (i >= 0)
      line = line.substring(0, i);
    line = line.replace(/\s+$/, '');

    if (line.length === 0)
      return {};

    if (line.length >= 2) {
      if (line.charAt(1) === ':') {
        var nextLine = "";
        if (line.indexOf('\x12') >= 0 && line.charAt(0) !== 'w') {	// w: is the only header field that can have a continuation.
          nextLine = line.substring(line.indexOf('\x12')+1);
          line = line.substring(0, line.indexOf('\x12'));	//This handles a continuation mark on a header field
        }
        var field = metaTextHeaders[line.charAt(0)];
        if (field !== undefined) {
          if (field === 'unalignedWords')
            tune.addMetaTextArray(field, Directive.parseFontChangeLine(tokenizer.translateString(tokenizer.stripComment(line.substring(2)))));
          else
            tune.addMetaText(field, tokenizer.translateString(tokenizer.stripComment(line.substring(2))));
          return {};
        } else {
          switch(line.charAt(0))
          {
            case  'H':
              tune.addMetaText("history", tokenizer.translateString(tokenizer.stripComment(line.substring(2))));
              multilineVars.is_in_history = true;
              break;
            case  'K':
              // since the key is the last thing that can happen in the header, we can resolve the tempo now
              this.resolveTempo();
              var result = KeyVoice.parseKey(line.substring(2));
              if (!multilineVars.is_in_header && tune.hasBeginMusic()) {
                if (result.foundClef)
                  tune.appendStartingElement('clef', -1, -1, multilineVars.clef);
                if (result.foundKey)
                  tune.appendStartingElement('key', -1, -1, KeyVoice.fixKey(multilineVars.clef, multilineVars.key));
              }
              multilineVars.is_in_header = false;	// The first key signifies the end of the header.
              break;
            case  'L':
              this.setDefaultLength(line, 2, line.length);
              break;
            case  'M':
              multilineVars.origMeter = multilineVars.meter = this.setMeter(line.substring(2));
              break;
            case  'P':
              // TODO-PER: There is more to do with parts, but the writer doesn't care.
              if (multilineVars.is_in_header)
                tune.addMetaText("partOrder", tokenizer.translateString(tokenizer.stripComment(line.substring(2))));
              else
                multilineVars.partForNextLine = tokenizer.translateString(tokenizer.stripComment(line.substring(2)));
              break;
            case  'Q':
              var tempo = this.setTempo(line, 2, line.length);
              if (tempo.type === 'delaySet') multilineVars.tempo = tempo.tempo;
              else if (tempo.type === 'immediate') tune.metaText.tempo = tempo.tempo;
              break;
            case  'T':
              this.setTitle(line.substring(2));
              break;
            case 'U':
              this.addUserDefinition(line, 2, line.length);
              break;
            case  'V':
              KeyVoice.parseVoice(line, 2, line.length);
              if (!multilineVars.is_in_header)
                return {newline: true};
              break;
            case  's':
              return {symbols: true};
            case  'w':
              return {words: true};
            case 'X':
              break;
            case 'E':
            case 'm':
              warn("Ignored header", line, 0);
              break;
            default:
              // It wasn't a recognized header value, so parse it as music.
              if (nextLine.length)
                nextLine = "\x12" + nextLine;
              //parseRegularMusicLine(line+nextLine);
              //nextLine = "";
              return {regular: true, str: line+nextLine};
          }
        }
        if (nextLine.length > 0)
          return {recurse: true, str: nextLine};
        return {};
      }
    }

    // If we got this far, we have a regular line of mulsic
    return {regular: true, str: line};
  };
};
},{"./Common":6,"./Directive":7,"./KeyVoice":9}],9:[function(require,module,exports){
var Common = require('./Common');
var Directive = require('./Directive');

var tokenizer;
var warn;
var multilineVars;
var tune;

exports.initialize = function(tokenizer_, warn_, multilineVars_, tune_) {
  tokenizer = tokenizer_;
  warn = warn_;
  multilineVars = multilineVars_;
  tune = tune_;
};

exports.standardKey = function(keyName) {
  var key1sharp = {acc: 'sharp', note: 'f'};
  var key2sharp = {acc: 'sharp', note: 'c'};
  var key3sharp = {acc: 'sharp', note: 'g'};
  var key4sharp = {acc: 'sharp', note: 'd'};
  var key5sharp = {acc: 'sharp', note: 'A'};
  var key6sharp = {acc: 'sharp', note: 'e'};
  var key7sharp = {acc: 'sharp', note: 'B'};
  var key1flat = {acc: 'flat', note: 'B'};
  var key2flat = {acc: 'flat', note: 'e'};
  var key3flat = {acc: 'flat', note: 'A'};
  var key4flat = {acc: 'flat', note: 'd'};
  var key5flat = {acc: 'flat', note: 'G'};
  var key6flat = {acc: 'flat', note: 'c'};
  var key7flat = {acc: 'flat', note: 'F'};

  var keys = {
    'C#': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp ],
    'A#m': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp ],
    'G#Mix': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp ],
    'D#Dor': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp ],
    'E#Phr': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp ],
    'F#Lyd': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp ],
    'B#Loc': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp ],

    'F#': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp ],
    'D#m': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp ],
    'C#Mix': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp ],
    'G#Dor': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp ],
    'A#Phr': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp ],
    'BLyd': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp ],
    'E#Loc': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp ],

    'B': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp ],
    'G#m': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp ],
    'F#Mix': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp ],
    'C#Dor': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp ],
    'D#Phr': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp ],
    'ELyd': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp ],
    'A#Loc': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp ],

    'E': [ key1sharp, key2sharp, key3sharp, key4sharp ],
    'C#m': [ key1sharp, key2sharp, key3sharp, key4sharp ],
    'BMix': [ key1sharp, key2sharp, key3sharp, key4sharp ],
    'F#Dor': [ key1sharp, key2sharp, key3sharp, key4sharp ],
    'G#Phr': [ key1sharp, key2sharp, key3sharp, key4sharp ],
    'ALyd': [ key1sharp, key2sharp, key3sharp, key4sharp ],
    'D#Loc': [ key1sharp, key2sharp, key3sharp, key4sharp ],

    'A': [ key1sharp, key2sharp, key3sharp ],
    'F#m': [ key1sharp, key2sharp, key3sharp ],
    'EMix': [ key1sharp, key2sharp, key3sharp ],
    'BDor': [ key1sharp, key2sharp, key3sharp ],
    'C#Phr': [ key1sharp, key2sharp, key3sharp ],
    'DLyd': [ key1sharp, key2sharp, key3sharp ],
    'G#Loc': [ key1sharp, key2sharp, key3sharp ],

    'D': [ key1sharp, key2sharp ],
    'Bm': [ key1sharp, key2sharp ],
    'AMix': [ key1sharp, key2sharp ],
    'EDor': [ key1sharp, key2sharp ],
    'F#Phr': [ key1sharp, key2sharp ],
    'GLyd': [ key1sharp, key2sharp ],
    'C#Loc': [ key1sharp, key2sharp ],

    'G': [ key1sharp ],
    'Em': [ key1sharp ],
    'DMix': [ key1sharp ],
    'ADor': [ key1sharp ],
    'BPhr': [ key1sharp ],
    'CLyd': [ key1sharp ],
    'F#Loc': [ key1sharp ],

    'C': [],
    'Am': [],
    'GMix': [],
    'DDor': [],
    'EPhr': [],
    'FLyd': [],
    'BLoc': [],

    'F': [ key1flat ],
    'Dm': [ key1flat ],
    'CMix': [ key1flat ],
    'GDor': [ key1flat ],
    'APhr': [ key1flat ],
    'BbLyd': [ key1flat ],
    'ELoc': [ key1flat ],

    'Bb': [ key1flat, key2flat ],
    'Gm': [ key1flat, key2flat ],
    'FMix': [ key1flat, key2flat ],
    'CDor': [ key1flat, key2flat ],
    'DPhr': [ key1flat, key2flat ],
    'EbLyd': [ key1flat, key2flat ],
    'ALoc': [ key1flat, key2flat ],

    'Eb': [ key1flat, key2flat, key3flat ],
    'Cm': [ key1flat, key2flat, key3flat ],
    'BbMix': [ key1flat, key2flat, key3flat ],
    'FDor': [ key1flat, key2flat, key3flat ],
    'GPhr': [ key1flat, key2flat, key3flat ],
    'AbLyd': [ key1flat, key2flat, key3flat ],
    'DLoc': [ key1flat, key2flat, key3flat ],

    'Ab': [ key1flat, key2flat, key3flat, key4flat ],
    'Fm': [ key1flat, key2flat, key3flat, key4flat ],
    'EbMix': [ key1flat, key2flat, key3flat, key4flat ],
    'BbDor': [ key1flat, key2flat, key3flat, key4flat ],
    'CPhr': [ key1flat, key2flat, key3flat, key4flat ],
    'DbLyd': [ key1flat, key2flat, key3flat, key4flat ],
    'GLoc': [ key1flat, key2flat, key3flat, key4flat ],

    'Db': [ key1flat, key2flat, key3flat, key4flat, key5flat ],
    'Bbm': [ key1flat, key2flat, key3flat, key4flat, key5flat ],
    'AbMix': [ key1flat, key2flat, key3flat, key4flat, key5flat ],
    'EbDor': [ key1flat, key2flat, key3flat, key4flat, key5flat ],
    'FPhr': [ key1flat, key2flat, key3flat, key4flat, key5flat ],
    'GbLyd': [ key1flat, key2flat, key3flat, key4flat, key5flat ],
    'CLoc': [ key1flat, key2flat, key3flat, key4flat, key5flat ],

    'Gb': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat ],
    'Ebm': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat ],
    'DbMix': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat ],
    'AbDor': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat ],
    'BbPhr': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat ],
    'CbLyd': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat ],
    'FLoc': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat ],

    'Cb': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat ],
    'Abm': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat ],
    'GbMix': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat ],
    'DbDor': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat ],
    'EbPhr': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat ],
    'FbLyd': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat ],
    'BbLoc': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat ],

    // The following are not in the 2.0 spec, but seem normal enough.
    // TODO-PER: These SOUND the same as what's written, but they aren't right
    'A#': [ key1flat, key2flat ],
    'B#': [],
    'D#': [ key1flat, key2flat, key3flat ],
    'E#': [ key1flat ],
    'G#': [ key1flat, key2flat, key3flat, key4flat ],
    'Gbm': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp ]
  };

  return keys[keyName];
};

var clefLines = {
  'treble': { clef: 'treble', pitch: 4, mid: 0 },
  'treble+8': { clef: 'treble+8', pitch: 4, mid: 0 },
  'treble-8': { clef: 'treble-8', pitch: 4, mid: 0 },
  'treble1': { clef: 'treble', pitch: 2, mid: 2 },
  'treble2': { clef: 'treble', pitch: 4, mid: 0 },
  'treble3': { clef: 'treble', pitch: 6, mid: -2 },
  'treble4': { clef: 'treble', pitch: 8, mid: -4 },
  'treble5': { clef: 'treble', pitch: 10, mid: -6 },
  'perc': { clef: 'perc', pitch: 6, mid: 0 },
  'none': { clef: 'none', mid: 0 },
  'bass': { clef: 'bass', pitch: 8, mid: -12 },
  'bass+8': { clef: 'bass+8', pitch: 8, mid: -12 },
  'bass-8': { clef: 'bass-8', pitch: 8, mid: -12 },
  'bass+16': { clef: 'bass', pitch: 8, mid: -12 },
  'bass-16': { clef: 'bass', pitch: 8, mid: -12 },
  'bass1': { clef: 'bass', pitch: 2, mid: -6 },
  'bass2': { clef: 'bass', pitch: 4, mid: -8 },
  'bass3': { clef: 'bass', pitch: 6, mid: -10 },
  'bass4': { clef: 'bass', pitch: 8, mid: -12 },
  'bass5': { clef: 'bass', pitch: 10, mid: -14 },
  'tenor': { clef: 'alto', pitch: 8, mid: -8 },
  'tenor1': { clef: 'alto', pitch: 2, mid: -2 },
  'tenor2': { clef: 'alto', pitch: 4, mid: -4 },
  'tenor3': { clef: 'alto', pitch: 6, mid: -6 },
  'tenor4': { clef: 'alto', pitch: 8, mid: -8 },
  'tenor5': { clef: 'alto', pitch: 10, mid: -10 },
  'alto': { clef: 'alto', pitch: 6, mid: -6 },
  'alto1': { clef: 'alto', pitch: 2, mid: -2 },
  'alto2': { clef: 'alto', pitch: 4, mid: -4 },
  'alto3': { clef: 'alto', pitch: 6, mid: -6 },
  'alto4': { clef: 'alto', pitch: 8, mid: -8 },
  'alto5': { clef: 'alto', pitch: 10, mid: -10 },
  'alto+8': { clef: 'alto+8', pitch: 6, mid: -6 },
  'alto-8': { clef: 'alto-8', pitch: 6, mid: -6 }
};

var calcMiddle = function(clef, oct) {
  var value = clefLines[clef];
  var mid = value ? value.mid : 0;
  return mid+oct;
};

exports.fixClef = function(clef) {
  var value = clefLines[clef.type];
  if (value) {
    clef.clefPos = value.pitch;
    clef.type = value.clef;
  }
};

exports.deepCopyKey = function(key) {
  var ret = { accidentals: [], root: key.root, acc: key.acc, mode: key.mode };
  Common.each(key.accidentals, function(k) {
    ret.accidentals.push(Common.clone(k));
  });
  return ret;
};

var pitches = {A: 5, B: 6, C: 0, D: 1, E: 2, F: 3, G: 4, a: 12, b: 13, c: 7, d: 8, e: 9, f: 10, g: 11};

exports.addPosToKey = function(clef, key) {
  // Shift the key signature from the treble positions to whatever position is needed for the clef.
  // This may put the key signature unnaturally high or low, so if it does, then shift it.
  var mid = clef.verticalPos;
  Common.each(key.accidentals, function(acc) {
    var pitch = pitches[acc.note];
    pitch = pitch - mid;
    acc.verticalPos = pitch;
  });
  if (key.impliedNaturals)
    Common.each(key.impliedNaturals, function(acc) {
      var pitch = pitches[acc.note];
      pitch = pitch - mid;
      acc.verticalPos = pitch;
    });

  if (mid < -10) {
    Common.each(key.accidentals, function(acc) {
      acc.verticalPos -= 7;
      if (acc.verticalPos >= 11 || (acc.verticalPos === 10 && acc.acc === 'flat'))
        acc.verticalPos -= 7;
      if (acc.note === 'A' && acc.acc === 'sharp' )
        acc.verticalPos -=7;
      if ((acc.note === 'G' || acc.note === 'F') && acc.acc === 'flat' )
        acc.verticalPos -=7;
    });
    if (key.impliedNaturals)
      Common.each(key.impliedNaturals, function(acc) {
        acc.verticalPos -= 7;
        if (acc.verticalPos >= 11 || (acc.verticalPos === 10 && acc.acc === 'flat'))
          acc.verticalPos -= 7;
        if (acc.note === 'A' && acc.acc === 'sharp' )
          acc.verticalPos -=7;
        if ((acc.note === 'G' || acc.note === 'F') && acc.acc === 'flat' )
          acc.verticalPos -=7;
      });
  } else if (mid < -4) {
    Common.each(key.accidentals, function(acc) {
      acc.verticalPos -= 7;
      if (mid === -8 && (acc.note === 'f' || acc.note === 'g') && acc.acc === 'sharp' )
        acc.verticalPos -=7;
    });
    if (key.impliedNaturals)
      Common.each(key.impliedNaturals, function(acc) {
        acc.verticalPos -= 7;
        if (mid === -8 && (acc.note === 'f' || acc.note === 'g') && acc.acc === 'sharp' )
          acc.verticalPos -=7;
      });
  } else if (mid >= 7) {
    Common.each(key.accidentals, function(acc) {
      acc.verticalPos += 7;
    });
    if (key.impliedNaturals)
      Common.each(key.impliedNaturals, function(acc) {
        acc.verticalPos += 7;
      });
  }
};

exports.fixKey = function(clef, key) {
  var fixedKey = Common.clone(key);
  exports.addPosToKey(clef, fixedKey);
  return fixedKey;
};

var parseMiddle = function(str) {
  var mid = pitches[str.charAt(0)];
  for (var i = 1; i < str.length; i++) {
    if (str.charAt(i) === ',') mid -= 7;
    else if (str.charAt(i) === ',') mid += 7;
    else break;
  }
  return { mid: mid - 6, str: str.substring(i) };	// We get the note in the middle of the staff. We want the note that appears as the first ledger line below the staff.
};

var normalizeAccidentals = function(accs) {
  for (var i = 0; i < accs.length; i++) {
    if (accs[i].note === 'b')
      accs[i].note = 'B';
    else if (accs[i].note === 'a')
      accs[i].note = 'A';
    else if (accs[i].note === 'F')
      accs[i].note = 'f';
    else if (accs[i].note === 'E')
      accs[i].note = 'e';
    else if (accs[i].note === 'D')
      accs[i].note = 'd';
    else if (accs[i].note === 'C')
      accs[i].note = 'c';
    else if (accs[i].note === 'G' && accs[i].acc === 'sharp')
      accs[i].note = 'g';
    else if (accs[i].note === 'g' && accs[i].acc === 'flat')
      accs[i].note = 'G';
  }
};

exports.parseKey = function(str)	// (and clef)
{
  // returns:
  //		{ foundClef: true, foundKey: true }
  // Side effects:
  //		calls warn() when there is a syntax error
  //		sets these members of multilineVars:
  //			clef
  //			key
  //			style
  //
  // The format is:
  // K: [⟨key⟩] [⟨modifiers⟩*]
  // modifiers are any of the following in any order:
  //  [⟨clef⟩] [middle=⟨pitch⟩] [transpose=[-]⟨number⟩] [stafflines=⟨number⟩] [staffscale=⟨number⟩][style=⟨style⟩]
  // key is none|HP|Hp|⟨specified_key⟩
  // clef is [clef=] [⟨clef type⟩] [⟨line number⟩] [+8|-8]
  // specified_key is ⟨pitch⟩[#|b][mode(first three chars are significant)][accidentals*]
  if (str.length === 0) {
    // an empty K: field is the same as K:none
    str = 'none';
  }
  var tokens = tokenizer.tokenize(str, 0, str.length);
  var ret = {};

  // first the key
  switch (tokens[0].token) {
    case 'HP':
      Directive.addDirective("bagpipes");
      multilineVars.key = { root: "HP", accidentals: [], acc: "", mode: "" };
      ret.foundKey = true;
      tokens.shift();
      break;
    case 'Hp':
      Directive.addDirective("bagpipes");
      multilineVars.key = { root: "Hp", accidentals: [{acc: 'natural', note: 'g'}, {acc: 'sharp', note: 'f'}, {acc: 'sharp', note: 'c'}], acc: "", mode: "" };
      ret.foundKey = true;
      tokens.shift();
      break;
    case 'none':
      // we got the none key - that's the same as C to us
      multilineVars.key = { root: "none", accidentals: [], acc: "", mode: "" };
      ret.foundKey = true;
      tokens.shift();
      break;
    default:
      var retPitch = tokenizer.getKeyPitch(tokens[0].token);
      if (retPitch.len > 0) {
        ret.foundKey = true;
        var acc = "";
        var mode = "";
        // The accidental and mode might be attached to the pitch, so we might want to just remove the first character.
        if (tokens[0].token.length > 1)
          tokens[0].token = tokens[0].token.substring(1);
        else
          tokens.shift();
        var key = retPitch.token;
        // We got a pitch to start with, so we might also have an accidental and a mode
        if (tokens.length > 0) {
          var retAcc = tokenizer.getSharpFlat(tokens[0].token);
          if (retAcc.len > 0) {
            if (tokens[0].token.length > 1)
              tokens[0].token = tokens[0].token.substring(1);
            else
              tokens.shift();
            key += retAcc.token;
            acc = retAcc.token;
          }
          if (tokens.length > 0) {
            var retMode = tokenizer.getMode(tokens[0].token);
            if (retMode.len > 0) {
              tokens.shift();
              key += retMode.token;
              mode = retMode.token;
            }
          }
          // Be sure that the key specified is in the list: not all keys are physically possible, like Cbmin.
          if (exports.standardKey(key) === undefined) {
            warn("Unsupported key signature: " + key, str, 0);
            return ret;
          }
        }
        // We need to do a deep copy because we are going to modify it
        var oldKey = exports.deepCopyKey(multilineVars.key);
        multilineVars.key = exports.deepCopyKey({accidentals: exports.standardKey(key)});
        multilineVars.key.root = retPitch.token;
        multilineVars.key.acc = acc;
        multilineVars.key.mode = mode;
        if (oldKey) {
          // Add natural in all places that the old key had an accidental.
          var kk;
          for (var k = 0; k < multilineVars.key.accidentals.length; k++) {
            for (kk = 0; kk < oldKey.accidentals.length; kk++) {
              if (oldKey.accidentals[kk].note && multilineVars.key.accidentals[k].note.toLowerCase() === oldKey.accidentals[kk].note.toLowerCase())
                oldKey.accidentals[kk].note = null;
            }
          }
          for (kk = 0; kk < oldKey.accidentals.length; kk++) {
            if (oldKey.accidentals[kk].note) {
              if (!multilineVars.key.impliedNaturals)
                multilineVars.key.impliedNaturals = [];
              multilineVars.key.impliedNaturals.push({ acc: 'natural', note: oldKey.accidentals[kk].note });
            }
          }
        }
      }
      break;
  }

  // There are two special cases of deprecated syntax. Ignore them if they occur
  if (tokens.length === 0) return ret;
  if (tokens[0].token === 'exp') tokens.shift();
  if (tokens.length === 0) return ret;
  if (tokens[0].token === 'oct') tokens.shift();

  // now see if there are extra accidentals
  if (tokens.length === 0) return ret;
  var accs = tokenizer.getKeyAccidentals2(tokens);
  if (accs.warn)
    warn(accs.warn, str, 0);
  // If we have extra accidentals, first replace ones that are of the same pitch before adding them to the end.
  if (accs.accs) {
    if (!ret.foundKey) {		// if there are only extra accidentals, make sure this is set.
      ret.foundKey = true;
      multilineVars.key = { root: "none", acc: "", mode: "", accidentals: [] };
    }
    normalizeAccidentals(accs.accs);
    for (var i = 0; i < accs.accs.length; i++) {
      var found = false;
      for (var j = 0; j < multilineVars.key.accidentals.length && !found; j++) {
        if (multilineVars.key.accidentals[j].note === accs.accs[i].note) {
          found = true;
          multilineVars.key.accidentals[j].acc = accs.accs[i].acc;
        }
      }
      if (!found) {
        multilineVars.key.accidentals.push(accs.accs[i]);
        if (multilineVars.key.impliedNaturals) {
          for (var kkk = 0; kkk < multilineVars.key.impliedNaturals.length; kkk++) {
            if (multilineVars.key.impliedNaturals[kkk].note === accs.accs[i].note)
              multilineVars.key.impliedNaturals.splice(kkk, 1);
          }
        }
      }
    }
  }

  // Now see if any optional parameters are present. They have the form "key=value", except that "clef=" is optional
  var token;
  while (tokens.length > 0) {
    switch (tokens[0].token) {
      case "m":
      case "middle":
        tokens.shift();
        if (tokens.length === 0) { warn("Expected = after middle", str, 0); return ret; }
        token = tokens.shift();
        if (token.token !== "=") { warn("Expected = after middle", str, token.start); break; }
        if (tokens.length === 0) { warn("Expected parameter after middle=", str, 0); return ret; }
        var pitch = tokenizer.getPitchFromTokens(tokens);
        if (pitch.warn)
          warn(pitch.warn, str, 0);
        if (pitch.position)
          multilineVars.clef.verticalPos = pitch.position - 6;	// we get the position from the middle line, but want to offset it to the first ledger line.
        break;
      case "transpose":
        tokens.shift();
        if (tokens.length === 0) { warn("Expected = after transpose", str, 0); return ret; }
        token = tokens.shift();
        if (token.token !== "=") { warn("Expected = after transpose", str, token.start); break; }
        if (tokens.length === 0) { warn("Expected parameter after transpose=", str, 0); return ret; }
        if (tokens[0].type !== 'number') { warn("Expected number after transpose", str, tokens[0].start); break; }
        multilineVars.clef.transpose = tokens[0].intt;
        tokens.shift();
        break;
      case "stafflines":
        tokens.shift();
        if (tokens.length === 0) { warn("Expected = after stafflines", str, 0); return ret; }
        token = tokens.shift();
        if (token.token !== "=") { warn("Expected = after stafflines", str, token.start); break; }
        if (tokens.length === 0) { warn("Expected parameter after stafflines=", str, 0); return ret; }
        if (tokens[0].type !== 'number') { warn("Expected number after stafflines", str, tokens[0].start); break; }
        multilineVars.clef.stafflines = tokens[0].intt;
        tokens.shift();
        break;
      case "staffscale":
        tokens.shift();
        if (tokens.length === 0) { warn("Expected = after staffscale", str, 0); return ret; }
        token = tokens.shift();
        if (token.token !== "=") { warn("Expected = after staffscale", str, token.start); break; }
        if (tokens.length === 0) { warn("Expected parameter after staffscale=", str, 0); return ret; }
        if (tokens[0].type !== 'number') { warn("Expected number after staffscale", str, tokens[0].start); break; }
        multilineVars.clef.staffscale = tokens[0].floatt;
        tokens.shift();
        break;
      case "style":
        tokens.shift();
        if (tokens.length === 0) { warn("Expected = after style", str, 0); return ret; }
        token = tokens.shift();
        if (token.token !== "=") { warn("Expected = after style", str, token.start); break; }
        if (tokens.length === 0) { warn("Expected parameter after style=", str, 0); return ret; }
        switch (tokens[0].token) {
          case "normal":
          case "harmonic":
          case "rhythm":
          case "x":
            multilineVars.style = tokens[0].token;
            tokens.shift();
            break;
          default:
            warn("error parsing style element: " + tokens[0].token, str, tokens[0].start);
            break;
        }
        break;
      case "clef":
        tokens.shift();
        if (tokens.length === 0) { warn("Expected = after clef", str, 0); return ret; }
        token = tokens.shift();
        if (token.token !== "=") { warn("Expected = after clef", str, token.start); break; }
        if (tokens.length === 0) { warn("Expected parameter after clef=", str, 0); return ret; }
      //break; yes, we want to fall through. That allows "clef=" to be optional.
      case "treble":
      case "bass":
      case "alto":
      case "tenor":
      case "perc":
        // clef is [clef=] [⟨clef type⟩] [⟨line number⟩] [+8|-8]
        var clef = tokens.shift();
        switch (clef.token) {
          case 'treble':
          case 'tenor':
          case 'alto':
          case 'bass':
          case 'perc':
          case 'none':
            break;
          case 'C': clef.token = 'alto'; break;
          case 'F': clef.token = 'bass'; break;
          case 'G': clef.token = 'treble'; break;
          case 'c': clef.token = 'alto'; break;
          case 'f': clef.token = 'bass'; break;
          case 'g': clef.token = 'treble'; break;
          default:
            warn("Expected clef name. Found " + clef.token, str, clef.start);
            break;
        }
        if (tokens.length > 0 && tokens[0].type === 'number') {
          clef.token += tokens[0].token;
          tokens.shift();
        }
        if (tokens.length > 1 && (tokens[0].token === '-' || tokens[0].token === '+') && tokens[1].token === '8') {
          clef.token += tokens[0].token + tokens[1].token;
          tokens.shift();
          tokens.shift();
        }
        multilineVars.clef = {type: clef.token, verticalPos: calcMiddle(clef.token, 0)};
        ret.foundClef = true;
        break;
      default:
        warn("Unknown parameter: " + tokens[0].token, str, tokens[0].start);
        tokens.shift();
    }
  }
  return ret;
};

var setCurrentVoice = function(id) {
  multilineVars.currentVoice = multilineVars.voices[id];
  tune.setCurrentVoice(multilineVars.currentVoice.staffNum, multilineVars.currentVoice.index);
};

exports.parseVoice = function(line, i, e) {
  //First truncate the string to the first non-space character after V: through either the
  //end of the line or a % character. Then remove trailing spaces, too.
  var ret = tokenizer.getMeat(line, i, e);
  var start = ret.start;
  var end = ret.end;
  //The first thing on the line is the ID. It can be any non-space string and terminates at the
  //first space.
  var id = tokenizer.getToken(line, start, end);
  if (id.length === 0) {
    warn("Expected a voice id", line, start);
    return;
  }
  var isNew = false;
  if (multilineVars.voices[id] === undefined) {
    multilineVars.voices[id] = {};
    isNew = true;
    if (multilineVars.score_is_present)
      warn("Can't have an unknown V: id when the %score directive is present", line, start);
  }
  start += id.length;
  start += tokenizer.eatWhiteSpace(line, start);

  var staffInfo = {startStaff: isNew};
  var addNextTokenToStaffInfo = function(name) {
    var attr = tokenizer.getVoiceToken(line, start, end);
    if (attr.warn !== undefined)
      warn("Expected value for " + name + " in voice: " + attr.warn, line, start);
    else if (attr.token.length === 0 && line.charAt(start) !== '"')
      warn("Expected value for " + name + " in voice", line, start);
    else
      staffInfo[name] = attr.token;
    start += attr.len;
  };
  var addNextTokenToVoiceInfo = function(id, name, type) {
    var attr = tokenizer.getVoiceToken(line, start, end);
    if (attr.warn !== undefined)
      warn("Expected value for " + name + " in voice: " + attr.warn, line, start);
    else if (attr.token.length === 0 && line.charAt(start) !== '"')
      warn("Expected value for " + name + " in voice", line, start);
    else {
      if (type === 'number')
        attr.token = parseFloat(attr.token);
      multilineVars.voices[id][name] = attr.token;
    }
    start += attr.len;
  };

  //Then the following items can occur in any order:
  while (start < end) {
    var token = tokenizer.getVoiceToken(line, start, end);
    start += token.len;

    if (token.warn) {
      warn("Error parsing voice: " + token.warn, line, start);
    } else {
      var attr = null;
      switch (token.token) {
        case 'clef':
        case 'cl':
          addNextTokenToStaffInfo('clef');
          // TODO-PER: check for a legal clef; do octavizing
          var oct = 0;
          //							for (var ii = 0; ii < staffInfo.clef.length; ii++) {
          //								if (staffInfo.clef[ii] === ',') oct -= 7;
          //								else if (staffInfo.clef[ii] === "'") oct += 7;
          //							}
          if (staffInfo.clef !== undefined) {
            staffInfo.clef = staffInfo.clef.replace(/[',]/g, ""); //'//comment for emacs formatting of regexp
            if (staffInfo.clef.indexOf('+16') !== -1) {
              oct += 14;
              staffInfo.clef = staffInfo.clef.replace('+16', '');
            }
            staffInfo.verticalPos = calcMiddle(staffInfo.clef, oct);
          }
          break;
        case 'treble':
        case 'bass':
        case 'tenor':
        case 'alto':
        case 'none':
        case 'treble\'':
        case 'bass\'':
        case 'tenor\'':
        case 'alto\'':
        case 'none\'':
        case 'treble\'\'':
        case 'bass\'\'':
        case 'tenor\'\'':
        case 'alto\'\'':
        case 'none\'\'':
        case 'treble,':
        case 'bass,':
        case 'tenor,':
        case 'alto,':
        case 'none,':
        case 'treble,,':
        case 'bass,,':
        case 'tenor,,':
        case 'alto,,':
        case 'none,,':
          // TODO-PER: handle the octave indicators on the clef by changing the middle property
          var oct2 = 0;
          //							for (var iii = 0; iii < token.token.length; iii++) {
          //								if (token.token[iii] === ',') oct2 -= 7;
          //								else if (token.token[iii] === "'") oct2 += 7;
          //							}
          staffInfo.clef = token.token.replace(/[',]/g, ""); //'//comment for emacs formatting of regexp
          staffInfo.verticalPos = calcMiddle(staffInfo.clef, oct2);
          break;
        case 'staves':
        case 'stave':
        case 'stv':
          addNextTokenToStaffInfo('staves');
          break;
        case 'brace':
        case 'brc':
          addNextTokenToStaffInfo('brace');
          break;
        case 'bracket':
        case 'brk':
          addNextTokenToStaffInfo('bracket');
          break;
        case 'name':
        case 'nm':
          addNextTokenToStaffInfo('name');
          break;
        case 'subname':
        case 'sname':
        case 'snm':
          addNextTokenToStaffInfo('subname');
          break;
        case 'merge':
          staffInfo.startStaff = false;
          break;
        case 'stems':
          attr = tokenizer.getVoiceToken(line, start, end);
          if (attr.warn !== undefined)
            warn("Expected value for stems in voice: " + attr.warn, line, start);
          else if (attr.token === 'up' || attr.token === 'down')
            multilineVars.voices[id].stem = attr.token;
          else
            warn("Expected up or down for voice stem", line, start);
          start += attr.len;
          break;
        case 'up':
        case 'down':
          multilineVars.voices[id].stem = token.token;
          break;
        case 'middle':
        case 'm':
          addNextTokenToStaffInfo('verticalPos');
          staffInfo.verticalPos = parseMiddle(staffInfo.verticalPos).mid;
          break;
        case 'gchords':
        case 'gch':
          multilineVars.voices[id].suppressChords = true;
          break;
        case 'space':
        case 'spc':
          addNextTokenToStaffInfo('spacing');
          break;
        case 'scale':
          addNextTokenToVoiceInfo(id, 'scale', 'number');
          break;
        case 'transpose':
          addNextTokenToVoiceInfo(id, 'transpose', 'number');
          break;
      }
    }
    start += tokenizer.eatWhiteSpace(line, start);
  }

  // now we've filled up staffInfo, figure out what to do with this voice
  // TODO-PER: It is unclear from the standard and the examples what to do with brace, bracket, and staves, so they are ignored for now.
  if (staffInfo.startStaff || multilineVars.staves.length === 0) {
    multilineVars.staves.push({index: multilineVars.staves.length, meter: multilineVars.origMeter});
    if (!multilineVars.score_is_present)
      multilineVars.staves[multilineVars.staves.length-1].numVoices = 0;
  }
  if (multilineVars.voices[id].staffNum === undefined) {
    // store where to write this for quick access later.
    multilineVars.voices[id].staffNum = multilineVars.staves.length-1;
    var vi = 0;
    for(var v in multilineVars.voices) {
      if(multilineVars.voices.hasOwnProperty(v)) {
        if (multilineVars.voices[v].staffNum === multilineVars.voices[id].staffNum)
          vi++;
      }
    }
    multilineVars.voices[id].index = vi-1;
  }
  var s = multilineVars.staves[multilineVars.voices[id].staffNum];
  if (!multilineVars.score_is_present)
    s.numVoices++;
  if (staffInfo.clef) s.clef = {type: staffInfo.clef, verticalPos: staffInfo.verticalPos};
  if (staffInfo.spacing) s.spacing_below_offset = staffInfo.spacing;
  if (staffInfo.verticalPos) s.verticalPos = staffInfo.verticalPos;

  if (staffInfo.name) {if (s.name) s.name.push(staffInfo.name); else s.name = [ staffInfo.name ];}
  if (staffInfo.subname) {if (s.subname) s.subname.push(staffInfo.subname); else s.subname = [ staffInfo.subname ];}

  setCurrentVoice(id);
};
},{"./Common":6,"./Directive":7}],10:[function(require,module,exports){
var Common = require('./Common');

module.exports = function() {
  this.skipWhiteSpace = function(str) {
    for (var i = 0; i < str.length; i++) {
      if (!this.isWhiteSpace(str.charAt(i)))
        return i;
    }
    return str.length;	// It must have been all white space
  };
  var finished = function(str, i) {
    return i >= str.length;
  };
  this.eatWhiteSpace = function(line, index) {
    for (var i = index; i < line.length; i++) {
      if (!this.isWhiteSpace(line.charAt(i)))
        return i-index;
    }
    return i-index;
  };

  // This just gets the basic pitch letter, ignoring leading spaces, and normalizing it to a capital
  this.getKeyPitch = function(str) {
    var i = this.skipWhiteSpace(str);
    if (finished(str, i))
      return {len: 0};
    switch (str.charAt(i)) {
      case 'A':return {len: i+1, token: 'A'};
      case 'B':return {len: i+1, token: 'B'};
      case 'C':return {len: i+1, token: 'C'};
      case 'D':return {len: i+1, token: 'D'};
      case 'E':return {len: i+1, token: 'E'};
      case 'F':return {len: i+1, token: 'F'};
      case 'G':return {len: i+1, token: 'G'};
//			case 'a':return {len: i+1, token: 'A'};
//			case 'b':return {len: i+1, token: 'B'};
//			case 'c':return {len: i+1, token: 'C'};
//			case 'd':return {len: i+1, token: 'D'};
//			case 'e':return {len: i+1, token: 'E'};
//			case 'f':return {len: i+1, token: 'F'};
//			case 'g':return {len: i+1, token: 'G'};
    }
    return {len: 0};
  };

  // This just gets the basic accidental, ignoring leading spaces, and only the ones that appear in a key
  this.getSharpFlat = function(str) {
    if (str === 'bass')
      return {len: 0};
    switch (str.charAt(0)) {
      case '#':return {len: 1, token: '#'};
      case 'b':return {len: 1, token: 'b'};
    }
    return {len: 0};
  };

  this.getMode = function(str) {
    var skipAlpha = function(str, start) {
      // This returns the index of the next non-alphabetic char, or the entire length of the string if not found.
      while (start < str.length && ((str.charAt(start) >= 'a' && str.charAt(start) <= 'z') || (str.charAt(start) >= 'A' && str.charAt(start) <= 'Z')))
        start++;
      return start;
    };

    var i = this.skipWhiteSpace(str);
    if (finished(str, i))
      return {len: 0};
    var firstThree = str.substring(i,i+3).toLowerCase();
    if (firstThree.length > 1 && firstThree.charAt(1) === ' ' || firstThree.charAt(1) === '^' || firstThree.charAt(1) === '_' || firstThree.charAt(1) === '=') firstThree = firstThree.charAt(0);	// This will handle the case of 'm'
    switch (firstThree) {
      case 'mix':return {len: skipAlpha(str, i), token: 'Mix'};
      case 'dor':return {len: skipAlpha(str, i), token: 'Dor'};
      case 'phr':return {len: skipAlpha(str, i), token: 'Phr'};
      case 'lyd':return {len: skipAlpha(str, i), token: 'Lyd'};
      case 'loc':return {len: skipAlpha(str, i), token: 'Loc'};
      case 'aeo':return {len: skipAlpha(str, i), token: 'm'};
      case 'maj':return {len: skipAlpha(str, i), token: ''};
      case 'ion':return {len: skipAlpha(str, i), token: ''};
      case 'min':return {len: skipAlpha(str, i), token: 'm'};
      case 'm':return {len: skipAlpha(str, i), token: 'm'};
    }
    return {len: 0};
  };

  this.getClef = function(str, bExplicitOnly) {
    var strOrig = str;
    var i = this.skipWhiteSpace(str);
    if (finished(str, i))
      return {len: 0};
    // The word 'clef' is optional, but if it appears, a clef MUST appear
    var needsClef = false;
    var strClef = str.substring(i);
    if (Common.startsWith(strClef, 'clef=')) {
      needsClef = true;
      strClef = strClef.substring(5);
      i += 5;
    }
    if (strClef.length === 0 && needsClef)
      return {len: i+5, warn: "No clef specified: " + strOrig};

    var j = this.skipWhiteSpace(strClef);
    if (finished(strClef, j))
      return {len: 0};
    if (j > 0) {
      i += j;
      strClef = strClef.substring(j);
    }
    var name = null;
    if (Common.startsWith(strClef, 'treble'))
      name = 'treble';
    else if (Common.startsWith(strClef, 'bass3'))
      name = 'bass3';
    else if (Common.startsWith(strClef, 'bass'))
      name = 'bass';
    else if (Common.startsWith(strClef, 'tenor'))
      name = 'tenor';
    else if (Common.startsWith(strClef, 'alto2'))
      name = 'alto2';
    else if (Common.startsWith(strClef, 'alto1'))
      name = 'alto1';
    else if (Common.startsWith(strClef, 'alto'))
      name = 'alto';
    else if (!bExplicitOnly && (needsClef && Common.startsWith(strClef, 'none')))
      name = 'none';
    else if (Common.startsWith(strClef, 'perc'))
      name = 'perc';
    else if (!bExplicitOnly && (needsClef && Common.startsWith(strClef, 'C')))
      name = 'tenor';
    else if (!bExplicitOnly && (needsClef && Common.startsWith(strClef, 'F')))
      name = 'bass';
    else if (!bExplicitOnly && (needsClef && Common.startsWith(strClef, 'G')))
      name = 'treble';
    else
      return {len: i+5, warn: "Unknown clef specified: " + strOrig};

    strClef = strClef.substring(name.length);
    j = this.isMatch(strClef, '+8');
    if (j > 0)
      name += "+8";
    else {
      j = this.isMatch(strClef, '-8');
      if (j > 0)
        name += "-8";
    }
    return {len: i+name.length, token: name, explicit: needsClef};
  };

  // This returns one of the legal bar lines
  // This is called alot and there is no obvious tokenable items, so this is broken apart.
  this.getBarLine = function(line, i) {
    switch (line.charAt(i)) {
      case ']':
        ++i;
        switch (line.charAt(i)) {
          case '|': return {len: 2, token: "bar_thick_thin"};
          case '[':
            ++i;
            if ((line.charAt(i) >= '1' && line.charAt(i) <= '9') || line.charAt(i) === '"')
              return {len: 2, token: "bar_invisible"};
            return {len: 1, warn: "Unknown bar symbol"};
          default:
            return {len: 1, token: "bar_invisible"};
        }
        break;
      case ':':
        ++i;
        switch (line.charAt(i)) {
          case ':': return {len: 2, token: "bar_dbl_repeat"};
          case '|':	// :|
            ++i;
            switch (line.charAt(i)) {
              case ']':	// :|]
                ++i;
                switch (line.charAt(i)) {
                  case '|':	// :|]|
                    ++i;
                    if (line.charAt(i) === ':')  return {len: 5, token: "bar_dbl_repeat"};
                    return {len: 3, token: "bar_right_repeat"};
                  default:
                    return {len: 3, token: "bar_right_repeat"};
                }
                break;
              case '|':	// :||
                ++i;
                if (line.charAt(i) === ':')  return {len: 4, token: "bar_dbl_repeat"};
                return {len: 3, token: "bar_right_repeat"};
              default:
                return {len: 2, token: "bar_right_repeat"};
            }
            break;
          default:
            return {len: 1, warn: "Unknown bar symbol"};
        }
        break;
      case '[':	// [
        ++i;
        if (line.charAt(i) === '|') {	// [|
          ++i;
          switch (line.charAt(i)) {
            case ':': return {len: 3, token: "bar_left_repeat"};
            case ']': return {len: 3, token: "bar_invisible"};
            default: return {len: 2, token: "bar_thick_thin"};
          }
        } else {
          if ((line.charAt(i) >= '1' && line.charAt(i) <= '9') || line.charAt(i) === '"')
            return {len: 1, token: "bar_invisible"};
          return {len: 0};
        }
        break;
      case '|':	// |
        ++i;
        switch (line.charAt(i)) {
          case ']': return {len: 2, token: "bar_thin_thick"};
          case '|': // ||
            ++i;
            if (line.charAt(i) === ':') return {len: 3, token: "bar_left_repeat"};
            return {len: 2, token: "bar_thin_thin"};
          case ':':	// |:
            var colons = 0;
            while (line.charAt(i+colons) === ':') colons++;
            return { len: 1+colons, token: "bar_left_repeat"};
          default: return {len: 1, token: "bar_thin"};
        }
        break;
    }
    return {len: 0};
  };

  // this returns all the characters in the string that match one of the characters in the legalChars string
  this.getTokenOf = function(str, legalChars) {
    for (var i = 0; i < str.length; i++) {
      if (legalChars.indexOf(str.charAt(i)) < 0)
        return {len: i, token: str.substring(0, i)};
    }
    return {len: i, token: str};
  };

  this.getToken = function(str, start, end) {
    // This returns the next set of chars that doesn't contain spaces
    var i = start;
    while (i < end && !this.isWhiteSpace(str.charAt(i)))
      i++;
    return str.substring(start, i);
  };

  // This just sees if the next token is the word passed in, with possible leading spaces
  this.isMatch = function(str, match) {
    var i = this.skipWhiteSpace(str);
    if (finished(str, i))
      return 0;
    if (Common.startsWith(str.substring(i), match))
      return i+match.length;
    return 0;
  };

  this.getPitchFromTokens = function(tokens) {
    var ret = { };
    var pitches = {A: 5, B: 6, C: 0, D: 1, E: 2, F: 3, G: 4, a: 12, b: 13, c: 7, d: 8, e: 9, f: 10, g: 11};
    ret.position = pitches[tokens[0].token];
    if (ret.position === undefined)
      return { warn: "Pitch expected. Found: " + tokens[0].token };
    tokens.shift();
    while (tokens.length) {
      switch (tokens[0].token) {
        case ',': ret.position -= 7; tokens.shift(); break;
        case '\'': ret.position += 7; tokens.shift(); break;
        default: return ret;
      }
    }
    return ret;
  };

  this.getKeyAccidentals2 = function(tokens) {
    var accs;
    // find and strip off all accidentals in the token list
    while (tokens.length > 0) {
      var acc;
      if (tokens[0].token === '^') {
        acc = 'sharp';
        tokens.shift();
        if (tokens.length === 0) return {accs: accs, warn: 'Expected note name after ' + acc};
        switch (tokens[0].token) {
          case '^': acc = 'dblsharp'; tokens.shift(); break;
          case '/': acc = 'quartersharp'; tokens.shift(); break;
        }
      } else if (tokens[0].token === '=') {
        acc = 'natural';
        tokens.shift();
      } else if (tokens[0].token === '_') {
        acc = 'flat';
        tokens.shift();
        if (tokens.length === 0) return {accs: accs, warn: 'Expected note name after ' + acc};
        switch (tokens[0].token) {
          case '_': acc = 'dblflat'; tokens.shift(); break;
          case '/': acc = 'quarterflat'; tokens.shift(); break;
        }
      } else {
        // Not an accidental, we'll assume that a later parse will recognize it.
        return { accs: accs };
      }
      if (tokens.length === 0) return {accs: accs, warn: 'Expected note name after ' + acc};
      switch (tokens[0].token.charAt(0))
      {
        case 'a':
        case 'b':
        case 'c':
        case 'd':
        case 'e':
        case 'f':
        case 'g':
        case 'A':
        case 'B':
        case 'C':
        case 'D':
        case 'E':
        case 'F':
        case 'G':
          if (accs === undefined)
            accs = [];
          accs.push({ acc: acc, note: tokens[0].token.charAt(0) });
          if (tokens[0].token.length === 1)
            tokens.shift();
          else
            tokens[0].token = tokens[0].token.substring(1);
          break;
        default:
          return {accs: accs, warn: 'Expected note name after ' + acc + ' Found: ' + tokens[0].token };
      }
    }
    return { accs: accs };
  };

  // This gets an accidental marking for the key signature. It has the accidental then the pitch letter.
  this.getKeyAccidental = function(str) {
    var accTranslation = {
      '^': 'sharp',
      '^^': 'dblsharp',
      '=': 'natural',
      '_': 'flat',
      '__': 'dblflat',
      '_/': 'quarterflat',
      '^/': 'quartersharp'
    };
    var i = this.skipWhiteSpace(str);
    if (finished(str, i))
      return {len: 0};
    var acc = null;
    switch (str.charAt(i))
    {
      case '^':
      case '_':
      case '=':
        acc = str.charAt(i);
        break;
      default:return {len: 0};
    }
    i++;
    if (finished(str, i))
      return {len: 1, warn: 'Expected note name after accidental'};
    switch (str.charAt(i))
    {
      case 'a':
      case 'b':
      case 'c':
      case 'd':
      case 'e':
      case 'f':
      case 'g':
      case 'A':
      case 'B':
      case 'C':
      case 'D':
      case 'E':
      case 'F':
      case 'G':
        return {len: i+1, token: {acc: accTranslation[acc], note: str.charAt(i)}};
      case '^':
      case '_':
      case '/':
        acc += str.charAt(i);
        i++;
        if (finished(str, i))
          return {len: 2, warn: 'Expected note name after accidental'};
        switch (str.charAt(i))
        {
          case 'a':
          case 'b':
          case 'c':
          case 'd':
          case 'e':
          case 'f':
          case 'g':
          case 'A':
          case 'B':
          case 'C':
          case 'D':
          case 'E':
          case 'F':
          case 'G':
            return {len: i+1, token: {acc: accTranslation[acc], note: str.charAt(i)}};
          default:
            return {len: 2, warn: 'Expected note name after accidental'};
        }
        break;
      default:
        return {len: 1, warn: 'Expected note name after accidental'};
    }
  };

  this.isWhiteSpace = function(ch) {
    return ch === ' ' || ch === '\t' || ch === '\x12';
  };

  this.getMeat = function(line, start, end) {
    // This removes any comments starting with '%' and trims the ends of the string so that there are no leading or trailing spaces.
    // it returns just the start and end characters that contain the meat.
    var comment = line.indexOf('%', start);
    if (comment >= 0 && comment < end)
      end = comment;
    while (start < end && (line.charAt(start) === ' ' || line.charAt(start) === '\t' || line.charAt(start) === '\x12'))
      start++;
    while (start < end && (line.charAt(end-1) === ' ' || line.charAt(end-1) === '\t' || line.charAt(end-1) === '\x12'))
      end--;
    return {start: start, end: end};
  };

  var isLetter = function(ch) {
    return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z');
  };

  var isNumber = function(ch) {
    return (ch >= '0' && ch <= '9');
  };

  this.tokenize = function(line, start, end) {
    // this returns all the tokens inside the passed string. A token is a punctuation mark, a string of digits, a string of letters.
    //  Quoted strings are one token.
    //  If there is a minus sign next to a number, then it is included in the number.
    // If there is a period immediately after a number, with a number immediately following, then a float is returned.
    // The type of token is returned: quote, alpha, number, punct
    var ret = this.getMeat(line, start, end);
    start = ret.start;
    end = ret.end;
    var tokens = [];
    var i;
    while (start < end) {
      if (line.charAt(start) === '"') {
        i = start+1;
        while (i < end && line.charAt(i) !== '"') i++;
        tokens.push({ type: 'quote', token: line.substring(start+1, i), start: start+1, end: i});
        i++;
      } else if (isLetter(line.charAt(start))) {
        i = start+1;
        while (i < end && isLetter(line.charAt(i))) i++;
        tokens.push({ type: 'alpha', token: line.substring(start, i), continueId: isNumber(line.charAt(i)), start: start, end: i});
        start = i + 1;
      } else if (line.charAt(start) === '.' && isNumber(line.charAt(i+1))) {
        i = start+1;
        var int2 = null;
        var float2 = null;
        while (i < end && isNumber(line.charAt(i))) i++;

        float2 = parseFloat(line.substring(start, i));
        tokens.push({ type: 'number', token: line.substring(start, i), intt: int2, floatt: float2, continueId: isLetter(line.charAt(i)), start: start, end: i});
        start = i + 1;
      } else if (isNumber(line.charAt(start)) || (line.charAt(start) === '-' && isNumber(line.charAt(i+1)))) {
        i = start+1;
        var intt = null;
        var floatt = null;
        while (i < end && isNumber(line.charAt(i))) i++;
        if (line.charAt(i) === '.' && isNumber(line.charAt(i+1))) {
          i++;
          while (i < end && isNumber(line.charAt(i))) i++;
        } else
          intt = parseInt(line.substring(start, i));

        floatt = parseFloat(line.substring(start, i));
        tokens.push({ type: 'number', token: line.substring(start, i), intt: intt, floatt: floatt, continueId: isLetter(line.charAt(i)), start: start, end: i});
        start = i + 1;
      } else if (line.charAt(start) === ' ' || line.charAt(start) === '\t') {
        i = start+1;
      } else {
        tokens.push({ type: 'punct', token: line.charAt(start), start: start, end: start+1});
        i = start+1;
      }
      start = i;
    }
    return tokens;
  };

  this.getVoiceToken = function(line, start, end) {
    // This finds the next token. A token is delimited by a space or an equal sign. If it starts with a quote, then the portion between the quotes is returned.
    var i = start;
    while (i < end && this.isWhiteSpace(line.charAt(i)) || line.charAt(i) === '=')
      i++;

    if (line.charAt(i) === '"') {
      var close = line.indexOf('"', i+1);
      if (close === -1 || close >= end)
        return {len: 1, err: "Missing close quote"};
      return {len: close-start+1, token: this.translateString(line.substring(i+1, close))};
    } else {
      var ii = i;
      while (ii < end && !this.isWhiteSpace(line.charAt(ii)) && line.charAt(ii) !== '=')
        ii++;
      return {len: ii-start+1, token: line.substring(i, ii)};
    }
  };

  var charMap = {
    "`a": 'à', "'a": "á", "^a": "â", "~a": "ã", "\"a": "ä", "oa": "å", "=a": "ā", "ua": "ă", ";a": "ą",
    "`e": 'è', "'e": "é", "^e": "ê", "\"e": "ë", "=e": "ē", "ue": "ĕ", ";e": "ę", ".e": "ė",
    "`i": 'ì', "'i": "í", "^i": "î", "\"i": "ï", "=i": "ī", "ui": "ĭ", ";i": "į",
    "`o": 'ò', "'o": "ó", "^o": "ô", "~o": "õ", "\"o": "ö", "=o": "ō", "uo": "ŏ", "/o": "ø",
    "`u": 'ù', "'u": "ú", "^u": "û", "~u": "ũ", "\"u": "ü", "ou": "ů", "=u": "ū", "uu": "ŭ", ";u": "ų",
    "`A": 'À', "'A": "Á", "^A": "Â", "~A": "Ã", "\"A": "Ä", "oA": "Å", "=A": "Ā", "uA": "Ă", ";A": "Ą",
    "`E": 'È', "'E": "É", "^E": "Ê", "\"E": "Ë", "=E": "Ē", "uE": "Ĕ", ";E": "Ę", ".E": "Ė",
    "`I": 'Ì', "'I": "Í", "^I": "Î", "~I": "Ĩ", "\"I": "Ï", "=I": "Ī", "uI": "Ĭ", ";I": "Į", ".I": "İ",
    "`O": 'Ò', "'O": "Ó", "^O": "Ô", "~O": "Õ", "\"O": "Ö", "=O": "Ō", "uO": "Ŏ", "/O": "Ø",
    "`U": 'Ù', "'U": "Ú", "^U": "Û", "~U": "Ũ", "\"U": "Ü", "oU": "Ů", "=U": "Ū", "uU": "Ŭ", ";U": "Ų",
    "ae": "æ", "AE": "Æ", "oe": "œ", "OE": "Œ", "ss": "ß",
    "'c": "ć", "^c": "ĉ", "uc": "č", "cc": "ç", ".c": "ċ", "cC": "Ç", "'C": "Ć", "^C": "Ĉ", "uC": "Č", ".C": "Ċ",
    "~n": "ñ",
    "=s": "š", "vs": "š",
    "vz": 'ž'

// More chars: Ñ Ĳ ĳ Ď ď Đ đ Ĝ ĝ Ğ ğ Ġ ġ Ģ ģ Ĥ ĥ Ħ ħ Ĵ ĵ Ķ ķ ĸ Ĺ ĺ Ļ ļ Ľ ľ Ŀ ŀ Ł ł Ń ń Ņ ņ Ň ň ŉ Ŋ ŋ   Ŕ ŕ Ŗ ŗ Ř ř Ś ś Ŝ ŝ Ş ş Š Ţ ţ Ť ť Ŧ ŧ Ŵ ŵ Ŷ ŷ Ÿ ÿ Ÿ Ź ź Ż ż Ž
  };
  var charMap1 = {
    "#": "♯",
    "b": "♭",
    "=": "♮"
  };
  var charMap2 = {
    "201": "♯",
    "202": "♭",
    "203": "♮",
    "241": "¡",
    "242": "¢", "252": "a", "262": "2", "272": "o", "302": "Â", "312": "Ê", "322": "Ò", "332": "Ú", "342": "â", "352": "ê", "362": "ò", "372": "ú",
    "243": "£", "253": "«", "263": "3", "273": "»", "303": "Ã", "313": "Ë", "323": "Ó", "333": "Û", "343": "ã", "353": "ë", "363": "ó", "373": "û",
    "244": "¤", "254": "¬", "264": "  ́", "274": "1⁄4", "304": "Ä", "314": "Ì", "324": "Ô", "334": "Ü", "344": "ä", "354": "ì", "364": "ô", "374": "ü",
    "245": "¥", "255": "-", "265": "μ", "275": "1⁄2", "305": "Å", "315": "Í", "325": "Õ", "335": "Ý",  "345": "å", "355": "í", "365": "õ", "375": "ý",
    "246": "¦", "256": "®", "266": "¶", "276": "3⁄4", "306": "Æ", "316": "Î", "326": "Ö", "336": "Þ", "346": "æ", "356": "î", "366": "ö", "376": "þ",
    "247": "§", "257": " ̄", "267": "·", "277": "¿", "307": "Ç", "317": "Ï", "327": "×", "337": "ß", "347": "ç", "357": "ï", "367": "÷", "377": "ÿ",
    "250": " ̈", "260": "°", "270": " ̧", "300": "À", "310": "È", "320": "Ð", "330": "Ø", "340": "à", "350": "è", "360": "ð", "370": "ø",
    "251": "©", "261": "±", "271": "1", "301": "Á", "311": "É", "321": "Ñ", "331": "Ù", "341": "á", "351": "é", "361": "ñ", "371": "ù" };
  this.translateString = function(str) {
    var arr = str.split('\\');
    if (arr.length === 1) return str;
    var out = null;
    Common.each(arr, function(s) {
      if (out === null)
        out = s;
      else {
        var c = charMap[s.substring(0, 2)];
        if (c !== undefined)
          out += c + s.substring(2);
        else {
          c = charMap2[s.substring(0, 3)];
          if (c !== undefined)
            out += c + s.substring(3);
          else {
            c = charMap1[s.substring(0, 1)];
            if (c !== undefined)
              out += c + s.substring(1);
            else
              out += "\\" + s;
          }
        }
      }
    });
    return out;
  };
  this.getNumber = function(line, index) {
    var num = 0;
    while (index < line.length) {
      switch (line.charAt(index)) {
        case '0':num = num*10;index++;break;
        case '1':num = num*10+1;index++;break;
        case '2':num = num*10+2;index++;break;
        case '3':num = num*10+3;index++;break;
        case '4':num = num*10+4;index++;break;
        case '5':num = num*10+5;index++;break;
        case '6':num = num*10+6;index++;break;
        case '7':num = num*10+7;index++;break;
        case '8':num = num*10+8;index++;break;
        case '9':num = num*10+9;index++;break;
        default:
          return {num: num, index: index};
      }
    }
    return {num: num, index: index};
  };

  this.getFraction = function(line, index) {
    var num = 1;
    var den = 1;
    if (line.charAt(index) !== '/') {
      var ret = this.getNumber(line, index);
      num = ret.num;
      index = ret.index;
    }
    if (line.charAt(index) === '/') {
      index++;
      if (line.charAt(index) === '/') {
        var div = 0.5;
        while (line.charAt(index++) === '/')
          div = div /2;
        return {value: num * div, index: index-1};
      } else {
        var iSave = index;
        var ret2 = this.getNumber(line, index);
        if (ret2.num === 0 && iSave === index)	// If we didn't use any characters, it is an implied 2
          ret2.num = 2;
        if (ret2.num !== 0)
          den = ret2.num;
        index = ret2.index;
      }
    }

    return {value: num/den, index: index};
  };

  this.theReverser = function(str) {
    if (Common.endsWith(str, ", The"))
      return "The " + str.substring(0, str.length-5);
    if (Common.endsWith(str, ", A"))
      return "A " + str.substring(0, str.length-3);
    return str;
  };

  this.stripComment = function(str) {
    var i = str.indexOf('%');
    if (i >= 0)
      return Common.strip(str.substring(0, i));
    return Common.strip(str);
  };

  this.getInt = function(str) {
    // This parses the beginning of the string for a number and returns { value: num, digits: num }
    // If digits is 0, then the string didn't point to a number.
    var x = parseInt(str);
    if (isNaN(x))
      return {digits: 0};
    var s = "" + x;
    var i = str.indexOf(s);	// This is to account for leading spaces
    return {value: x, digits: i+s.length};
  };

  this.getFloat = function(str) {
    // This parses the beginning of the string for a number and returns { value: num, digits: num }
    // If digits is 0, then the string didn't point to a number.
    var x = parseFloat(str);
    if (isNaN(x))
      return {digits: 0};
    var s = "" + x;
    var i = str.indexOf(s);	// This is to account for leading spaces
    return {value: x, digits: i+s.length};
  };

  this.getMeasurement = function(tokens) {
    if (tokens.length === 0) return { used: 0 };
    var used = 1;
    var num = '';
    if (tokens[0].token === '-') {
      tokens.shift();
      num = '-';
      used++;
    }
    else if (tokens[0].type !== 'number') return { used: 0 };
    num += tokens.shift().token;
    if (tokens.length === 0) return { used: 1, value: parseInt(num) };
    var x = tokens.shift();
    if (x.token === '.') {
      used++;
      if (tokens.length === 0) return { used: used, value: parseInt(num) };
      if (tokens[0].type === 'number') {
        x = tokens.shift();
        num = num + '.' + x.token;
        used++;
        if (tokens.length === 0) return { used: used, value: parseFloat(num) };
      }
      x = tokens.shift();
    }
    switch (x.token) {
      case 'pt': return { used: used+1, value: parseFloat(num) };
      case 'cm': return { used: used+1, value: parseFloat(num)/2.54*72 };
      case 'in': return { used: used+1, value: parseFloat(num)*72 };
      default: tokens.unshift(x); return { used: used, value: parseFloat(num) };
    }
    return { used: 0 };
  };
  var substInChord = function(str)
  {
    while ( str.indexOf("\\n") !== -1)
    {
      str = str.replace("\\n", "\n");
    }
    return str;
  };
  this.getBrackettedSubstring = function(line, i, maxErrorChars, _matchChar)
  {
    // This extracts the sub string by looking at the first character and searching for that
    // character later in the line (or search for the optional _matchChar).
    // For instance, if the first character is a quote it will look for
    // the end quote. If the end of the line is reached, then only up to the default number
    // of characters are returned, so that a missing end quote won't eat up the entire line.
    // It returns the substring and the number of characters consumed.
    // The number of characters consumed is normally two more than the size of the substring,
    // but in the error case it might not be.
    var matchChar = _matchChar || line.charAt(i);
    var pos = i+1;
    while ((pos < line.length) && (line.charAt(pos) !== matchChar))
      ++pos;
    if (line.charAt(pos) === matchChar)
      return [pos-i+1,substInChord(line.substring(i+1, pos)), true];
    else	// we hit the end of line, so we'll just pick an arbitrary num of chars so the line doesn't disappear.
    {
      pos = i+maxErrorChars;
      if (pos > line.length-1)
        pos = line.length-1;
      return [pos-i+1, substInChord(line.substring(i+1, pos)), false];
    }
  };
};
},{"./Common":6}]},{},[1]);
