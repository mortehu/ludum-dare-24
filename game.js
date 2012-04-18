var gl;

/***********************************************************************/

var DRAW_vertices = new Array ();
var DRAW_textureCoords = new Array ();
var DRAW_currentTexture;

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
  result = gl.createTexture ();
  result.image = new Image ();
  result.image.src = url;
  result.image.onload = function () { DRAW_HandleLoadedTexture (result) };

  return result;
}

function DRAW_HandleLoadedTexture (texture)
{
  gl.bindTexture (gl.TEXTURE_2D, texture);
  gl.pixelStorei (gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.generateMipmap (gl.TEXTURE_2D);
}

function DRAW_Flush ()
{
  var vertexCount;

  vertexCount = DRAW_vertices.length / 2;

  if (!vertexCount)
    return;

  gl.activeTexture (gl.TEXTURE0);
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

/***********************************************************************/

var keys = {};
var lastTime = 0;

function SYS_Init ()
{
  var canvas = document.getElementById ("game-canvas");

  if (!(gl = WebGLUtils.setupWebGL (canvas)))
    return;


  document.onkeydown = function (event) { keys[String.fromCharCode (event.keyCode)] = true; };
  document.onkeyup = function (event) { keys[String.fromCharCode (event.keyCode)] = false; };

  gl.viewportWidth = canvas.width;
  gl.viewportHeight = canvas.height;

  gl.viewport (0, 0, gl.viewportWidth, gl.viewportHeight);

  DRAW_SetupShaders ();

  gl.clearColor (0.0, 0.0, 0.0, 1.0);
  gl.enable (gl.DEPTH_TEST);

  gl.enable (gl.BLEND);
  gl.blendFunc (gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
}

/***********************************************************************/

var x = 0, y = 0;
var earth;
var elapsed = 0;

function GAME_SetupTextures ()
{
  earth = DRAW_LoadTexture ("placeholder.png");
}

function GAME_Init ()
{
  SYS_Init ();

  GAME_SetupTextures ();

  x = (gl.viewportWidth - 100) * 0.5;
  y = (gl.viewportHeight - 100) * 0.5;

  GAME_Update ();
}

function GAME_Update ()
{
  var timeNow, deltaTime;

  timeNow = new Date ().getTime ();
  deltaTime = timeNow - lastTime;

  if (deltaTime < 0 || deltaTime > 0.05)
    deltaTime = 0.05;

  gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (keys['W']) y -= deltaTime * 10.0;
  if (keys['A']) x -= deltaTime * 10.0;
  if (keys['S']) y += deltaTime * 10.0;
  if (keys['D']) x += deltaTime * 10.0;

  DRAW_AddQuad (earth, x, y, 128.0, 128.0);
  DRAW_Flush ();

  elapsed += deltaTime;

  requestAnimFrame (GAME_Update);
}
