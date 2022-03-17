import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default class CubeView {
    // Canvas height needs to fit 9 cubies; divide by 10 for some margin
    static SIZE = document.getElementById('feedback').height / 10;
    // Additional padding between faces
    static PADDING = 5;
    static FACESIZE = CubeView.SIZE * 3 + CubeView.PADDING;
    // Delay between displaying each facelet of feedback in ms
    static DELAY = 10;

    // Throttle the viewport to 10 FPS when not rotating to save power
    throttle = false;
    // Accumulated timeout for displaying facelet
    delay = 0;

    constructor() {
        // Set up scene, camera, renderer, and controls

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(5, 5, 5);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);

        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.enablePan = false;
        controls.enableZoom = false;

        this.selection = new THREE.Mesh(
            new THREE.BoxGeometry(),
            new THREE.MeshBasicMaterial({ color: 'black', transparent: true, opacity: 0.25 }),
        );
        this.selection.visible = false;
        this.scene.add(this.selection);

        // Save cursor position on pointer down to distinguish rotating and painting
        this.renderer.domElement.addEventListener('pointerdown', event => {
            this.throttle = false;
            this.cursorPos = [event.clientX, event.clientY];
        });
        this.renderer.domElement.addEventListener('pointerup', event => {
            this.throttle = true;
            // Ensure cursor hasn't moved since pointer was down, as that is a rotation event
            if (Math.hypot(event.clientX - this.cursorPos[0], event.clientY - this.cursorPos[1]) > 1) return;

            const clicked = this.findClickedCubie(event);
            // Ignore clicks that don't intersect with a cubie
            if (clicked == undefined) return;
            if (clicked.object.position.equals(this.selection.position)) {
                this.selection.position.set(0, 0, 0);
                this.selection.visible = false;
            } else {
                this.selection.position.copy(clicked.object.position);
                this.selection.visible = true;
            }
        });

        this.animate();
        document.body.appendChild(this.renderer.domElement);

        // Generate cubies
        const CUBIE_ORDER = [
            'DLB', 'DL', 'DFL', 'BL', 'L', 'FL', 'UBL', 'UL', 'ULF',
            'DB', 'D', 'DF', 'B', '', 'F', 'UB', 'U', 'UF',
            'DBR', 'DR', 'DRF', 'BR', 'R', 'FR', 'URB', 'UR', 'UFR',
        ];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                for (let k = 0; k < 3; k++) {
                    this.addCubie(i - 1, j - 1, k - 1, CUBIE_ORDER[i * 9 + j * 3 + k]);
                }
            }
        }

        // Fix to prevent canvas from looking blurry on Retina displays
        let canvas = document.getElementById('feedback');
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

    /**
     * Add a cubie of the given name at the specified coordinates.
     * @param {number} x x-coordinate
     * @param {number} y y-coordinate
     * @param {number} z z-coordinate
     * @param {string} name piece to add that must consist of zero or more characters from 'URFDLB'
     */
    addCubie(x, y, z, name) {
        const COLORMAP = {
            U: new THREE.Color(0xFFFFFF),
            R: new THREE.Color(0xEA2003),
            F: new THREE.Color(0x4DE432),
            D: new THREE.Color(0xF6ED35),
            L: new THREE.Color(0xF5921D),
            B: new THREE.Color(0x62B3E1),
            X: new THREE.Color(0x000000),
        };
        const SCALE = .95;

        // Generate all-black material
        const material = new THREE.MeshBasicMaterial({ vertexColors: THREE.FaceColors });
        const colors = [];
        // 36 vertices = 6 faces * 2 triangles/face * 3 vertices/triangle
        for (let i = 0; i < 36; i++) {
            colors.push(COLORMAP['X'].r, COLORMAP['X'].g, COLORMAP['X'].b);
        }

        // Set up geometry
        const geometry = new THREE.BoxGeometry().toNonIndexed();
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        // Add cubie to scene
        const cubie = new THREE.Mesh(geometry, material);
        cubie.position.set(x, y, z);
        // Slightly scale cubie down to visibly separate them
        cubie.scale.set(SCALE, SCALE, SCALE);
        cubie.name = name;

        this.scene.add(cubie);

        // Set appropriate colors on correct faces
        // Thankfully, cubes in three.js are always placed with face indices pointing in the same direction
        // For example, face indices 0 through 5 inclusive will always point right (in our camera setup)
        // We can take advantage of this to easily find the indices we need to set for a given piece name
        const FACEMAP = { R: 0, L: 6, U: 12, D: 18, F: 24, B: 30 };
        const colorAttribute = geometry.getAttribute('color');
        for (const face of name) {
            // 6 vertices = 1 face * 3 triangles/face * 2 vertices/triangle
            for (let i = FACEMAP[face]; i < FACEMAP[face] + 6; i++) {
                colorAttribute.setXYZ(i, COLORMAP[face].r, COLORMAP[face].g, COLORMAP[face].b);
            }
        }
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

    drawSquare(x, y, color, result) {
        let canvas = document.getElementById('feedback').getContext('2d');
        canvas.fillStyle = `rgb(${color.r * 256}, ${color.g * 256}, ${color.b * 256})`;
        canvas.fillRect(x, y, CubeView.SIZE, CubeView.SIZE);
        if (result == '/' || result == 'X') {
            canvas.beginPath();
            canvas.moveTo(x, y);
            canvas.lineTo(x + CubeView.SIZE, y + CubeView.SIZE);
            canvas.stroke();
        }
        if (result == 'X') {
            canvas.beginPath();
            canvas.moveTo(x + CubeView.SIZE, y);
            canvas.lineTo(x, y + CubeView.SIZE);
            canvas.stroke();
        }
    }

    drawFace(x, y, colors, results) {
        for (let c = 0; c < 3; c++) {
            for (let r = 0; r < 3; r++) {
                // NOTE: rows and cols interchanged on x/y coordinate grid
                setTimeout(() => {
                    this.drawSquare(
                        x + c * CubeView.SIZE + c,
                        y + r * CubeView.SIZE + r,
                        this.CHARTOCOLOR[colors.charAt(r * 3 + c)],
                        results.charAt(r * 3 + c)
                    );
                }, this.delay);
                this.delay += CubeView.DELAY;
            }
        }
    }

    drawCube(colors, results) {
        this.delay = 0;
        const canvas = document.getElementById('feedback');
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        this.drawFace(CubeView.FACESIZE, 0, colors.substring(0, 9), results.substring(0, 9));
        for (let i = 0; i < 4; i++) {
            this.drawFace(
                i * CubeView.FACESIZE,
                CubeView.FACESIZE,
                colors.substring(i * 9 + 9, i * 9 + 18),
                results.substring(i * 9 + 9, i * 9 + 18)
            );
        }
        this.drawFace(CubeView.FACESIZE, CubeView.FACESIZE * 2, colors.substring(45), results.substring(45));
    }
}
