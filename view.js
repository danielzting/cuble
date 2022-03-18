import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Cubie from './cubie.js';

export default class CubeView {
    // Canvas height needs to fit 9 cubies; divide by 10 for some margin
    static SIZE = document.getElementById('feedback').height / 10;
    // Additional padding between faces
    static PADDING = 5;
    static FACESIZE = CubeView.SIZE * 3 + CubeView.PADDING;
    // Delay between displaying each facelet of feedback in ms
    static DELAY = 10;

    // Throttle the viewport to 10 FPS when not rotating to save power
    throttle = true;
    // Accumulated timeout for displaying facelet
    delay = 0;

    static COLORMAP = {
        U: new THREE.Color(0xFFFFFF),
        R: new THREE.Color(0xEA2003),
        F: new THREE.Color(0x4DE432),
        D: new THREE.Color(0xF6ED35),
        L: new THREE.Color(0xF5921D),
        B: new THREE.Color(0x62B3E1),
        X: new THREE.Color(0x000000),
    };

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
                    this.scene.add(new Cubie(i - 1, j - 1, k - 1, CUBIE_ORDER[i * 9 + j * 3 + k]));
                }
            }
        }

        // HACK: Change order of cubies so picker buttons are arranged more logically
        CUBIE_ORDER.sort().reverse();

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
            // Set up cubie picker
            const picker = document.getElementById('picker');
            const erase = document.getElementById('erase');
            const rotate = document.getElementById('rotate');
            picker.replaceChildren();
            if (clicked.object.position.equals(this.selection.position)) {
                this.selection.position.set(0, 0, 0);
                this.selection.visible = false;
                erase.disabled = true;
                rotate.disabled = true;
            } else {
                this.selection.position.copy(clicked.object.position);
                this.selection.visible = true;
                // Don't show cubie picker for centers
                if (clicked.object.name.length === 1) return;
                for (const cubie of CUBIE_ORDER) {
                    // Only let user pick cubies of same edge/corner type
                    if (cubie.length !== clicked.object.name.length) continue;
                    // Initialize button
                    const buttonsPerRow = (cubie.length == 2) ? 6 : 4;
                    const button = picker.appendChild(document.createElement('button'));
                    button.classList.add('cubie');
                    button.style.width = (picker.offsetWidth - 10 * buttonsPerRow) / buttonsPerRow + 'px';
                    // Draw cubie onto button
                    const canvas = button.appendChild(document.createElement('canvas'));
                    canvas.width = button.clientWidth * 2;
                    canvas.height = button.clientHeight * 2;
                    canvas.style.width = button.clientWidth + 'px';
                    canvas.style.height = button.clientHeight + 'px';
                    const ctx = canvas.getContext('2d');
                    for (let i = 0; i < cubie.length; i++) {
                        const color = CubeView.COLORMAP[cubie.charAt(i)];
                        const perWidth = canvas.width / cubie.length;
                        ctx.fillStyle = `rgb(${color.r * 256}, ${color.g * 256}, ${color.b * 256})`;
                        ctx.fillRect(perWidth * i, 0, perWidth, canvas.height);
                    }
                    button.onclick = () => clicked.object.setColors(cubie);
                }
                erase.disabled = false;
                erase.onclick = () => clicked.object.setColors('XXX');
                rotate.disabled = false;
                rotate.onclick = () => clicked.object.rotate();
            }
        });

        // Fix to prevent canvas from looking blurry on Retina displays
        const canvas = document.getElementById('feedback');
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
        const canvas = document.getElementById('feedback').getContext('2d');
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
