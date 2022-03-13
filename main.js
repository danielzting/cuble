import CubeModel from './model';
import CubeView from './view';

const cubeView = new CubeView();
const cubeModel = new CubeModel();

// Save cursor position on pointer down to distinguish rotating and painting
let cursorPos = [0, 0];

// Save cursor position so color won't change from rotating camera
document.addEventListener('pointerdown', event => {
    cubeView.throttle = false;
    cursorPos = [event.clientX, event.clientY];
});

// Paint a cubie
document.addEventListener('pointerup', event => {
    cubeView.throttle = true;
    // Ensure cursor hasn't moved since pointer was down, as that is a rotation event
    if (Math.hypot(event.clientX - cursorPos[0], event.clientY - cursorPos[1]) > 1) return;
    // Update view and model
    const intersect = cubeView.findClickedCubie(event);
    if (intersect !== undefined) {
        if (cubeView.updateColor(intersect)) {
            cubeModel.updateColor(intersect);
        }
    }
});

document.getElementById('guess').onclick = check;
document.addEventListener('keyup', event => {
    if (event.key === "Enter") {
        check();
    }
});

function check() {
    const state = cubeModel.facelets.join('');
    cubeView.drawCube(
        state.substring(0, 9) +
        state.substring(4 * 9, 5 * 9) +
        state.substring(2 * 9, 3 * 9) +
        state.substring(9, 2 * 9) +
        state.substring(5 * 9) +
        state.substring(3 * 9, 4 * 9)
    );
    if (cubeModel.match()) {
        alert('You won!');
    } else {
        alert('Try again!');
    }
}
