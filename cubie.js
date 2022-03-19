import * as THREE from 'three';
import COLORS from './colors.js';

export default class Cubie extends THREE.Mesh {
    /**
     * Add a cubie of the given name at the specified coordinates.
     * @param {number} x x-coordinate
     * @param {number} y y-coordinate
     * @param {number} z z-coordinate
     * @param {string} name cubie to add, must consist of zero or more characters from 'URFDLB'
     */
    constructor(x, y, z, name) {
        // Slightly scale cubie down to visibly separate them
        const SCALE = .95;

        // Generate all-black material
        const material = new THREE.MeshBasicMaterial({ vertexColors: THREE.FaceColors });
        const colors = [];
        // 36 vertices = 6 faces * 2 triangles/face * 3 vertices/triangle
        for (let i = 0; i < 36; i++) {
            colors.push(0, 0, 0);
        }

        // Set up geometry
        const geometry = new THREE.BoxGeometry().toNonIndexed();
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        // Add cubie to scene
        super(geometry, material);
        this.position.set(x, y, z);
        this.scale.set(SCALE, SCALE, SCALE);
        this.name = name;
        this.setColors(name);
    }

    /**
     * Change the colors of this cubie. Before this method is called, the name field MUST have been set.
     * The number of colors must match the type of the cubie: three for corners and two for edges.
     * 
     * For a corner, the order is as follows: the first character must be U or D, then the next two
     * characters are the left and right colors when looking at the corner from the perspective of
     * the first color on top.
     * 
     * For an edge, the first character must be U or D if the edge has those. Otherwise, the first
     * character must be F or B.
     * @param {string} colors color to add, must consist of zero or more characters from 'URFDLB'
     */
    setColors(colors) {
        if (colors.length !== this.name.length) {
            throw `Expected ${this.name.length} colors but got ${colors}.`;
        }
        this.colors = colors;
        // Set appropriate colors on correct faces
        // Thankfully, cubes in three.js are always placed with face indices pointing in the same direction
        // For example, face indices 0 through 5 inclusive will always point right (in our camera setup)
        // We can take advantage of this to easily find the indices we need to set for a given piece name
        const FACEMAP = { R: 0, L: 6, U: 12, D: 18, F: 24, B: 30 };
        const colorAttribute = this.geometry.getAttribute('color');
        for (let i = 0; i < this.name.length; i++) {
            const color = COLORS[colors.charAt(i)];
            // 6 vertices = 1 face * 3 triangles/face * 2 vertices/triangle
            for (let j = 0; j < 6; j++) {
                colorAttribute.setXYZ(FACEMAP[this.name.charAt(i)] + j, color.r, color.g, color.b);
            }
        }
        this.geometry.attributes.color.needsUpdate = true;
    }

    /**
     * Remove the colors from the cubie.
     */
    erase() {
        this.setColors('XXX'.substring(0, this.name.length));
    }

    /**
     * Twist the cubie clockwise if it is a corner or flip it if it is an edge.
     */
    rotate() {
        this.setColors(this.colors.substring(1) + this.colors.charAt(0));
    }
}
