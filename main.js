import * as THREE from 'three';
import { FBXLoader } from 'three/addons/FBXLoader.js';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/DRACOLoader.js';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { LookingGlassWebXRPolyfill, LookingGlassConfig } from '@lookingglass/webxr';
import * as fflate from 'fflate';

const lookingGlassConfig = LookingGlassConfig;
lookingGlassConfig.targetX = 500;
lookingGlassConfig.targetY = 120;
lookingGlassConfig.targetZ = 480;
lookingGlassConfig.targetDiam = 600;
lookingGlassConfig.fovy = (40 * Math.PI) / 180;
new LookingGlassWebXRPolyfill();

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100000);
camera.position.set(0, 400, 800);

const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    logarithmicDepthBuffer: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.LinearToneMapping;
renderer.toneMappingExposure = 1.6;
renderer.xr.enabled = true;
document.getElementById('canvas-container').appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 100;
controls.maxDistance = 30000;
controls.maxPolarAngle = Math.PI / 2.05;

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 2.0); 
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x666666, 1.5); 
hemiLight.position.set(0, 500, 0);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
sunLight.position.set(1500, 3000, 1500);
sunLight.castShadow = true;
sunLight.shadow.camera.top = 5000;
sunLight.shadow.camera.bottom = -5000;
sunLight.shadow.camera.left = -5000;
sunLight.shadow.camera.right = 5000;
sunLight.shadow.mapSize.set(2048, 2048);
scene.add(sunLight);

const leftLight = new THREE.DirectionalLight(0xffffff, 1.5);
leftLight.position.set(-1000, 500, 1000);
scene.add(leftLight);

const rightLight = new THREE.DirectionalLight(0xffffff, 1.5);
rightLight.position.set(1000, 500, 1000);
scene.add(rightLight);

// --- Noise Texture ---
const canvas = document.createElement('canvas');
canvas.width = 256; canvas.height = 256;
const ctx = canvas.getContext('2d');
for (let i = 0; i < canvas.width; i++) {
    for (let j = 0; j < canvas.height; j++) {
        const val = 100 + Math.random() * 50;
        ctx.fillStyle = `rgb(${val},${val},${val})`;
        ctx.fillRect(i, j, 1, 1);
    }
}
const noiseTexture = new THREE.CanvasTexture(canvas);
noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;
noiseTexture.repeat.set(100, 100);

// --- Environment ---
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30000, 30000),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1.0, bumpMap: noiseTexture, bumpScale: 2.0 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const wallMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1.0 });
const wallGeo = new THREE.PlaneGeometry(30000, 8000);
const walls = [
    { pos: [0, 4000, -14500], rot: [0, 0, 0] },
    { pos: [0, 4000, 14500], rot: [0, Math.PI, 0] },
    { pos: [-14500, 4000, 0], rot: [0, Math.PI/2, 0] },
    { pos: [14500, 4000, 0], rot: [0, -Math.PI/2, 0] }
];
walls.forEach(w => {
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(...w.pos);
    wall.rotation.set(...w.rot);
    scene.add(wall);
});

