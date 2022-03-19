import confetti from 'canvas-confetti';
import seedrandom from 'seedrandom';
import RubiksCubeSolver from './lib/solver.js';
import Cube from './cube.js';

const cube = new Cube();
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
    if (!solver.verifyState()) {
        guess.classList.add('shake');
    } else {
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
            }, Cube.DELAY * 100);
        } else {
            console.log(answerState);
        }
    }
}
