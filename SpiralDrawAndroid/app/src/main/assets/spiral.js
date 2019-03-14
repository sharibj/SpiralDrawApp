// Author : Sharib Jafari
// HTML Elements ID Constants
var canvasId = 'SpiralDraw',
  settingsId = 'settings',
  toolboxId = 'toolbox',
  foldsId = 'folds',
  thicknessId = 'thickness',
  labelForFoldsId = 'labelForFolds',
  labelForThicknessId = 'labelForThickness',
  mirrorId = 'mirror',
  chosencolorId = 'chosencolor';

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
var Point = makeStruct("x y color thickness");
// Struct to store history
var History = makeStruct("allPoints folds mirror");

// Flag to turn on/off mirroring
var mirror = true;
// Number of folds
var folds = 12;

// 2D List of raw coordinates of all the points
var allPoints = new Array();
// List of 'History'
var historyList = new Array();
// X and Y coordinates of the middle of the canvas
var midx, midy, canvasCenter;

// Paint cursor.
// Keeps track of how many lines are already drawn from the list.
var paintCount = 0;
// Stroke color
var sColor = "#000000";
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
  var settings = document.getElementById(settingsId),
    toolBox = document.getElementById(toolboxId);
  settings.style.visibility = toolBox.style.visibility;
  if (toggle) {
    toggle = false;
    visibility = 'visible';
    // Push latest patterns to history
    historyList.push(new History(allPoints.slice(), folds, mirror));
    clearAllPoints();
  } else {
    toggle = true;
    visibility = 'hidden';
  }
  toolBox.style.visibility = visibility;
  var i,
    tags = document.getElementById(toolboxId).getElementsByTagName("*"),
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

// Create image using history list.
// Includes coordinates that lie outside the screen, as well
function createImage() {
  // Get the smallest coordinate from drawing
  var smallestPoint = getExtremePoint(false);
  // Get the largest coordinate from drawing
  var largestPoint = getExtremePoint(true);
  // Border margin for final image
  var margin = 10;
  // Calculate x and y offsets
  var xOffset = 0 - smallestPoint.x + margin;
  var yOffset = 0 - smallestPoint.y + margin;
  var offset = new Point(xOffset, yOffset);
  // Calculate maximum x and y values for final image
  var maxX = largestPoint.x + xOffset + margin;
  var maxY = largestPoint.y + yOffset + margin;
  // Create a new canvas to redraw the image
  var imgCanvas = document.createElement("CANVAS");
  var imgCtx = imgCanvas.getContext('2d');
  imgCtx.canvas.width = maxX;
  imgCtx.canvas.height = maxY;
  // Draw
  for (var counter = 0; counter < historyList.length; counter++) {
    var hAllPoints = historyList[counter].allPoints;
    var count = historyList[counter].folds;
    if (historyList[counter].mirror) {
      count *= 2;
    }
    for (var counter2 = 0; counter2 < count; counter2++) {
      paintList(imgCtx, hAllPoints[counter2], 0, offset);
    }
  }
  return imgCanvas;
}

// Create an image from the drawn pattern export it
function download() {
  var download = document.getElementById("download");
  var image = createImage().toDataURL("image/png")
    .replace("image/png", "image/octet-stream");
  download.setAttribute("href", image);
}
//  Initial Function
function draw() {
  init();
  toggleToolbox();
  var canvas = document.getElementById(canvasId);
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    // Calculate center of canvas
    midx = (canvas.width) / 2;
    midy = (canvas.height) / 2;
    canvasCenter = new Point(midx, midy);
    // Initialize folds slider
    var fldSlider = document.getElementById(foldsId);
    fldSlider.oninput = function() {

      historyList.push(new History(allPoints.slice(), folds, mirror));
      folds = parseInt(this.value);
      document.getElementById(labelForFoldsId).innerHTML = "Folds(" + folds + ")";
      clearAllPoints();
    }
    // Initialize thickness (sWidth) slider
    var thckSlider = document.getElementById(thicknessId);
    thckSlider.oninput = function() {
      sWidth = parseInt(this.value);
      document.getElementById(labelForThicknessId).innerHTML = "Thickness(" + sWidth + ")";
    }

    var mirrorCheck = document.getElementById(mirrorId);
    mirrorCheck.onclick = function() {
      historyList.push(new History(allPoints.slice(), folds, mirror));
      mirror = this.checked;
      clearAllPoints();
    }
    var chosencolor = document.getElementById(chosencolorId);
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
    allPoints[counter].push(new Point(x, y, sColor, sWidth));
    // Mirror the point on X axis if mirroring is on
    if (mirror) {
      var absDiff = Math.abs(x - midx);
      if (x > midx) {
        x = midx - absDiff;
      } else {
        x = midx + absDiff;
      }
      allPoints[counter + folds].push(new Point(x, y, sColor, sWidth));
    }
  }
}

// Start drawing line
function beginLine(isMouse) {
  var point = new Point(getX(isMouse), getY(isMouse));
  recordCoordinates = true;
  addPointToList(point);
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
    addPointToList(point);
    paint(ctx);
  }
}

// paint the pattern on canvas
function paint(ctx) {
  var count = folds;
  if (mirror) {
    count *= 2;
  }
  for (var counter = 0; counter < count; counter++) {
    paintList(ctx, allPoints[counter], paintCount, new Point(0, 0));
  }
  paintCount = allPoints[0].length - 1;
}

// Draw lines using the list
function paintList(ctx, linePoint, paintCount, offset) {
  var prevPoint = null;
  if (linePoint != null && linePoint.length > 0) {
    for (var counter = paintCount; counter < linePoint.length; counter++) {
      var point = linePoint[counter];
      if (point != null && prevPoint != null && point != prevPoint) {
        drawLine(ctx, prevPoint.x, prevPoint.y, point.x, point.y, point.color, point.thickness, offset);
      }
      prevPoint = point;
    }
  }
}

// Draw a line
function drawLine(ctx, x1, y1, x2, y2, color, width, offset) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1 + offset.x, y1 + offset.y);
  ctx.lineTo(x2 + offset.x, y2 + offset.y);
  ctx.stroke();
}

// if returnLargest=true, return largets x and y
// else return Smallest x and y
function getExtremePoint(returnLargest) {
  // Default x and y values for smallest comparision
  var x = 100000;
  var y = 100000;
  if (returnLargest) {
    // Default x and y values for largest comparision
    x = 0;
    y = 0;
  }
  for (var c = 0; c < historyList.length; c++) {
    var hAllPoints = historyList[c].allPoints;
    var count = historyList[c].folds;
    if (historyList[c].mirror) {
      count *= 2;
    }
    for (var counter = 0; counter < count; counter++) {
      var points = hAllPoints[counter];
      if (points != null) {
        for (var counter2 = 0; counter2 < points.length; counter2++) {
          if (points[counter2] != null) {
            if (returnLargest) {
              if (points[counter2].x > x) {
                x = points[counter2].x;
              }
              if (points[counter2].y > y) {
                y = points[counter2].y;
              }
            } else {
              if (points[counter2].x < x) {
                x = points[counter2].x;
              }
              if (points[counter2].y < y) {
                y = points[counter2].y;
              }

            }
          }
        }
      }
    }
  }
  return new Point(x, y);
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
