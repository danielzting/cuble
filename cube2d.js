import COLORS from "./colors";

export default class Cube2D {
    // Canvas height needs to fit 9 cubies; divide by 10 for some margin
    static SIZE = document.getElementById('feedback').height / 10;
    // Additional padding between faces
    static PADDING = 5;
    static FACESIZE = Cube2D.SIZE * 3 + Cube2D.PADDING;
    // Delay between displaying each facelet of feedback in ms
    static DELAY = 10;
    // Accumulated timeout for displaying facelet
    delay = 0;

    /**
     * Initialize a 2D projection of a cube.
     * @param {object} HTML <canvas> element to draw onto
     */
    constructor(canvas) {
        // Fix to prevent canvas from looking blurry on Retina displays
        canvas.width *= 2;
        canvas.height *= 2;
        canvas.getContext('2d').scale(2, 2);
        this.canvas = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    }

    drawSquare(x, y, color, result) {
        this.canvas.fillStyle = `rgb(${color.r * 256}, ${color.g * 256}, ${color.b * 256})`;
        this.canvas.fillRect(x, y, Cube2D.SIZE, Cube2D.SIZE);
        if (result !== '.') {
            this.canvas.beginPath();
            this.canvas.moveTo(x, y);
            this.canvas.lineTo(x + Cube2D.SIZE, y + Cube2D.SIZE);
            this.canvas.stroke();
        }
        if (result === 'X') {
            this.canvas.beginPath();
            this.canvas.moveTo(x + Cube2D.SIZE, y);
            this.canvas.lineTo(x, y + Cube2D.SIZE);
            this.canvas.stroke();
        }
    }

    drawFace(x, y, colors, results) {
        for (let c = 0; c < 3; c++) {
            for (let r = 0; r < 3; r++) {
                // NOTE: rows and cols interchanged on x/y coordinate grid
                setTimeout(() => {
                    this.drawSquare(
                        x + c * Cube2D.SIZE + c,
                        y + r * Cube2D.SIZE + r,
                        COLORS[colors.charAt(r * 3 + c)],
                        results.charAt(r * 3 + c)
                    );
                }, this.delay);
                this.delay += Cube2D.DELAY;
            }
        }
    }

    /**
     * Draw the actual facelets with appropriate feedback (X or slash) based on expected facelets.
     * Order is ULFRBD, left-to-right row-major order (like reading English).
     * @param {string} expected solution facelets
     * @param {string} actual user-submitted facelets
     */
    drawCube(expected, actual) {
        this.delay = 0;
        this.canvas.clearRect(0, 0, this.width, this.height);
        this.drawFace(Cube2D.FACESIZE, 0, expected.substring(0, 9), actual.substring(0, 9));
        for (let i = 0; i < 4; i++) {
            this.drawFace(
                i * Cube2D.FACESIZE,
                Cube2D.FACESIZE,
                expected.substring(i * 9 + 9, i * 9 + 18),
                actual.substring(i * 9 + 9, i * 9 + 18)
            );
        }
        this.drawFace(Cube2D.FACESIZE, Cube2D.FACESIZE * 2, expected.substring(45), actual.substring(45));
    }
}
