import CubeModel from './model';
import CubeView from './view';

const cubeView = new CubeView();
const cubeModel = new CubeModel();

// Save cursor position on pointer down to distinguish rotating and painting
let cursorPosition = [0, 0];

// Save cursor position so color won't change from rotating camera
document.addEventListener('pointerdown', event => {
    cubeView.throttle = false;
    cursorPosition = [event.clientX, event.clientY];
});

// Paint a cubie
document.addEventListener('pointerup', event => {
    cubeView.throttle = true;
    // Ensure cursor hasn't moved since pointer was down, as that is a rotation event
    if (Math.hypot(event.clientX - cursorPosition[0], event.clientY - cursorPosition[1]) > 1) return;
    // Update view and model
    const intersect = cubeView.findClickedCubie(event);
    if (intersect !== undefined) {
        cubeView.updateColor(intersect);
        cubeModel.updateColor(intersect);
    }
});

document.getElementById('guess').onclick = check;
document.addEventListener('keyup', event => {
    if (event.key === "Enter") {
        check();
    }
});

function check() {
    if (cubeModel.match()) {
        alert('You won!');
    } else {
        alert('Try again!');
    }
}
