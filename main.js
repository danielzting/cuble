import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as Cube from 'cubejs';

// Set up scene, camera, renderer, and orbit controls
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 5);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1); // For Retina/HiDPI displays
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
// Save cursor position on pointer down to distinguish rotating and painting
let cursorPosition = new THREE.Vector2();
let throttle = true;

// Add a cubie at the specified coordinates
function addCubie(x, y, z, colorList, id) {
    const geometry = new THREE.BoxGeometry().toNonIndexed();
    const material = new THREE.MeshBasicMaterial({ vertexColors: THREE.FaceColors });
    const positionAttribute = geometry.getAttribute('position');
    const colors = [];
    for (let i = 0; i < positionAttribute.count; i += 3) {
        const color = colorList[(i / 3) % colorList.length];
        for (let j = 0; j < 6; j++) { // Repeat once for each vertex of the two triangles that form a square face
            colors.push(color.r, color.g, color.b);
        }
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const cubie = new THREE.Mesh(geometry, material);
    scene.add(cubie);
    cubie.position.set(x, y, z);
    cubie.scale.set(.95, .95, .95); // Leave gap to distinguish cubies
    cubie.name = id;
}

// Generate the cube one cubie at a time
const U = new THREE.Color('white');
const R = new THREE.Color('red');
const F = new THREE.Color('green');
const D = new THREE.Color('yellow');
const L = new THREE.Color('orange');
const B = new THREE.Color('blue');
const X = new THREE.Color('black');
const COLORS = [U, R, F, D, L, B];
const COLORMAP = [
    // Left slice
    [X, L, X, D, X, B], [X, L, X, D, X, X], [X, L, X, D, F, X],
    [X, L, X, X, X, B], [X, L, X, X, X, X], [X, L, X, X, F, X],
    [X, L, U, X, X, B], [X, L, U, X, X, X], [X, L, U, X, F, X],
    // Middle slice
    [X, X, X, D, X, B], [X, X, X, D, X, X], [X, X, X, D, F, X],
    [X, X, X, X, X, B], [X, X, X, X, X, X], [X, X, X, X, F, X],
    [X, X, U, X, X, B], [X, X, U, X, X, X], [X, X, U, X, F, X],
    // Right slice
    [R, X, X, D, X, B], [R, X, X, D, X, X], [R, X, X, D, F, X],
    [R, X, X, X, X, B], [R, X, X, X, X, X], [R, X, X, X, F, X],
    [R, X, U, X, X, B], [R, X, U, X, X, X], [R, X, U, X, F, X],
];
let colorIndex = 0;
for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
            addCubie(x - 1, y - 1, z - 1, COLORMAP[colorIndex++], 9 * x + 3 * y + z);
        }
    }
}
// Mapping from object name and face to facelet
const FACEMAP = {
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
const FACEORDER = 'URFDLB';
// Array to store facelet colors in the form UUUUUUUUUR...F...D...L...B...
let facelets = [];
for (const face of FACEORDER) {
    for (let i = 0; i < 9; i++) {
        facelets.push(face);
    }
}
// Generate solution
const solution = Cube.random().asString();
console.log(solution);

function animate() {
    if (throttle) {
        setTimeout(() => {
            requestAnimationFrame(animate);
        }, 1000 / 10);
    } else {
        requestAnimationFrame(animate);
    }
    renderer.render(scene, camera);
}
animate();

// Save cursor position so color won't change from rotating camera
document.addEventListener('pointerdown', event => {
    throttle = false;
    cursorPosition = new THREE.Vector2(event.clientX, event.clientY);
});

// Paint a cubie
document.addEventListener('pointerup', event => {
    throttle = true;
    // Ensure cursor hasn't moved since pointer was down, as that is a rotation event
    if (cursorPosition.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 1) return;
    // Cast ray
    const pointer = new THREE.Vector2();
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    // Ensure user clicked on a cubie
    if (intersects.length === 0) return;
    // Get current color of cubie to determine next color
    const face = intersects[0].face;
    const colorAttribute = intersects[0].object.geometry.getAttribute('color');
    const currentColor = new THREE.Color(colorAttribute.getX(face.a), colorAttribute.getY(face.b), colorAttribute.getZ(face.c));
    // Prevent user from changing color of black internal faces
    if (currentColor.equals(X)) return;
    // Prevent user from changing color of center facelets
    if ([4, 10, 12, 14, 16, 22].includes(intersects[0].object.name)) return;
    let color = new THREE.Color();
    for (let i = 0; i < COLORS.length; i++) {
        if (currentColor.getHex() - COLORS[i].getHex() === 0) { // Cannot use equals() because of floating point imprecision
            color = COLORS[++i % COLORS.length];
            break;
        }
    }
    // Helper method to set color attribute
    function setColor(f1, f2, f3, color) {
        colorAttribute.setXYZ(f1, color.r, color.g, color.b);
        colorAttribute.setXYZ(f2, color.r, color.g, color.b);
        colorAttribute.setXYZ(f3, color.r, color.g, color.b);
    }
    // Set color on selected triangle
    setColor(face.a, face.b, face.c, color);
    // HACKY: Determine which face indices make up the other triangle on the same square face
    if (face.a % 2 === 0) {
        setColor(face.c + 1, face.c + 2, face.c + 3, color);
    } else {
        setColor(face.a - 1, face.a - 2, face.a - 3, color);
    }
    colorAttribute.needsUpdate = true;
    // Update facelet array
    const facelet = FACEMAP[intersects[0].object.name][Math.floor(face.a / 6)];
    const faceletIndex = FACEORDER.indexOf(facelet.charAt(0)) * 9 + parseInt(facelet.charAt(1)) - 1;
    facelets[faceletIndex] = FACEORDER[(FACEORDER.indexOf(facelets[faceletIndex]) + 1) % FACEORDER.length];
});

document.getElementById('guess').onclick = () => {
    if (facelets.join('') === solution) {
        alert('You won!');
    } else {
        alert('Try again!');
    }
}

function valid(facelets) {
    for (const face of FACEORDER) {
        if (facelets.filter(color => color === face).length !== 9) {
            return false;
        }
    }
    return new Cube().move(Cube.inverse(Cube.fromString(facelets.join('')).solve())).asString() === facelets.join('');
}

// Automatically resize viewport when window is resized
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
