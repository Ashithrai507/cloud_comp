import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";

export function createRoadSegment(zPos) {
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.1, 20),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  road.position.set(0, 0, zPos);
  return road;
}


