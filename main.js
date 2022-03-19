import confetti from 'canvas-confetti';
import RubiksCubeSolver from './lib/solver.js';
import Cube from './cube.js';

const cube = new Cube();

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
    const solver = new RubiksCubeSolver();
    solver.currentState = cube.permutation.concat(cube.orientation);
    if (!solver.verifyState()) {
        guess.classList.add('shake');
    } else {
        cubeView.drawCube(format(cubeModel.facelets.join('')), format(cubeModel.check()));
        if (cubeModel.facelets.join('') === cubeModel.solution) {
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
                setTimeout(() => canvas.style.display = 'none', 3000);
            }, CubeView.DELAY * 100);
        }
    }
}
