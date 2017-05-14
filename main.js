var columns = 20, rows = 20;
var data = new Array(columns * rows);

var pause = false;
var passive = false;
var index = 0;
var delay = 125;

window.onclick = function(event) {
  var target = event.target;
  if (/\d+/.test(target.id)) {
    data[target.id] = !data[target.id];
  }
};

window.setTimeout(function update() {
  if (pause) {
    return window.setTimeout(update, delay);
  }

  index = (index + 1) % columns;

  if (passive) {
    return window.setTimeout(update, delay);
  }

  if (index == columns - 1) {
    var copy = data.slice(0);

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < columns; x++) {
        var count = 0;

        count += copy[((x - 1) * columns) + (y - 1)] ? 1 : 0;
        count += copy[(x * columns) + (y - 1)] ? 1 : 0;
        count += copy[((x + 1) * columns) + (y - 1)] ? 1 : 0;

        count += copy[((x - 1) * columns) + y] ? 1 : 0;
        count += copy[((x + 1) * columns) + y] ? 1 : 0;

        count += copy[((x - 1) * columns) + (y + 1)] ? 1 : 0;
        count += copy[(x * columns) + (y + 1)] ? 1 : 0;
        count += copy[((x + 1) * columns) + (y + 1)] ? 1 : 0;

        if (data[(x * columns) + y] == true && (count < 2 || count > 3)) {
          data[(x * columns) + y] = false;
        } else if (count == 3) {
          data[(x * columns) + y] = true;
        }
      }
    }
  }

  window.setTimeout(update, delay);
}, delay);

var audio = new AudioContext();
var master = audio.createGain();
master.gain.value = 0.25

master.connect(audio.destination);

var frequencies = (function() {
  var map = [1 - 22];
  var offsets = [2, 2, 3, 2, 3];

  for (var i = 0; i < 4; i++) {
    offsets.forEach(function(n) {
      map.push(map[map.length - 1] + n);
    });
  }

  map = map.slice(0, 20);

  return map.map(function(i) {
    return 440 * Math.pow(1.05946309436, i - 1);
  }).reverse();
}());

var tracks = frequencies.map(function(f) {
  var gain = audio.createGain();
  gain.gain.value = 0;

  var oscillator = audio.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.value = f;

  oscillator.connect(gain);
  gain.connect(master);

  oscillator.start();

  return gain;
});

window.setTimeout(function process(value) {
  if (value != index) {
    for (var y = 0, x = index; y < rows; y++) {
      var track = tracks[y];

      if (data[(x * columns) + y]) {
        track.gain.cancelScheduledValues(audio.currentTime);
        track.gain.setValueAtTime(1, audio.currentTime);
        track.gain.linearRampToValueAtTime(0, audio.currentTime + 0.25);
      }
    }
  }

  setTimeout(process, 0, index);
}, 0, index);

var content = document.getElementById('content');
var grid = document.createElement('table');
grid.id = 'grid';
grid.className = 'grid';

for (var y = 0; y < rows; y++) {
  var row = document.createElement('tr');

  for (var x = 0; x < columns; x++) {
    var cell = document.createElement('td');
    cell.id = (columns * x) + y;
    cell.className = 'cell';

    row.appendChild(cell);
  }

  grid.appendChild(row);
}

content.appendChild(grid);

var play = document.createElement('button');
play.id = 'play';
play.className = 'button play';
play.innerText = pause ? 'Play' : 'Pause';
play.onclick = function() {
  pause = !pause;
  play.innerText = pause ? 'Play' : 'Pause';
};

content.appendChild(play);

var randomize = document.createElement('button');
randomize.id = 'randomize';
randomize.className = 'button randomize';
randomize.innerText = 'Randomize';
randomize.onclick = function() {
  for (var y = 0; y < rows; y++) {
    for (var x = 0; x < columns; x++) {
      data[(x * columns) + y] = Math.round(Math.random() * 0.65);
    }
  }
};

content.appendChild(randomize);

var exportpattern = document.createElement('button');
exportpattern.id = 'exportpattern';
exportpattern.className = 'button';
exportpattern.innerText = 'Export pattern';
exportpattern.onclick = function() {
  var cells = document.getElementsByClassName('alive');
  var pattern = [];
  for(var i = 0; i < cells.length; i++){
    var cellid = cells[i].id;
     if (/\d+/.test(cellid)) {
        pattern.push(cellid);
      }
  }
  prompt("Copy to clipboard with Ctrl+C or right-click", pattern.toString());
}
content.appendChild(exportpattern);

var importpattern = document.createElement('button');
importpattern.id = 'importpattern';
importpattern.className = 'button';
importpattern.innerText = 'Import pattern';
importpattern.onclick = function() {
  var input = prompt("Copy to clipboard with Ctrl+C or right-click", "");
  var cells = input.split(",");
  
  for(var i = 0; i < cells.length; i++){
     if (/\d+/.test(cells[i])) {
      data[cells[i]] = true;
    }
  }
}
content.appendChild(importpattern);

window.requestAnimationFrame(function render(time) {
  for (var y = 0; y < rows; y++) {
    for (var x = 0; x < columns; x++) {
      var element = document.getElementById((x * columns) + y);
      if (!element) {
        continue;
      }

      if (data[(x * columns) + y]) {
        element.classList.add('alive');
      } else {
        element.classList.remove('alive');
      }

      if (x == index) {
        if (element.classList.contains('current')) {
          continue;
        }

        element.classList.add('current');
      } else {
        element.classList.remove('current');
      }
    }
  }

  window.requestAnimationFrame(render, grid);
}, grid);