function createPlaza() {
    const walkwayMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1.0, bumpMap: noiseTexture, bumpScale: 3.0 });
    const buildingGrays = [0x222222, 0x333333, 0x444444, 0x555555, 0x666666, 0x777777];
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 });
    const windowMat = new THREE.MeshBasicMaterial({ 
        color: 0x050505, 
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    });

    const benchMat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.8 });
    const grayMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
    const plantMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 1.0 });
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, flatShading: true });

    for(let i=0; i<25; i++) {
        const cloudGroup = new THREE.Group();
        for(let j=0; j<5; j++) {
            const cloud = new THREE.Mesh(new THREE.SphereGeometry(300, 7, 7), cloudMat);
            cloud.position.set(j * 250, Math.random() * 100, Math.random() * 100);
            cloudGroup.add(cloud);
        }
        cloudGroup.position.set((Math.random()-0.5)*20000, 6000 + Math.random()*2000, (Math.random()-0.5)*20000);
        scene.add(cloudGroup);
    }

    const mainWalkway = new THREE.Mesh(new THREE.BoxGeometry(8000, 10, 1200), walkwayMat);
    mainWalkway.position.y = 5;
    mainWalkway.receiveShadow = true;
    scene.add(mainWalkway);

    for(let i=-3500; i<=3500; i += 1000) {
        [1, -1].forEach(side => {
            const zPos = 550 * side;
            const bench = new THREE.Group();
            const seat = new THREE.Mesh(new THREE.BoxGeometry(150, 20, 60), benchMat);
            const back = new THREE.Mesh(new THREE.BoxGeometry(150, 60, 10), benchMat);
            back.position.set(0, 30, 30 * side);
            const legL = new THREE.Mesh(new THREE.BoxGeometry(30, 40, 50), grayMat);
            const legR = new THREE.Mesh(new THREE.BoxGeometry(30, 40, 50), grayMat);
            legL.position.set(-50, -20, 0); legR.position.set(50, -20, 0);
            bench.add(seat, back, legL, legR);
            bench.position.set(i, 50, zPos);
            scene.add(bench);

            const pot = new THREE.Mesh(new THREE.CylinderGeometry(45, 35, 70, 8), grayMat);
            pot.position.set(i + (250 * side), 40, zPos);
            scene.add(pot);
            const plant = new THREE.Mesh(new THREE.DodecahedronGeometry(50, 0), plantMat);
            plant.position.set(i + (250 * side), 100, zPos);
            scene.add(plant);
        });
    }

    const buildingPositions = [
        { pos: [1500, 1000, 1500], size: [600, 2000, 600] },
        { pos: [-1500, 1200, -1500], size: [500, 2400, 500] },
        { pos: [1800, 300, -1800], size: [1200, 600, 1000] },
        { pos: [-1800, 400, 1800], size: [1000, 800, 1400] },
        { pos: [600, 1500, 1500], size: [200, 3000, 200] },
        { pos: [-800, 1100, -1500], size: [300, 2200, 300] },
        { pos: [2500, 700, 1800], size: [800, 1400, 800] },
        { pos: [-2500, 600, -1800], size: [700, 1200, 700] },
        { pos: [0, 800, -2000], size: [1500, 1600, 500] },
        { pos: [0, 500, 2000], size: [2000, 1000, 400] }
    ];

    buildingPositions.forEach((b, idx) => {
        const group = new THREE.Group();
        const mainMesh = new THREE.Mesh(new THREE.BoxGeometry(...b.size), new THREE.MeshStandardMaterial({ color: buildingGrays[idx % 6], roughness: 0.8 }));
        mainMesh.castShadow = true; mainMesh.receiveShadow = true;
        group.add(mainMesh);

        const zDir = b.pos[2] > 0 ? -1 : 1;
        const door = new THREE.Mesh(new THREE.BoxGeometry(100, 150, 5), doorMat);
        door.position.set(0, -b.size[1]/2 + 75, (b.size[2]/2 + 2) * zDir);
        group.add(door);

        const winW = 80; const winH = 120;
        const padX = 120; const padY = 250;
        const availW = b.size[0] - (padX * 2);
        const availH = b.size[1] - (padY * 2);
        
        if (availW > winW && availH > winH) {
            const cols = Math.max(1, Math.floor(availW / 150));
            const rows = Math.max(1, Math.floor(availH / 300));
            for(let r=0; r<rows; r++) {
                for(let c=0; c<cols; c++) {
                    if (r === 0 && Math.abs(c - (cols-1)/2) < 1) continue; 
                    const win = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), windowMat);
                    const xPos = (cols > 1) ? ((c / (cols - 1)) - 0.5) * availW : 0;
                    const yPos = -b.size[1]/2 + padY + (r * (availH / Math.max(1, rows-1)));
                    win.position.set(xPos, yPos, (b.size[2]/2 + 5) * zDir);
                    if (zDir === -1) win.rotation.y = Math.PI;
                    group.add(win);
                }
            }
        }
        group.position.set(b.pos[0], b.size[1]/2, b.pos[2]);
        scene.add(group);
    });
}
createPlaza();

// --- Character and Logic ---
let character, mixer, headBone, skeletonHelper;
let idleAction, walkAction, runAction;
let baseScale = 1.0;
let animations = {};
let hasAnimations = false;
let timer = new THREE.Clock(); // Using Clock for exact delta timing

