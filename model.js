import * as Cube from 'cubejs';
import solver from 'rubiks-cube-solver';

export default class CubeModel {
    static FACEORDER = 'URFDLB';
    static FACEMAP = {
        0: { 1: 'L7', 3: 'D7', 5: 'B9' },
        1: { 1: 'L8', 3: 'D4' },
        2: { 1: 'L9', 3: 'D1', 4: 'F7' },
        3: { 1: 'L4', 5: 'B6' },
        5: { 1: 'L6', 4: 'F4' },
        6: { 1: 'L1', 2: 'U1', 5: 'B3' },
        7: { 1: 'L2', 2: 'U4' },
        8: { 1: 'L3', 2: 'U7', 4: 'F1' },
        9: { 3: 'D8', 5: 'B8' },
        11: { 3: 'D2', 4: 'F8' },
        15: { 2: 'U2', 5: 'B2' },
        17: { 2: 'U8', 4: 'F2' },
        18: { 0: 'R9', 3: 'D9', 5: 'B7' },
        19: { 0: 'R8', 3: 'D6' },
        20: { 0: 'R7', 3: 'D3', 4: 'F9' },
        21: { 0: 'R6', 5: 'B4' },
        23: { 0: 'R4', 4: 'F6' },
        24: { 0: 'R3', 2: 'U3', 5: 'B1' },
        25: { 0: 'R2', 2: 'U6' },
        26: { 0: 'R1', 2: 'U9', 4: 'F3' },
    };

    constructor() {
        // Array to store facelet colors in the form UUUUUUUUUR...F...D...L...B...
        this.facelets = [];
        for (const face of CubeModel.FACEORDER) {
            for (let i = 0; i < 9; i++) {
                this.facelets.push(face);
            }
        }
        // Generate solution
        this.solution = Cube.random().asString();
    }

    updateColor(intersect) {
        const facelet = CubeModel.FACEMAP[intersect.object.name][Math.floor(intersect.face.a / 6)];
        let faceletIndex = CubeModel.FACEORDER.indexOf(facelet.charAt(0)) * 9;
        faceletIndex += parseInt(facelet.charAt(1)) - 1;
        const nextFacelet = CubeModel.FACEORDER.indexOf(this.facelets[faceletIndex]) + 1;
        this.facelets[faceletIndex] = CubeModel.FACEORDER[nextFacelet % CubeModel.FACEORDER.length];
    }

    check() {
        let result = '';
        // Keep track of how many of each color guess we've seen
        // This is important to mark a square "yellow" versus "gray"
        // Example: if answer = "AABCD" and guess = "AAAAA", first A = green, second A = yellow, rest = gray
        // We want to emulate this behavior
        for (let i = 0; i < 6; i++) {
            const faceSquares = this.solution.substring(9 * i, 9 * i + 4)
                + this.solution.substring(9 * i + 5, 9 * i + 9);
            // Yellows allowed = total of that color - correct of that color
            const yellowsLeft = new Map();
            for (const face of CubeModel.FACEORDER) {
                yellowsLeft.set(face, faceSquares.split(face).length);
            }
            for (let j = 0; j < 9; j++) {
                const index = i * 9 + j;
                const color = this.facelets[index];
                if (this.solution.charAt(index) === color) {
                    yellowsLeft.set(color, yellowsLeft.get(color) - 1);
                }
            }
            for (let j = 0; j < 9; j++) {
                const index = i * 9 + j;
                const color = this.facelets[index];
                // Check if same face has this color, excluding centers
                if (this.solution.charAt(index) === color) {
                    // Facelet is correct color
                    result += '.';
                } else if (faceSquares.includes(this.facelets[index]) && yellowsLeft.get(color) > 0) {
                    // Facelet is wrong color but another non-center piece on the same face has this color
                    result += '/';
                    yellowsLeft.set(color, yellowsLeft.get(color) - 1);
                } else {
                    // This color does not appear anywhere on this face
                    result += 'X';
                }
            }
        }
        return result;
    }

    possible() {
        const state = this.facelets.join('').toLowerCase();
        // HACKY: Determine if state is valid by attempting to solve and bailing out on error
        try {
            // Convert URFDLB to solver FRUDLB format
            solver([
                state.substring(18, 27),
                state.substring(9, 18),
                state.substring(0, 9),
                state.substring(27)
            ].join(''));
            return true;
        } catch (e) {
            return false;
        }
    }
}
