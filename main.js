import confetti from 'canvas-confetti';
import seedrandom from 'seedrandom';
import { registerSW } from 'virtual:pwa-register';
import RubiksCubeSolver from './lib/solver.js';
import Cube2D from './cube2d.js';
import Cube3D from './cube3d.js';
import updateStats from './graph.js';

const feedback = new Cube2D(document.getElementById('feedback'));
// Generate random states until one is found valid
const today = new Date().toDateString();
const rng = seedrandom(today);
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
const answerState = solver.currentState;
const answerColors = stateToFaceletColors(answerState);
const cube = new Cube3D(answerState);

function toggleVisible(id) {
    const element = document.getElementById(id);
    if (element.style.display === 'none') {
        element.style.display = 'block';
    } else {
        element.style.display = 'none';
    }
}
// Set up statistics
let stats = JSON.parse(localStorage.getItem('stats'));
if (stats === null) {
    stats = Array(22).fill(0);
}
document.getElementById('open-stats').onclick = () => toggleVisible('stats-container');
document.getElementById('close-stats').onclick = () => toggleVisible('stats-container');
updateStats(document.getElementById('graph'), stats);

// Set up countdown timer
const midnight = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
midnight.setHours(0);
midnight.setMinutes(0);
midnight.setSeconds(0);
function updateClock() {
    const msLeft = Date.parse(midnight) - Date.parse(new Date());
    const secondsLeft = Math.floor((msLeft / 1000) % 60);
    const minutesLeft = Math.floor((msLeft / 1000 / 60) % 60);
    const hoursLeft = Math.floor((msLeft / (1000 * 60 * 60)) % 24);
    document.getElementById('hours').innerText = ('0' + hoursLeft).slice(-2);
    document.getElementById('minutes').innerText = ('0' + minutesLeft).slice(-2);
    document.getElementById('seconds').innerText = ('0' + secondsLeft).slice(-2);
}
updateClock();
setInterval(updateClock, 1000);

// Set up tutorial
const example = new Cube2D(document.getElementById('example'));
example.drawFace(0, 0, 'ULDRUFUBU', '.XXX.//XX');
document.getElementById('open-tutorial').onclick = () => toggleVisible('tutorial-container');
document.getElementById('close-tutorial').onclick = () => toggleVisible('tutorial-container');
if (!localStorage.getItem('tutorialComplete')) {
    toggleVisible('tutorial-container');
    localStorage.setItem('tutorialComplete', true);
}

// Set up guess button
const guess = document.getElementById('guess');
guess.onclick = check;
guess.addEventListener('animationend', () => guess.classList.remove('shake'));

// Load state from storage
if (localStorage.getItem('today') !== today) {
    localStorage.setItem('today', today);
    localStorage.setItem('guesses', -1);
    localStorage.setItem('score', JSON.stringify(Array(20).fill(-1)));
    localStorage.removeItem('complete');
    cube.save();
} else {
    cube.load();
}
let guesses = localStorage.getItem('guesses');
let score = JSON.parse(localStorage.getItem('score'));
check();
cube.updateParity();

function check() {
    solver.currentState = [...cube.permutation, ...cube.orientation];
    // solver.js does not check all numbers are in valid [0, 20) range
    if (cube.permutation.includes(-1) || !solver.verifyState()) {
        guess.classList.add('shake');
    } else {
        // Increment guesses, save state, and show feedback
        localStorage.setItem('guesses', guesses++);
        document.getElementById('guess').innerText = guesses + ' ✅';
        cube.save();
        updateScore(score);
        cube.initPicker(cube.selection);
        const currentColors = stateToFaceletColors(solver.currentState);
        // Check answer
        feedback.drawCube(currentColors, answerColors);
        if (currentColors.toString() === answerColors.toString()) {
            if (!localStorage.getItem('complete')) {
                localStorage.setItem('complete', true);
                stats[guesses]++;
                localStorage.setItem('stats', JSON.stringify(stats));
                updateStats(document.getElementById('graph'), stats);
            }
            // Show confetti
            const canvas = document.getElementById('confetti');
            canvas.style.display = 'block';
            setTimeout(() => {
                let myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
                myConfetti({
                    particleCount: 100,
                    spread: 135,
                    shapes: ['square'],
                    origin: { x: .5, y: .6 },
                });
                cube.selection.visible = false;
                document.getElementById('parity').innerText = `You won in ${guesses} guesses!`;
                document.getElementById('picker').replaceChildren();
                const share = document.createElement('button');
                share.innerText = '📋 Share';
                share.classList.add('action');
                share.style.flex = '1';
                share.onclick = () => {
                    const today = new Date().toISOString().substring(0, 10);
                    const result = `Cuble ${today}: ${guesses} guesses, ${score.join(' ')}`;
                    navigator.clipboard.writeText(result).then(
                        () => share.innerText = '✅ Copied results to clipboard!',
                        () => share.innerText = '❌ Could not copy to clipboard!',
                    );
                };
                document.getElementById('actions').replaceChildren(share);
                setTimeout(() => canvas.style.display = 'none', 3000);
            }, Cube2D.DELAY * 100);
        }
    }
}

function updateScore(score) {
    for (let i = 0; i < score.length; i++) {
        if (cube.permutation[i] === answerState[i] && cube.orientation[i] === answerState[i + 20]) {
            if (score[i] === -1) {
                score[i] = guesses;
            }
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
                } else if (facelet.length === 3) {
                    // HACK: swap orientations 1 and 2
                    actualOrientation += 3 - orientation[index];
                }
                colors.push(actualPermutation.charAt(actualOrientation % actualPermutation.length));
            }
        }
    }
    return colors;
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

if ('serviceWorker' in navigator) {
    // && !/localhost/.test(window.location)) {
    registerSW();
}
