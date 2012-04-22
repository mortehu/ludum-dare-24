/*  Untitled Game
    Copyright (C) 2012  Morten Hustveit

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/***********************************************************************/

var DRAW_vertices = new Array ();
var DRAW_textureCoords = new Array ();
var DRAW_currentTexture;
var DRAW_camera;
var DRAW_alpha = 1.0;
var DRAW_blendMode = 0;

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

function DRAW_SetBlendMode (mode)
{
  if (mode == DRAW_blendMode)
    return;

  DRAW_Flush ();

  DRAW_blendMode = mode;
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

  switch (DRAW_blendMode)
    {
    case 0: gl.blendFunc (gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); break;
    case 1: gl.blendFunc (gl.SRC_ALPHA, gl.ONE); break;
    }

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
  DRAW_textureCoords.push (1.0);

  DRAW_textureCoords.push (0.0);
  DRAW_textureCoords.push (0.0);

  DRAW_textureCoords.push (1.0);
  DRAW_textureCoords.push (0.0);

  DRAW_textureCoords.push (0.0);
  DRAW_textureCoords.push (1.0);

  DRAW_textureCoords.push (1.0);
  DRAW_textureCoords.push (0.0);

  DRAW_textureCoords.push (1.0);
  DRAW_textureCoords.push (1.0);
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

function DRAW_Number (number, x, y)
{
  DRAW_SetAlpha (1.0);

  do
    {
      var digit;
      var s0;

      digit = number % 10;

      s0 = digit * 11 / 256.0;

      DRAW_AddQuadST (GFX_font, x, y, 11, 16, s0, 1, s0 + 11 / 256.0, 0);

      x -= 11;
      number = Math.floor (number / 10);
    }
  while (number > 0);
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

var SYS_keys = {};
var SYS_mouseX = 0, SYS_mouseY = 0;
var lastTime = 0;

function SYS_Init ()
{
  var canvas = document.getElementById ("game-canvas");

  if (!(gl = WebGLUtils.setupWebGL (canvas)))
    return;

  document.onkeydown = function (event) { GAME_KeyPressed (event); };
  document.onkeyup = function (event) { GAME_KeyRelease (event); };
  canvas.onmousemove = function (event) { GAME_MouseMoved (event, this); }
  canvas.onmousedown = function (event) { GAME_ButtonPressed (event); }
  canvas.onselectstart = function () { return false; }

  gl.viewportWidth = canvas.width;
  gl.viewportHeight = canvas.height;

  gl.viewport (0, 0, gl.viewportWidth, gl.viewportHeight);

  DRAW_SetupShaders ();

  gl.clearColor (0.0, 0.0, 0.0, 0.0);
  gl.disable (gl.DEPTH_TEST);

  gl.enable (gl.BLEND);
  gl.disable (gl.CULL_FACE);
}

/***********************************************************************/

var baddies = [];
var bombs = [];
var planets = [];
var particles = [];
var elapsed = 0;
var gravity = 500.0 / 128.0;
var hasDoubleJump = true;
var laserAge = 1.0;

var teleportFromX, teleportFromY;
var teleportToX, teleportToY;
var teleportAge = 1.0;

var GFX_atmosphere;
var GFX_avatar, GFX_arm;
var GFX_avatarWalk = [];
var GFX_baddie;
var GFX_black;
var GFX_bomb;
var GFX_coin;
var GFX_font;
var GFX_help;
var GFX_laser;
var GFX_mine;
var GFX_particle0;
var GFX_planetSelector;
var GFX_planets = [];
var GFX_stars0, GFX_stars1;
var GFX_teleport;
var GFX_teleportMachine;

var avatarAngle = 0, avatarAltitude = 0, yVel = 0, xVel = 0, avatarFlipped = true;
var avatarWalkDistance = 0.0;
var avatarHealth = 500.0;
var coinsLeft = 0;
var homePlanet = 0;

function GAME_NewPlanet (x, y, radius)
{
  var newPlanet = new Object;

  newPlanet.x = x;
  newPlanet.y = y;
  newPlanet.radius = radius;
  newPlanet.coins = [];
  newPlanet.teleports = [];
  newPlanet.sprite = GFX_planets [Math.floor (Math.random () * GFX_planets.length) % GFX_planets.length];

  for (var i = 0; i < 10; ++i)
    {
      var coin;

      coin = new Object;
      coin.angle = i * Math.PI * 2 / 10.0;
      if (Math.random () < 0.60)
        coin.altitude = 18;
      else
        coin.altitude = 50;
      if (coin.friendly = Math.random () < 0.80)
        ++coinsLeft;

      newPlanet.coins.push (coin);
    }

  planets.push (newPlanet);
}

function GAME_NewBaddie (x, y)
{
  var baddie;

  baddie = new Object;
  baddie.x = x;
  baddie.y = y;
  baddie.velX = 0;
  baddie.velY = 0;
  baddie.angle = 0;
  baddie.collisionAvoidance = -1;
  baddie.health = 1.0;
  baddies.push (baddie);
}

function GAME_NewBomb (x, y, velX, velY)
{
  var bomb, avatarPosition, magnitude;

  bomb = new Object;
  bomb.x = x;
  bomb.y = y;
  bomb.velX = velX;
  bomb.velY = velY;

  bombs.push (bomb);
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

function GAME_FindTeleports ()
{
  var i, j;
  var planetA, planetB;
  var deltaX, deltaY;
  var distance, angle;

  for (i = 0; i < planets.length; ++i)
    {
      planetA = planets[i];

      for (j = i + 1; j < planets.length; ++j)
        {
          planetB = planets[j];

          deltaX = planetB.x - planetA.x;
          deltaY = planetB.y - planetA.y;

          distance = deltaX * deltaX + deltaY * deltaY;

          if (distance > 300000)
            continue;

          angle = Math.atan2 (deltaX, -deltaY) - Math.PI * 0.5;

          planetA.teleports.push (angle);
          planetB.teleports.push ((angle + Math.PI) % (2 * Math.PI));
        }
    }
}

function GAME_SetupTextures ()
{
  GFX_arm = DRAW_LoadTexture ("gfx/arm.png");
  GFX_atmosphere = DRAW_LoadTexture ("gfx/atmosphere.png");
  GFX_avatar = DRAW_LoadTexture ("gfx/avatar.png");
  GFX_avatarWalk.push (DRAW_LoadTexture ("gfx/avatar0.png"));
  GFX_avatarWalk.push (GFX_avatar);
  GFX_avatarWalk.push (DRAW_LoadTexture ("gfx/avatar4.png"));
  GFX_avatarWalk.push (GFX_avatar);
  GFX_baddie = DRAW_LoadTexture ("gfx/baddie.png");
  GFX_black = DRAW_LoadTexture ("gfx/black.png");
  GFX_bomb = DRAW_LoadTexture ("gfx/bomb.png");
  GFX_coin = DRAW_LoadTexture ("gfx/coin.png");
  GFX_font = DRAW_LoadTexture ("gfx/font.png");
  GFX_help = DRAW_LoadTexture ("gfx/help.png");
  GFX_laser = DRAW_LoadTexture ("gfx/laser.png");
  GFX_mine = DRAW_LoadTexture ("gfx/mine.png");
  GFX_particle0 = DRAW_LoadTexture ("gfx/particle0.png");
  GFX_planetSelector = DRAW_LoadTexture ("gfx/planet-selector.png");
  GFX_planets.push(DRAW_LoadTexture ("gfx/planet0.png"));
  GFX_planets.push(DRAW_LoadTexture ("gfx/planet1.png"));
  GFX_planets.push(DRAW_LoadTexture ("gfx/planet2.png"));
  GFX_stars0 = DRAW_LoadTexture ("gfx/stars0.png");
  GFX_stars1 = DRAW_LoadTexture ("gfx/stars1.png");
  GFX_teleport = DRAW_LoadTexture ("gfx/teleport.png");
  GFX_teleportMachine = DRAW_LoadTexture ("gfx/teleport-machine.png");
}

function GAME_GenPlanet ()
{
  var r, i, j, x, y, angle, iters;

  for (iters = 0; iters < 1000; ++iters)
    {
      r = Math.random ();
      r = Math.pow (r, 1.5); /* Cluster planets around the first planet */

      i = Math.floor (r * (planets.length + 1)) % planets.length;

      angle = Math.random () * Math.PI * 2;
      x = planets[i].x + Math.cos (angle) * 543.058007951;
      y = planets[i].y + Math.sin (angle) * 543.058007951;

      for (j = 0; j < planets.length; ++j)
        {
          var deltaX, deltaY;

          if (j == i)
            continue;

          deltaX = x - planets[j].x;
          deltaY = y - planets[j].y;

          if (deltaX * deltaX + deltaY * deltaY < 540 * 640)
            break;
        }

      if (j == planets.length)
        break;
    }

  if (iters == 1000)
    return;

  GAME_NewPlanet (x, y, 64 + Math.random() * 64);
}

function GAME_Init ()
{
  var i;

  SYS_Init ();

  DRAW_camera = new Object;
  DRAW_camera.x = -400.0;
  DRAW_camera.y = -300.0;
  DRAW_camera.velX = 0;
  DRAW_camera.velY = 0;

  GAME_SetupTextures ();

  GAME_NewPlanet (0, 0, 128);

  for (i = 0; i < 16; ++i)
    GAME_GenPlanet ();

  GAME_FindTeleports ();

  setTimeout("GAME_BaddiesSpawn()", 1000);
  setTimeout("GAME_BombsSpawn()", 1000);

  GAME_Update ();
}

function GAME_SkyDraw ()
{
  var s0x, s0y, s1x, s1y;

  s0x = DRAW_camera.x * 0.0002;
  s0y = DRAW_camera.y * 0.0002;
  s1x = DRAW_camera.x * 0.000075;
  s1y = DRAW_camera.y * 0.000075;

  DRAW_AddQuadST (GFX_stars0, DRAW_camera.x, DRAW_camera.y, gl.viewportWidth, gl.viewportHeight,
                  s0x, s0y, s0x + 1.0, s0y + gl.viewportHeight / gl.viewportWidth);

  DRAW_SetBlendMode (1);
  DRAW_AddQuadST (GFX_stars1, DRAW_camera.x, DRAW_camera.y, gl.viewportWidth, gl.viewportHeight,
                  s1x, s1y, s1x + 1.0, s1y + gl.viewportHeight / gl.viewportWidth);

  DRAW_SetBlendMode (0);
}

function GAME_AvatarPosition (up)
{
  var planet;
  var result = new Object;

  planet = planets[homePlanet];

  y = avatarAltitude + planet.radius + up;

  result.x = planet.x + Math.cos(avatarAngle - Math.PI * 0.5) * y;
  result.y = planet.y + Math.sin(avatarAngle - Math.PI * 0.5) * y;

  return result;
}

function GAME_AvatarDraw ()
{
  var planet;
  var x, y, deltaX, deltaY, armX, armY;
  var sprite;
  var c, s;

  planet = planets[homePlanet];

  y = avatarAltitude + planet.radius;

  if (avatarAltitude)
    sprite = GFX_avatarWalk[0];
  else if (xVel)
    sprite = GFX_avatarWalk[Math.floor (avatarWalkDistance * 0.04 % 4)];
  else
    sprite = GFX_avatar;

  c = Math.cos(avatarAngle - Math.PI * 0.5);
  s = Math.sin(avatarAngle - Math.PI * 0.5);

  armX = planet.x + c * (y + 20);
  armY = planet.y + s * (y + 20);

  deltaX = SYS_mouseX + DRAW_camera.x - armX;
  deltaY = SYS_mouseY + DRAW_camera.y - armY;

  DRAW_AddQuadAngle (GFX_arm, armX, armY, 4, 8, Math.atan2 (deltaX, -deltaY), false);
  DRAW_AddQuadAngle (sprite, planet.x + c * y, planet.y + s * y, 32, 32, avatarAngle, avatarFlipped);
}

function GAME_KeyPressed(e)
{
  var ch;

  ch = String.fromCharCode (e.keyCode);

  if (SYS_keys[ch])
    return;

  SYS_keys[ch] = true;

  switch (String.fromCharCode (e.keyCode))
    {
    case 'W':

      if (homePlanet != (nextPlanet = GAME_NearestPlanet ()))
        {
          var deltaX, deltaY;
          var avatarPosition;

          avatarPosition = GAME_AvatarPosition (16);
          teleportFromX = avatarPosition.x;
          teleportFromY = avatarPosition.y;

          deltaX = planets[nextPlanet].x - planets[homePlanet].x;
          deltaY = planets[nextPlanet].y - planets[homePlanet].y;

          homePlanet = nextPlanet;
          avatarAngle = Math.atan2(-deltaX, deltaY);
          avatarFlipped = !avatarFlipped;

          avatarPosition = GAME_AvatarPosition (16);
          teleportToX = avatarPosition.x;
          teleportToY = avatarPosition.y;
          teleportAge = 0.0;
        }

      break;

    case ' ':

      if (avatarAltitude == 0)
        yVel = 200;
      else if (hasDoubleJump && yVel < 120)
        {
          yVel = 120;
          hasDoubleJump = false;
        }

      break;
    }
}

function GAME_KeyRelease (e)
{
  SYS_keys[String.fromCharCode (e.keyCode)] = false;
}

function GAME_MouseMoved (ev, el)
{
  SYS_mouseX = ev.pageX - el.offsetLeft;
  SYS_mouseY = ev.pageY - el.offsetTop;
}

function GAME_ButtonPressed (ev)
{
  if (laserAge > 0.15)
    laserAge = 0.0;
}

function GAME_RayCollide (fromX, fromY, dirX, dirY, deltaTime)
{
  var i, j;
  var distance = 1000.0;
  var magnitude;
  var hitObject = -1, hitSubObject, hitObjectType;
  var deltaX, deltaY;
  var dist;
  var a, b, c, d, discr;

  magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
  dirX /= magnitude;
  dirY /= magnitude;

  for (i = 0; i < planets.length; ++i)
    {
      var planet;

      planet = planets[i];

      deltaX = fromX - planet.x;
      deltaY = fromY - planet.y;

      if (!(planet.inRange = deltaX * deltaX + deltaY * deltaY < 1000 * 1000))
        continue;

      b = 2 * (deltaX * dirX + deltaY * dirY);
      c = deltaX * deltaX + deltaY * deltaY - planet.radius * planet.radius;

      discr = b * b - 4 * c;

      if (discr < 0)
        continue;

      discr = Math.sqrt (discr);

      dist = (-b - discr) * 0.5;

      if (dist < 0)
        {
          dist = (-b + discr) * 0.5;

          if (dist < 0)
            continue;
        }

      if (dist < distance)
        distance = dist;
    }

  for (i = 0; i < planets.length; ++i)
    {
      var planet, coins;

      planet = planets[i];

      if (!planet.inRange)
        continue;

      coins = planet.coins;

      for (j = 0; j < coins.length; ++j)
        {
          var coin;
          var x, y;

          coin = coins[j];

          if (coin.friendly)
            continue;

          x = planet.x + Math.cos (coin.angle) * (planet.radius + coin.altitude) - 8;
          y = planet.y + Math.sin (coin.angle) * (planet.radius + coin.altitude) - 8;

          deltaX = fromX - x;
          deltaY = fromY - y;

          b = 2 * (deltaX * dirX + deltaY * dirY);
          c = deltaX * deltaX + deltaY * deltaY - 16 * 16;

          discr = b * b - 4 * c;

          if (discr < 0)
            continue;

          discr = Math.sqrt (discr);

          dist = (-b - discr) * 0.5;

          if (dist < 0)
            {
              dist = (-b + discr) * 0.5;

              if (dist < 0)
                continue;
            }

          if (dist < distance)
            {
              distance = dist;
              hitObject = i; 
              hitSubObject = j;
              hitObjectType = 'mine';
            }
        }
    }

  for (i = 0; i < baddies.length; ++i)
    {
      var baddie;

      baddie = baddies[i];

      deltaX = fromX - baddie.x;
      deltaY = fromY - baddie.y;

      b = 2 * (deltaX * dirX + deltaY * dirY);
      c = deltaX * deltaX + deltaY * deltaY - 16 * 16;

      discr = b * b - 4 * c;

      if (discr < 0)
        {
          ++i;

          continue;
        }

      discr = Math.sqrt (discr);

      dist = (-b - discr) * 0.5;

      if (dist < 0)
        {
          dist = (-b + discr) * 0.5;

          if (dist < 0)
            continue;
        }

      if (dist < distance)
        {
          distance = dist;
          hitObject = i;
          hitObjectType = 'baddie';
        }
    }

  if (hitObject >= 0)
    {
      if (hitObjectType == 'baddie')
        {
          var baddie;

          distance = dist;

          baddie = baddies[hitObject];

          baddie.health -= (avatarAltitude ? 5 : 1) * deltaTime;
          baddie.velX += dirX * deltaTime * 1000;
          baddie.velY += dirY * deltaTime * 1000;

          if (baddie.health < 0)
            {
              for (var j = 0; j < 40; ++j)
                {
                  particle = new Object;
                  particle.x = baddie.x;
                  particle.y = baddie.y;
                  particle.velX = (Math.random() - 0.5) * 32;
                  particle.velY = (Math.random() - 0.5) * 32;
                  particle.age = 0;
                  particles.push (particle);
                }

              baddies.splice (hitObject, 1);
            }
        }
      else if (hitObjectType == 'mine')
        {
          mine = planets[hitObject].coins[hitSubObject];

          x = planets[hitObject].x + Math.cos (mine.angle) * (planets[hitObject].radius + mine.altitude) - 8;
          y = planets[hitObject].y + Math.sin (mine.angle) * (planets[hitObject].radius + mine.altitude) - 8;

          for (var j = 0; j < 40; ++j)
            {
              particle = new Object;
              particle.x = x;
              particle.y = y;
              particle.velX = (Math.random() - 0.5) * 32;
              particle.velY = (Math.random() - 0.5) * 32;
              particle.age = 0;
              particles.push (particle);
            }

          planets[hitObject].coins.splice (hitSubObject, 1);
        }
    }

  return distance;
}

function GAME_AngleDistance (a, b)
{
  if (a < 0) a += 2 * Math.pi;
  if (b < 0) b += 2 * Math.pi;

  if (Math.abs (a - b) < Math.PI)
    return Math.abs (a - b);

  if (a > b)
    return Math.abs (b - (a - 2 * Math.PI));

  return Math.abs (a - (b - 2 * Math.PI));
}

function GAME_Cruise (position, target, maxAcceleration, maxVelocity, deltaTime)
{
  var distance;
  var dirX, dirY;
  var velocity;
  var targetVelocityX, targetVelocityY, targetVelocity;
  var deltaVelocityX, deltaVelocityY, deltaVelocity;

  dirX = target.x - position.x;
  dirY = target.y - position.y;
  distance = Math.sqrt (dirX * dirX + dirY * dirY);

  if (distance)
    {
      dirX /= distance;
      dirY /= distance;
    }

  targetVelocity = Math.sqrt (distance / maxAcceleration) * maxAcceleration;

  if (targetVelocity > maxVelocity)
    targetVelocity = maxVelocity;

  if (targetVelocity * deltaTime > distance)
    targetVelocity = distance / deltaTime;

  velocity = Math.sqrt (position.velX * position.velX + position.velY * position.velY);

  targetVelocityX = dirX * targetVelocity;
  targetVelocityY = dirY * targetVelocity;

  deltaVelocityX = targetVelocityX - position.velX;
  deltaVelocityY = targetVelocityY - position.velY;

  deltaVelocity = Math.sqrt (deltaVelocityX * deltaVelocityX + deltaVelocityY * deltaVelocityY);

  /* Can we reach the target velocity in less than `deltaTime' seconds? */
  if (deltaVelocity < maxAcceleration * deltaTime)
    {
      position.velX = targetVelocityX;
      position.velY = targetVelocityY;
    }
  else
    {
      /* Apply maximum acceleration in the direction of the target/current velocity delta */
      position.velX += (deltaVelocityX / deltaVelocity) * maxAcceleration * deltaTime;
      position.velY += (deltaVelocityY / deltaVelocity) * maxAcceleration * deltaTime;
    }

  position.x += position.velX * deltaTime;
  position.y += position.velY * deltaTime;
}

/* Move camera towards target, constrained by maximum acceleration and velocity */
function GAME_CameraUpdate (deltaTime)
{
  var target;

  var avatarPosition = GAME_AvatarPosition (16);
  target = new Object;
  target.x = avatarPosition.x - gl.viewportWidth * 0.5;
  target.y = avatarPosition.y - gl.viewportHeight * 0.5;

  GAME_Cruise (DRAW_camera, target, 1000.0, 1500.0, deltaTime);
}

function GAME_PlanetsDraw ()
{
  var nearestPlanet;
  var i, j;
  var coinAnim;

  coinAnim = Math.sin (elapsed * 2) * 3;

  avatarPosition = GAME_AvatarPosition (16);

  nearestPlanet = GAME_NearestPlanet ();

  for (i = 0; i < planets.length; ++i)
    {
      var planet = planets[i];
      var coins = planet.coins;
      var teleports = planet.teleports;

      DRAW_SetBlendMode (0);
      DRAW_AddCircle (planet.sprite, planet.x, planet.y, planet.radius);

      DRAW_SetBlendMode (1);
      DRAW_AddQuad (GFX_atmosphere, planet.x - planet.radius - 16, planet.y - planet.radius - 16, 2 * planet.radius + 32, 2 * planet.radius + 32);

      if (i == nearestPlanet && nearestPlanet != homePlanet)
        DRAW_AddQuad (GFX_planetSelector, planet.x - planet.radius - 10, planet.y - planet.radius - 10, 2 * planet.radius + 20, 2 * planet.radius + 20);

      for (j = 0; j < coins.length; )
        {
          var coin = coins[j];
          var x, y;
          var deltaX, deltaY;

          x = planet.x + Math.cos (coin.angle) * (planet.radius + coin.altitude + coinAnim) - 8;
          y = planet.y + Math.sin (coin.angle) * (planet.radius + coin.altitude + coinAnim) - 8;

          deltaX = avatarPosition.x - x;
          deltaY = avatarPosition.y - y;

          if (deltaX * deltaX + deltaY * deltaY < 22 * 22)
            {
              if (coin.friendly)
                {
                  avatarHealth += 50;
                  --coinsLeft;
                }
              else
                {
                  avatarHealth *= 0.5;

                  for (var k = 0; k < 10; ++k)
                    {
                      particle = new Object;
                      particle.x = x;
                      particle.y = y;
                      particle.velX = (Math.random() - 0.5) * 32;
                      particle.velY = (Math.random() - 0.5) * 32;
                      particle.age = 0;
                      particles.push (particle);
                    }
                }

              coins.splice (j, 1);

              continue;
            }
          else
            ++j;

          DRAW_AddQuad (coin.friendly ? GFX_coin : GFX_mine, x, y, 16, 16);
        }

      for (j = 0; j < teleports.length; ++j)
        {
          var teleport;
          var x, y;

          teleport = teleports[j];

          x = planet.x + Math.cos (teleport) * planet.radius;
          y = planet.y + Math.sin (teleport) * planet.radius;

          DRAW_AddQuadAngle (GFX_teleportMachine, x, y, 16, 16, teleport + Math.PI * 0.5, false);
        }
    }
}

function GAME_Draw (deltaTime)
{
  gl.uniform4f (gl.getUniformLocation (shaderProgram, "uniform_Camera"), 1.0 / gl.viewportWidth, 1.0 / gl.viewportHeight, DRAW_camera.x, DRAW_camera.y);

  DRAW_SetAlpha (1.0);

  GAME_SkyDraw ();

  DRAW_SetBlendMode (1);
  DRAW_SetAlpha (1.0);

  if (laserAge < 0.15)
    {
      var angle;
      var toX, toY;
      var distance;

      avatarPosition = GAME_AvatarPosition (20);

      toX = SYS_mouseX + DRAW_camera.x;
      toY = SYS_mouseY + DRAW_camera.y;
      angle = Math.atan2 (toX - avatarPosition.x, -(toY - avatarPosition.y));

      /* XXX: Game code in the draw code */
      if (1000 > (distance = GAME_RayCollide (avatarPosition.x, avatarPosition.y, toX - avatarPosition.x, toY - avatarPosition.y, deltaTime)))
        {
          var deltaX, deltaY;
          var magScale;
          var particle;

          deltaX = toX - avatarPosition.x;
          deltaY = toY - avatarPosition.y;
          magScale = 1.0 / Math.sqrt (deltaX * deltaX + deltaY * deltaY);
          deltaX *= magScale;
          deltaY *= magScale;

          toX = avatarPosition.x + deltaX * distance;
          toY = avatarPosition.y + deltaY * distance;

          for (var j = 0; j < 10; ++j)
            {
              particle = new Object;
              particle.x = toX;
              particle.y = toY;
              particle.velX = (Math.random() - 0.5) * 4;
              particle.velY = (Math.random() - 0.5) * 4;
              particle.age = 0;
              particles.push (particle);
            }
        }

      DRAW_SetAlpha (1.0 - laserAge / 0.15);
      DRAW_AddQuadAngle (GFX_laser, avatarPosition.x, avatarPosition.y, 4.0, distance, angle);
    }

  if (teleportAge < 0.5)
    {
      var distance, angle;

      distance = Math.sqrt ((teleportToX - teleportFromX) * (teleportToX - teleportFromX) + (teleportToY - teleportFromY) * (teleportToY - teleportFromY));
      angle = Math.atan2 (teleportToX - teleportFromX, -(teleportToY - teleportFromY));

      DRAW_SetAlpha (1.0 - teleportAge * 2.0);
      DRAW_AddQuadAngle (GFX_teleport, teleportFromX, teleportFromY, 4.0, distance, angle);
    }

  DRAW_SetAlpha (1.0);
  DRAW_SetBlendMode (0);

  GAME_PlanetsDraw ();

  GAME_AvatarDraw ();

  for (var i = 0; i < bombs.length; ++i)
    {
      var bomb;

      bomb = bombs[i];

      DRAW_AddQuad (GFX_bomb, bomb.x - 2, bomb.y - 2, 4, 4);
    }

  for (var i = 0; i < baddies.length; ++i)
    {
      var baddie;

      baddie = baddies[i];

      DRAW_AddQuad (GFX_baddie, baddie.x - 16, baddie.y - 16, 32, 32);
    }

  DRAW_SetBlendMode (1);

  for (var i = 0; i < particles.length; ++i)
    {
      var particle;
      var scale;

      particle = particles[i];
      scale = 8 + particle.age * 4;

      DRAW_SetAlpha (1.0 - particle.age);
      DRAW_AddQuad (GFX_particle0, particle.x - scale, particle.y - scale, scale * 2, scale * 2);
    }

  DRAW_SetBlendMode (0);

  if (avatarHealth < 500.0)
    {
      if (avatarHealth > 0.0)
        DRAW_SetAlpha (1.0 - avatarHealth / 500.0);
      else
        DRAW_SetAlpha (1.0);

      DRAW_AddQuad (GFX_black, DRAW_camera.x, DRAW_camera.y, gl.viewportWidth, gl.viewportHeight);
    }

  if (SYS_keys['H'])
    {
      DRAW_SetAlpha (1.0);
      DRAW_AddQuad (GFX_help, DRAW_camera.x + gl.viewportWidth * 0.5 - gl.viewportHeight * 0.5, DRAW_camera.y, gl.viewportHeight, gl.viewportHeight);
    }

  DRAW_Number (coinsLeft, DRAW_camera.x + 100, DRAW_camera.y + 100);

  DRAW_Flush ();
}

function GAME_BaddiesSpawn ()
{
  if (baddies.length < 2)
    {
      r = Math.random ();

      if (r < 0.25)
        GAME_NewBaddie (DRAW_camera.x + gl.viewportWidth * 0.5, DRAW_camera.y - 50);
      else if (r < 0.50)
        GAME_NewBaddie (DRAW_camera.x - 50,                     DRAW_camera.y + gl.viewportHeight * 0.5);
      else if (r < 0.75)
        GAME_NewBaddie (DRAW_camera.x + gl.viewportWidth + 50,  DRAW_camera.y + gl.viewportHeight * 0.5);
      else
        GAME_NewBaddie (DRAW_camera.x + gl.viewportWidth * 0.5, DRAW_camera.y + gl.viewportHeight + 50);
    }

  setTimeout("GAME_BaddiesSpawn()", 10000);
}

function GAME_BombsSpawn ()
{
  for (var i = 0; i < baddies.length; ++i)
    {
      GAME_NewBomb (baddies[i].x, baddies[i].y,
                    baddies[i].velX * 0.5 + (Math.random () - 0.5) * 50,
                    baddies[i].velY * 0.5 + (Math.random () - 0.5) * 50);
    }

  setTimeout("GAME_BombsSpawn()", 1000);
}

function GAME_Move (deltaTime)
{
  var friction;
  var hPlanet;

  laserAge += deltaTime;
  teleportAge += deltaTime;

  hPlanet = planets[homePlanet];

  avatarPosition = GAME_AvatarPosition (16);

  for (var i = 0; i < baddies.length; )
    {
      var baddie;
      var target, deltaX, deltaY, angle;
      var magnitude;

      baddie = baddies[i];
      target = new Object;

      for (var j = 0; j < planets.length; ++j)
        {
          deltaX = baddie.x - planets[j].x;
          deltaY = baddie.y - planets[j].y;

          if (deltaX * deltaX + deltaY * deltaY < planets[j].radius * planets[j].radius + 16 * 16)
            break;
        }

      if (j != planets.length)
        {
          var r;

          for (var j = 0; j < 40; ++j)
            {
              particle = new Object;
              particle.x = baddie.x;
              particle.y = baddie.y;
              particle.velX = (Math.random() - 0.5) * 32;
              particle.velY = (Math.random() - 0.5) * 32;
              particle.age = 0;
              particles.push (particle);
            }

          baddies.splice (i, 1);

          continue;
        }
      else
        ++i;

      deltaX = baddie.x - hPlanet.x;
      deltaY = baddie.y - hPlanet.y;
      magnitude = Math.sqrt (deltaX * deltaX + deltaY * deltaY);

      angle = Math.atan2 (deltaX, -deltaY);

      if (magnitude < 200 || GAME_AngleDistance (angle, avatarAngle) > Math.PI * 0.5)
        {
          target.x = hPlanet.x + Math.sin (angle + 0.1) * 271;
          target.y = hPlanet.y - Math.cos (angle + 0.1) * 271;
        }
      else
        {
          target.x = hPlanet.x + Math.sin (avatarAngle + i) * 271;
          target.y = hPlanet.y - Math.cos (avatarAngle + i) * 271;
        }

      GAME_Cruise (baddie, target, 600.0, 600.0, deltaTime);
    }

  for (var i = 0; i < bombs.length; )
    {
      var bomb;
      var deltaX, deltaY;
      var magnitude;
      var magScale;
      var collide = false;

      bomb = bombs[i];

      deltaX = bomb.x - avatarPosition.x;
      deltaY = bomb.y - avatarPosition.y;

      if (deltaX * deltaX + deltaY * deltaY < 13 * 13)
        {
          avatarHealth *= 0.8;
          collide = true;
        }
      else
        {
          for (var j = 0; j < planets.length; ++j)
            {
              var planet;

              planet = planets[j];

              deltaX = bomb.x - planet.x;
              deltaY = bomb.y - planet.y;
              magnitude = deltaX * deltaX + deltaY * deltaY;

              if (magnitude < planet.radius * planet.radius)
                {
                  collide = true;

                  break;
                }
            }
        }

      if (collide)
        {
          bombs.splice (i, 1);

          for (var j = 0; j < 10; ++j)
            {
              particle = new Object;
              particle.x = bomb.x;
              particle.y = bomb.y;
              particle.velX = (Math.random() - 0.5) * 4;
              particle.velY = (Math.random() - 0.5) * 4;
              particle.age = 0.5;
              particles.push (particle);
            }

          continue;

        }

      ++i;

      deltaX = avatarPosition.x - bomb.x;
      deltaY = avatarPosition.y - bomb.y;
      magScale = 1.0 / Math.sqrt (deltaX * deltaX + deltaY * deltaY);
      deltaX *= magScale;
      deltaY *= magScale;

      bomb.velX += deltaTime * deltaX * 1000.0;
      bomb.velY += deltaTime * deltaY * 1000.0;

      magnitude = Math.sqrt (bomb.velX * bomb.velX + bomb.velY * bomb.velY);

      if (magnitude > 500)
        {
          magScale = 500.0 / magnitude;
          bomb.velX *= magScale;
          bomb.velY *= magScale;
        }

      bomb.x += deltaTime * bomb.velX;
      bomb.y += deltaTime * bomb.velY;
    }

  for (var i = 0; i < particles.length; )
    {
      var particle;

      particle = particles[i];

      particle.x += deltaTime * particle.velX;
      particle.y += deltaTime * particle.velY;
      particle.age += deltaTime;

      if (particle.age > 1.0)
          particles.splice (i, 1);
      else
        ++i;
    }

  friction = avatarAltitude ? 0.3 : 1.0;

  if (SYS_keys['A'])
    {
      xVel -= friction * deltaTime * 6.0;
      if (xVel < -1.5)
        xVel = -1.5;
      avatarFlipped = false;
    }
  else if (SYS_keys['D'])
    {
      xVel += friction * deltaTime * 6.0;
      if (xVel > 1.5)
        xVel = 1.5;
      avatarFlipped = true;
    }
  else if (xVel > 0)
    {
      xVel -= friction * deltaTime * 6.0;
      if (xVel < 0.0)
        xVel = 0.0;
      avatarFlipped = true;
    }
  else if (xVel < 0)
    {
      xVel += friction * deltaTime * 6.0;
      if (xVel < 0.0)
        xVel = 0.0;
      avatarFlipped = false;
    }

  if (avatarAltitude || !xVel)
    avatarWalkDistance = 0;

  var walkAngle;
  walkAngle = xVel * deltaTime / (hPlanet.radius / 128);

  avatarWalkDistance += Math.abs (walkAngle) * 2 * hPlanet.radius;
  avatarAngle += walkAngle;

  while (avatarAngle < 0.0)
    avatarAngle += 2 * Math.PI;
  avatarAngle %= 2 * Math.PI;

  yVel -= deltaTime * gravity * hPlanet.radius;
  avatarAltitude += yVel * deltaTime;

  if (avatarAltitude < 0)
    {
      avatarAltitude = 0;
      yVel = 0;
      hasDoubleJump = true;
    }

  GAME_CameraUpdate (deltaTime);

  elapsed += deltaTime;
}

function GAME_Update ()
{
  var timeNow, deltaTime;
  var avatarPosition;

  timeNow = new Date ().getTime ();
  deltaTime = (timeNow - lastTime) * 0.001;
  lastTime = timeNow;

  if (deltaTime < 0 || deltaTime > 0.033)
    deltaTime = 0.033;

  GAME_Draw (deltaTime);

  if (!SYS_keys['H'] && avatarHealth)
    GAME_Move (deltaTime);

  requestAnimFrame (GAME_Update);
}