// Movement speeds adjusted for large world scale
let walkSpeed = 220; 
let runSpeed = 450;
let turnSpeed = 10.0; 

let steps = 0;
let idleTime = 0;
let currentModelConfig = null;
let modelList = [];

// Hologram Logic
let hologramEnabled = false;
const originalMaterials = new Map();

const holographicMaterial = new THREE.MeshStandardMaterial({
    color: 0x001133,
    emissive: 0x0044ff,
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 0.4,
    wireframe: false,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

holographicMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.time = { value: 0 };
    holographicMaterial.userData.shader = shader;
    shader.vertexShader = `
        varying vec3 vWorldPos;
        ${shader.vertexShader}
    `.replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
         vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
    );
    shader.fragmentShader = `
        uniform float time;
        varying vec3 vWorldPos;
        ${shader.fragmentShader}
    `.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         float scale = 0.04;
         vec3 grid = abs(fract(vWorldPos * scale - 0.5) - 0.5) / fwidth(vWorldPos * scale);
         float line = min(grid.x, min(grid.y, grid.z));
         float gridVal = 1.0 - min(line, 1.0);
         float scanline = sin(vWorldPos.y * 0.1 - time * 4.0) * 0.5 + 0.5;
         scanline = pow(scanline, 15.0);
         gl_FragColor.rgb += vec3(0.0, 0.6, 1.0) * (gridVal * 0.8 + scanline * 1.5);
         gl_FragColor.a = 0.2 + (gridVal * 0.4) + (scanline * 0.5);
        `
    );
};

const hologramToggle = document.getElementById('hologram-toggle');
if (hologramToggle) {
    hologramToggle.addEventListener('change', (e) => {
        hologramEnabled = e.target.checked;
        applyHologramState();
    });
}

function applyHologramState() {
    if (!character) return;
    character.traverse(c => {
        if (c.isMesh) {
            if (hologramEnabled) {
                if (!originalMaterials.has(c)) originalMaterials.set(c, c.material);
                c.material = holographicMaterial;
            } else {
                if (originalMaterials.has(c)) c.material = originalMaterials.get(c);
            }
        }
    });
}

const statusEl = document.getElementById('status');
const posXEl = document.getElementById('pos-x');
const posZEl = document.getElementById('pos-z');
const rotYEl = document.getElementById('rot-y');
const stepsEl = document.getElementById('steps');
const loadingText = document.getElementById('loading-text');
const loadingOverlay = document.getElementById('loading-overlay');
const animSelect = document.getElementById('animation-select');
const modelSelect = document.getElementById('model-select');

const keys = { w: false, a: false, s: false, d: false, shift: false };
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = true;
});
window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = false;
});

function findAnimation(type) {
    const names = Object.keys(animations);
    if (names.length === 0) return null;
    if (currentModelConfig && currentModelConfig.animationMap) {
        const map = currentModelConfig.animationMap;
        if (type === 'idle' && map.idle !== undefined) return `idx_${map.idle}`;
        if (type === 'run' && map.run !== undefined) return `idx_${map.run}`;
        if (type === 'walk' && map.walk !== undefined) return `idx_${map.walk}`;
    }
    const walkKeys = ['walk', 'step', 'forward', 'cycle'];
    const runKeys = ['run', 'sprint', 'fast'];
    const idleKeys = ['idle', 'stay', 'wait', 'pose', 'static'];
    if (type === 'run') return names.find(k => runKeys.some(rk => k.includes(rk))) || findAnimation('walk');
    if (type === 'walk') return names.find(k => walkKeys.some(wk => k.includes(wk))) || names[0];
    if (type === 'idle') return names.find(k => idleKeys.some(ik => k.includes(ik))) || names[0];
    return names[0];
}

function loadModel(url) {
    loadingOverlay.style.display = 'flex';
    loadingText.textContent = 'Loading Digital Environment...';
    currentModelConfig = modelList.find(m => m.path === url) || { path: url };
    
    if (mixer && character) { mixer.stopAllAction(); mixer.uncacheRoot(character); }
    mixer = null; animations = {}; headBone = null; 
    idleAction = null; walkAction = null; runAction = null;
    idleTime = 0;
    if (skeletonHelper) { scene.remove(skeletonHelper); skeletonHelper = null; }
    if (character) {
        scene.remove(character);
        character.traverse(c => {
            if (c.isMesh) {
                if (c.geometry) c.geometry.dispose();
                if (c.material) {
                    if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                    else c.material.dispose();
                }
            }
        });
        character = null;
    }
    originalMaterials.clear(); 

    const fbxLoader = new FBXLoader();
    const glbLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('libs/draco/');
    glbLoader.setDRACOLoader(dracoLoader);

    const isGLB = url.toLowerCase().endsWith('.glb') || url.toLowerCase().endsWith('.gltf');
    const selectedLoader = isGLB ? glbLoader : fbxLoader;

    selectedLoader.load(url, (object) => {
        try {
            const loadedObject = isGLB ? object.scene : object;
            character = loadedObject;
            hasAnimations = object.animations && object.animations.length > 0;

            character.traverse(c => {
                if (c.isMesh) {
                    c.castShadow = c.receiveShadow = true;
                    c.frustumCulled = false; 
                    if (c.material) {
                        const mats = Array.isArray(c.material) ? c.material : [c.material];
                        mats.forEach(m => {
                            if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
                            m.shininess = 0; m.depthWrite = true; m.alphaTest = 0.5;
                        });
                    }
                }
                if (c.isBone) {
                    const name = c.name.toLowerCase();
                    if (name.includes('head')) headBone = c;
                    else if (!headBone && name.includes('neck')) headBone = c;
                    c._restRot = c.rotation.clone();
                }
            });
            
            const sBox = new THREE.Box3().setFromObject(character);
            const size = sBox.getSize(new THREE.Vector3());
            baseScale = 200 / (size.y || 1);
            character.scale.setScalar(baseScale);
            const centeredBox = new THREE.Box3().setFromObject(character);
            character.position.set(500, 10 - centeredBox.min.y, 480); 

            animSelect.innerHTML = '<option value="auto">Automatic (Dynamic)</option>';
            animSelect.innerHTML += '<option value="none">None (Static Pose)</option>';
            
            if (hasAnimations) {
                mixer = new THREE.AnimationMixer(character);
                object.animations.forEach((clip, idx) => {
                    const name = clip.name.toLowerCase();
                    const action = mixer.clipAction(clip);
                    animations[name] = action;
                    animations[`idx_${idx}`] = action;
                    const opt = document.createElement('option'); opt.value = name; opt.textContent = clip.name;
                    animSelect.appendChild(opt);
                });

                const idleName = findAnimation('idle');
                const walkName = findAnimation('walk');
                const runName = findAnimation('run');

                if (idleName) { idleAction = animations[idleName]; idleAction.play(); idleAction.setEffectiveWeight(1); }
                if (walkName) { walkAction = animations[walkName]; walkAction.play(); walkAction.setEffectiveWeight(0); }
                if (runName) { runAction = animations[runName]; runAction.play(); runAction.setEffectiveWeight(0); }
            }
            animSelect.value = 'auto';

            skeletonHelper = new THREE.SkeletonHelper(character);
            skeletonHelper.visible = document.getElementById('skeleton-toggle').checked;
            scene.add(skeletonHelper);
            scene.add(character);
            applyHologramState();
            setTimeout(() => { loadingOverlay.style.display = 'none'; }, 500);
        } catch (e) { console.error(e); loadingOverlay.style.display = 'none'; }
    }, undefined, (err) => { console.error(err); loadingOverlay.style.display = 'none'; });
}

async function initModels() {
    try {
        const response = await fetch('models.json');
        modelList = await response.json();
        modelSelect.innerHTML = '';
        modelList.forEach(m => {
            const opt = document.createElement('option'); opt.value = m.path; opt.textContent = m.name;
            modelSelect.appendChild(opt);
        });
        if (modelList.length > 0) loadModel(modelList[0].path);
    } catch (e) { console.error(e); }
}
initModels();

modelSelect.addEventListener('change', (e) => { if (e.target.value) loadModel(e.target.value); });
document.getElementById('skeleton-toggle').addEventListener('change', (e) => { if (skeletonHelper) skeletonHelper.visible = e.target.checked; });

function update() {
    const delta = timer.getDelta();
    if (!character) return;

    const isExplicitlyStatic = animSelect.value === 'none';
    const isMoving = keys.w || keys.s || keys.a || keys.d;

    // --- EXACT ANIMATION WEIGHT BLENDING FROM EXAMPLE ---
    if (mixer && !isExplicitlyStatic) {
        if (animSelect.value === 'auto' && idleAction && walkAction) {
            const targetAction = isMoving ? (keys.shift ? (runAction || walkAction) : walkAction) : idleAction;
            [idleAction, walkAction, runAction].forEach(action => {
                if (action) {
                    const targetWeight = (action === targetAction) ? 1 : 0;
                    const currentWeight = action.getEffectiveWeight();
                    const newWeight = THREE.MathUtils.lerp(currentWeight, targetWeight, delta * 10);
                    action.setEffectiveWeight(newWeight);
                }
            });
        }
        mixer.update(delta);
    }

    // --- EXACT MOVEMENT AND ORIENTATION FROM EXAMPLE ---
    if (isMoving) {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3().crossVectors(forward, camera.up);

        let direction = new THREE.Vector3();
        if (keys.w) direction.add(forward);
        if (keys.s) direction.sub(forward);
        if (keys.a) direction.sub(right);
        if (keys.d) direction.add(right);
        
        if (direction.length() > 0) {
            direction.normalize();

            // EXACT orientation calc from example
            // Adjusted by PI/2 because models are authored facing +X but code expects +Z
            const targetAngle = Math.atan2(direction.x, direction.z) - Math.PI / 2;
            const targetQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
            character.quaternion.slerp(targetQuaternion, delta * turnSpeed);

            const speed = keys.shift ? runSpeed : walkSpeed;
            character.position.addScaledVector(direction, speed * delta);
        }
        
        statusEl.textContent = keys.shift ? 'Running' : 'Walking';
        steps += delta * 100;
    } else {
        statusEl.textContent = 'Stationary';
    }

    // Procedural FX
    if (!isExplicitlyStatic) {
        if (hologramEnabled && holographicMaterial.userData.shader) {
            holographicMaterial.userData.shader.uniforms.time.value = performance.now() * 0.001;
        }
        idleTime += delta;
        const breathing = Math.sin(idleTime * 1.5) * 0.004;
        character.scale.y += (baseScale * (1.0 + breathing) - character.scale.y) * 0.1;
    } else {
        character.scale.y += (baseScale - character.scale.y) * 0.1;
    }

    // Head Tracking
    if (headBone && !isMoving) {
        const targetPos = camera.position.clone();
        const localTarget = headBone.parent ? headBone.parent.worldToLocal(targetPos) : character.worldToLocal(targetPos);
        const lookAtMatrix = new THREE.Matrix4();
        lookAtMatrix.lookAt(headBone.position, localTarget, new THREE.Vector3(0, 1, 0));
        const targetQ = new THREE.Quaternion().setFromRotationMatrix(lookAtMatrix);
        if (headBone._restRot) {
            const restQ = new THREE.Quaternion().setFromEuler(headBone._restRot);
            targetQ.multiply(restQ);
        }
        headBone.quaternion.slerp(targetQ, 0.08);
        const euler = new THREE.Euler().setFromQuaternion(headBone.quaternion, 'YXZ');
        euler.x = Math.max(-0.4, Math.min(0.4, euler.x));
        euler.y = Math.max(-0.8, Math.min(0.8, euler.y)); euler.z = 0; 
        headBone.quaternion.setFromEuler(euler);
    }

    posXEl.textContent = character.position.x.toFixed(2); posZEl.textContent = character.position.z.toFixed(2);
    rotYEl.textContent = character.rotation.y.toFixed(2); stepsEl.textContent = Math.floor(steps / 10);
}

function animate() {
    update();
    if (character) {
        const targetPos = new THREE.Vector3(character.position.x, character.position.y + 120, character.position.z);
        controls.target.lerp(targetPos, 0.1);
        lookingGlassConfig.targetX = controls.target.x;
        lookingGlassConfig.targetY = controls.target.y;
        lookingGlassConfig.targetZ = controls.target.z;
    }
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
renderer.setAnimationLoop(animate);
