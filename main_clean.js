import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";
import { createRoadSegment } from "./objects/roadSegment.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 20, 120);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
sun.castShadow = true;
scene.add(sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x2e8b57 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function createProceduralCar() {
  const carGroup = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 3.6), new THREE.MeshStandardMaterial({ color: 0xd32f2f, metalness: 0.4, roughness: 0.5 }));
  body.position.y = 0.4;
  body.castShadow = true;
  carGroup.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.6), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.3 }));
  cabin.position.set(0, 0.85, -0.2);
  cabin.castShadow = true;
  carGroup.add(cabin);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccee, metalness: 0.1, roughness: 0.15, transparent: true, opacity: 0.65 });
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 0.02), glassMat);
  windshield.position.set(0, 0.95, -0.6);
  carGroup.add(windshield);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  function createWheel(x, z) { const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 24), wheelMaterial); wheel.rotation.z = Math.PI / 2; wheel.position.set(x, 0.2, z); wheel.castShadow = true; return wheel; }
  const wheelFL = createWheel(-0.9, -1.2);
  const wheelFR = createWheel(0.9, -1.2);
  const wheelRL = createWheel(-0.9, 1.2);
  const wheelRR = createWheel(0.9, 1.2);
  carGroup.add(wheelFL, wheelFR, wheelRL, wheelRR);
  carGroup.userData.wheels = { frontLeft: wheelFL, frontRight: wheelFR, rearLeft: wheelRL, rearRight: wheelRR };
  carGroup.userData.body = body;
  carGroup.userData.baseBodyY = body.position.y;
  carGroup.userData.baseWheelY = 0.2;
  carGroup.userData.suspension = { offset: 0, vel: 0 };
  return carGroup;
}

function decorateProceduralCar(group) { const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff6d1, emissive: 0xffffee, emissiveIntensity: 0.6 }); const lhL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), lightMat); const lhR = lhL.clone(); lhL.position.set(-0.45, 0.45, 1.75); lhR.position.set(0.45, 0.45, 1.75); group.add(lhL, lhR); const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.2), new THREE.MeshStandardMaterial({ color: 0xd32f2f, metalness: 0.2, roughness: 0.6 })); spoiler.position.set(0, 0.75, -1.6); spoiler.rotation.x = -0.05; spoiler.castShadow = true; group.add(spoiler); const rimMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.3 }); group.traverse((c) => { if (c.isMesh && c.geometry.type === 'CylinderGeometry') { const rim = new THREE.Mesh(new THREE.CircleGeometry(0.14, 16), rimMat); rim.rotation.y = Math.PI / 2; rim.position.copy(c.position); rim.position.y = c.position.y; group.add(rim); } }); }

const car = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 3), new THREE.MeshBasicMaterial({ visible: false }));
car.position.set(0, 0.5, 2);
scene.add(car);

const carVisual = createProceduralCar();
carVisual.position.y = -0.5;
car.add(carVisual);
decorateProceduralCar(carVisual);

const _camLookTarget = new THREE.Vector3();
let _time = 0;

const speedo = document.createElement('div');
speedo.id = 'speedometer';
speedo.style.position = 'fixed';
speedo.style.left = '12px';
speedo.style.bottom = '12px';
speedo.style.padding = '10px 14px';
speedo.style.background = 'rgba(0,0,0,0.6)';
speedo.style.color = '#fff';
speedo.style.fontFamily = 'monospace';
speedo.style.fontSize = '20px';
speedo.style.borderRadius = '6px';
speedo.style.zIndex = '9999';
speedo.textContent = '0 km/h';
document.body.appendChild(speedo);

const segments = [];
const SEGMENT_LENGTH = 20;
const SEGMENT_COUNT = 6;
for (let i = 0; i < SEGMENT_COUNT; i++) { const segment = createRoadSegment(-i * SEGMENT_LENGTH); segments.push(segment); scene.add(segment); }

const keys = { w: false, a: false, s: false, d: false, brake: false };
window.addEventListener("keydown", e => { if (e.key === "w") keys.w = true; if (e.key === "a") keys.a = true; if (e.key === "s") keys.s = true; if (e.key === "d") keys.d = true; if (e.code === "Space") keys.brake = true; });
window.addEventListener("keyup", e => { if (e.key === "w") keys.w = false; if (e.key === "a") keys.a = false; if (e.key === "s") keys.s = false; if (e.key === "d") keys.d = false; if (e.code === "Space") keys.brake = false; });

car.userData.physics = { speed: 0, steerAngle: 0 };
car.userData.throttleHold = 0;

const PHYS = {
  maxSpeed: 33.333333,
  accelK: 0.135,
  dragCoeff: 0.4,
  rollingResistance: 1.5,
  mass: 1200,
  brakeDecel: 12,
  maxReverse: 6,
  maxAccel: 8,
  handbrakeDecel: 30,
  suspensionStiffness: 400,
  suspensionDamping: 120,
  suspensionTravel: 0.12,
  pitchFactor: 0.008,
  rollFactor: 0.01,
  maxSteerAngle: Math.PI / 4,
  steerSpeed: 6,
  wheelBase: 2.6
};

