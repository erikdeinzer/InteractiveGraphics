// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	// Matrix of style: [a, b, 0, c, d, 0, tx, ty, 1]

	const rad_rotation = rotation * Math.PI / 180; // Convert degrees to radians

	const a = scale * Math.cos(rad_rotation);
	const b = scale * Math.sin(rad_rotation);
	const c = -scale * Math.sin(rad_rotation);
	const d = scale * Math.cos(rad_rotation);
	const tx = positionX;
	const ty = positionY;
	return Array(a, b, 0, c, d, 0, tx, ty, 1); // Column-major order
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform(trans1, trans2) {
    var mat = Array(9).fill(0);

    // Loop by column and then row
    for (let col = 0; col < 3; col++) {
        for (let row = 0; row < 3; row++) {
            let sum = 0;
			// Multiply the two matrices
            for (let k = 0; k < 3; k++) {
                sum += trans2[k * 3 + row] * trans1[col * 3 + k];
            }
            mat[col * 3 + row] = sum;
        }
    }

    return mat;
}
