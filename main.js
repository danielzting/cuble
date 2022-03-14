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

const button = document.getElementById('guess');
button.onclick = check;
button.addEventListener('animationend', () => button.classList.remove('shake'));
document.addEventListener('keyup', event => {
    if (event.key === "Enter") {
        check();
    }
});

function check() {
    function format(state) {
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
    }
}
