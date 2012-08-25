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

var gl;

var DRAW_vertices = new Array ();
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
  canvas.onkeydown = function (event) { GAME_KeyPressed (event); return false; };
  canvas.onkeyup = function (event) { GAME_KeyRelease (event); return false; };
  canvas.onmousemove = function (event) { GAME_MouseMoved (event, this); return false; }
  document.onmousedown = function () { GAME_ButtonPressed (); return false; }
  canvas.onselectstart = function () { return false; }
}

/***********************************************************************/

var GFX_solid;
var GFX_traitLegend;

var GAME_cellTraits = ['muzzleVelocity', 'projectileMass', 'fireRate', 'aim', 'repair', 'catabolism', 'anabolism', 'energyStorage', 'massStorage'];

var GAME_camera = { x: 0, y: 0, velX: 0, velY: 0 };
var GAME_cells = new Array ();
var GAME_baddies = new Array ();
var GAME_autospawn = 0;

var GAME_focusCell = -1;

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

function GAME_ButtonPressed ()
{
}

function GAME_Draw (deltaTime)
{
  var blobX, blobY, i, focusSetThisFrame = false;

  DRAW_UpdateViewport ();

  gl.uniform4f (gl.getUniformLocation (shaderProgram, "uniform_Camera"), 1.0 / gl.viewportWidth, 1.0 / gl.viewportHeight, GAME_camera.x, GAME_camera.y);

  DRAW_SetBlendMode (-1);
  DRAW_SetColor (1.0, 1.0, 1.0, 1.0);

  blobX = 200 + 10;
  blobY = gl.viewportHeight - 200 - 10;

  DRAW_AddCircle (GFX_solid, blobX, blobY,
                  200 - 10,         /* inner radius */
                  200);             /* outer radius */

  for (i = 0; i < GAME_cells.length; ++i)
    {
      var cell = GAME_cells[i];
      var x, y;

      x = cell.x + blobX;
      y = cell.y + blobY;

      if (!focusSetThisFrame)
        {
          var dx, dy;

          dx = x - SYS_mouseX;
          dy = y - SYS_mouseY;

          if (dx * dx + dy * dy < 30 * 30)
            {
              GAME_focusCell = i;

              focusSetThisFrame = true;
            }
        }

      if (GAME_focusCell == i)
        DRAW_SetColor (1.0, 1.0, 1.0, 1.0);
      else
        DRAW_SetColor (0.5, 0.8, 0.5, 1.0);

      DRAW_AddCircle (GFX_solid, x, y,
                      0.0,              /* inner radius */
                      30);              /* outer radius */
    }

  DRAW_SetColor (1.0, 0.0, 0.3, 1.0);

  for (i = 0; i < GAME_baddies.length; ++i)
    {
      var baddie = GAME_baddies[i];

      DRAW_AddSpiky (GFX_solid, blobX + baddie.x, blobY + baddie.y,
                     baddie.radius * 0.5,  /* inner radius */
                     baddie.radius,        /* outer radius */
                     baddie.angle);
    }

  if (GAME_focusCell >= 0)
    {
      DRAW_SetColor (1.0, 1.0, 1.0, 1.0);

      for (i = 0; i < GAME_cellTraits.length; ++i)
        DRAW_AddQuad (GFX_solid, 180, 14 + i * 20, 30 * GAME_cells[GAME_focusCell][GAME_cellTraits[i]], 10);

      DRAW_SetBlendMode (0);
      DRAW_AddQuad (GFX_traitLegend, 0, 0, 256, 256);
    }

  DRAW_Flush ();
}

function GAME_RepelCells (deltaTime)
{
  var i, j, updatedPositions, result = false;;

  updatedPositions = new Array ();

  for (i = 0; i < GAME_cells.length; ++i)
    {
      var forceX = 0.0, forceY = 0.0, mag;
      var cellA;

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

          if (mag < 60 * 60)
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

      if (!forceX && !forceY)
        continue;

      mag = Math.sqrt (forceX * forceX + forceY * forceY);
      forceX /= mag;
      forceY /= mag;

      cellA.x += 200.0 * forceX * deltaTime;
      cellA.y += 200.0 * forceY * deltaTime;

      result = true;
    }

  return result;
}

function GAME_Update ()
{
  var timeNow, deltaTime;

  timeNow = new Date ().getTime ();
  deltaTime = (timeNow - lastTime) * 0.001;
  lastTime = timeNow;

  if (deltaTime < 0 || deltaTime > 0.033)
    deltaTime = 0.033;

  /*********************************************************************/

  if (!GAME_RepelCells (deltaTime) && GAME_autospawn)
    {
      GAME_cells.push (GAME_GenerateCell ());
      --GAME_autospawn;
    }

  /*********************************************************************/

  GAME_nextBaddieSpawn -= deltaTime;

  if (GAME_nextBaddieSpawn < 0.0)
    {
      GAME_baddies.push (GAME_GenerateBaddie ());
      GAME_nextBaddieSpawn = 0.3;
    }

  for (i = 0; i < GAME_baddies.length; )
    {
      var baddie;

      baddie = GAME_baddies[i];

      baddie.x += baddie.velX * deltaTime;
      baddie.y += baddie.velY * deltaTime;
      baddie.angle += deltaTime;

      if (baddie.x * baddie.x + baddie.y * baddie.y < (200 + baddie.radius) * (200 + baddie.radius))
        GAME_baddies.splice(i, 1);
      else
        ++i;
    }

  /*********************************************************************/

  GAME_Draw (deltaTime);

  SYS_requestedAnimFrame = requestAnimFrame (GAME_Update);
}

function GAME_SetupTextures ()
{
  GFX_solid = DRAW_LoadTexture ("gfx/solid.png");
  GFX_traitLegend = DRAW_LoadTexture ("gfx/trait-legend.png");
}

function GAME_GenerateCell ()
{
  var result;

  result = new Object ();
  result.muzzleVelocity = 1.0;
  result.projectileMass = 1.1;
  result.fireRate = 1.2;
  result.aim = 1.3;
  result.repair = 1.5;
  result.catabolism = 1.4;
  result.anabolism = 1.7;
  result.energyStorage = 1.1;
  result.massStorage = 1.2;
  result.x = 0;
  result.y = 0;

  return result;
}

function GAME_GenerateBaddie ()
{
  var result, angle, s, c;

  angle = Math.random () - 0.5 - 0.2;
  s = Math.sin (angle);
  c = Math.cos (angle);

  result = new Object ();
  result.velX = -c * 50;
  result.velY = -s * 50;
  result.x = c * 900;
  result.y = s * 900;
  result.radius = 30;
  result.angle = Math.random ();

  return result;
}

function GAME_Init ()
{
  var i;

  SYS_Init ();

  GAME_autospawn = 7;
  GAME_nextBaddieSpawn = 0.0;

  GAME_cells.push (GAME_GenerateCell ());
}
