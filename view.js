import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default class CubeView {
    // Canvas height needs to fit 9 cubies; divide by 10 for some margin
    static SIZE = document.getElementById('results').height / 10;
    static PADDING = 5;
    static FACESIZE = CubeView.SIZE * 3 + CubeView.PADDING;

    constructor() {
        // Set up scene, camera, renderer, and orbit controls
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(5, 5, 5);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
        document.body.appendChild(this.renderer.domElement);
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.enablePan = false;
        this.animate();
        this.throttle = true;

        // Generate the cube one cubie at a time
        const U = new THREE.Color('white');
        const R = new THREE.Color('red');
        const F = new THREE.Color('green');
        const D = new THREE.Color('yellow');
        const L = new THREE.Color('orange');
        const B = new THREE.Color('blue');
        const X = new THREE.Color('black');
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
        this.COLORS = [U, R, F, D, L, B];
        this.CHARTOCOLOR = { 'U': U, 'R': R, 'F': F, 'D': D, 'L': L, 'B': B };
        let colorIndex = 0;
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                for (let z = 0; z < 3; z++) {
                    this.addCubie(x - 1, y - 1, z - 1, COLORMAP[colorIndex++], 9 * x + 3 * y + z);
                }
            }
        }

        // Fix to prevent canvas from looking blurry on Retina displays
        let canvas = document.getElementById('results');
        canvas.width *= 2;
        canvas.height *= 2;
        canvas.getContext('2d').scale(2, 2);

        // Automatically resize viewport when window is resized
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    addCubie(x, y, z, colorList, id) {
        const geometry = new THREE.BoxGeometry().toNonIndexed();
        const material = new THREE.MeshBasicMaterial({ vertexColors: THREE.FaceColors });
        const positionAttribute = geometry.getAttribute('position');
        const colors = [];
        for (let i = 0; i < positionAttribute.count; i += 3) {
            const color = colorList[(i / 3) % colorList.length];
            for (let j = 0; j < 6; j++) {
                // Repeat once for each vertex of the two triangles that form a square face
                colors.push(color.r, color.g, color.b);
            }
        }
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const cubie = new THREE.Mesh(geometry, material);
        this.scene.add(cubie);
        cubie.position.set(x, y, z);
        cubie.scale.set(.95, .95, .95); // Leave gap to distinguish cubies
        cubie.name = id;
    }

    /* Update the color given intersect data. Return true if and only if successful. */
    updateColor(intersect) {
        // Get current color of cubie
        const face = intersect.face;
        const colorAttribute = intersect.object.geometry.getAttribute('color');
        const currentColor = new THREE.Color(
            colorAttribute.getX(face.a),
            colorAttribute.getY(face.b),
            colorAttribute.getZ(face.c)
        );

        // Prevent user from changing color of black internal faces
        if (currentColor.equals(new THREE.Color('black'))) return;
        // Prevent user from changing color of center facelets
        if ([4, 10, 12, 14, 16, 22].includes(intersect.object.name)) return;

        // Use current color to determine next color
        let nextColor = new THREE.Color();
        for (let i = 0; i < this.COLORS.length; i++) {
            // Cannot use equals() because of floating point imprecision
            if (currentColor.getHex() - this.COLORS[i].getHex() === 0) {
                nextColor = this.COLORS[++i % this.COLORS.length];
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
        setColor(face.a, face.b, face.c, nextColor);
        // HACKY: Determine which face indices make up the other triangle on the same square face
        if (face.a % 2 === 0) {
            setColor(face.c + 1, face.c + 2, face.c + 3, nextColor);
        } else {
            setColor(face.a - 1, face.a - 2, face.a - 3, nextColor);
        }
        colorAttribute.needsUpdate = true;

        return true;
    }

    findClickedCubie(event) {
        // Cast ray
        const pointer = new THREE.Vector2();
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(pointer, this.camera);
        return raycaster.intersectObjects(this.scene.children)[0];
    }

    animate() {
        if (this.throttle) {
            setTimeout(() => {
                requestAnimationFrame(this.animate.bind(this));
            }, 1000 / 10);
        } else {
            requestAnimationFrame(this.animate.bind(this));
        }
        this.renderer.render(this.scene, this.camera);
    }

    drawSquare(x, y, color) {
        let canvas = document.getElementById('results').getContext('2d');
        canvas.fillStyle = `rgb(${color.r * 256}, ${color.g * 256}, ${color.b * 256})`;
        canvas.fillRect(x, y, CubeView.SIZE, CubeView.SIZE);
    }

    drawFace(x, y, colors) {
        for (let c = 0; c < 3; c++) {
            for (let r = 0; r < 3; r++) {
                // NOTE: rows and cols interchanged on x/y coordinate grid
                this.drawSquare(
                    x + c * CubeView.SIZE + c,
                    y + r * CubeView.SIZE + r,
                    this.CHARTOCOLOR[colors.charAt(r * 3 + c)]
                );
            }
        }
    }

    drawCube(state) {
        this.drawFace(CubeView.FACESIZE, 0, state.substring(0, 9));
        for (let i = 0; i < 4; i++) {
            this.drawFace(i * CubeView.FACESIZE, CubeView.FACESIZE, state.substring(i * 9 + 9, (i + 1) * 9 + 9));
        }
        this.drawFace(CubeView.FACESIZE, CubeView.FACESIZE * 2, state.substring(5 * 9));
    }
}
