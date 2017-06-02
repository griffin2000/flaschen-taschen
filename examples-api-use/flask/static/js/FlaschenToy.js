var gl;
function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl" , { preserveDrawingBuffer: true });
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}


function getShader(gl, str, isFrag, status) {

    var shader;
    if (isFrag) {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } 

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        err= gl.getShaderInfoLog(shader);
        if (status)
        {
            status.compiled = false
            status.err = err

        }
        return null;
    }

    if (status)
        status.compiled = true
    return shader;
}


var shaderProgram;
var fragmentShader;
var vertexShader;

function initShaders() {

    var fragmentShaderSrc = `
    precision mediump float;
        varying vec2 uv;

    void main(void) {
        gl_FragColor = vec4(uv.xy, 0.0, 1.0);
    }
    `
    var vertexShaderSrc = `
        attribute vec3 aVertexPosition;
        attribute vec2 aVertexUV;
        varying vec2 uv;


    void main(void) {
        gl_Position = vec4(aVertexPosition, 1.0);
        uv = aVertexUV;
    }
    `
    var errMsgDiv = document.getElementById('errMsg');
    errMsgDiv.innerHTML = ""

    shaderOK = true;
    var shaderStatus = {}
    fragmentShader = getShader(gl, fragmentShaderSrc, true, shaderStatus);
    if (!fragmentShader)
    {

        shaderOK = false;
        errMsgDiv.innerHTML += "Fragment shader failed:" + shaderStatus.err+"<br>"
    }

    vertexShader = getShader(gl, vertexShaderSrc, false, shaderStatus);
    if (!vertexShader)
    {
        shaderOK = false;
        errMsgDiv.innerHTML += "Vertex shader failed:" + shaderStatus.err + "<br>"
    }

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        shaderOK = false;
        errMsgDiv.innerHTML += "Linked failed<br>"
    }


    if (shaderOK)
        errMsgDiv.innerHTML = "Shader compiled OK"


    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.vertexUVAttribute = gl.getAttribLocation(shaderProgram, "aVertexUV");
    gl.enableVertexAttribArray(shaderProgram.vertexUVAttribute);

    
}




var squareVertexUVBuffer;
var squareVertexPositionBuffer;

function initBuffers() {

    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    vertices = [
         1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0, -1.0, 0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;

    squareVertexUVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexUVBuffer);
    vertices = [
         1.0, 1.0,
         0.0, 1.0,
         1.0, 0.0,
         0.0, 0.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexUVBuffer.itemSize = 2;
    squareVertexUVBuffer.numItems = 4;
}

var updateShader = true;
var lastUpdate = 0;
var shaderOK = false;
var resolution = { w: 45, h: 35 }
var mousePos = { x: 0.0, y: 0.0 }
var mouseClick = { x: 0.0, y: 0.0 }
var lastT = 0
var frameNo = 0;

function drawScene(canvasCtx, gl, t) {

    var updateFuncInput = document.getElementById('updateFunc');


    if(updateShader)
    {
        if (t - lastUpdate > 500)
        {
            lastUpdate = t;
            updateShader = false;

            var shaderPrefix =
                `
                precision mediump float;

                uniform vec3 iResolution;
                uniform float iGlobalTime;
                uniform float iGlobalDelta;
                uniform float iGlobalFrame;
                uniform vec4 iMouse;
                uniform vec4 iDate;
                `;
            var shaderPostfix =
                `

                    void main(void ) {

                        mainImage(gl_FragColor, gl_FragCoord.xy);
                    }

                `


            fragmentShaderSrc = shaderPrefix + updateFuncInput.value + shaderPostfix;

            var errMsgDiv = document.getElementById('errMsg');
            errMsgDiv.innerHTML = ""

            shaderOK = true;
            var shaderStatus = {}
            fragmentShader = getShader(gl, fragmentShaderSrc, true, shaderStatus);
            if (!fragmentShader) {

                shaderOK = false;
                errMsgDiv.innerHTML += "Fragment shader failed:" + shaderStatus.err + "<br>"
            }

            if (shaderOK)
            {
                shaderProgram = gl.createProgram();
                gl.attachShader(shaderProgram, vertexShader);
                gl.attachShader(shaderProgram, fragmentShader);
                gl.linkProgram(shaderProgram);

                if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                    shaderOK = false;
                    errMsgDiv.innerHTML += "Linked failed<br>"
                }

            }


            if (shaderOK)
                errMsgDiv.innerHTML = "Shader compiled OK"


            gl.useProgram(shaderProgram);

            shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
            shaderProgram.vertexUVAttribute = gl.getAttribLocation(shaderProgram, "aVertexUV");
            gl.enableVertexAttribArray(shaderProgram.vertexUVAttribute);


        }


    }

    if (!shaderOK)
        return

    gl.useProgram(shaderProgram);
    var deltaMS = t - lastT;

    var offsetLoc = gl.getUniformLocation(shaderProgram, "iGlobalTime");
    if (offsetLoc != null)
        gl.uniform1f(offsetLoc, t / 1000);
    var offsetLoc = gl.getUniformLocation(shaderProgram, "iGlobalFrame");
    if (offsetLoc != null)
        gl.uniform1f(offsetLoc, frameNo);
    var offsetLoc = gl.getUniformLocation(shaderProgram, "iGlobalDelta");
    if (offsetLoc != null)
        gl.uniform1f(offsetLoc, deltaMS/1000.0);


    frameNo++;

    var offsetLoc = gl.getUniformLocation(shaderProgram, "iMouse");
    if (offsetLoc != null)
        gl.uniform4f(offsetLoc, mousePos.x, mousePos.y, mouseClick.x, mouseClick.y);

    var offsetLoc = gl.getUniformLocation(shaderProgram, "iResolution");
    if (offsetLoc != null)
        gl.uniform3f(offsetLoc, resolution.w, resolution.h, 1.0);

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexUVBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexUVAttribute, squareVertexUVBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}


function webGLStart(w,h) {
    var canvas = document.getElementById("ftCanvas");

    resolution.w = w;
    resolution.h = h;

    canvas.addEventListener('mousemove', function (evt) {
        var rect = canvas.getBoundingClientRect();

        mousePos.x = Math.min(Math.max(mousePos.x, 0.0), 1.0);
        mousePos.y = Math.min(Math.max(mousePos.y, 0.0), 1.0);
        mousePos.y = rect.height - mousePos.y
    });

    canvas.addEventListener('mousedown', function (evt) {
        var rect = canvas.getBoundingClientRect();

        mouseClick.x = Math.min(Math.max(mouseClick.x, 0.0), 1.0);
        mouseClick.y = Math.min(Math.max(mouseClick.y, 0.0), 1.0);
        mouseClick.y = rect.height - mouseClick.y
    });


    initGL(canvas);
    initShaders();
    initBuffers();

    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var updateFuncInput = document.getElementById('updateFunc');

    updateFuncInput.addEventListener("input", () => {
        updateShader = true;




    });
    var d = new Date();
    var t0 = d.getTime();

    function animateFunction(func) {
        fn = function () {
            var d = new Date();
            var t = d.getTime();
            func(null, gl, t-t0);

            requestAnimationFrame(fn);

        };

        fn();

        return fn;
    }

    animateFunction(drawScene);
}
