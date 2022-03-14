import * as Cube from 'cubejs';

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
        for (let i = 0; i < this.solution.length; i++) {
            const faceStart = Math.floor(i / 9) * 9;
            if (this.solution.charAt(i) === this.facelets[i]) {
                result += '.';
                // Check if same face has this color
            } else if (this.solution.substring(faceStart, faceStart + 9).includes(this.facelets[i])) {
                result += '/';
            } else {
                result += 'X';
            }
        }
        return result;
    }
}
