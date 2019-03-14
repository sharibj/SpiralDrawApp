// Author : Sharib Jafari
var canvasId = 'SpiralDraw';
// Flag to signal mouse drag/ touch move
var recordCoordinates;
// Struct Factory
function makeStruct(names) {
  var names = names.split(' ');
  var count = names.length;

  function constructor() {
    for (var i = 0; i < count; i++) {
      this[names[i]] = arguments[i];
    }
  }
  return constructor;
}
// Struct to store coordinates of a point
var Point = makeStruct("x y");
// Flag to turn on/off mirroring
var mirror = true;
// Number of folds
var folds = 12;

// 2D List of raw coordinates of all the points
var allPoints = new Array();
var historyList = new Array();
// X and Y coordinates of the middle of the canvas
var midx;
var midy;
var canvasCenter;

// Paint cursor.
// Keeps track of how many lines are already drawn from the list.
var paintCount = 0;
// Stroke color
var sColor = "#ff0000";
// Stroke Width
var sWidth = 2;
// Toggle flag for toolbox visibility
var toggle = false;

// Close Toolbox
function closeToolbox() {
  toggle = false;
  toggleToolbox();
}

// Toggle toolbox visibility
function toggleToolbox() {
  var visibility; // = 'hidden';
  var settings = document.getElementById("settings"),
    toolBox = document.getElementById("toolbox");
  settings.style.visibility = toolBox.style.visibility;
  if (toggle) {
    toggle = false;
    visibility = 'visible';
  } else {
    toggle = true;
    visibility = 'hidden';
  }
  toolBox.style.visibility = visibility;
  var i,
    tags = document.getElementById("toolbox").getElementsByTagName("*"),
    total = tags.length;
  for (i = 0; i < total; i++) {
    tags[i].style.visibility = visibility;
  }
}

// Clears everything
function init() {
  clearAllPoints();
  clearCanvas();
  historyList = new Array();
}

// Clears coordinates list
function clearAllPoints() {
  historyList.push(allPoints);
  var total = folds;
  if (mirror) {
    total *= 2;
  }
  for (var counter = 0; counter < total; counter++) {
    allPoints[counter] = new Array();
  }
  paintCount = 0;
}

// Clears canvas
function clearCanvas() {
  var canvas = document.getElementById(canvasId);
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

//  Initial Function
function draw() {
  init();
  toggleToolbox();
  var canvas = document.getElementById(canvasId);
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var margin = 30;
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight - margin;
    // Calculate center of canvas
    midx = (canvas.width) / 2;
    midy = (canvas.height) / 2;
    canvasCenter = new Point(midx, midy);
    // Initialize folds slider
    var fldSlider = document.getElementById("folds");
    fldSlider.oninput = function() {
      folds = parseInt(this.value);
      document.getElementById("labelForFolds").innerHTML = "Folds(" + folds + ")";
      clearAllPoints();
    }
    // Initialize thickness (sWidth) slider
    var thckSlider = document.getElementById("thickness");
    thckSlider.oninput = function() {
      sWidth = parseInt(this.value);
      document.getElementById("labelForThickness").innerHTML = "Thickness(" + sWidth + ")";
    }

    var mirrorCheck = document.getElementById("mirror");
    mirrorCheck.onclick = function() {
      mirror = this.checked;
      clearAllPoints();
    }
    var chosencolor = document.getElementById("chosencolor");
    chosencolor.onchange = function() {
      sColor = this.value;
    }
    // Mouse Event Listeners
    canvas.addEventListener("mousedown", function() {
      beginLine(true);
    }, false);
    canvas.addEventListener("mouseup", function() {
      endLine();
    }, false);
    canvas.addEventListener("mousemove", function() {
      traceLine(ctx, true);
    }, false);
    // Touch Event Listeners
    canvas.addEventListener("touchstart", function() {
      beginLine(false);
    }, false);
    canvas.addEventListener("touchend", function() {
      endLine();
    }, false);
    canvas.addEventListener("touchmove", function() {
      traceLine(ctx, false);
    }, false);
  }
}

