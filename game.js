var gl;

/***********************************************************************/

var DRAW_vertices = new Array ();
var DRAW_textureCoords = new Array ();
var DRAW_currentTexture;
var DRAW_textureCount = 2;

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

  gl.uniform2f (gl.getUniformLocation (shaderProgram, "uniform_WindowSize"), 1.0 / gl.viewportWidth, 1.0 / gl.viewportHeight);
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
  gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  if (!--DRAW_textureCount)
    GAME_Update ();
}

function DRAW_Flush ()
{
  var vertexCount;
  var vertexPositionBuffer;
  var texCoordBuffer;

  vertexCount = DRAW_vertices.length / 2;

  if (!vertexCount)
    return;

  gl.bindTexture (gl.TEXTURE_2D, DRAW_currentTexture);

  vertexPositionBuffer = gl.createBuffer ();
  gl.bindBuffer (gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (DRAW_vertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 2;

  texCoordBuffer = gl.createBuffer ();
  gl.bindBuffer (gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (DRAW_textureCoords), gl.STATIC_DRAW);
  texCoordBuffer.itemSize = 2;

  gl.bindBuffer (gl.ARRAY_BUFFER, texCoordBuffer);
  gl.vertexAttribPointer (shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer (gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer (shaderProgram.vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays (gl.TRIANGLES, 0, vertexCount);

  DRAW_vertices.length = 0;
  DRAW_textureCoords.length = 0;

  gl.deleteBuffer (texCoordBuffer);
  gl.deleteBuffer (vertexPositionBuffer);
}

function DRAW_AddQuad (texture, x, y, width, height)
{
  if (texture != DRAW_currentTexture)
    DRAW_Flush ();

  DRAW_currentTexture = texture;

  DRAW_vertices.push (x);
  DRAW_vertices.push (y);

  DRAW_vertices.push (x);
  DRAW_vertices.push (y + height);

  DRAW_vertices.push (x + width);
  DRAW_vertices.push (y + height);

  DRAW_vertices.push (x);
  DRAW_vertices.push (y);

  DRAW_vertices.push (x + width);
  DRAW_vertices.push (y + height);

  DRAW_vertices.push (x + width);
  DRAW_vertices.push (y);

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

/* Pivot: Bottom center */
function DRAW_AddQuadAngle (texture, x, y, width, height, angle)
{
  var s, c;

  if (texture != DRAW_currentTexture)
    DRAW_Flush ();

  s = Math.sin(angle);
  c = Math.cos(angle);

  DRAW_currentTexture = texture;

  /* D */
  DRAW_vertices.push (x + c * width * 0.5);
  DRAW_vertices.push (y + s * width * 0.5);

  /* A */
  DRAW_vertices.push (x + c * width * 0.5 + s * height);
  DRAW_vertices.push (y + s * width * 0.5 - c * height);

  /* B */
  DRAW_vertices.push (x - c * width * 0.5 + s * height);
  DRAW_vertices.push (y - s * width * 0.5 - c * height);

  /* D */
  DRAW_vertices.push (x + c * width * 0.5);
  DRAW_vertices.push (y + s * width * 0.5);

  /* B */
  DRAW_vertices.push (x - c * width * 0.5 + s * height);
  DRAW_vertices.push (y - s * width * 0.5 - c * height);

  /* C */
  DRAW_vertices.push (x - c * width * 0.5);
  DRAW_vertices.push (y - s * width * 0.5);

  DRAW_textureCoords.push (1.0);
  DRAW_textureCoords.push (0.0);

  DRAW_textureCoords.push (1.0);
  DRAW_textureCoords.push (1.0);

  DRAW_textureCoords.push (0.0);
  DRAW_textureCoords.push (1.0);

  DRAW_textureCoords.push (1.0);
  DRAW_textureCoords.push (0.0);

  DRAW_textureCoords.push (0.0);
  DRAW_textureCoords.push (1.0);

  DRAW_textureCoords.push (0.0);
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

    DRAW_vertices.push (s1 * radius + x);
    DRAW_vertices.push (c1 * radius + y);

    DRAW_vertices.push (x);
    DRAW_vertices.push (y);

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

function DRAW_DebugQuad (texture, x, y, width, height)
{
  var verts = [], texCoords = [];

  verts.push (x);
  verts.push (y);

  verts.push (x);
  verts.push (y + height);

  verts.push (x + width);
  verts.push (y + height);

  verts.push (x);
  verts.push (y);

  verts.push (x + width);
  verts.push (y + height);

  verts.push (x + width);
  verts.push (y);

  texCoords.push (0.0);
  texCoords.push (0.0);

  texCoords.push (0.0);
  texCoords.push (1.0);

  texCoords.push (1.0);
  texCoords.push (1.0);

  texCoords.push (0.0);
  texCoords.push (0.0);

  texCoords.push (1.0);
  texCoords.push (1.0);

  texCoords.push (1.0);
  texCoords.push (0.0);

  gl.bindTexture (gl.TEXTURE_2D, texture);

  var vertexPositionBuffer = gl.createBuffer ();
  gl.bindBuffer (gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (verts), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 2;

  var texCoordBuffer = gl.createBuffer ();
  gl.bindBuffer (gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (texCoords), gl.STATIC_DRAW);
  texCoordBuffer.itemSize = 2;

  gl.bindBuffer (gl.ARRAY_BUFFER, texCoordBuffer);
  gl.vertexAttribPointer (shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer (gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer (shaderProgram.vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays (gl.TRIANGLES, 0, 6);

  gl.deleteBuffer (texCoordBuffer);
  gl.deleteBuffer (vertexPositionBuffer);
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

var elapsed = 0;
var gravity = 50.0;
var jetPackPower = 80.0;

var earth;
var avatar;

var x = 0, y = 0, yVel = 0;
var jetPack = false;

function GAME_SetupTextures ()
{
  DRAW_textureCount = 2;
  avatar = DRAW_LoadTexture ("gfx/avatar.png");
  earth = DRAW_LoadTexture ("gfx/planet0.png");
}

function GAME_Init ()
{
  SYS_Init ();

  GAME_SetupTextures ();

  /*GAME_Update ();*/
}

function GAME_DrawAvatar (x, y)
{
  y += 128;

  DRAW_AddQuadAngle (avatar, 400 + Math.cos(x - Math.PI * 0.5) * y, 300 + Math.sin(x - Math.PI * 0.5) * y, 64, 64, x);
}

function GAME_KeyPressed(e)
{
  keys[String.fromCharCode (e.keyCode)] = true;

  switch (String.fromCharCode (e.keyCode))
    {
    case ' ':

      if (y == 0)
        yVel = gravity * 1.5;
      else
        jetPack = true;

      break;
    }
}

function GAME_KeyRelease(e)
{
  keys[String.fromCharCode (e.keyCode)] = false;

  switch (String.fromCharCode (e.keyCode))
    {
    case ' ':

      jetPack = false;

      break;
    }
}

function GAME_Update ()
{
  var timeNow, deltaTime;

  timeNow = new Date ().getTime ();
  deltaTime = timeNow - lastTime;

  if (deltaTime < 0 || deltaTime > 0.05)
    deltaTime = 0.05;

  gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (keys['A'])
    x -= deltaTime * 0.5;
  if (keys['D'])
    x += deltaTime * 0.5;

  if (jetPack)
    yVel += deltaTime * jetPackPower;

  yVel -= deltaTime * gravity;
  y += yVel * deltaTime;

  if (y < 0)
  {
    y = 0;
    yVel = 0;
  }

  DRAW_AddCircle (earth, 400, 300, 128.0);

  GAME_DrawAvatar (x, y);

  DRAW_Flush ();

  elapsed += deltaTime;

  requestAnimFrame (GAME_Update);
}
