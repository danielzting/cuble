// Set up scene, camera, renderer, and orbit controls
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 5);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1); // For Retina/HiDPI displays
document.body.appendChild(renderer.domElement);
controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
// Save cursor position on pointer down to distinguish rotating and painting
let cursorPosition = new THREE.Vector2();

// Add a cubie at the specified coordinates
function addCubie(x, y, z, colorList) {
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
}

// Generate the cube one cubie at a time
const W = new THREE.Color('white');
const O = new THREE.Color('orange');
const G = new THREE.Color('green');
const R = new THREE.Color('red');
const B = new THREE.Color('blue');
const Y = new THREE.Color('yellow');
const X = new THREE.Color('black');
const COLORS = [W, O, G, R, B, Y];
const COLORMAP = [
    [X, O, X, Y, X, B], [X, O, X, Y, X, X], [X, O, X, Y, G, X],
    [X, O, X, X, X, B], [X, O, X, X, X, X], [X, O, X, X, G, X],
    [X, O, W, X, X, B], [X, O, W, X, X, X], [X, O, W, X, G, X],

    [X, X, X, Y, X, B], [X, X, X, Y, X, X], [X, X, X, Y, G, X],
    [X, X, X, X, X, B], [X, X, X, X, X, X], [X, X, X, X, G, X],
    [X, X, W, X, X, B], [X, X, W, X, X, X], [X, X, W, X, G, X],

    [R, X, X, Y, X, B], [R, X, X, Y, X, X], [R, X, X, Y, G, X],
    [R, X, X, X, X, B], [R, X, X, X, X, X], [R, X, X, X, G, X],
    [R, X, W, X, X, B], [R, X, W, X, X, X], [R, X, W, X, G, X],
];
let colorIndex = 0;
for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
            addCubie(x, y, z, COLORMAP[colorIndex++]);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Save cursor position so color won't change from rotating camera
document.addEventListener('pointerdown', event => {
    cursorPosition = new THREE.Vector2(event.clientX, event.clientY);
});

// Paint a cubie
document.addEventListener('pointerup', event => {
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
    if (intersects.length == 0) return;
    // Get current color of cubie to determine next color
    const face = intersects[0].face;
    const colorAttribute = intersects[0].object.geometry.getAttribute('color');
    const currentColor = new THREE.Color(colorAttribute.getX(face.a), colorAttribute.getY(face.b), colorAttribute.getZ(face.c));
    let color = new THREE.Color();
    for (let i = 0; i < COLORS.length; i++) {
        if (currentColor.getHex() - COLORS[i].getHex() === 0) {
            color = COLORS[++i % COLORS.length];
            break;
        }
    }
    // Set color on selected triangle
    colorAttribute.setXYZ(face.a, color.r, color.g, color.b);
    colorAttribute.setXYZ(face.b, color.r, color.g, color.b);
    colorAttribute.setXYZ(face.c, color.r, color.g, color.b);
    // HACKY: Determine which face indices make up the other triangle on the same square face
    if (face.a % 2 == 0) {
        colorAttribute.setXYZ(face.c + 1, color.r, color.g, color.b);
        colorAttribute.setXYZ(face.c + 2, color.r, color.g, color.b);
        colorAttribute.setXYZ(face.c + 3, color.r, color.g, color.b);
    } else {
        colorAttribute.setXYZ(face.a - 1, color.r, color.g, color.b);
        colorAttribute.setXYZ(face.a - 2, color.r, color.g, color.b);
        colorAttribute.setXYZ(face.a - 3, color.r, color.g, color.b);
    }
    colorAttribute.needsUpdate = true;
});

// Automatically resize viewport when window is resized
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
