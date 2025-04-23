// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
	
	const cosX = Math.cos(rotationX);
	const sinX = Math.sin(rotationX);
	const cosY = Math.cos(rotationY);
	const sinY = Math.sin(rotationY);


	const rot_mat_x = [
		1, 0, 0, 0,
		0, cosX, -sinX, 0,
		0, sinX, cosX, 0,
		0, 0, 0, 1
	];
	const rot_mat_y = [
		cosY, 0, -sinY, 0,
		0,    1, 0,     0,
		sinY, 0, cosY,  0,
		0,    0, 0,     1
	];
	const combined_rot_mat = MatrixMult(rot_mat_y, rot_mat_x);

	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	let mvp = MatrixMult(trans, combined_rot_mat); // Apply rotation then translation
	mvp = MatrixMult(projectionMatrix, mvp); // Apply projection
	return mvp;
}



// Shader sources
const meshVS = `
    attribute vec3 aPosition; 	// Vertex position
    attribute vec2 aTexCoord; 	// Texture coordinates
    uniform mat4 uTransform;  	// Transformation matrix
    uniform bool uSwapYZ;     	// Whether to swap Y and Z axes
    varying vec2 vUV;			// Texture coordinates passed to fragment shader
    void main() {
      vec3 p = aPosition;
      if (uSwapYZ) p = p.xzy; 	// Swap Y and Z axes
      gl_Position = uTransform * vec4(p,1.0); // Apply transformation
      vUV = aTexCoord; 			// Pass texture coordinates to fragment shader
    }
`;
const meshFS = `
    precision mediump float; 		// Set the precision for floating point numbers
    varying vec2 vUV; 				// Texture coordinates passed from vertex shader
    uniform sampler2D uSampler; 	// Texture sampler
    uniform bool uShowTexture; 		// Whether to show the texture or not
    void main() {
      gl_FragColor = uShowTexture
        ? texture2D(uSampler, vUV)
        : vec4(vUV, 0.0, 1.0); 		// color gradient for better understanding
    }
`;

// [TO-DO] Complete the implementation of the following class.
class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
		this.prog = InitShaderProgram(meshVS, meshFS);
		gl.useProgram(this.prog);

		// create two VBOs: one for positions, one for UVs
		this.vboPositions  = gl.createBuffer();
		this.vboTexCoords  = gl.createBuffer();

		// attribute + uniform locations
		this.aPosition  = gl.getAttribLocation(this.prog, "aPosition");
		this.aTexCoord  = gl.getAttribLocation(this.prog, "aTexCoord");
		this.uTransform = gl.getUniformLocation(this.prog, "uTransform");
		this.uSwapYZ    = gl.getUniformLocation(this.prog, "uSwapYZ");
		this.uShowTex   = gl.getUniformLocation(this.prog, "uShowTexture");
		this.uSampler   = gl.getUniformLocation(this.prog, "uSampler");

		// create a texture object
		this.tex = gl.createTexture();
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		// Upload vertex positions
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vboPositions);
		gl.bufferData(gl.ARRAY_BUFFER,
		              new Float32Array(vertPos),
		              gl.STATIC_DRAW);

		// Upload texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vboTexCoords);
		gl.bufferData(gl.ARRAY_BUFFER,
		              new Float32Array(texCoords),
		              gl.STATIC_DRAW);

		// Record how many vertices we have (numTriagnles misleading but kept per spec)
		this.numTriangles = vertPos.length / 3;

	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		gl.useProgram(this.prog);
		gl.uniform1i(this.uSwapYZ, swap ? 1 : 0);
	}
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw( trans )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		
		gl.useProgram(this.prog);

		// Transformation matrix
		gl.uniformMatrix4fv(this.uTransform, false,
			new Float32Array(trans));

		// Bind the vertex buffer objects
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vboPositions);
		gl.enableVertexAttribArray(this.aPosition);
		gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);

		// Bind the texture coordinates buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vboTexCoords);
		gl.enableVertexAttribArray(this.aTexCoord);
		gl.vertexAttribPointer(this.aTexCoord,
		                       2, gl.FLOAT, false, 0, 0);

		// Bind texture unit to 0 - although not necessary
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.tex);

		// draw the triangles
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{	
		// [TO-DO] Bind the texture
		gl.bindTexture(gl.TEXTURE_2D, this.tex);
		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// the texture parameters. For example, you can set the texture

		// Repeat texture horizontally and vertically
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); 
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

		// For minification (many texels in one pixel) use appropriate mipmap filtering.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); 
		// For magnification (one texel in many pixels) use linear filtering.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); 

		gl.generateMipmap(gl.TEXTURE_2D);

		gl.useProgram(this.prog);
		gl.uniform1i(this.uSampler, 0);

		// CHeck whether the checkbox "show texture" is checked or not.
		const showTextureCheckbox = document.getElementById("show-texture");
		if (showTextureCheckbox) {
			this.showTexture(showTextureCheckbox.checked);
		}

	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		gl.useProgram(this.prog);
		gl.uniform1i(this.uShowTex, show ? 1 : 0);
	}
	
}
