import * as THREE from 'three';
import { GUI } from 'lil-gui';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AStar, GridNode, GridState, GridSearchProblem } from './AStar.ts';

let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let grid: GridState;
let problem: GridSearchProblem;
let astar: AStar;
const TILE_GEOMETRY = new THREE.BoxGeometry(1, 0.01, 1);
const START_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x11cc11 }); //green
const GOAL_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xcc1111 }); //red
const EXPANDED_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x96EC60 }); //light green
const CONSIDERING_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x52deb7 });
const PATH_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xFFD700 }); //yellow
const TILE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xeeeeee }); //white
const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 }); //black

const size = 50;
const viewSize = size + 1;
const wallProbability = 0.1;
let settings = {
    expansionDelay: 100,
    pathDelay: 100
};

window.addEventListener('load', async () => initialize());


function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}

async function initialize() {
    console.log('Initializing');
    if (WebGL.isWebGLAvailable()) {
        console.log('WebGL is available');
        scene = new THREE.Scene();
        renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('app') as HTMLCanvasElement,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);

        const aspect_ratio = window.innerWidth / window.innerHeight;
        camera = new THREE.OrthographicCamera(
            -aspect_ratio * viewSize / 2,
            aspect_ratio * viewSize / 2,
            viewSize / 2,
            -viewSize / 2,
            0.1,
            1000
        );

        controls = new OrbitControls(camera, renderer.domElement);
        const gui = new GUI();


        initializeGridCanvas(size, size, 1)

        // camera needs to be positioned above the grid to see it so we move it half the grid size in the y direction and then back in the z direction
        let cameraPos = new THREE.Vector3(size / 2, 10, size / 2);
        controls.target = new THREE.Vector3(size / 2, 0, size / 2);
        camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
        camera.lookAt(new THREE.Vector3(size / 2, 0, size / 2));
        scene.add(camera);
        renderer.render(scene, camera);

        console.log('starting search')
        astar = new AStar(problem);
        const [path, expanded] = astar.search();
        console.log(`Path is ${path.length} nodes long`);
        console.log(`${expanded} nodes were expanded to find the path`);
        console.log('starting visualization')
        await drawGrid();

        animate();
        window.addEventListener('resize', onWindowResize);
    }
}

function initializeGridCanvas(rows: number, cols: number, cellSize: number) {

    let gridHelper = new THREE.GridHelper(cols * cellSize, cols, 0x000000, 0x000000);
    gridHelper.position.set(cols / 2, 0.01, rows / 2);
    scene.add(gridHelper);

    // make GridState object to do A* search
    grid = new GridState(rows, cols);

    problem = new GridSearchProblem(grid);
    // make 20% of the grid unwalkable
    for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
            grid.setWalkable(x, y, Math.random() > wallProbability);
        }
    }
    //problem.setGoal(25, 25);
    problem.randomizeStartAndGoal();

    for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
            let node = grid.getNode(x, y);
            let material;
            if (node.isWalkable) {
                material = TILE_MATERIAL;
            } else {
                material = wallMaterial;
            }
            if (node == problem.start) {
                material = START_MATERIAL;
            }
            if (node == problem.goal) {
                material = GOAL_MATERIAL;
            }
            let cube = new THREE.Mesh(TILE_GEOMETRY, material);
            cube.position.set(x + 0.5, 0, y + 0.5);
            cube.name = `(${x},${y})`;
            scene.add(cube);
        }
    }

}

async function drawGrid() {
    astar = new AStar(problem);
    await astar.searchVisualize(visualizeStep);
}

async function visualizeStep(node: GridNode, action: string) {
    // Dont change start and goal colors
    if (node == problem.start || node == problem.goal) {
        return;
    }
    let material: THREE.Material = TILE_MATERIAL;
    let cube = scene.getObjectByName(`(${node.x},${node.y})`) as THREE.Mesh;

    switch (action) {
        case 'expanding':
            material = EXPANDED_MATERIAL;
            break;
        case 'path':
            material = PATH_MATERIAL;
            break;
        case 'considering':
            material = CONSIDERING_MATERIAL;
            break;
        default:
            break;
    }

    if (cube) {
        cube.material = material;
        renderer.render(scene, camera);
        await new Promise((resolve) => setTimeout(resolve, settings.pathDelay));
    }

}

function onWindowResize() {
    const newAspectRatio = window.innerWidth / window.innerHeight;
    camera.left = -newAspectRatio * viewSize / 2;
    camera.right = newAspectRatio * viewSize / 2;
    camera.top = viewSize / 2;
    camera.bottom = -viewSize / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


