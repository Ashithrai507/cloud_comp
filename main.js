import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";
import { createRoadSegment } from "./objects/roadSegment.js";

/* ================= SCENE ================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 20, 120);

/* ================= CAMERA ================= */
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 8);

/* ================= RENDERER ================= */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

/* ================= LIGHTS ================= */
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
sun.castShadow = true;
scene.add(sun);

/* ================= GROUND ================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x2e8b57 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* ================= PROCEDURAL CAR ================= */
function createProceduralCar() {
  const g = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.5, 3.6),
    new THREE.MeshStandardMaterial({ color: 0xd32f2f, metalness: 0.4, roughness: 0.5 })
  );
  body.position.y = 0.4;
  g.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.6, 1.6),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  );
  cabin.position.set(0, 0.85, -0.2);
  g.add(cabin);

  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const wheels = {};

  function wheel(x, z) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 24), wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.2, z);
    g.add(w);
    return w;
  }

  wheels.fl = wheel(-0.9, -1.2);
  wheels.fr = wheel( 0.9, -1.2);
  wheels.rl = wheel(-0.9,  1.2);
  wheels.rr = wheel( 0.9,  1.2);

  g.userData = {
    body,
    wheels,
    baseBodyY: body.position.y
  };

  return g;
}

/* ================= PHYSICS ROOT ================= */
const car = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 1, 3),
  new THREE.MeshBasicMaterial({ visible: false })
);
car.position.set(0, 0.5, 2);
scene.add(car);

const carVisual = createProceduralCar();
carVisual.position.y = -0.5;
car.add(carVisual);

/* ================= ROAD ================= */
const segments = [];
const SEGMENT_LENGTH = 20;
for (let i = 0; i < 6; i++) {
  const s = createRoadSegment(-i * SEGMENT_LENGTH);
  segments.push(s);
  scene.add(s);
}

/* ================= INPUT ================= */
const keys = { w: false, a: false, s: false, d: false };
window.addEventListener("keydown", e => keys[e.key] !== undefined && (keys[e.key] = true));
window.addEventListener("keyup",   e => keys[e.key] !== undefined && (keys[e.key] = false));

/* ================= PHYSICS ================= */
const phys = { speed: 0, steer: 0 };
const MAX_SPEED = 25;

/* ================= LOOP ================= */
let last = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  if (keys.w) phys.speed += 20 * dt;
  if (keys.s) phys.speed -= 20 * dt;
  phys.speed *= 0.98;
  phys.speed = THREE.MathUtils.clamp(phys.speed, -10, MAX_SPEED);

  if (keys.a) phys.steer += 1.8 * dt;
  if (keys.d) phys.steer -= 1.8 * dt;
  phys.steer *= 0.9;

  car.rotation.y += phys.steer * phys.speed * dt * 0.1;
  car.position.x += -Math.sin(car.rotation.y) * phys.speed * dt;
  car.position.z += -Math.cos(car.rotation.y) * phys.speed * dt;

  // wheels
  const w = carVisual.userData.wheels;
  const spin = phys.speed * dt * 2;
  w.fl.rotation.x += spin;
  w.fr.rotation.x += spin;
  w.rl.rotation.x += spin;
  w.rr.rotation.x += spin;
  w.fl.rotation.y = phys.steer * 0.5;
  w.fr.rotation.y = phys.steer * 0.5;

  // road loop
  for (const s of segments) {
    s.position.z += phys.speed * dt;
    if (s.position.z > camera.position.z) s.position.z -= SEGMENT_LENGTH * segments.length;
  }

  camera.position.set(
    car.position.x + Math.sin(car.rotation.y) * 6,
    3,
    car.position.z + Math.cos(car.rotation.y) * 6
  );
  camera.lookAt(car.position);

  renderer.render(scene, camera);
}

animate(performance.now());
