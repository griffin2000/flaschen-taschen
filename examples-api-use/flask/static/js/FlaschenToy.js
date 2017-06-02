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

var mousePos = {x:0.0,y:0.0}

function drawScene(canvasCtx, gl, t) {

    var updateFuncInput = document.getElementById('updateFunc');

    if(updateShader)
    {
        var d = new Date();
        var t = d.getTime();
        if (t - lastUpdate > 500)
        {
            lastUpdate = t;
            updateShader = false;

            fragmentShaderSrc = updateFuncInput.value;

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


    var offsetLoc = gl.getUniformLocation(shaderProgram, "t");
    if (offsetLoc != null)
        gl.uniform1f(offsetLoc, t / 1000);

    var offsetLoc = gl.getUniformLocation(shaderProgram, "mousePos");
    if (offsetLoc != null)
        gl.uniform2f(offsetLoc, mousePos.x, mousePos.y);

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


    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        var mp = {
            x: ((0.5 + evt.clientX - rect.left) / rect.width),
            y: ((0.5 + evt.clientY - rect.top) / rect.height)
        };
        mp.x = Math.min(Math.max(mp.x, 0.0), 1.0);
        mp.y = Math.min(Math.max(mp.y, 0.0), 1.0);
        mp.y = 1.0-mp.y

        return mp
    }

    canvas.addEventListener('mousemove', function (evt) {
        mousePos = getMousePos(canvas, evt);
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
