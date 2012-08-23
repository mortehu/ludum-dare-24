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

soundManager.onload = function() {
  soundManager.createSound({ id:'placeholder', url:'sfx/sine.mp3', multiShot: true, autoLoad: true });
}

soundManager.onerror = function() {
}

/***********************************************************************/

var DRAW_vertices = new Array ();
var DRAW_textureCoords = new Array ();
var DRAW_currentTexture;
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
  gl.pixelStorei (gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
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

/***********************************************************************/

function VEC_Cruise (position, target, maxAcceleration, maxVelocity, deltaTime)
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
var lastTime = 0;

function SYS_Init ()
{
  var canvas = document.getElementById ("game-canvas");

  if (!(gl = WebGLUtils.setupWebGL (canvas)))
    return;

  document.onkeydown = function (event) { GAME_KeyPressed (event); };
  document.onkeyup = function (event) { GAME_KeyRelease (event); };
  canvas.onmousemove = function (event) { GAME_MouseMoved (event, this); }
  document.onmousedown = function () { GAME_ButtonPressed (); }
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

var GFX_placeholder;
var GAME_camera = { x: -100, y: -300, velX: 0, velY: 0 };

var GAME_cameraMovingRight = true;
var GAME_cameraTargetRight = { x: 0, y: 0 };
var GAME_cameraTargetLeft = { x: -744, y: -410 };

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
  soundManager.play('placeholder', {volume:100});
}

function GAME_Draw (deltaTime)
{
  gl.uniform4f (gl.getUniformLocation (shaderProgram, "uniform_Camera"), 1.0 / gl.viewportWidth, 1.0 / gl.viewportHeight, GAME_camera.x, GAME_camera.y);

  DRAW_SetAlpha (1.0);

  DRAW_SetBlendMode (1);
  DRAW_SetAlpha (1.0);

  DRAW_AddQuad (GFX_placeholder, 0, 0, 256, 256);
  DRAW_Flush ();
}

function GAME_Update ()
{
  var timeNow, deltaTime;

  timeNow = new Date ().getTime ();
  deltaTime = (timeNow - lastTime) * 0.001;
  lastTime = timeNow;

  if (deltaTime < 0 || deltaTime > 0.033)
    deltaTime = 0.033;

  if (GAME_cameraMovingRight)
    {
      if (VEC_Cruise (GAME_camera, GAME_cameraTargetRight, 500, 1000, deltaTime))
       GAME_cameraMovingRight = false;
    }
  else
    {
      if (VEC_Cruise (GAME_camera, GAME_cameraTargetLeft, 500, 1000, deltaTime))
       GAME_cameraMovingRight = true;
    }

  GAME_Draw (deltaTime);

  requestAnimFrame (GAME_Update);
}

function GAME_SetupTextures ()
{
  GFX_placeholder = DRAW_LoadTexture ("gfx/placeholder.png");
}

function GAME_Init ()
{
  var i;

  SYS_Init ();

  GAME_SetupTextures ();

  GAME_Update ();
}
