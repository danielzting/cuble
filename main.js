import confetti from 'canvas-confetti';
import seedrandom from 'seedrandom';
import RubiksCubeSolver from './lib/solver.js';
import Cube2D from './cube2d.js';
import Cube3D from './cube3d.js';

const feedback = new Cube2D(document.getElementById('feedback'));
const cube = new Cube3D();
// Generate random states until one is found valid
const rng = seedrandom(new Date().toDateString());
const solver = new RubiksCubeSolver();
do {
    // Generate random permutation
    const edgePermutation = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    const cornerPermutation = shuffle([12, 13, 14, 15, 16, 17, 18, 19]);
    const permutation = [...edgePermutation, ...cornerPermutation];
    // Generate orientations
    const orientation = [];
    // Edges only have 2 orientations
    for (let i = 0; i < 12; i++) {
        orientation.push(Math.floor(rng() * 2));
    }
    // Corners can have 3 orientations
    for (let i = 0; i < 8; i++) {
        orientation.push(Math.floor(rng() * 3));
    }
    solver.currentState = [...permutation, ...orientation];
} while (!solver.verifyState());
const answerColors = stateToFaceletColors(solver.currentState);

// Set up guess button
const guess = document.getElementById('guess');
guess.onclick = check;
guess.addEventListener('animationend', () => guess.classList.remove('shake'));
document.addEventListener('keyup', event => {
    if (event.key === 'Enter') {
        check();
    }
});

function check() {
    solver.currentState = [...cube.permutation, ...cube.orientation];
    // solver.js does not check all numbers are in valid [0, 20) range
    if (cube.permutation.includes(-1) || !solver.verifyState()) {
        guess.classList.add('shake');
    } else {
        const currentColors = stateToFaceletColors(solver.currentState);
        feedback.drawCube(currentColors, getFeedback(currentColors, answerColors));
        if (currentColors.toString() === answerColors.toString()) {
            const canvas = document.getElementById('confetti');
            canvas.style.display = 'block';
            setTimeout(() => {
                let myConfetti = confetti.create(canvas, {
                    resize: true,
                    useWorker: true
                });
                myConfetti({
                    particleCount: 100,
                    spread: 135,
                    shapes: ['square'],
                    origin: { x: .5, y: .6 },
                });
                cube.selection.visible = false;
                document.getElementById('picker').style.display = 'none';
                document.getElementById('actions').style.display = 'none';
                setTimeout(() => canvas.style.display = 'none', 3000);
            }, Cube2D.DELAY * 100);
        }
    }
}

function stateToFaceletColors(state) {
    const permutation = state.slice(0, 20);
    const orientation = state.slice(20);
    // Convert a permutation and orientation state into the 54 facelet colors required by Cube2D
    const FACELETS = {
        U: ['UBL', 'UB', 'URB', 'UL', 'U', 'UR', 'ULF', 'UF', 'UFR'],
        L: ['UBL', 'UL', 'ULF', 'BL', 'L', 'FL', 'DLB', 'DL', 'DFL'],
        F: ['ULF', 'UF', 'UFR', 'FL', 'F', 'FR', 'DFL', 'DF', 'DRF'],
        R: ['UFR', 'UR', 'URB', 'FR', 'R', 'BR', 'DRF', 'DR', 'DBR'],
        B: ['URB', 'UB', 'UBL', 'BR', 'B', 'BL', 'DBR', 'DB', 'DLB'],
        D: ['DFL', 'DF', 'DRF', 'DL', 'D', 'DR', 'DLB', 'DB', 'DBR'],
    };
    const colors = [];
    for (const face of 'ULFRBD') {
        for (const facelet of FACELETS[face]) {
            if (facelet.length === 1) {
                colors.push(facelet);
            } else {
                const index = Cube3D.getStateIndex(facelet);
                let actualPermutation = Cube3D.CUBIE_ORDER[permutation[index]];
                let actualOrientation = facelet.indexOf(face);
                if (facelet.length === 2) {
                    actualOrientation += orientation[index];
                // HACK: swap orientations 1 and 2
                } else if (facelet.length === 3) {
                    actualOrientation += 3 - orientation[index];
                }
                colors.push(actualPermutation.charAt(actualOrientation % actualPermutation.length));
            }
        }
    }
    return colors;
}

function getFeedback(actual, expected) {
    const feedback = [];
    for (let i = 0; i < actual.length; i++) {
        if (actual[i] === expected[i]) {
            feedback.push('.');
        } else {
            feedback.push('X');
        }
    }
    return feedback;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(rng() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}
