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
function addCubie(x, y, z) {
    const geometry = new THREE.BoxGeometry().toNonIndexed();
    const material = new THREE.MeshBasicMaterial({ vertexColors: THREE.FaceColors });
    const positionAttribute = geometry.getAttribute('position');
    const colors = [];
    for (let i = 0; i < positionAttribute.count; i += 3) {
        const color = new THREE.Color(Math.random() * 0xffffff);
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
for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
            addCubie(x, y, z);
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
    cursorPosition = new THREE.Vector2(event.screenX, event.screenY);
});

// Paint a cubie
document.addEventListener('pointerup', event => {
    // Ensure cursor hasn't moved since pointer was down, as that is a rotation event
    if (cursorPosition.distanceTo(new THREE.Vector2(event.screenX, event.screenY)) > 1) return;
    // Cast ray
    const pointer = new THREE.Vector2();
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    // Ensure user clicked on a cubie
    if (intersects.length == 0) return;
    const face = intersects[0].face;
    const colorAttribute = intersects[0].object.geometry.getAttribute('color');
    const color = new THREE.Color(Math.random() * 0xffffff);
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