// Get X coordinate of mouse/touch
function getX(isMouse) {
  if (isMouse) {
    return event.clientX;
  } else {
    return event.touches[0].clientX;
  }
}

// Get Y coordinate of mouse/touch
function getY(isMouse) {
  if (isMouse) {
    return event.clientY;
  } else {
    return event.touches[0].clientY;
  }
}

// This is where all the magic happens
function addPointToList(point) {
  // Radius is the distance between center of the canvas and the point
  var radius = distance(canvasCenter, point);
  // Get the angle
  var angle = getAngleForPoint(new Point(point.x - midx, point.y - midy), radius);
  // Calculate and add points for each fold
  for (var counter = 0; counter < folds; counter++) {
    var angleIncrement = (360 / folds) * counter;
    var incAngle = angle + angleIncrement;
    var calculatedPoint = getPointForAngle(incAngle, radius);
    var x = calculatedPoint.x + midx;
    var y = calculatedPoint.y + midy;
    allPoints[counter].push(new Point(x, y));
    // Mirror the point on X axis if mirroring is on
    if (mirror) {
      var absDiff = Math.abs(x - midx);
      if (x > midx) {
        x = midx - absDiff;
      } else {
        x = midx + absDiff;
      }
      allPoints[counter + folds].push(new Point(x, y));
    }
  }
}

// Start drawing line
function beginLine(isMouse) {
  var point = new Point(getX(isMouse), getY(isMouse));
  //if (isPointInRange(point)) {
  recordCoordinates = true;
  addPointToList(point);
  //}
}

// Stop drawing line
function endLine() {
  recordCoordinates = false;
  for (var counter = 0; counter < folds; counter++) {
    allPoints[counter].push(null);
  }
  if (mirror) {
    for (counter = folds; counter < folds * 2; counter++) {
      allPoints[counter].push(null);
    }
  }
}

// Trace line by adding all coordinates to the list
function traceLine(ctx, isMouse) {
  if (recordCoordinates) {
    var point = new Point(getX(isMouse), getY(isMouse));
    //if (isPointInRange(point)) {
    addPointToList(point);
    paint(ctx);
    //}
  }
}

// paint the pattern on canvas
function paint(ctx) {
  var count = folds;
  if (mirror) {
    count *= 2;
  }
  for (var counter = 0; counter < count; counter++) {
    paintList(ctx, allPoints[counter], paintCount);
  }
  paintCount = allPoints[0].length - 1;
}

// Draw lines using the list
function paintList(ctx, linePoint, paintCount) {
  var prevPoint = null;
  if (linePoint != null && linePoint.length > 0) {
    for (var counter = paintCount; counter < linePoint.length; counter++) {
      var point = linePoint[counter];
      //if (isPointInRange(point)) {
      if (point != null && prevPoint != null && point != prevPoint) {
        drawLine(ctx, prevPoint.x, prevPoint.y, point.x, point.y);
      }
      prevPoint = point;
      //}
    }
  }
}

function isPointInRange(point) {
  var canvas = document.getElementById(canvasId);
  return (point.x >= 0 && point.x <= canvas.width && point.y >= 0 && point.y <= canvas.height);
}
// Draw a line
function drawLine(ctx, x1, y1, x2, y2) {
  ctx.strokeStyle = sColor;
  ctx.lineWidth = sWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

//Utility math functions......................
function getAngleForPoint(point, radius) {
  var cosAngle = (point.x) / radius;
  var sinAngle = (point.y) / radius;
  var rad = Math.atan2(sinAngle, cosAngle);
  return toDegrees(rad);
}

function getPointForAngle(angle, radius) {
  var angle = toRadians(angle);
  var x = radius * Math.cos(angle);
  var y = radius * Math.sin(angle);
  return new Point(x, y);
}

function distance(start, end) {
  return Math.sqrt((end.x - start.x) * (end.x - start.x) + (end.y - start.y) * (end.y - start.y));
}

function toDegrees(angle) {
  return angle * (180 / Math.PI);
}

function toRadians(angle) {
  return (angle * (Math.PI / 180));
}
//............................................
