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
let answerState = [];
do {
    // Shuffle permutation
    const permutation = [...cube.permutation];
    for (let i = permutation.length - 1; i > 0; i--) {
        let j = Math.floor(rng() * (i + 1));
        let temp = permutation[i];
        permutation[i] = permutation[j];
        permutation[j] = temp;
    }
    // Generate random orientations
    const orientation = [];
    for (let i = 0; i < permutation.length; i++) {
        orientation.push(Math.floor(rng() * 3));
    }
    answerState = permutation.concat(orientation);
    solver.currentState = answerState;
} while (!solver.verifyState());
answerState = cube.permutation.concat(cube.orientation);

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
    solver.currentState = cube.permutation.concat(cube.orientation);
    // solver.js does not check all numbers are in valid [0, 20) range
    if (cube.permutation.includes(-1) || !solver.verifyState()) {
        guess.classList.add('shake');
    } else {
        // JavaScript doesn't have a native array equality function LOL? Compare JSON serializations
        if (JSON.stringify(cube.permutation.concat(cube.orientation)) === JSON.stringify(answerState)) {
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
        } else {
            feedback.drawCube(stateToFaceletColors(cube.permutation, cube.orientation), '.'.repeat(54));
            console.log(answerState);
        }
    }
}

function stateToFaceletColors(permutation, orientation) {
    const FACELETS = [
        'UBL U', 'UB U', 'URB U', 'UL U', 'U', 'UR U', 'ULF U', 'UF U', 'UFR U', // U
        'UBL L', 'UL L', 'ULF L', 'BL L', 'L', 'FL L', 'DLB L', 'DL L', 'DFL L', // L
        'ULF F', 'UF F', 'UFR F', 'FL F', 'F', 'FR F', 'DFL F', 'DF F', 'DRF F', // F
        'UFR R', 'UR R', 'URB R', 'FR R', 'R', 'BR R', 'DRF R', 'DR R', 'DBR R', // R
        'URB B', 'UB B', 'UBL B', 'BR B', 'B', 'BL B', 'DBR B', 'DB B', 'DLB B', // B
        'DFL D', 'DF D', 'DRF D', 'DL D', 'D', 'DR D', 'DLB D', 'DB D', 'DBR D', // D
    ];
    const state = [];
    for (let i = 0; i < FACELETS.length; i++) {
        if (FACELETS[i].length === 1) {
            state.push(FACELETS[i]);
        } else {
            const cubie = FACELETS[i].split(' ')[0];
            const face = FACELETS[i].split(' ')[1];
            const index = permutation[Cube3D.getStateIndex(cubie)];
            const actualPermutation = Cube3D.CUBIE_ORDER[index];
            const actualOrientation = cubie.indexOf(face) + orientation[index];
            state.push(actualPermutation.charAt(actualOrientation % actualPermutation.length));
        }
    }
    return state.join('');
}
