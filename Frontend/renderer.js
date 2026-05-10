const baseMap_canvas = document.getElementById("baseMap");
const baseMap_ctx = baseMap_canvas.getContext("2d");
const telemetry_canvas = document.getElementById("telemetry");
const telemetry_ctx = telemetry_canvas.getContext("2d");
const path_canvas = document.getElementById("racePath");
const path_ctx = path_canvas.getContext("2d");

path_canvas.width = window.innerWidth;
path_canvas.height = window.innerHeight;
baseMap_canvas.width = window.innerWidth;
baseMap_canvas.height = window.innerHeight;
telemetry_canvas.width = window.innerWidth;
telemetry_canvas.height = window.innerHeight;


/*
// --- Initialize regl ---
const regl = createREGL({
  canvas: baseMap_canvas
});
*/

function dmsToDecimal(degrees, minutes, seconds)
{
  return degrees + (minutes / 60) + (seconds / 3600);
}

function gpsToPixel(coordinate, coordinateCenter, canvasCenter, world) {
  x = (coordinate.lon - coordinateCenter.lon) / world.pixelWidth + canvasCenter.x;
  y = (coordinate.lat - coordinateCenter.lat) / world.pixelHeight + canvasCenter.y;
  return { x, y };
}

let coordinateCenter = {lon: 0, lat: 0};
let canvasCenter = {x: 0, y: 0};
let testCoordinate = {lat: dmsToDecimal(45, 37, 37.58), lon: dmsToDecimal(-122, -15, -29.72)};
let world = null;
let scaleTransform = [1,1];
let trackPoints = [];
let pointCount = 0;
let windowFocus = true;
let imageLoaded = false;

// --- Load the map texture ---
const mapImage = new Image();




// Load PGW world file
async function loadWorldFile(imageWidth, imageHeight) {
  const text = await fetch("Washougal MX Clipped Map.pgw").then(r => r.text());
  const [A, D, B, E, C, F] = text.trim().split(/\s+/).map(Number);

  return {
    pixelWidth: A * (imageHeight / window.innerHeight),
    pixelHeight: E * (imageHeight / window.innerHeight),
    topLeftLon: C,
    topLeftLat: F,
    bottomRightLon: C + A * imageWidth,
    bottomRightLat: F + E * imageHeight
  };
}


window.addEventListener('focus', () => {windowFocus = true});
window.addEventListener('blur', () => {windowFocus = false});

mapImage.onload = async () => {

  await loadWorldFile(mapImage.width, mapImage.height).then(w => {
    world = w;
    console.log("World file loaded:", world);
  })

  coordinateCenter.lon = (world.topLeftLon + world.bottomRightLon) / 2;
  coordinateCenter.lat = (world.topLeftLat + world.bottomRightLat) / 2;
  canvasCenter.x = telemetry_canvas.width / 2;
  canvasCenter.y = telemetry_canvas.height / 2;

  /*
  const imageAspect = mapImage.width / mapImage.height;
  const canvasAspect = baseMap_canvas.width / baseMap_canvas.height;

  if (imageAspect > canvasAspect) {
    // Image is wider than canvas
    scaleTransform[1] = canvasAspect / imageAspect;
  } else {
    // Image is taller than canvas
    scaleTransform[0] = imageAspect / canvasAspect;
  }
  */
  let scalingFactor = window.innerHeight / mapImage.height;

  baseMap_ctx.drawImage(mapImage, window.innerWidth / 2 - mapImage.width * scalingFactor / 2, 0, mapImage.width * scalingFactor, mapImage.height * scalingFactor);

  imageLoaded = true;
  //const mapTexture = regl.texture(mapImage);

  /*
  // Draw a full-screen quad
  const drawMap = regl({
    frag: `
      precision mediump float;
      uniform sampler2D tex;
      varying vec2 uv;
      void main() {
        gl_FragColor = texture2D(tex, uv);
      }
    `,
    vert: `
      precision mediump float;
      attribute vec2 position;
      uniform vec2 scale;
      varying vec2 uv;
      void main() {
        vec2 scaled = position * scale;
        uv = 0.5 * (vec2(position.x, -position.y) + 1.0);
        gl_Position = vec4(scaled, 0, 1);
      }
    `,
    attributes: {
      position: [
        -1, -1,
         1, -1,
        -1,  1,
         1,  1
      ]
    },
    uniforms: {
      tex: mapTexture,
      scale: () => scaleTransform,
    },
    count: 4,
    primitive: 'triangle strip'
  });

  console.log(world.topLeftLon, world.topLeftLat);
  console.log(world.bottomRightLon, world.bottomRightLat);

  drawMap();
  */
};


//Draw the point where the car is at and draw the path from where it was
function drawPath()
{
  let position;

  //Draw the path of all the coordinate points in the buffer.
  for (let i = 0; i < trackPoints.length; i += 1)
  {
    position = gpsToPixel(trackPoints[i], coordinateCenter, canvasCenter, world);
    
    path_ctx.strokeStyle = "yellow";
    if(pointCount == 1)
    {
      path_ctx.moveTo(position.x, position.y);
    }
    else if(pointCount > 1)
    {
      path_ctx.lineTo(position.x, position.y);
      path_ctx.stroke();
    }
  }

  //Draw the car point as the latest coordinate.
  
  telemetry_ctx.fillStyle = "red";
  telemetry_ctx.beginPath();
  telemetry_ctx.arc(position.x, position.y, 10, 0, 2 * Math.PI);
  telemetry_ctx.clearRect(0, 0, telemetry_canvas.width, telemetry_canvas.height);
  telemetry_ctx.fill();
  trackPoints = [];
}

mapImage.src = "Washougal MX Clipped Map.png";
status_display = document.getElementById('status');


setInterval(() => {

  /*
  The javascript canvas does not
  draw when the window is not being
  focused on. In the case of this the
  coordinate points will be buffered
  until the window regains focus. Upon
  regaining focus the window will draw
  all the points in the buffer at once.
  */

  if(trackPoints.length > 0 && imageLoaded === true && windowFocus === true)
  {
    const display_coord = trackPoints[trackPoints.length - 1]
    status_display.innerHTML = `Lon: ${display_coord["lon"]}<br>Lat: ${display_coord["lat"]}`;
    requestAnimationFrame(drawPath);
  }
}, 16);

window.api.rendererReady();

window.api.onTelemetry(({ lat, lon }) => {
  pointCount += 1;
  
  trackPoints.push({lat, lon});
  
  /*
  trackPoints.push(testCoordinate);
  requestAnimationFrame(drawPath);
  */
});
