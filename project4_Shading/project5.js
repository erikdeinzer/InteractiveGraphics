// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
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

	const trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	const mvp = MatrixMult(trans, combined_rot_mat); // Apply rotation then translation
	return mvp;
}


// [TO-DO] Complete the implementation of the following class.

// Shader sources
const meshVS = `
    attribute vec3 aPosition;     // Vertex position
    attribute vec2 aTexCoord;     // Texture coordinates
    attribute vec3 aNormal;       // Vertex normal

    uniform mat4 uTransform;      // MVP matrix
    uniform mat3 uNormalMatrix;   // Normal matrix
    uniform bool uSwapYZ;         // Whether to swap Y and Z axes

    varying vec2 vUV;             // Texture coordinates passed to fragment shader
    varying vec3 vNormal;         // Normal passed to fragment shader

    void main() {
      vec3 p = aPosition;
      vec3 n = aNormal;
      if (uSwapYZ) {
        p = p.xzy;
        n = n.xzy;
      }
      gl_Position = uTransform * vec4(p, 1.0);    // Transform position
      vUV = aTexCoord;                            // Pass texture coordinates
      vNormal = normalize(uNormalMatrix * n);	  // Transform normal using the normal matrix
    }
`;
const meshFS = `
    precision mediump float;

    varying vec2 vUV;             // Texture coordinates passed from vertex shader
    varying vec3 vNormal;         // Transformed normal from vertex shader

    uniform sampler2D uSampler;   // Texture sampler
    uniform bool uShowTexture;    // Whether to use the texture
    uniform vec3 uLightDir;       // Light direction (in view space)
    uniform float uShininess;     // Shininess factor for specular highlights

    void main() {
      vec3 N = normalize(vNormal);             // Surface normal
      vec3 L = normalize(uLightDir);           // Light direction
      vec3 V = vec3(0.0, 0.0, 1.0);            // View direction (camera looks down +Z)
      vec3 R = reflect(-L, N);                 // Reflection direction

      float diff = max(dot(N, L), 0.0);        // Diffuse term
      float spec = 0.0;

      if (diff > 0.0) {
        spec = pow(max(dot(V, R), 0.0), uShininess); // Specular term
      }

      vec4 baseColor = uShowTexture
        ? texture2D(uSampler, vUV) // Use texture color if available
        : vec4(vUV, 0.0, 1.0); // Fallback gradient if no texture

	  vec3 finalColor = baseColor.rgb * (0.1 + 0.7 * diff) + vec3(1.0, 0.5, 0.0) * spec * 3.0;
      gl_FragColor = vec4(finalColor, baseColor.a);
    }
`;

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
		this.prog = InitShaderProgram(meshVS, meshFS);
		gl.useProgram(this.prog);


		// create two VBOs: one for positions, one for UVs
		this.vboPositions = gl.createBuffer();
		this.vboTexCoords = gl.createBuffer();
		this.vboNormals   = gl.createBuffer();

		// attribute + uniform locations
		this.aPosition = gl.getAttribLocation(this.prog, "aPosition");
		this.aTexCoord = gl.getAttribLocation(this.prog, "aTexCoord");
		this.aNormal   = gl.getAttribLocation(this.prog, "aNormal");

		this.uTransform     = gl.getUniformLocation(this.prog, "uTransform");
		this.uNormalMatrix  = gl.getUniformLocation(this.prog, "uNormalMatrix");
		this.uSwapYZ        = gl.getUniformLocation(this.prog, "uSwapYZ");
		this.uShowTex       = gl.getUniformLocation(this.prog, "uShowTexture");
		this.uSampler       = gl.getUniformLocation(this.prog, "uSampler");
		this.uLightDir      = gl.getUniformLocation(this.prog, "uLightDir");
		this.uShininess     = gl.getUniformLocation(this.prog, "uShininess");

		// create a texture object
		this.tex = gl.createTexture();
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// Upload vertex positions in the buffers
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vboPositions);
		gl.bufferData(gl.ARRAY_BUFFER, 
			new Float32Array(vertPos), 
			gl.STATIC_DRAW);

		// Upload texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vboTexCoords);
		gl.bufferData(gl.ARRAY_BUFFER, 
			new Float32Array(texCoords), 
			gl.STATIC_DRAW);

		// Upload normals
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vboNormals);
		gl.bufferData(gl.ARRAY_BUFFER,
					new Float32Array(normals),
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
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram(this.prog);

		// Set transformation and normal matrices
		gl.uniformMatrix4fv(this.uTransform, false, matrixMVP);
		gl.uniformMatrix3fv(this.uNormalMatrix, false, matrixNormal);

		// Bind and enable position buffer
		if (this.lightWorld) {
			const [wx, wy, wz] = this.lightWorld;
			const lx = matrixMV[0]*wx + matrixMV[4]*wy + matrixMV[8]*wz;
			const ly = matrixMV[1]*wx + matrixMV[5]*wy + matrixMV[9]*wz;
			const lz = matrixMV[2]*wx + matrixMV[6]*wy + matrixMV[10]*wz;
			const invLen = 1 / Math.hypot(lx, ly, lz);
			gl.uniform3f(this.uLightDir, lx*invLen, ly*invLen, lz*invLen);
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vboPositions);
		gl.enableVertexAttribArray(this.aPosition);
		gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);

		// Bind and enable texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vboTexCoords);
		gl.enableVertexAttribArray(this.aTexCoord);
		gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);

		// Bind and enable normals
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vboNormals);
		gl.vertexAttribPointer(this.aNormal, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.aNormal);

		// Bind texture to texture unit 0
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.tex);

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

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
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
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram(this.prog);
		gl.uniform3f(this.uLightDir, -x, -y, -z); // Light direction in view space. If positive Normal from surface point to lightsource
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.prog);
		gl.uniform1f(this.uShininess, shininess);
	}
}
