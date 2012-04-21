var gl;

/***********************************************************************/

var DRAW_vertices = new Array ();
var DRAW_textureCoords = new Array ();
var DRAW_currentTexture;
var DRAW_cameraX = -400.0, DRAW_cameraY = -300.0;
var DRAW_cameraVelX = 0, DRAW_cameraVelY = 0;
var DRAW_cameraNoiseX = 0.0, DRAW_cameraNoiseY = 0.0;
var DRAW_alpha = 1.0;

function DRAW_SetupShaders ()
{
  var fragmentShader = DRAW_GetShaderFromElement ("shader-fs");
  var vertexShader = DRAW_GetShaderFromElement ("shader-vs");

  shaderProgram = gl.createProgram ();
  gl.attachShader (shaderProgram, vertexShader);
  gl.attachShader (shaderProgram, fragmentShader);
  gl.linkProgram (shaderProgram);

  if (!gl.getProgramParameter (shaderProgram, gl.LINK_STATUS))
    {
      alert ("Could not initialise shaders");

      return;
    }

  gl.useProgram (shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation (shaderProgram, "attr_VertexPosition");
  gl.enableVertexAttribArray (shaderProgram.vertexPositionAttribute);

  shaderProgram.textureCoordAttribute = gl.getAttribLocation (shaderProgram, "attr_TextureCoord");
  gl.enableVertexAttribArray (shaderProgram.textureCoordAttribute);

  gl.uniform1i (gl.getUniformLocation (shaderProgram, "uniform_Sampler"), 0);
}

function DRAW_GetShaderFromElement (id)
{
  var shader, shaderScript;
  var str = "", k;

  shaderScript = document.getElementById (id);

  if (!shaderScript)
    return null;

  k = shaderScript.firstChild;

  while (k)
    {
      if (k.nodeType == 3)
        str += k.textContent;

      k = k.nextSibling;
    }

  if (shaderScript.type == "x-shader/x-fragment")
    shader = gl.createShader (gl.FRAGMENT_SHADER);
  else if (shaderScript.type == "x-shader/x-vertex")
    shader = gl.createShader (gl.VERTEX_SHADER);
  else
    return null;

  gl.shaderSource (shader, str);
  gl.compileShader (shader);

  if (!gl.getShaderParameter (shader, gl.COMPILE_STATUS))
    {
      alert (gl.getShaderInfoLog (shader));

      return null;
    }

  return shader;
}

function DRAW_LoadTexture (url)
{
  var result; /* Argh! */

  result = gl.createTexture ();
  result.image = new Image ();
  result.image.onload = function () { DRAW_HandleLoadedTexture (result) };
  result.image.src = url;

  return result;
}

function DRAW_HandleLoadedTexture (texture)
{
  gl.bindTexture (gl.TEXTURE_2D, texture);
  gl.pixelStorei (gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  /*
  gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  */
}

function DRAW_Flush ()
{
  var vertexCount;
  var vertexPositionBuffer;
  var texCoordBuffer;

  vertexCount = DRAW_vertices.length / 3;

  if (!vertexCount)
    return;

  gl.bindTexture (gl.TEXTURE_2D, DRAW_currentTexture);

  vertexPositionBuffer = gl.createBuffer ();
  gl.bindBuffer (gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (DRAW_vertices), gl.STATIC_DRAW);

  texCoordBuffer = gl.createBuffer ();
  gl.bindBuffer (gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (DRAW_textureCoords), gl.STATIC_DRAW);

  gl.bindBuffer (gl.ARRAY_BUFFER, texCoordBuffer);
  gl.vertexAttribPointer (shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer (gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer (shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.drawArrays (gl.TRIANGLES, 0, vertexCount);

  DRAW_vertices.length = 0;
  DRAW_textureCoords.length = 0;

  gl.deleteBuffer (texCoordBuffer);
  gl.deleteBuffer (vertexPositionBuffer);
}

function DRAW_SetAlpha (alpha)
{
  DRAW_alpha = alpha;
}

function DRAW_AddQuad (texture, x, y, width, height)
{
  if (texture != DRAW_currentTexture)
    DRAW_Flush ();

  DRAW_currentTexture = texture;

  DRAW_vertices.push (x);
  DRAW_vertices.push (y);
  DRAW_vertices.push (DRAW_alpha);

  DRAW_vertices.push (x);
  DRAW_vertices.push (y + height);
  DRAW_vertices.push (DRAW_alpha);

  DRAW_vertices.push (x + width);
  DRAW_vertices.push (y + height);
  DRAW_vertices.push (DRAW_alpha);

  DRAW_vertices.push (x);
  DRAW_vertices.push (y);
  DRAW_vertices.push (DRAW_alpha);

  DRAW_vertices.push (x + width);
  DRAW_vertices.push (y + height);
  DRAW_vertices.push (DRAW_alpha);

  DRAW_vertices.push (x + width);
  DRAW_vertices.push (y);
  DRAW_vertices.push (DRAW_alpha);

  DRAW_textureCoords.push (0.0);
  DRAW_textureCoords.push (0.0);

  DRAW_textureCoords.push (0.0);
  DRAW_textureCoords.push (1.0);

  DRAW_textureCoords.push (1.0);
  DRAW_textureCoords.push (1.0);

  DRAW_textureCoords.push (0.0);
  DRAW_textureCoords.push (0.0);

  DRAW_textureCoords.push (1.0);
  DRAW_textureCoords.push (1.0);

  DRAW_textureCoords.push (1.0);
  DRAW_textureCoords.push (0.0);
}

function DRAW_AddQuadST (texture, x, y, width, height, s0, t0, s1, t1)
{
  if (texture != DRAW_currentTexture)
    DRAW_Flush ();

  DRAW_currentTexture = texture;

  DRAW_vertices.push (x);
  DRAW_vertices.push (y);
  DRAW_vertices.push (DRAW_alpha);

  DRAW_vertices.push (x);
  DRAW_vertices.push (y + height);
  DRAW_vertices.push (DRAW_alpha);

  DRAW_vertices.push (x + width);
  DRAW_vertices.push (y + height);
  DRAW_vertices.push (DRAW_alpha);

  DRAW_vertices.push (x);
  DRAW_vertices.push (y);
  DRAW_vertices.push (DRAW_alpha);

  DRAW_vertices.push (x + width);
  DRAW_vertices.push (y + height);
  DRAW_vertices.push (DRAW_alpha);

  DRAW_vertices.push (x + width);
  DRAW_vertices.push (y);
  DRAW_vertices.push (DRAW_alpha);

  DRAW_textureCoords.push (s0);
  DRAW_textureCoords.push (t0);

  DRAW_textureCoords.push (s0);
  DRAW_textureCoords.push (t1);

  DRAW_textureCoords.push (s1);
  DRAW_textureCoords.push (t1);

  DRAW_textureCoords.push (s0);
  DRAW_textureCoords.push (t0);

  DRAW_textureCoords.push (s1);
  DRAW_textureCoords.push (t1);

  DRAW_textureCoords.push (s1);
  DRAW_textureCoords.push (t0);
}

/* Pivot: Bottom center */
function DRAW_AddQuadAngle (texture, x, y, width, height, angle, flipped)
{
  var s, c;
  var x0 = 0.0, x1 = 1.0;

  if (texture != DRAW_currentTexture)
    DRAW_Flush ();

  s = Math.sin(angle);
  c = Math.cos(angle);

  DRAW_currentTexture = texture;

  /* D */
  DRAW_vertices.push (x + c * width * 0.5);
  DRAW_vertices.push (y + s * width * 0.5);
  DRAW_vertices.push (DRAW_alpha);

  /* A */
  DRAW_vertices.push (x + c * width * 0.5 + s * height);
  DRAW_vertices.push (y + s * width * 0.5 - c * height);
  DRAW_vertices.push (DRAW_alpha);

  /* B */
  DRAW_vertices.push (x - c * width * 0.5 + s * height);
  DRAW_vertices.push (y - s * width * 0.5 - c * height);
  DRAW_vertices.push (DRAW_alpha);

  /* D */
  DRAW_vertices.push (x + c * width * 0.5);
  DRAW_vertices.push (y + s * width * 0.5);
  DRAW_vertices.push (DRAW_alpha);

  /* B */
  DRAW_vertices.push (x - c * width * 0.5 + s * height);
  DRAW_vertices.push (y - s * width * 0.5 - c * height);
  DRAW_vertices.push (DRAW_alpha);

  /* C */
  DRAW_vertices.push (x - c * width * 0.5);
  DRAW_vertices.push (y - s * width * 0.5);
  DRAW_vertices.push (DRAW_alpha);

  if (flipped)
    {
      x0 = 1.0;
      x1 = 0.0;
    }

  DRAW_textureCoords.push (x1);
  DRAW_textureCoords.push (0.0);

  DRAW_textureCoords.push (x1);
  DRAW_textureCoords.push (1.0);

  DRAW_textureCoords.push (x0);
  DRAW_textureCoords.push (1.0);

  DRAW_textureCoords.push (x1);
  DRAW_textureCoords.push (0.0);

  DRAW_textureCoords.push (x0);
  DRAW_textureCoords.push (1.0);

  DRAW_textureCoords.push (x0);
  DRAW_textureCoords.push (0.0);
}

function DRAW_AddCircle (texture, x, y, radius)
{
  var i, s0, c0;

  if (texture != DRAW_currentTexture)
    DRAW_Flush ();

  DRAW_currentTexture = texture;

  s0 = 0.0;
  c0 = 1.0;

  for (i = 0; i < 200; ++i)
  {
    var s1, c1;

    if (i < 199)
    {
      s1 = Math.sin((i + 1) * Math.PI / 100.0);
      c1 = Math.cos((i + 1) * Math.PI / 100.0);
    }
    else
    {
      s1 = 0.0;
      c1 = 1.0;
    }

    DRAW_vertices.push (s0 * radius + x);
    DRAW_vertices.push (c0 * radius + y);
    DRAW_vertices.push (DRAW_alpha);

    DRAW_vertices.push (s1 * radius + x);
    DRAW_vertices.push (c1 * radius + y);
    DRAW_vertices.push (DRAW_alpha);

    DRAW_vertices.push (x);
    DRAW_vertices.push (y);
    DRAW_vertices.push (DRAW_alpha);

    DRAW_textureCoords.push (0.5 + 0.5 * s0);
    DRAW_textureCoords.push (0.5 - 0.5 * c0);

    DRAW_textureCoords.push (0.5 + 0.5 * s1);
    DRAW_textureCoords.push (0.5 - 0.5 * c1);

    DRAW_textureCoords.push (0.5);
    DRAW_textureCoords.push (0.5);

    s0 = s1;
    c0 = c1;
  }
}

/***********************************************************************/

var keys = {};
var lastTime = 0;

function SYS_Init ()
{
  var canvas = document.getElementById ("game-canvas");

  if (!(gl = WebGLUtils.setupWebGL (canvas)))
    return;

  document.onkeydown = function () { GAME_KeyPressed(event); };
  document.onkeyup = function () { GAME_KeyRelease(event); };

  gl.viewportWidth = canvas.width;
  gl.viewportHeight = canvas.height;

  gl.viewport (0, 0, gl.viewportWidth, gl.viewportHeight);

  DRAW_SetupShaders ();

  gl.clearColor (0.0, 0.0, 0.0, 0.0);
  gl.disable (gl.DEPTH_TEST);

  gl.enable (gl.BLEND);
  gl.disable (gl.CULL_FACE);
  gl.blendFunc (gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
}

/***********************************************************************/

var planets = [];
var lasers = [];
var elapsed = 0;
var gravity = 50.0;
var hasDoubleJump = true;

var earth;
var planetSelector;
var avatar;
var stars0, stars1;
var GFX_laser;

var avatarAngle = 0, avatarAltitude = 0, yVel = 0, avatarFlipped = true;
var homePlanet = 0;

function GAME_NewPlanet (x, y, radius)
{
  var newPlanet = new Object;

  newPlanet.x = x;
  newPlanet.y = y;
  newPlanet.radius = radius;

  planets.push(newPlanet);
}

function GAME_NearestPlanet ()
{
  var homeX, homeY;
  var minAngle = 2 * Math.PI;
  var result = homePlanet;

  homeX = planets[homePlanet].x;
  homeY = planets[homePlanet].y;

  for (var i = 0; i < planets.length; ++i)
  {
    var planet, distance, angle;

    if (i == homePlanet)
      continue;

    planet = planets[i];

    distance = (planet.x - homeX) * (planet.x - homeX) + (planet.y - homeY) * (planet.y - homeY);

    if (distance > 300000)
      continue;

    angle = Math.atan2(planet.x - homeX, -(planet.y - homeY));

    if (Math.abs (angle - avatarAngle) > Math.PI)
    {
      if (angle > avatarAngle)
        angle -= 2 * Math.PI;
      else
        angle += 2 * Math.PI;
    }

    angle = Math.abs (angle - avatarAngle);

    if (angle < 0.3 && angle < minAngle)
    {
      minAngle = angle;
      result = i;
    }
  }

  return result;
}

function GAME_SetupTextures ()
{
  GFX_laser = DRAW_LoadTexture ("gfx/laser.png");
  stars0 = DRAW_LoadTexture ("gfx/stars0.png");
  stars1 = DRAW_LoadTexture ("gfx/stars1.png");
  avatar = DRAW_LoadTexture ("gfx/avatar.png");
  earth = DRAW_LoadTexture ("gfx/planet0.png");
  planetSelector = DRAW_LoadTexture ("gfx/planet-selector.png");
}

function GAME_Init ()
{
  SYS_Init ();

  GAME_SetupTextures ();

  GAME_NewPlanet (   0,    0, 128);
  GAME_NewPlanet ( 384,  384, 128);
  GAME_NewPlanet (-384,  384, 128);
  GAME_NewPlanet (-384, -384, 128);
  GAME_NewPlanet ( 384, -384, 128);

  GAME_Update ();
}

function GAME_DrawSky ()
{
  var s0x, s0y, s1x, s1y;

  s0x = DRAW_cameraX * 0.0001;
  s0y = DRAW_cameraY * 0.0001;
  s1x = DRAW_cameraX * 0.00005;
  s1y = DRAW_cameraY * 0.00005;

  DRAW_AddQuadST (stars0, DRAW_cameraX, DRAW_cameraY, gl.viewportWidth, gl.viewportHeight,
                  s0x, s0y, s0x + 1.0, s0y + gl.viewportHeight / gl.viewportWidth);
  DRAW_AddQuadST (stars1, DRAW_cameraX, DRAW_cameraY, gl.viewportWidth, gl.viewportHeight,
                  s1x, s1y, s1x + 1.0, s1y + gl.viewportHeight / gl.viewportWidth);
}

function GAME_AvatarPosition ()
{
  var planet;
  var result = new Object;

  planet = planets[homePlanet];

  y = avatarAltitude + planet.radius + 16;

  result.x = planet.x + Math.cos(avatarAngle - Math.PI * 0.5) * y;
  result.y = planet.y + Math.sin(avatarAngle - Math.PI * 0.5) * y;

  return result;
}

function GAME_DrawAvatar (x, y, flipped)
{
  var planet;

  planet = planets[homePlanet];

  y += planet.radius;

  DRAW_AddQuadAngle (avatar, planet.x + Math.cos(x - Math.PI * 0.5) * y, planet.y + Math.sin(x - Math.PI * 0.5) * y, 32, 32, x, flipped);
}

function GAME_KeyPressed(e)
{
  var ch;

  ch = String.fromCharCode (e.keyCode);

  if (keys[ch])
    return;

  keys[ch] = true;

  switch (String.fromCharCode (e.keyCode))
    {
    case ' ':

      if (avatarAltitude == 0)
        yVel = gravity * 1.5;
      else if (hasDoubleJump && yVel < 0)
      {
        yVel = gravity * 0.8;
        hasDoubleJump = false;
      }

      break;

    case 'T':

      if (homePlanet != (nextPlanet = GAME_NearestPlanet ()))
        {
          var deltaX, deltaY;

          deltaX = planets[nextPlanet].x - planets[homePlanet].x;
          deltaY = planets[nextPlanet].y - planets[homePlanet].y;

          homePlanet = nextPlanet;
          avatarAngle = Math.atan2(-deltaX, deltaY);
        }

      break;

    case 'F':

      avatarPosition = GAME_AvatarPosition ();
      laser = new Object();
      laser.age = 0.0;
      laser.fromX = avatarPosition.x;
      laser.fromY = avatarPosition.y;

      if (avatarFlipped)
        {
          laser.toX = laser.fromX + Math.cos (avatarAngle) * 1000.0;
          laser.toY = laser.fromY - Math.sin (avatarAngle) * 1000.0;
        }
      else
        {
          laser.toX = laser.fromX - Math.cos (avatarAngle) * 1000.0;
          laser.toY = laser.fromY + Math.sin (avatarAngle) * 1000.0;
        }

      lasers.push(laser);

      break;
    }
}

function GAME_KeyRelease(e)
{
  keys[String.fromCharCode (e.keyCode)] = false;
}

/* Move camera towards target, constrained by maximum acceleration and velocity */
function GAME_CameraUpdate (deltaTime)
{
  var targetX, targetY, distance;
  var dirX, dirY;
  var velocity;
  var targetVelocityX, targetVelocityY, targetVelocity;
  var deltaVelocityX, deltaVelocityY, deltaVelocity;

  var maxAcceleration = 200.0;
  var maxVelocity = 500.0;

  targetX = planets[homePlanet].x - gl.viewportWidth * 0.5;
  targetY = planets[homePlanet].y - gl.viewportHeight * 0.5;

  dirX = targetX - DRAW_cameraX;
  dirY = targetY - DRAW_cameraY;
  distance = Math.sqrt (dirX * dirX + dirY * dirY);

  if (!distance)
    return;

  dirX /= distance;
  dirY /= distance;

  targetVelocity = Math.sqrt (distance / maxAcceleration) * maxAcceleration;

  if (targetVelocity > maxVelocity)
    targetVelocity = maxVelocity;

  if (targetVelocity * deltaTime > distance)
    targetVelocity = distance / deltaTime;

  velocity = Math.sqrt (DRAW_cameraVelX * DRAW_cameraVelX + DRAW_cameraVelY * DRAW_cameraVelY);

  targetVelocityX = dirX * targetVelocity;
  targetVelocityY = dirY * targetVelocity;

  deltaVelocityX = targetVelocityX - DRAW_cameraVelX;
  deltaVelocityY = targetVelocityY - DRAW_cameraVelY;

  deltaVelocity = Math.sqrt (deltaVelocityX * deltaVelocityX + deltaVelocityY * deltaVelocityY);

  /* Can we reach the target velocity in less than `deltaTime' seconds? */
  if (deltaVelocity < maxAcceleration * deltaTime)
    {
      DRAW_cameraVelX = targetVelocityX;
      DRAW_cameraVelY = targetVelocityY;
    }
  else
    {
      /* Apply maximum acceleration in the direction of the target/current velocity delta */
      DRAW_cameraVelX += (deltaVelocityX / deltaVelocity) * maxAcceleration * deltaTime;
      DRAW_cameraVelY += (deltaVelocityY / deltaVelocity) * maxAcceleration * deltaTime;
    }

  DRAW_cameraX += DRAW_cameraVelX * deltaTime;
  DRAW_cameraY += DRAW_cameraVelY * deltaTime;
}

function GAME_Draw ()
{
  var nearestPlanet;

  gl.uniform4f (gl.getUniformLocation (shaderProgram, "uniform_Camera"), 1.0 / gl.viewportWidth, 1.0 / gl.viewportHeight, DRAW_cameraX, DRAW_cameraY);

  GAME_DrawSky ();

  nearestPlanet = GAME_NearestPlanet ();

  for (var i = 0; i < lasers.length; ++i)
    {
      var laser = lasers[i];
      var length;

      length = Math.sqrt ((laser.toX - laser.fromX) * (laser.toX - laser.fromX) + (laser.toY - laser.fromY) * (laser.toY - laser.fromY));

      DRAW_SetAlpha (1.0 - laser.age * 2.0);
      DRAW_AddQuadAngle (GFX_laser, laser.fromX, laser.fromY, 4.0, length, Math.atan2 (laser.toX - laser.fromX, laser.toY - laser.fromY));
    }

  DRAW_SetAlpha (1.0);

  for (var i = 0; i < planets.length; ++i)
    {
      var planet = planets[i];

      DRAW_AddCircle (earth, planet.x, planet.y, 128.0);

      if (i == nearestPlanet && nearestPlanet != homePlanet)
        {
          DRAW_AddQuad (planetSelector, planet.x - planet.radius - 10, planet.y - planet.radius - 10, 2 * planet.radius + 20, 2 * planet.radius + 20);
        }
    }

  GAME_DrawAvatar (avatarAngle, avatarAltitude, avatarFlipped);

  DRAW_Flush ();
}

function GAME_Update ()
{
  var timeNow, deltaTime;

  timeNow = new Date ().getTime ();
  deltaTime = timeNow - lastTime;

  if (deltaTime < 0 || deltaTime > 0.05)
    deltaTime = 0.05;

  GAME_Draw ();

  for (var i = 0; i < lasers.length; )
    {
      var laser = lasers[i];

      laser.age += deltaTime;

      if (laser.age > 0.5)
        {
          lasers.splice(i, 1);
        }
      else
        ++i;
    }

  if (keys['A'])
    {
      avatarAngle -= deltaTime * 0.5;
      avatarFlipped = false;
    }

  if (keys['D'])
    {
      avatarAngle += deltaTime * 0.5;
      avatarFlipped = true;
    }

  while (avatarAngle < 0.0)
    avatarAngle += 2 * Math.PI;
  avatarAngle %= 2 * Math.PI;

  yVel -= deltaTime * gravity;
  avatarAltitude += yVel * deltaTime;

  if (avatarAltitude < 0)
    {
      avatarAltitude = 0;
      yVel = 0;
      hasDoubleJump = true;
    }

  GAME_CameraUpdate (deltaTime);

  elapsed += deltaTime;

  requestAnimFrame (GAME_Update);
}
