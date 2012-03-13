var gl;
var pMatrix = mat4.create ();
var mvMatrix = mat4.create ();
var lastTime = 0;

var triangleVertexPositionBuffer;
var texCoordBuffer;
var myTexture;

function GameSetupShaders ()
{
  var fragmentShader = getShader (gl, "shader-fs");
  var vertexShader = getShader (gl, "shader-vs");

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

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation (shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray (shaderProgram.vertexPositionAttribute);

  shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  shaderProgram.pMatrixUniform = gl.getUniformLocation (shaderProgram, "uPMatrix");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation (shaderProgram, "uMVMatrix");
  shaderProgram.samplerUniform = gl.getUniformLocation (shaderProgram, "uSampler");
}

function getShader (gl, id)
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

function GameSetupBuffers ()
{
   triangleVertexPositionBuffer = gl.createBuffer ();
   gl.bindBuffer (gl.ARRAY_BUFFER, triangleVertexPositionBuffer);

   var vertices =
     [
        0.0,  1.0, 0.0,
       -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0
     ];

   gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (vertices), gl.STATIC_DRAW);
   triangleVertexPositionBuffer.itemSize = 3;
   triangleVertexPositionBuffer.numItems = 3;

   texCoordBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
   var textureCoords =
     [
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
     ];
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
   texCoordBuffer.itemSize = 2;
   texCoordBuffer.numItems = 3;
}

function GameSetupTextures ()
{
  myTexture = gl.createTexture();
  myTexture.image = new Image();
  myTexture.image.src = "earth0000.png";
  myTexture.image.onload = function() { handleLoadedTexture(myTexture) };
}

function handleLoadedTexture(texture)
{
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
}

var x = 0;

function GameUpdate ()
{
  var timeNow, deltaTime;

  requestAnimFrame (GameUpdate);

  timeNow = new Date ().getTime ();
  deltaTime = timeNow - lastTime;

  if (deltaTime < 0 || deltaTime > 0.05)
    deltaTime = 0.05;

  gl.viewport (0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mat4.identity (pMatrix);
  mat4.perspective (45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

  x += deltaTime;

  mat4.identity (mvMatrix);
  mat4.translate (mvMatrix, [-1.5, 0.0, -5 - 0.1 * x]);

  gl.uniformMatrix4fv (shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv (shaderProgram.mvMatrixUniform, false, mvMatrix);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, myTexture);
  gl.uniform1i(shaderProgram.samplerUniform, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, texCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer (gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
  gl.vertexAttribPointer (shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.drawArrays (gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
}

function GameStart ()
{
  var canvas = document.getElementById ("game-canvas");

  if (!(gl = WebGLUtils.setupWebGL (canvas)))
    return;

  gl.viewportWidth = canvas.width;
  gl.viewportHeight = canvas.height;

  GameSetupShaders ();
  GameSetupBuffers ();
  GameSetupTextures ();

  gl.clearColor (0.0, 0.0, 0.0, 1.0);
  gl.enable (gl.DEPTH_TEST);

  GameUpdate ();
}