function updateCar(dt) {
  const phys = car.userData.physics;
  const throttleOn = !!keys.w;
  const brakeOn = !!keys.s;
  let steerInput = 0;
  if (keys.a) steerInput += 1;
  if (keys.d) steerInput -= 1;

  const drag = PHYS.dragCoeff * phys.speed * Math.abs(phys.speed);
  const rolling = PHYS.rollingResistance * phys.speed;

  if (throttleOn) car.userData.throttleHold += dt; else car.userData.throttleHold = 0;
  const desiredSpeed = PHYS.maxSpeed * (1 - Math.exp(-PHYS.accelK * car.userData.throttleHold));
  const speedDelta = desiredSpeed - phys.speed;
  const maxDelta = PHYS.maxAccel * dt;
  const applied = Math.max(-maxDelta, Math.min(maxDelta, speedDelta));
  phys.speed += applied;

  const decel = (drag + rolling) * dt;
  if (phys.speed > 0) phys.speed = Math.max(0, phys.speed - decel); else phys.speed = Math.min(0, phys.speed + decel);

  if (brakeOn) { const bd = PHYS.brakeDecel * dt; if (phys.speed > 0) phys.speed = Math.max(0, phys.speed - bd); else phys.speed = Math.min(0, phys.speed + bd); }
  if (keys.brake) { const hb = PHYS.handbrakeDecel * dt; if (phys.speed > 0) phys.speed = Math.max(0, phys.speed - hb); else phys.speed = Math.min(0, phys.speed + hb); }

  phys.speed = THREE.MathUtils.clamp(phys.speed, -PHYS.maxReverse, PHYS.maxSpeed);

  const speedFactor = 1 - Math.min(Math.abs(phys.speed) / PHYS.maxSpeed, 1);
  const targetSteer = steerInput * PHYS.maxSteerAngle * speedFactor;
  phys.steerAngle += (targetSteer - phys.steerAngle) * Math.min(1, PHYS.steerSpeed * dt);

  const angularVel = (phys.speed / PHYS.wheelBase) * Math.tan(phys.steerAngle || 0);
  car.rotation.y += angularVel * dt;
  car.position.x += -Math.sin(car.rotation.y) * phys.speed * dt;
  car.position.z += -Math.cos(car.rotation.y) * phys.speed * dt;

  if (Math.abs(phys.speed) < 0.01) phys.speed = 0;

  try { const kmh = Math.round(phys.speed * 3.6); speedo.textContent = `${kmh} km/h`; } catch (e) {}

  try {
    const s = carVisual.userData.suspension;
    const wheels = carVisual.userData.wheels;
    const body = carVisual.userData.body;
    const baseWheelY = carVisual.userData.baseWheelY;
    if (s && body) {
      const longitudinalAccel = 0;
      const lateralAccel = phys.speed * angularVel;
      const targetSusp = THREE.MathUtils.clamp(-longitudinalAccel * 0.02, -PHYS.suspensionTravel, PHYS.suspensionTravel);
      const springForce = PHYS.suspensionStiffness * (targetSusp - s.offset);
      const damper = -PHYS.suspensionDamping * s.vel;
      const force = springForce + damper;
      s.vel += (force / PHYS.mass) * dt;
      s.offset += s.vel * dt;
      s.offset = THREE.MathUtils.clamp(s.offset, -PHYS.suspensionTravel, PHYS.suspensionTravel);
      const bob = Math.sin(_time * 6) * (Math.min(Math.abs(phys.speed) / PHYS.maxSpeed, 1)) * 0.01;
      body.position.y = carVisual.userData.baseBodyY + s.offset + bob;
      const targetPitch = -longitudinalAccel * PHYS.pitchFactor;
      const targetRoll = THREE.MathUtils.clamp(lateralAccel * PHYS.rollFactor, -0.25, 0.25);
      body.rotation.x += (targetPitch - body.rotation.x) * Math.min(1, 6 * dt);
      body.rotation.z += ((-targetRoll) - body.rotation.z) * Math.min(1, 6 * dt);
      if (wheels) {
        const frontComp = s.offset * 0.6 - targetPitch * 0.6;
        const rearComp = s.offset * 1.0 + targetPitch * 0.6;
        wheels.frontLeft.position.y = baseWheelY - frontComp;
        wheels.frontRight.position.y = baseWheelY - frontComp;
        wheels.rearLeft.position.y = baseWheelY - rearComp;
        wheels.rearRight.position.y = baseWheelY - rearComp;
        const steerVis = phys.steerAngle * 0.6;
        wheels.frontLeft.rotation.y = steerVis;
        wheels.frontRight.rotation.y = steerVis;
        const spin = phys.speed * 0.6;
        wheels.frontLeft.rotation.x += spin * dt;
        wheels.frontRight.rotation.x += spin * dt;
        wheels.rearLeft.rotation.x += spin * dt;
        wheels.rearRight.rotation.x += spin * dt;
      }
    }
  } catch (e) {}
}

function updateRoad(dt) { const s = car.userData.physics.speed; for (const segment of segments) { segment.position.z += s * dt; if (segment.position.z > camera.position.z + SEGMENT_LENGTH / 2) { segment.position.z -= SEGMENT_COUNT * SEGMENT_LENGTH; } } }

const camOffset = new THREE.Vector3();
function updateCamera() { const followDist = 6; const followHeight = 2.8; camOffset.set(Math.sin(car.rotation.y) * followDist, followHeight, Math.cos(car.rotation.y) * followDist); camera.position.copy(car.position).add(camOffset); _camLookTarget.copy(car.position); _camLookTarget.y += 0.6; camera.lookAt(_camLookTarget); }

window.addEventListener("resize", () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });

let lastTime = performance.now();
function animate(now) { requestAnimationFrame(animate); let dt = (now - lastTime) / 1000; lastTime = now; dt = Math.min(dt, 0.05); _time += dt; updateCar(dt); updateRoad(dt); updateCamera(); renderer.render(scene, camera); }
animate(performance.now());