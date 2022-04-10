import COLORS from "./colors";

export default class Cube2D {
    // Canvas height needs to fit 9 cubies; divide by 10 for some margin
    static SIZE = document.getElementById('feedback').height / 10;
    // Additional padding between faces
    static PADDING = 5;
    static FACESIZE = Cube2D.SIZE * 3 + Cube2D.PADDING;

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

    drawSquare(x, y, color, feedback) {
        this.canvas.fillStyle = `rgb(${color.r * 256}, ${color.g * 256}, ${color.b * 256})`;
        this.canvas.fillRect(x, y, Cube2D.SIZE, Cube2D.SIZE);
        if (feedback !== '.') {
            this.canvas.beginPath();
            this.canvas.moveTo(x + Cube2D.SIZE, y);
            this.canvas.lineTo(x, y + Cube2D.SIZE);
            this.canvas.stroke();
        }
        if (feedback === 'X') {
            this.canvas.beginPath();
            this.canvas.moveTo(x, y);
            this.canvas.lineTo(x + Cube2D.SIZE, y + Cube2D.SIZE);
            this.canvas.stroke();
        }
    }

    drawFace(x, y, colors, feedback) {
        for (let c = 0; c < 3; c++) {
            for (let r = 0; r < 3; r++) {
                // NOTE: rows and cols interchanged on x/y coordinate grid
                this.drawSquare(
                    x + c * Cube2D.SIZE + c,
                    y + r * Cube2D.SIZE + r,
                    COLORS[colors[r * 3 + c]],
                    feedback[r * 3 + c]
                );
            }
        }
    }

    /**
     * Draw a 2D projection of the cube with the given feedback.
     * Order is ULFRBD, left-to-right row-major order (like reading English).
     * @param {Array<string>} colors 54 characters representing the color of each facelet
     * @param {Array<string>} feedback 54 characters (period, slash or X) to overlay on top of each facelet
     */
    drawCube(colors, feedback) {
        this.canvas.clearRect(0, 0, this.width, this.height);
        this.drawFace(Cube2D.FACESIZE, 0, colors.slice(0, 9), feedback.slice(0, 9));
        for (let i = 0; i < 4; i++) {
            this.drawFace(
                i * Cube2D.FACESIZE,
                Cube2D.FACESIZE,
                colors.slice(i * 9 + 9, i * 9 + 18),
                feedback.slice(i * 9 + 9, i * 9 + 18)
            );
        }
        this.drawFace(Cube2D.FACESIZE, Cube2D.FACESIZE * 2, colors.slice(45), feedback.slice(45));
    }
}
