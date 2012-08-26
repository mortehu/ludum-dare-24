/*  Ludum Dare 24 Entry
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

soundManager.preferFlash = true;
soundManager.flashVersion = 9;
soundManager.url = 'swf/';

soundManager.onload = function()
{
  soundManager.createSound({ id:'placeholder', url:'sfx/sine.mp3', multiShot: true, autoLoad: true });
}

soundManager.onerror = function()
{
}

/***********************************************************************/

var GAME_CELL_COST = 20.0;
var GAME_CELL_ENERGY_COST = 10.0;
var GAME_CELL_BLINK_MIN = 5.0;
var GAME_CELL_BLINK_EXTRA = 4.0;
var GAME_BADDIE_DAMAGE = 15.0;
var GAME_BADDIE_SPAWN_DISTANCE = 333;
var GAME_BADDIE_ACCELERATION = 10.0;
var GAME_BLOB_RADIUS = 100.0;
var GAME_CELL_RADIUS = 20.0;
var GAME_ENERGY_CELL_UPKEEP = 0.00;
var GAME_ENERGY_SOLAR_INPUT = 10.0;
var GAME_ENERGY_STORAGE_BASE = 200.0;
var GAME_HEALTH_REGENERATION = 1.0;
var GAME_MASS_STORAGE_BASE = 200.0;
var GAME_PROJECTILE_MASS = 10.0;
var GAME_PROJECTILE_DAMAGE = 40.0;
var GAME_SCORE_DAMAGE = 3.0;

/***********************************************************************/

var gl;

var DRAW_vertices = [];
var DRAW_currentTexture;
var DRAW_red = 1.0, DRAW_green = 1.0, DRAW_blue = 1.0, DRAW_alpha = 1.0;
var DRAW_blendMode = 0;

var vertexPositionBuffer;

function DRAW_UpdateViewport ()
{
  var canvas = document.getElementById ("game-canvas");

  gl.viewportWidth = canvas.width;
  gl.viewportHeight = canvas.height;

  gl.viewport (0, 0, gl.viewportWidth, gl.viewportHeight);
}

