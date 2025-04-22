// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.


function composite(bgImg, fgImg, fgOpac, fgPos) {

    // Get the image data of the background and foreground images
    const bgData = bgImg.data;
    const fgData = fgImg.data;
    const bgWidth = bgImg.width;
    const bgHeight = bgImg.height;
    const fgWidth = fgImg.width;
    const fgHeight = fgImg.height;

    // Calculate the position of the foreground image in the background image
    for (let y = 0; y < fgHeight; y++) {
        for (let x = 0; x < fgWidth; x++) {

            // Compute the index of the current pixel (in each row RGBA RGBA ...)
            const fgIndex = (y * fgWidth + x) << 2; // Provides the Index for the beginning of the pixel in the foreground image
            
            // Get the RGBA values of the foreground pixel
            const fgA = (fgData[fgIndex + 3] / 255) * fgOpac; // Foreground Alpha (0-1) 
            if (fgA === 0) continue; // Skip transparent pixels
            const fgR = fgData[fgIndex]; // Red 
            const fgG = fgData[fgIndex + 1]; // Green
            const fgB = fgData[fgIndex + 2]; // Blue 

            // Corresponding pixel index on background image
            const bgX = x + fgPos.x; 
            const bgY = y + fgPos.y; 
            
            // Check if the background pixel is within the bounds of the background image
            if (bgX >= 0 && bgX < bgWidth && bgY >= 0 && bgY < bgHeight) {
                // Compute the index of the current pixel in the background image
                const bgIndex = (bgY * bgWidth + bgX) << 2;

                const bgR = bgData[bgIndex]; // Red
                const bgG = bgData[bgIndex + 1]; // Green
                const bgB = bgData[bgIndex + 2]; // Blue
                const bgA = bgData[bgIndex + 3] / 255; // Background Alpha (0-1)

                // Alpha blending
                const outA = fgA + bgA * (1 - fgA); // Output Alpha (0-1).
                if (outA > 0.0) { // Avoid division by zero 
                    const outR = (fgR * fgA + bgR * bgA * (1 - fgA)) / outA; // Output Red (0-255)
                    const outG = (fgG * fgA + bgG * bgA * (1 - fgA)) / outA; // Output Green (0-255)
                    const outB = (fgB * fgA + bgB * bgA * (1 - fgA)) / outA; // Output Blue (0-255)
                
                // Make sure the output values are integers within the range of 0-255
                bgData[bgIndex]     = clamp(Math.round(outR));
                bgData[bgIndex + 1] = clamp(Math.round(outG)); 
                bgData[bgIndex + 2] = clamp(Math.round(outB));
                bgData[bgIndex + 3] = clamp(Math.round(outA * 255));}
            }
        }
    }
}

function clamp(value, min=0, max=255) {
    return Math.max(min, Math.min(max, value));
}