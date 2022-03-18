import confetti from 'canvas-confetti';

import CubeModel from './model';
import CubeView from './view';

const cubeView = new CubeView();
const cubeModel = new CubeModel();

// Set up guess button
const button = document.getElementById('guess');
button.onclick = check;
button.addEventListener('animationend', () => button.classList.remove('shake'));
document.addEventListener('keyup', event => {
    if (event.key === 'Enter') {
        check();
    }
});

function check() {
    function format(state) {
        // Convert URFDLB to 2D view ULFRBD format
        return state.substring(0, 9) +
            state.substring(36, 45) +
            state.substring(18, 27) +
            state.substring(9, 18) +
            state.substring(45) +
            state.substring(27, 36);
    }
    if (!cubeModel.possible()) {
        button.classList.add('shake');
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