function DRAW_SetupShaders ()
{
  var fragmentShader = DRAW_GetShaderFromElement ("shader-fs");
  var vertexShader = DRAW_GetShaderFromElement ("shader-vs");

  shaderProgram = gl.createProgram ();
  gl.attachShader (shaderProgram, vertexShader);
  gl.attachShader (shaderProgram, fragmentShader);
  gl.linkProgram (shaderProgram);

  if (!gl.getProgramParameter (shaderProgram, gl.LINK_STATUS) && !gl.isContextLost())
    {
      alert ("Could not link shaders");

      return;
    }

  gl.useProgram (shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation (shaderProgram, "attr_VertexPosition");
  gl.enableVertexAttribArray (shaderProgram.vertexPositionAttribute);

  shaderProgram.colorAttribute = gl.getAttribLocation (shaderProgram, "attr_Color");
  gl.enableVertexAttribArray (shaderProgram.colorAttribute);

  shaderProgram.textureCoordAttribute = gl.getAttribLocation (shaderProgram, "attr_TextureCoord");
  gl.enableVertexAttribArray (shaderProgram.textureCoordAttribute);

  gl.uniform1i (gl.getUniformLocation (shaderProgram, "uniform_Sampler"), 0);

  vertexPositionBuffer = gl.createBuffer ();

  gl.bindBuffer (gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer (shaderProgram.vertexPositionAttribute, 2, gl.FLOAT, false, 32, 0);
  gl.vertexAttribPointer (shaderProgram.colorAttribute, 4, gl.FLOAT, false, 32, 8);
  gl.vertexAttribPointer (shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 32, 24);
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

  if (!gl.getShaderParameter (shader, gl.COMPILE_STATUS) && !gl.isContextLost())
    {
      alert ("Shader compile error: " + gl.getShaderInfoLog (shader));

      return null;
    }

  return shader;
}

function DRAW_LoadTexture (url)
{
  var result;

  result = gl.createTexture ();
  result.image = new Image ();
  result.image.onload = function () { DRAW_HandleLoadedTexture (result) };
  result.image.src = url;

  return result;
}

function DRAW_HandleLoadedTexture (texture)
{
  gl.bindTexture (gl.TEXTURE_2D, texture);
  gl.pixelStorei (gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
}

function DRAW_Flush ()
{
  var vertexCount;

  vertexCount = DRAW_vertices.length / 8;

  if (!vertexCount)
    return;

  gl.bindTexture (gl.TEXTURE_2D, DRAW_currentTexture);

  switch (DRAW_blendMode)
    {
    case -1: gl.blendFunc (gl.ONE, gl.ZERO); break;
    case 0: gl.blendFunc (gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); break;
    case 1: gl.blendFunc (gl.SRC_ALPHA, gl.ONE); break;
    }

  gl.bindBuffer (gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (DRAW_vertices), gl.STREAM_DRAW);
  DRAW_vertices.length = 0;

  gl.drawArrays (gl.TRIANGLES, 0, vertexCount);
}

function DRAW_SetColor (r, g, b, a)
{
  DRAW_red = r;
  DRAW_green = g;
  DRAW_blue = b;
  DRAW_alpha = a;
}

function DRAW_AddQuad (texture, x, y, width, height)
{
  if (texture != DRAW_currentTexture)
    DRAW_Flush ();

  DRAW_currentTexture = texture;

  DRAW_vertices.push (x);
  DRAW_vertices.push (y);
  DRAW_vertices.push (DRAW_red);
  DRAW_vertices.push (DRAW_green);
  DRAW_vertices.push (DRAW_blue);
  DRAW_vertices.push (DRAW_alpha);
  DRAW_vertices.push (0.0);
  DRAW_vertices.push (0.0);

  DRAW_vertices.push (x);
  DRAW_vertices.push (y + height);
  DRAW_vertices.push (DRAW_red);
  DRAW_vertices.push (DRAW_green);
  DRAW_vertices.push (DRAW_blue);
  DRAW_vertices.push (DRAW_alpha);
  DRAW_vertices.push (0.0);
  DRAW_vertices.push (1.0);

  DRAW_vertices.push (x + width);
  DRAW_vertices.push (y + height);
  DRAW_vertices.push (DRAW_red);
  DRAW_vertices.push (DRAW_green);
  DRAW_vertices.push (DRAW_blue);
  DRAW_vertices.push (DRAW_alpha);
  DRAW_vertices.push (1.0);
  DRAW_vertices.push (1.0);

  DRAW_vertices.push (x);
  DRAW_vertices.push (y);
  DRAW_vertices.push (DRAW_red);
  DRAW_vertices.push (DRAW_green);
  DRAW_vertices.push (DRAW_blue);
  DRAW_vertices.push (DRAW_alpha);
  DRAW_vertices.push (0.0);
  DRAW_vertices.push (0.0);

  DRAW_vertices.push (x + width);
  DRAW_vertices.push (y + height);
  DRAW_vertices.push (DRAW_red);
  DRAW_vertices.push (DRAW_green);
  DRAW_vertices.push (DRAW_blue);
  DRAW_vertices.push (DRAW_alpha);
  DRAW_vertices.push (1.0);
  DRAW_vertices.push (1.0);

  DRAW_vertices.push (x + width);
  DRAW_vertices.push (y);
  DRAW_vertices.push (DRAW_red);
  DRAW_vertices.push (DRAW_green);
  DRAW_vertices.push (DRAW_blue);
  DRAW_vertices.push (DRAW_alpha);
  DRAW_vertices.push (1.0);
  DRAW_vertices.push (0.0);
}

function DRAW_AddCircle (texture, centerX, centerY, innerRadius, outerRadius)
{
  var sector, ps, pc, sectorCount;

  if (texture != DRAW_currentTexture)
    DRAW_Flush ();

  DRAW_currentTexture = texture;

  ps = 0.0;
  pc = 1.0;

  sectorCount = Math.floor (Math.sqrt (2 * Math.PI * outerRadius) * 2);

  if (innerRadius > 0)
    {
      /* Adjacent sectors */

      for (sector = 0; sector < sectorCount; ++sector)
        {
          var s, c;

          s = Math.sin((sector + 1) / sectorCount * 2 * Math.PI);
          c = Math.cos((sector + 1) / sectorCount * 2 * Math.PI);

          DRAW_vertices.push (centerX + outerRadius * ps);
          DRAW_vertices.push (centerY + outerRadius * pc);
          DRAW_vertices.push (DRAW_red);
          DRAW_vertices.push (DRAW_green);
          DRAW_vertices.push (DRAW_blue);
          DRAW_vertices.push (DRAW_alpha);
          DRAW_vertices.push (0.0);
          DRAW_vertices.push (0.0);

          DRAW_vertices.push (centerX + innerRadius * ps);
          DRAW_vertices.push (centerY + innerRadius * pc);
          DRAW_vertices.push (DRAW_red);
          DRAW_vertices.push (DRAW_green);
          DRAW_vertices.push (DRAW_blue);
          DRAW_vertices.push (DRAW_alpha);
          DRAW_vertices.push (0.0);
          DRAW_vertices.push (0.0);

          DRAW_vertices.push (centerX + innerRadius * s);
          DRAW_vertices.push (centerY + innerRadius * c);
          DRAW_vertices.push (DRAW_red);
          DRAW_vertices.push (DRAW_green);
          DRAW_vertices.push (DRAW_blue);
          DRAW_vertices.push (DRAW_alpha);
          DRAW_vertices.push (0.0);
          DRAW_vertices.push (0.0);

          DRAW_vertices.push (centerX + outerRadius * ps);
          DRAW_vertices.push (centerY + outerRadius * pc);
          DRAW_vertices.push (DRAW_red);
          DRAW_vertices.push (DRAW_green);
          DRAW_vertices.push (DRAW_blue);
          DRAW_vertices.push (DRAW_alpha);
          DRAW_vertices.push (0.0);
          DRAW_vertices.push (0.0);

          DRAW_vertices.push (centerX + innerRadius * s);
          DRAW_vertices.push (centerY + innerRadius * c);
          DRAW_vertices.push (DRAW_red);
          DRAW_vertices.push (DRAW_green);
          DRAW_vertices.push (DRAW_blue);
          DRAW_vertices.push (DRAW_alpha);
          DRAW_vertices.push (0.0);
          DRAW_vertices.push (0.0);

          DRAW_vertices.push (centerX + outerRadius * s);
          DRAW_vertices.push (centerY + outerRadius * c);
          DRAW_vertices.push (DRAW_red);
          DRAW_vertices.push (DRAW_green);
          DRAW_vertices.push (DRAW_blue);
          DRAW_vertices.push (DRAW_alpha);
          DRAW_vertices.push (0.0);
          DRAW_vertices.push (0.0);

          ps = s;
          pc = c;
        }
    }
  else
    {
      /* Cake */

      for (sector = 0; sector < sectorCount; ++sector)
        {
          var s, c;

          s = Math.sin((sector + 1) / sectorCount * 2 * Math.PI);
          c = Math.cos((sector + 1) / sectorCount * 2 * Math.PI);

          DRAW_vertices.push (centerX + outerRadius * ps);
          DRAW_vertices.push (centerY + outerRadius * pc);
          DRAW_vertices.push (DRAW_red);
          DRAW_vertices.push (DRAW_green);
          DRAW_vertices.push (DRAW_blue);
          DRAW_vertices.push (DRAW_alpha);
          DRAW_vertices.push (0.0);
          DRAW_vertices.push (0.0);

          DRAW_vertices.push (centerX);
          DRAW_vertices.push (centerY);
          DRAW_vertices.push (DRAW_red);
          DRAW_vertices.push (DRAW_green);
          DRAW_vertices.push (DRAW_blue);
          DRAW_vertices.push (DRAW_alpha);
          DRAW_vertices.push (0.0);
          DRAW_vertices.push (0.0);

          DRAW_vertices.push (centerX + outerRadius * s);
          DRAW_vertices.push (centerY + outerRadius * c);
          DRAW_vertices.push (DRAW_red);
          DRAW_vertices.push (DRAW_green);
          DRAW_vertices.push (DRAW_blue);
          DRAW_vertices.push (DRAW_alpha);
          DRAW_vertices.push (0.0);
          DRAW_vertices.push (0.0);

          ps = s;
          pc = c;
        }
    }
}

function DRAW_AddMouth (texture, centerX, centerY, innerRadius, outerRadius)
{
  var sector, ps, pc, sectorCount;

  if (texture != DRAW_currentTexture)
    DRAW_Flush ();

  DRAW_currentTexture = texture;

  ps = Math.sin(Math.PI * 1.5);
  pc = Math.cos(Math.PI * 1.5);

  for (sector = 0; sector < 4; ++sector)
    {
      var s, c;

      s = Math.sin(Math.PI * 1.5 + (sector + 1) / 8 * 2 * Math.PI);
      c = Math.cos(Math.PI * 1.5 + (sector + 1) / 8 * 2 * Math.PI);

      DRAW_vertices.push (centerX + outerRadius * ps);
      DRAW_vertices.push (centerY + outerRadius * pc);
      DRAW_vertices.push (DRAW_red);
      DRAW_vertices.push (DRAW_green);
      DRAW_vertices.push (DRAW_blue);
      DRAW_vertices.push (DRAW_alpha);
      DRAW_vertices.push (0.0);
      DRAW_vertices.push (0.0);

      DRAW_vertices.push (centerX + innerRadius * ps);
      DRAW_vertices.push (centerY + innerRadius * pc);
      DRAW_vertices.push (DRAW_red);
      DRAW_vertices.push (DRAW_green);
      DRAW_vertices.push (DRAW_blue);
      DRAW_vertices.push (DRAW_alpha);
      DRAW_vertices.push (0.0);
      DRAW_vertices.push (0.0);

      DRAW_vertices.push (centerX + innerRadius * s);
      DRAW_vertices.push (centerY + innerRadius * c);
      DRAW_vertices.push (DRAW_red);
      DRAW_vertices.push (DRAW_green);
      DRAW_vertices.push (DRAW_blue);
      DRAW_vertices.push (DRAW_alpha);
      DRAW_vertices.push (0.0);
      DRAW_vertices.push (0.0);

      DRAW_vertices.push (centerX + outerRadius * ps);
      DRAW_vertices.push (centerY + outerRadius * pc);
      DRAW_vertices.push (DRAW_red);
      DRAW_vertices.push (DRAW_green);
      DRAW_vertices.push (DRAW_blue);
      DRAW_vertices.push (DRAW_alpha);
      DRAW_vertices.push (0.0);
      DRAW_vertices.push (0.0);

      DRAW_vertices.push (centerX + innerRadius * s);
      DRAW_vertices.push (centerY + innerRadius * c);
      DRAW_vertices.push (DRAW_red);
      DRAW_vertices.push (DRAW_green);
      DRAW_vertices.push (DRAW_blue);
      DRAW_vertices.push (DRAW_alpha);
      DRAW_vertices.push (0.0);
      DRAW_vertices.push (0.0);

      DRAW_vertices.push (centerX + outerRadius * s);
      DRAW_vertices.push (centerY + outerRadius * c);
      DRAW_vertices.push (DRAW_red);
      DRAW_vertices.push (DRAW_green);
      DRAW_vertices.push (DRAW_blue);
      DRAW_vertices.push (DRAW_alpha);
      DRAW_vertices.push (0.0);
      DRAW_vertices.push (0.0);

      ps = s;
      pc = c;
    }
}

function DRAW_AddSpiky (texture, centerX, centerY, innerRadius, outerRadius, angle)
{
  var sector, ps, pc;

  if (texture != DRAW_currentTexture)
    DRAW_Flush ();

  DRAW_currentTexture = texture;

  ps = Math.sin(angle) * innerRadius;
  pc = Math.cos(angle) * innerRadius;

  for (sector = 0; sector < 30; ++sector)
    {
      var s, c;

      s = Math.sin((sector + 1) / 30.0 * 2 * Math.PI + angle);
      c = Math.cos((sector + 1) / 30.0 * 2 * Math.PI + angle);

      if (sector & 1)
        {
          s *= innerRadius;
          c *= innerRadius;
        }
      else
        {
          s *= outerRadius;
          c *= outerRadius;
        }

      DRAW_vertices.push (centerX + ps);
      DRAW_vertices.push (centerY + pc);
      DRAW_vertices.push (DRAW_red);
      DRAW_vertices.push (DRAW_green);
      DRAW_vertices.push (DRAW_blue);
      DRAW_vertices.push (DRAW_alpha);
      DRAW_vertices.push (0.0);
      DRAW_vertices.push (0.0);

      DRAW_vertices.push (centerX);
      DRAW_vertices.push (centerY);
      DRAW_vertices.push (DRAW_red);
      DRAW_vertices.push (DRAW_green);
      DRAW_vertices.push (DRAW_blue);
      DRAW_vertices.push (DRAW_alpha);
      DRAW_vertices.push (0.0);
      DRAW_vertices.push (0.0);

      DRAW_vertices.push (centerX + s);
      DRAW_vertices.push (centerY + c);
      DRAW_vertices.push (DRAW_red);
      DRAW_vertices.push (DRAW_green);
      DRAW_vertices.push (DRAW_blue);
      DRAW_vertices.push (DRAW_alpha);
      DRAW_vertices.push (0.0);
      DRAW_vertices.push (0.0);

      ps = s;
      pc = c;
    }
}

function DRAW_AddQuadST (texture, x, y, width, height, s0, t0, s1, t1)
{
  if (texture != DRAW_currentTexture)
    DRAW_Flush ();

  DRAW_currentTexture = texture;

  DRAW_vertices.push (x);
  DRAW_vertices.push (y);
  DRAW_vertices.push (DRAW_red);
  DRAW_vertices.push (DRAW_green);
  DRAW_vertices.push (DRAW_blue);
  DRAW_vertices.push (DRAW_alpha);
  DRAW_vertices.push (s0);
  DRAW_vertices.push (t0);

  DRAW_vertices.push (x);
  DRAW_vertices.push (y + height);
  DRAW_vertices.push (DRAW_red);
  DRAW_vertices.push (DRAW_green);
  DRAW_vertices.push (DRAW_blue);
  DRAW_vertices.push (DRAW_alpha);
  DRAW_vertices.push (s0);
  DRAW_vertices.push (t1);

  DRAW_vertices.push (x + width);
  DRAW_vertices.push (y + height);
  DRAW_vertices.push (DRAW_red);
  DRAW_vertices.push (DRAW_green);
  DRAW_vertices.push (DRAW_blue);
  DRAW_vertices.push (DRAW_alpha);
  DRAW_vertices.push (s1);
  DRAW_vertices.push (t1);

  DRAW_vertices.push (x);
  DRAW_vertices.push (y);
  DRAW_vertices.push (DRAW_red);
  DRAW_vertices.push (DRAW_green);
  DRAW_vertices.push (DRAW_blue);
  DRAW_vertices.push (DRAW_alpha);
  DRAW_vertices.push (s0);
  DRAW_vertices.push (t0);

  DRAW_vertices.push (x + width);
  DRAW_vertices.push (y + height);
  DRAW_vertices.push (DRAW_red);
  DRAW_vertices.push (DRAW_green);
  DRAW_vertices.push (DRAW_blue);
  DRAW_vertices.push (DRAW_alpha);
  DRAW_vertices.push (s1);
  DRAW_vertices.push (t1);

  DRAW_vertices.push (x + width);
  DRAW_vertices.push (y);
  DRAW_vertices.push (DRAW_red);
  DRAW_vertices.push (DRAW_green);
  DRAW_vertices.push (DRAW_blue);
  DRAW_vertices.push (DRAW_alpha);
  DRAW_vertices.push (s1);
  DRAW_vertices.push (t0);
}

function DRAW_AddNumber (number, x, y, align)
{
  var result;

  if (align && number)
    x += Math.floor (Math.log(number) / Math.log(10)) * 29 * align;

  result = x + 29;

  do
    {
      var digit;
      var s0;

      digit = number % 10;

      DRAW_AddQuadST (GFX_score, x, y,
                      29, 38,
                      (digit * 29.0 - 1) / 512.0, 144 / 256.0,
                      ((digit + 1) * 29.0 - 1) / 512.0, 182.0 / 256.0);

      x -= 29;
      number = Math.floor (number / 10);
    }
  while (number > 0);

  return result;
}

/***********************************************************************/

function VEC_CruiseTo (position, target, maxAcceleration, maxVelocity, deltaTime)
{
  var distance;
  var dirX, dirY;
  var velocity;
  var targetVelocityX, targetVelocityY, targetVelocity;
  var deltaVelocityX, deltaVelocityY, deltaVelocity;

  dirX = target.x - position.x;
  dirY = target.y - position.y;
  distance = Math.sqrt (dirX * dirX + dirY * dirY);

  if (distance > 1.0e-3)
    {
      dirX /= distance;
      dirY /= distance;
    }
  else
    {
      distance = 0.0;
      dirX = dirY = 0.0;
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

  if (deltaVelocity < 1.0e-3)
    deltaVelocity = 0.0;

  /* Can we reach the target velocity in less than `deltaTime' seconds? */
  if (deltaVelocity <= maxAcceleration * deltaTime)
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

  return position.x == target.x && position.y == target.y && !position.velX && !position.velY;
}

/***********************************************************************/

var SYS_keys = {};
var SYS_mouseX = 0, SYS_mouseY = 0;
var SYS_requestedAnimFrame;
var lastTime = 0;

function SYS_SetupGL ()
{
  var canvas = document.getElementById ("game-canvas");

  if (!(gl = WebGLUtils.setupWebGL (canvas)))
    return;

  DRAW_UpdateViewport ();

  DRAW_SetupShaders ();

  gl.clearColor (0.0, 0.0, 0.0, 0.0);
  gl.disable (gl.DEPTH_TEST);

  gl.enable (gl.BLEND);
  gl.disable (gl.CULL_FACE);

  GAME_SetupTextures ();

  SYS_requestedAnimFrame = requestAnimFrame (GAME_Update);
}

function SYS_WebGLContextLost (event)
{
  event.preventDefault ();
  cancelCancelRequestAnimationFrame (SYS_requestedAnimFrame);
}

function SYS_Init ()
{
  var canvas = document.getElementById ("game-canvas");

  canvas.addEventListener("weblglcontextlost", SYS_WebGLContextLost, false);
  canvas.addEventListener("webglcontextrestored", SYS_SetupGL, false);

  SYS_SetupGL ();

  /* XXX: change to document.onkey* */
  document.onkeydown = function (event) { GAME_KeyPressed (event); };
  document.onkeyup = function (event) { GAME_KeyRelease (event); };
  canvas.onmousemove = function (event) { GAME_MouseMoved (event, this); return false; }
  document.onmousedown = function () { GAME_ButtonPressed (event); return false; }
  canvas.onselectstart = function () { return false; }
  canvas.oncontextmenu = function () { return false; }
}

/***********************************************************************/

var GFX_solid;
var GFX_traitLegend;
var GFX_statLegend;
var GFX_score;
var GFX_missions;

var GAME_cellTraits = ['fireRate', 'efficiency', 'anabolism', 'shield'];

var GAME_cellColors =
[
  0x77aaee, 0x77eeaa, 0xaa77ee, 0xb3ef1a, 0xee77aa,
  0xeeaa77, 0xff1ab3, 0xffb219, 0xff3a3a, 0x1ab3ff
];

var GAME_camera = { x: 0, y: 0, velX: 0, velY: 0 };
var GAME_cells;
var GAME_baddies;
var GAME_projectiles;
var GAME_over;
var GAME_energy, GAME_energyStorage;
var GAME_mass, GAME_massStorage;
var GAME_health, GAME_healthMax;
var GAME_score;
var GAME_mission, GAME_missionScroll;
var GAME_difficulty;
var GAME_bestScore;

var GAME_focusCell;
var GAME_cursorBlink;
var GAME_shake;

var GAME_nextCellColor;
var GAME_nextBaddieSpawn;

var GAME_scoreAnim;
var GAME_scoreAnimAmount;

var GAME_mission6Progress;

var GAME_paused = false;

function GAME_KeyPressed(e)
{
  var ch;

  ch = String.fromCharCode (e.keyCode);

  if (SYS_keys[ch])
    return;

  SYS_keys[ch] = true;

  switch (String.fromCharCode (e.keyCode))
    {
    case 'F':

      soundManager.play('placeholder', {volume:100});

      break;

    case 'P':

      GAME_paused = !GAME_paused;

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
  switch (ev.button)
    {
    case 0:

      if (GAME_over)
        {
          if (GAME_shake <= 0 && GAME_camera.y < 0 && !GAME_camera.velY)
            GAME_Reset ();

          break;
        }

      if (GAME_focusCell >= 0 && GAME_mass > GAME_CELL_COST && GAME_cells.length < 13 && GAME_RequireEnergy (GAME_CELL_ENERGY_COST))
        {
          GAME_mass -= GAME_CELL_COST;
          GAME_cells.push (GAME_SplitCell (GAME_cells[GAME_focusCell]));

          GAME_CompleteMission (0);
        }

      break;

    case 2:

      if (GAME_focusCell >= 0 && GAME_cells.length > 1)
        {
          var i;

          GAME_cells.splice (GAME_focusCell, 1);
          GAME_focusCell = -1;
          GAME_mass += 5;

          GAME_CompleteMission (1);
        }

      break;
    }
}

function GAME_Draw (deltaTime)
{
  var blobX, blobY, i, j, focusSetThisFrame = false;

  DRAW_UpdateViewport ();

  gl.uniform4f (gl.getUniformLocation (shaderProgram, "uniform_Camera"), 1.0 / gl.viewportWidth, 1.0 / gl.viewportHeight, GAME_camera.x, GAME_camera.y);

  DRAW_SetBlendMode (-1);

  blobX = gl.viewportWidth * 0.5;
  blobY = gl.viewportHeight * 0.5;

  DRAW_SetColor (0.0, 0.0, 0.0, 1.0);

  for (i = 0; i < GAME_projectiles.length; ++i)
    {
      var projectile = GAME_projectiles[i];

      DRAW_AddCircle (GFX_solid, blobX + projectile.x, blobY + projectile.y, 0, projectile.radius);
    }

  DRAW_SetColor (0.1, 0.4, 0.5, 1.0);

  DRAW_AddCircle (GFX_solid, blobX, blobY,
                  GAME_BLOB_RADIUS,         /* inner radius */
                  GAME_BLOB_RADIUS + 5);    /* outer radius */

  DRAW_SetBlendMode (0);

  DRAW_SetColor (0.1, 0.4, 0.5, 0.3);
  DRAW_AddCircle (GFX_solid, blobX, blobY,
                  0,                        /* inner radius */
                  GAME_BLOB_RADIUS);        /* outer radius */

  DRAW_SetBlendMode (-1);

  for (i = GAME_cells.length; i-- > 0; )
    {
      var cell = GAME_cells[i];
      var x, y, s, c;

      x = cell.x + blobX;
      y = cell.y + blobY;

      if (!focusSetThisFrame)
        {
          var dx, dy;

          dx = x - SYS_mouseX;
          dy = y - SYS_mouseY;

          if (dx * dx + dy * dy < GAME_CELL_RADIUS * GAME_CELL_RADIUS)
            {
              if (GAME_focusCell != i)
                {
                  GAME_focusCell = i;
                  GAME_cursorBlink = 0;
                }

              focusSetThisFrame = true;
            }
        }

      if (GAME_focusCell == i)
        {
          DRAW_SetBlendMode (0);
          DRAW_SetColor (0.1, 0.4, 0.5, 0.8 * Math.abs (Math.cos (GAME_cursorBlink)));
          DRAW_AddCircle (GFX_solid, x, y,
                          0.0,               /* inner radius */
                          GAME_CELL_RADIUS + 2); /* outer radius */

          GAME_cursorBlink += deltaTime * 4.0;
          DRAW_SetBlendMode (-1);
        }

      /* Body */

      DRAW_SetColor (cell.r, cell.g, cell.b, 1.0);

      DRAW_AddCircle (GFX_solid, x, y,
                      0.0,               /* inner radius */
                      GAME_CELL_RADIUS); /* outer radius */

      /* Mouth */

      DRAW_SetColor (0.0, 0.0, 0.0, 1.0);

      if (cell.drama > 0)
        {
          cell.drama -= deltaTime;

          DRAW_AddCircle (GFX_solid, x, y + GAME_CELL_RADIUS * 0.5 - 2,
                         0, 4);

        }
      else
        DRAW_AddMouth (GFX_solid, x, y + GAME_CELL_RADIUS * 0.5 - 4,
                       3, 5);

      /* Eyes */

      cell.nextBlink -= deltaTime;

      if (cell.nextBlink < 0)
        {
          if (cell.nextBlink < -0.03333)
            cell.nextBlink = GAME_CELL_BLINK_MIN + GAME_CELL_BLINK_EXTRA * Math.random ();
        }
      else
        {
          if (cell.drama > 0)
            {
              s = 0;
              c = 0;
            }
          else
            {
              s = Math.sin (cell.lookAngle) * 2;
              c = Math.cos (cell.lookAngle) * 2;
            }

          DRAW_SetColor (1.0, 1.0, 1.0, 1.0);

          DRAW_AddCircle (GFX_solid, x - 5 - GAME_CELL_RADIUS * 0.1, y - GAME_CELL_RADIUS * 0.6 + 5,
                          0.0,               /* inner radius */
                          5);                /* outer radius */

          DRAW_AddCircle (GFX_solid, x + 5 + GAME_CELL_RADIUS * 0.1, y - GAME_CELL_RADIUS * 0.6 + 5,
                          0.0,               /* inner radius */
                          5);                /* outer radius */

          DRAW_SetColor (0.0, 0.0, 0.0, 1.0);

          DRAW_AddCircle (GFX_solid, x - 5 - GAME_CELL_RADIUS * 0.1 + c, y - GAME_CELL_RADIUS * 0.6 + 5 + s,
                          0.0,               /* inner radius */
                          2);                /* outer radius */

          DRAW_AddCircle (GFX_solid, x + 5 + GAME_CELL_RADIUS * 0.1 + c, y - GAME_CELL_RADIUS * 0.6 + 5 + s,
                          0.0,               /* inner radius */
                          2);                /* outer radius */
        }
    }

  for (i = 0; i < GAME_baddies.length; ++i)
    {
      var baddie = GAME_baddies[i];

      baddie.radius = baddie.health / 3.0;

      if (baddie.age < 1.0)
        {
          DRAW_SetBlendMode (0);

          DRAW_SetColor (0.0, 0.0, 0.0, 1.0 - baddie.age);

          DRAW_AddSpiky (GFX_solid, blobX + baddie.x, blobY + baddie.y,
                         baddie.radius * 2 * baddie.age * 0.5,  /* inner radius */
                         baddie.radius * 2 * baddie.age,        /* outer radius */
                         baddie.angle);

          DRAW_SetBlendMode (-1);
        }

      if (baddie.age < 1.0)
        DRAW_SetColor (1.0, 0.0, 0.3, baddie.age);
      else
        DRAW_SetColor (1.0, 0.0, 0.3, 1.0);

      DRAW_AddSpiky (GFX_solid, blobX + baddie.x, blobY + baddie.y,
                     baddie.radius * 0.5,  /* inner radius */
                     baddie.radius,        /* outer radius */
                     baddie.angle);
    }

  if (GAME_focusCell >= 0)
    {
      if (GAME_cells.length > 1)
        {
          var traitsMax, traitsMin;

          traitsMax = [];
          traitsMin = [];

          for (i = 0; i < GAME_cellTraits.length; ++i)
            {
              traitsMin.push (GAME_cells[0][GAME_cellTraits[i]]);
              traitsMax.push (GAME_cells[0][GAME_cellTraits[i]]);
            }

          for (j = 1; j < GAME_cells.length; ++j)
            {
              var cell;

              cell = GAME_cells[j];

              for (i = 0; i < GAME_cellTraits.length; ++i)
                {
                  if (cell[GAME_cellTraits[i]] > traitsMax[i])
                    traitsMax[i] = cell[GAME_cellTraits[i]];

                  if (cell[GAME_cellTraits[i]] < traitsMin[i])
                    traitsMin[i] = cell[GAME_cellTraits[i]];
                }
            }

          DRAW_SetColor (0.0, 0.0, 0.0, 0.3);

          for (i = 0; i < GAME_cellTraits.length; ++i)
            {
              var x0, x1;

              x0 = 3 + Math.log (100 * traitsMin[i]) / Math.log(10) * 30;

              if (x0 < 1)
                x0 = 1;

              x1 = 3 + Math.log (100 * traitsMax[i]) / Math.log(10) * 30;

              if (x1 < 1)
                x1 = 1;

              DRAW_AddQuad (GFX_solid, 189 + x0, 12 + i * 23, (x1 - x0) + 1, 10);
            }
        }

      DRAW_SetColor (0.05, 0.2, 0.25, 1.0);

      for (i = 0; i < GAME_cellTraits.length; ++i)
        {
          var width;

          width = 3 + Math.log (100 * GAME_cells[GAME_focusCell][GAME_cellTraits[i]]) / Math.log(10) * 30;

          if (width < 1)
            width = 1;

          DRAW_AddQuad (GFX_solid, 190, 12 + i * 23, width, 10);
        }

      DRAW_SetColor (0.0, 0.0, 0.0, 1.0);
      DRAW_SetBlendMode (0);
      DRAW_AddQuad (GFX_traitLegend, 4, 10, 512, 128);
    }
  else
    DRAW_SetBlendMode (0);

  DRAW_SetColor (0.05, 0.2, 0.25, 1.0);
  DRAW_AddQuad (GFX_statLegend, 8, gl.viewportHeight - 61, 128, 64);

  DRAW_SetColor (0.00, 0.00, 0.00, 0.5);
  DRAW_AddQuad (GFX_solid, 85, gl.viewportHeight - 60, 360, 10);
  DRAW_SetColor (1.00, 1.00, 1.00, 0.9);
  i = GAME_health / GAME_healthMax * 360;
  DRAW_AddQuad (GFX_solid, 85, gl.viewportHeight - 60, i, 10);

  DRAW_SetColor (0.00, 0.00, 0.00, 0.5);
  DRAW_AddQuad (GFX_solid, 85, gl.viewportHeight - 40, 360, 10);
  DRAW_SetColor (0.70, 0.44, 0.09, 0.9);
  i = GAME_energy / GAME_energyStorage * 360;
  DRAW_AddQuad (GFX_solid, 85, gl.viewportHeight - 40, i, 10);

  DRAW_SetColor (0.00, 0.00, 0.00, 0.5);
  DRAW_AddQuad (GFX_solid, 85, gl.viewportHeight - 20, 360, 10);
  DRAW_SetColor (0.95, 0.64, 0.19, 0.9);
  i = GAME_mass / GAME_massStorage * 360;
  DRAW_AddQuad (GFX_solid, 85, gl.viewportHeight - 20, i, 10);

  if (GAME_camera.y < 0)
    {
      var yOffset;

      yOffset = -gl.viewportHeight + 250;

      DRAW_AddQuadST (GFX_score,
                      (gl.viewportWidth - 261) * 0.5, yOffset,
                      261, 38,
                      0.0, 0.0,
                      261.0 / 512.0, 38.0 / 256.0);
      yOffset += 50;

      DRAW_AddNumber (Math.floor (GAME_score), gl.viewportWidth * 0.5 - 14, yOffset, 0.5);
      yOffset += 80;

      DRAW_AddQuadST (GFX_score,
                      (gl.viewportWidth - 265) * 0.5, yOffset,
                      265, 52,
                      0.0, 69.0 / 256.0,
                      265.0 / 512.0, 121.0 / 256.0);
      yOffset += 60;

      DRAW_AddNumber (Math.floor (GAME_bestScore), gl.viewportWidth * 0.5 - 14, yOffset, 0.5);
    }

  VEC_CruiseTo (GAME_missionScroll, { x: 0, y: GAME_mission }, 1.0, 1.0, deltaTime);

  DRAW_SetColor (1.0, 1.0, 1.0, 1.0);
  DRAW_AddQuadST (GFX_missions, gl.viewportWidth - 512, gl.viewportHeight - 64,
                  512, 64,
                  0.0, GAME_missionScroll.y * 64.0 / 1024.0,
                  1.0, (GAME_missionScroll.y + 1) * 64.0 / 1024.0);

  DRAW_Flush ();
}

function GAME_RepelCells (deltaTime)
{
  var i, j, updatedPositions, result = false;

  updatedPositions = [];

  for (i = 0; i < GAME_cells.length; ++i)
    {
      var forceX = 0, forceY = 0, mag;
      var cellA, newX, newY, newPosition;

      cellA = GAME_cells[i];

      for (j = 0; j < GAME_cells.length; ++j)
        {
          var cellB, tx, ty;

          cellB = GAME_cells[j];

          if (j == i)
            continue;

          tx = cellA.x - cellB.x;
          ty = cellA.y - cellB.y;
          mag = tx * tx + ty * ty;

          if (mag < 4 * (GAME_CELL_RADIUS * GAME_CELL_RADIUS))
            {
              if (!mag)
                {
                  forceX += Math.random () * 2.0 - 1.0;
                  forceY += Math.random () * 2.0 - 1.0;
                }
              else
                {
                  mag = Math.sqrt(mag);

                  forceX += (cellA.x - cellB.x) / mag;
                  forceY += (cellA.y - cellB.y) / mag;
                }
            }
        }

      mag = cellA.x * cellA.x + cellA.y * cellA.y;

      if (mag > (GAME_BLOB_RADIUS - GAME_CELL_RADIUS) * (GAME_BLOB_RADIUS - GAME_CELL_RADIUS))
        {
          mag = Math.sqrt (mag);

          forceX += -cellA.x / mag;
          forceY += -cellA.y / mag;
        }

      if (!forceX && !forceY)
        {
          updatedPositions.push ({ x: cellA.x, y: cellA.y });

          continue;
        }

      cellA.drama = 0.2;

      mag = Math.sqrt (forceX * forceX + forceY * forceY);

      if (mag > 1)
        {
          forceX /= mag;
          forceY /= mag;
        }

      newPosition = {};
      newPosition.x = cellA.x + 50.0 * forceX * deltaTime;
      newPosition.y = cellA.y + 50.0 * forceY * deltaTime;
      updatedPositions.push (newPosition);

      result = true;
    }

  for (i = 0; i < GAME_cells.length; ++i)
    {
      var cell;

      cell = GAME_cells[i];

      cell.x = updatedPositions[i].x;
      cell.y = updatedPositions[i].y;
    }

  return result;
}

function GAME_CompleteMission (nr)
{
  if (GAME_mission != nr)
    return;

  ++GAME_mission;

  GAME_scoreAnim = 0;

  switch (nr)
    {
    case 0:
    case 1:

      GAME_scoreAnimAmount = 500;

      break;

    case 6:

      GAME_scoreAnimAmount = Math.floor (GAME_score);

      break;

    default:

      GAME_scoreAnimAmount = 10000;
    }

  GAME_score += 10000;

  GAME_baddies = [];

  if (GAME_bestScore < 90000)
    GAME_nextBaddieSpawn = 6;
}

function GAME_RequireEnergy (amount)
{
  if (GAME_energy < amount)
    return false;

  GAME_energy -= amount;

  return true;
}

function GAME_ShootAtBaddies (deltaTime)
{
  var i, j;

  if (!GAME_baddies.length)
    return;

  for (i = 0; i < GAME_cells.length; ++i)
    {
      var cell, nearestBaddie = -1, nearestBaddieDistance = 0;
      var dx, dy, mag, projectile;

      cell = GAME_cells[i];

      cell.nextBullet -= deltaTime;

      for (j = 0; j < GAME_baddies.length; ++j)
        {
          var baddie;

          baddie = GAME_baddies[j];

          dx = baddie.x - cell.x;
          dy = baddie.y - cell.y;
          mag = dx * dx + dy * dy;

          if (nearestBaddie == -1 || mag < nearestBaddieDistance)
            {
              nearestBaddie = j;
              nearestBaddieDistance = mag;
            }
        }

      dx = GAME_baddies[nearestBaddie].x - cell.x;
      dy = GAME_baddies[nearestBaddie].y - cell.y;

      cell.lookAngle = Math.atan2 (dy, dx);

      if (cell.nextBullet > 0)
        continue;

      if (GAME_mass - GAME_PROJECTILE_MASS <= GAME_CELL_COST)
        continue;

      if (GAME_PROJECTILE_MASS > GAME_mass)
        continue;

      if (GAME_energy - 1.5 * GAME_CELL_ENERGY_COST <= 10.0 / cell.efficiency)
        continue;

      if (!GAME_RequireEnergy (10.0 / cell.efficiency))
        continue;

      dx = GAME_baddies[nearestBaddie].x - cell.x;
      dy = GAME_baddies[nearestBaddie].y - cell.y;
      mag = Math.sqrt (nearestBaddieDistance);

      projectile = {};
      projectile.x = cell.x;
      projectile.y = cell.y;
      projectile.velX = 150 * dx / mag * cell.muzzleVelocity;
      projectile.velY = 150 * dy / mag * cell.muzzleVelocity;
      projectile.radius = 5.0;
      projectile.damage = GAME_PROJECTILE_DAMAGE;
      GAME_projectiles.push (projectile);

      GAME_mass -= GAME_PROJECTILE_MASS;

      cell.nextBullet = 3.0 / cell.fireRate;
    }
}

function GAME_Update ()
{
  var i, j, timeNow, deltaTime;

  timeNow = new Date ().getTime ();
  deltaTime = (timeNow - lastTime) * 0.001;
  lastTime = timeNow;

  if (GAME_paused)
    {
      GAME_Draw (0);

      SYS_requestedAnimFrame = requestAnimFrame (GAME_Update);

      return;
    }

  if (deltaTime < 0 || deltaTime > 0.033)
    deltaTime = 0.033;

  if (GAME_shake > 0)
    {
      GAME_camera.y = 20 * Math.sin (25 * GAME_shake) * GAME_shake;
      GAME_camera.x = 10 * Math.sin (50 * GAME_shake) * GAME_shake;
      GAME_shake -= deltaTime;
    }

  /*********************************************************************/

  if (!GAME_over)
    {
      VEC_CruiseTo (GAME_camera, { x: 0, y: 0 }, 2000, 1e6, deltaTime);

      GAME_score += 5 * deltaTime;

      GAME_energy += GAME_ENERGY_SOLAR_INPUT * deltaTime; /* Solar energy */
      GAME_health += GAME_HEALTH_REGENERATION * deltaTime; /* Recouperation */

      GAME_energyStorage = GAME_ENERGY_STORAGE_BASE;
      GAME_massStorage = GAME_MASS_STORAGE_BASE;

      GAME_healthMax = 100.0;

      for (i = 0; i < GAME_cells.length; ++i)
        {
          var cell, amount;

          cell = GAME_cells[i];

          amount = (4 * cell.anabolism) * deltaTime;

          if (amount > GAME_energy * cell.efficiency)
            amount = GAME_energy * cell.efficiency;

          if (GAME_mass + amount > GAME_massStorage)
            amount = GAME_massStorage - GAME_mass;

          GAME_mass += amount;
          GAME_energy -= amount / cell.efficiency;
          GAME_healthMax += cell.shield;

          if (!GAME_RequireEnergy (deltaTime * GAME_ENERGY_CELL_UPKEEP / cell.efficiency))
            GAME_energy = 0;
        }

      if (GAME_mission == 7 && !GAME_energy)
        GAME_CompleteMission (7);

      if (GAME_energy > GAME_energyStorage)
        GAME_energy = GAME_energyStorage;

      if (GAME_mass > GAME_massStorage)
        GAME_mass = GAME_massStorage;

      if (GAME_health > GAME_healthMax)
        GAME_health = 100.0;

  /*********************************************************************/

      GAME_ShootAtBaddies (deltaTime);

      GAME_RepelCells (deltaTime);

  /*********************************************************************/

      GAME_nextBaddieSpawn -= deltaTime;

      if (GAME_nextBaddieSpawn < 0.0)
        {
          GAME_baddies.push (GAME_GenerateBaddie ());
          GAME_nextBaddieSpawn = 6.0 / (1.0 + Math.pow (GAME_difficulty, 1.1) * 0.010);
        }
    }
  else if (GAME_shake <= 0) /* GAME_over */
    VEC_CruiseTo (GAME_camera, { x: 0, y: -gl.viewportHeight }, 2000, 1e6, deltaTime);

  for (i = 0; i < GAME_baddies.length; )
    {
      var baddie, mag, force, maxVelocity;

      baddie = GAME_baddies[i];

      baddie.age += deltaTime;

      mag = 1.0 / Math.sqrt (baddie.x * baddie.x + baddie.y * baddie.y);
      force = GAME_BADDIE_ACCELERATION * (1.0 + GAME_difficulty * 0.007) * mag * deltaTime;

      baddie.velX -= force * baddie.x;
      baddie.velY -= force * baddie.y;

      mag = Math.sqrt (baddie.velX * baddie.velX + baddie.velY * baddie.velY);

      maxVelocity = 50 * (1.0 + GAME_difficulty * 0.02);

      if (mag > maxVelocity)
        {
          baddie.velX = baddie.velX * maxVelocity / mag;
          baddie.velY = baddie.velY * maxVelocity / mag;
        }

      baddie.x += baddie.velX * deltaTime;
      baddie.y += baddie.velY * deltaTime;
      baddie.angle += deltaTime * mag / 50.0;

      if (!GAME_over
          && baddie.x * baddie.x + baddie.y * baddie.y < (GAME_BLOB_RADIUS + baddie.radius) * (GAME_BLOB_RADIUS + baddie.radius))
        {
          GAME_health -= GAME_BADDIE_DAMAGE * baddie.health / 100;
          GAME_shake = 0.5;

          GAME_baddies.splice(i, 1);

          for (j = 0; j < GAME_cells.length; ++j)
            {
              GAME_cells[j].drama = 0.9;
              GAME_cells[j].nextBlink = 0.0;
            }
        }
      else
        ++i;
    }

  /*********************************************************************/

  for (i = 0; i < GAME_projectiles.length; )
    {
      var projectile = GAME_projectiles[i], mag;

      projectile.x += projectile.velX * deltaTime;
      projectile.y += projectile.velY * deltaTime;

      mag = projectile.x * projectile.x + projectile.y * projectile.y;

      if (mag > 2 * GAME_BADDIE_SPAWN_DISTANCE * GAME_BADDIE_SPAWN_DISTANCE)
        {
          GAME_projectiles.splice (i, 1);

          continue;
        }

      if (!GAME_over)
        {
          for (j = 0; j < GAME_baddies.length; )
            {
              var baddie, dx, dy;

              baddie = GAME_baddies[j];

              dx = baddie.x - projectile.x;
              dy = baddie.y - projectile.y;

              if (dx * dx + dy * dy < (baddie.radius + projectile.radius) * (baddie.radius + projectile.radius))
                {
                  var amount;

                  GAME_projectiles.splice (i, 1);

                  amount = projectile.damage;

                  if (baddie.health < amount)
                    amount = baddie.health;

                  GAME_score += GAME_SCORE_DAMAGE * amount;

                  baddie.health -= amount;

                  if (baddie.health < 5)
                    {
                      if (GAME_mission == 6 && ++GAME_mission6Progress == 10)
                        GAME_CompleteMission (6);

                      GAME_baddies.splice(j, 1);
                    }

                  break;
                }

              ++j;
            }

          if (j != GAME_baddies.length)
            continue;
        }

      ++i;
    }

  if (GAME_health < 0)
    {
      GAME_over = true;
      GAME_health = 0;

      localStorage['GAME_bestScore'] = GAME_bestScore;
    }

  GAME_difficulty += deltaTime;

  if (GAME_score > GAME_bestScore)
    GAME_bestScore = GAME_score;

  if (GAME_scoreAnim < 2)
    {
      GAME_scoreAnim += deltaTime;

      DRAW_SetColor (1.0, 1.0, 1.0, 1.0 - GAME_scoreAnim * 0.5);

      DRAW_AddNumber (GAME_scoreAnimAmount,
                      gl.viewportWidth - 517,
                      gl.viewportHeight - 118 - GAME_scoreAnim * 15,
                      1);
    }

  /*********************************************************************/

  GAME_Draw (deltaTime);

  SYS_requestedAnimFrame = requestAnimFrame (GAME_Update);
}

function GAME_SetupTextures ()
{
  GFX_solid = DRAW_LoadTexture ("gfx/solid.png");
  GFX_traitLegend = DRAW_LoadTexture ("gfx/trait-legend.png");
  GFX_statLegend = DRAW_LoadTexture ("gfx/stat-legend.png");
  GFX_score = DRAW_LoadTexture ("gfx/score.png");
  GFX_missions = DRAW_LoadTexture ("gfx/missions.png");
}

function GAME_GenerateCell ()
{
  var result;

  result = {};
  result.muzzleVelocity = 1.0;
  result.fireRate = 1.0;
  result.aim = 1.0;
  result.repair = 1.0;
  result.efficiency = 1.0;
  result.anabolism = 1.0;
  result.shield = 1.0;
  result.energyStorage = 1.0;
  result.massStorage = 1.0;
  result.nextBullet = 0.0;
  result.x = 0;
  result.y = 0;
  result.r = ((GAME_cellColors[GAME_nextCellColor] >> 16) & 0xff) / 255.0;
  result.g = ((GAME_cellColors[GAME_nextCellColor] >> 8) & 0xff) / 255.0;
  result.b = (GAME_cellColors[GAME_nextCellColor] & 0xff) / 255.0;
  result.lookAngle = 0.0;
  result.nextBlink = 5.0 + Math.random ();
  result.drama = 0.0;

  GAME_nextCellColor = (GAME_nextCellColor + 1) % GAME_cellColors.length;

  return result;
}

function GAME_RandomScale ()
{
  /* Positive number, equal chance of 0.5 and 2.0, equal chance of 0.33 and 3.0, etc */

  return Math.pow (2, Math.sqrt (-2 * Math.log (Math.random ())) * Math.cos (2 * Math.PI * Math.random ()));
}

function GAME_SplitCell (cell)
{
  var result;

  result = {};
  result.muzzleVelocity = cell.muzzleVelocity;
  result.fireRate = cell.fireRate * GAME_RandomScale ();
  result.aim = cell.aim * GAME_RandomScale ();
  result.repair = cell.repair * GAME_RandomScale ();
  result.efficiency = cell.efficiency * GAME_RandomScale ();
  result.anabolism = cell.anabolism * GAME_RandomScale ();
  result.shield = cell.shield * GAME_RandomScale ();
  result.energyStorage = cell.energyStorage * GAME_RandomScale ();
  result.massStorage = cell.massStorage * GAME_RandomScale ();
  result.nextBullet = cell.nextBullet + 0.5;
  result.x = cell.x;
  result.y = cell.y;
  result.r = ((GAME_cellColors[GAME_nextCellColor] >> 16) & 0xff) / 255.0;
  result.g = ((GAME_cellColors[GAME_nextCellColor] >> 8) & 0xff) / 255.0;
  result.b = (GAME_cellColors[GAME_nextCellColor] & 0xff) / 255.0;
  result.lookAngle = 0.0;
  result.nextBlink = GAME_CELL_BLINK_MIN + GAME_CELL_BLINK_EXTRA * Math.random ();
  result.dram = 0.0;

  GAME_nextCellColor = (GAME_nextCellColor + 1) % GAME_cellColors.length;

  GAME_score += 157;

  if (result.efficiency > 10.0)
    GAME_CompleteMission (2);
  if (result.anabolism > 10.0)
    GAME_CompleteMission (3);
  if (result.fireRate > 10.0)
    GAME_CompleteMission (4);
  if (result.shield > 10.0)
    GAME_CompleteMission (5);

  return result;
}

function GAME_GenerateBaddie ()
{
  var result, angle, s, c;

  angle = Math.random () * Math.PI * 2.0;
  s = Math.sin (angle);
  c = Math.cos (angle);

  result = {};
  result.velX = 0;
  result.velY = 0;
  result.x = c * GAME_BADDIE_SPAWN_DISTANCE;
  result.y = s * GAME_BADDIE_SPAWN_DISTANCE;
  result.angle = Math.random ();
  result.health = 100;
  result.nextBlink = GAME_CELL_BLINK_MIN + GAME_CELL_BLINK_EXTRA * Math.random ();
  result.age = 0;

  return result;
}

function GAME_Reset ()
{
  GAME_cells = [];
  GAME_baddies = [];
  GAME_projectiles = [];
  GAME_health = 100.0;
  GAME_healthMax = 100.0;
  GAME_over = false;
  GAME_energy = 100.0;
  GAME_energyStorage = 200.0;
  GAME_mass = 100.0;
  GAME_massStorage = 200.0;
  GAME_difficulty = 0.0;
  GAME_mission = 0;
  GAME_missionScroll = { x: 0, y: 0, velX: 0, velY: 0 };

  GAME_focusCell = -1;
  GAME_cursorBlink = 0;
  GAME_shake = 0;

  GAME_nextCellColor = 0;

  GAME_nextBaddieSpawn = 1.0;

  GAME_mission6Progress = 0;

  GAME_cells.push (GAME_GenerateCell ());
  GAME_score = 0;
}

function GAME_Init ()
{
  var i;

  if (undefined === (GAME_bestScore = localStorage['GAME_bestScore']))
    GAME_bestScore = 0;

  SYS_Init ();

  GAME_Reset ();
}
