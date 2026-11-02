import * as THREE from 'three';

/**
 * Xây dựng Mô hình 3D Máy bay Chibi siêu cute, bầu bĩnh múp míp phong cách Pixar/Disney.
 * Mũi tròn bầu bĩnh hướng sang TRÁI (Facing Left).
 * Thân nguyên khối đúc liền mạch, cánh và đuôi bo tròn mềm mại.
 */
export function createAirplaneModel(): THREE.Group {
  const airplaneGroup = new THREE.Group();

  // Vật liệu (Materials)
  // 1. Thân máy bay trắng bóng mượt, phản quang mềm
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.12,
    metalness: 0.08,
  });

  // 2. Màu xanh ngọc Teal UTH chính thức (#00897b / #008272)
  const tealMaterial = new THREE.MeshStandardMaterial({
    color: 0x00897b,
    roughness: 0.18,
    metalness: 0.12,
  });

  // 3. Kính buồng lái & mắt cửa sổ (Đen navy bóng loáng phản chiếu ánh sáng)
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.05,
    metalness: 0.9,
  });

  // 4. Kim loại miệng ống xả
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.3,
    metalness: 0.7,
  });

  // ---------------- 1. THÂN MÁY BAY CHIBI BẦU BĨNH NGUYÊN KHỐI ----------------
  // Tạo dáng quả trứng tròn múp míp (Chubby fuselage)
  // Mũi máy bay to tròn ở bên TRÁI (X = -2.0), Đuôi vuốt thon tròn ở bên PHẢI (X = 2.2)
  const profilePoints: THREE.Vector2[] = [];
  profilePoints.push(new THREE.Vector2(0.001, -2.0));
  profilePoints.push(new THREE.Vector2(0.48, -1.9));
  profilePoints.push(new THREE.Vector2(0.85, -1.6));
  profilePoints.push(new THREE.Vector2(1.12, -1.1));
  profilePoints.push(new THREE.Vector2(1.22, -0.4));
  profilePoints.push(new THREE.Vector2(1.22, 0.4));
  profilePoints.push(new THREE.Vector2(1.08, 1.1));
  profilePoints.push(new THREE.Vector2(0.82, 1.6));
  profilePoints.push(new THREE.Vector2(0.48, 2.0));
  profilePoints.push(new THREE.Vector2(0.18, 2.22));
  profilePoints.push(new THREE.Vector2(0.001, 2.25)); // Chóp đuôi tròn trịa

  const spline = new THREE.SplineCurve(profilePoints);
  const smoothPoints = spline.getPoints(36);

  const fuselageGeo = new THREE.LatheGeometry(smoothPoints, 36);
  fuselageGeo.rotateZ(-Math.PI / 2); // Nằm ngang theo trục X

  const fuselage = new THREE.Mesh(fuselageGeo, bodyMaterial);
  airplaneGroup.add(fuselage);

  // Bụng máy bay sơn màu xanh ngọc Teal UTH
  const bellyGeo = new THREE.CylinderGeometry(1.23, 1.09, 2.2, 32, 1, false, Math.PI * 0.75, Math.PI * 0.5);
  bellyGeo.rotateZ(Math.PI / 2);
  const belly = new THREE.Mesh(bellyGeo, tealMaterial);
  belly.position.set(-0.1, -0.05, 0);
  airplaneGroup.add(belly);

  // ---------------- 2. KÍNH BUỒNG LÁI TO TRÒN CỰC DỄ THƯƠNG ----------------
  // Dải kính cong đen bóng to tròn ôm vòm mũi (như kính phi công hoạt hình)
  const cockpitGeo = new THREE.SphereGeometry(1.16, 24, 16, Math.PI * 0.68, Math.PI * 0.64, 0, Math.PI * 0.42);
  cockpitGeo.rotateZ(Math.PI / 2);
  cockpitGeo.scale(1.05, 0.95, 0.95);
  const cockpit = new THREE.Mesh(cockpitGeo, glassMaterial);
  cockpit.position.set(-1.25, 0.28, 0);
  airplaneGroup.add(cockpit);

  // Điểm sáng phản quang trên kính buồng lái (Tạo mắt long lanh hoạt hình)
  const glintGeo = new THREE.SphereGeometry(0.12, 12, 8);
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const glint1 = new THREE.Mesh(glintGeo, glintMat);
  glint1.position.set(-1.6, 0.7, 0.45);
  airplaneGroup.add(glint1);

  // ---------------- 3. CÁC CỬA SỔ HÀNH KHÁCH TRÒN VO DỄ THƯƠNG ----------------
  const winGeo = new THREE.SphereGeometry(0.11, 14, 10);
  winGeo.scale(1, 1.2, 0.4);

  // 4 cửa sổ tròn mỗi bên
  const windowXs = [-0.65, -0.2, 0.25, 0.7];
  windowXs.forEach((x) => {
    // Cửa sổ gần người xem
    const winNear = new THREE.Mesh(winGeo, glassMaterial);
    winNear.position.set(x, 0.28, 1.2);
    airplaneGroup.add(winNear);

    // Cửa sổ xa
    const winFar = new THREE.Mesh(winGeo, glassMaterial);
    winFar.position.set(x, 0.28, -1.2);
    airplaneGroup.add(winFar);
  });

  // ---------------- 4. CÁNH CHÍNH CHIBI BO TRÒN MỀM MẠI ----------------
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(0.9, 2.3);
  wingShape.quadraticCurveTo(1.2, 2.5, 1.45, 2.3); // Bo cong tròn đầu cánh
  wingShape.lineTo(1.3, 0);
  wingShape.closePath();

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.035,
    bevelThickness: 0.035,
  });
  wingGeo.rotateX(Math.PI / 2);

  // Cánh gần
  const nearWing = new THREE.Mesh(wingGeo, bodyMaterial);
  nearWing.position.set(-0.35, -0.15, 0);
  nearWing.rotation.x = 0.06;
  airplaneGroup.add(nearWing);

  // Bo tròn đầu cánh xanh ngọc Teal UTH
  const wingTipGeo = new THREE.SphereGeometry(0.25, 16, 12);
  wingTipGeo.scale(1.2, 0.4, 0.5);
  const nearWingTip = new THREE.Mesh(wingTipGeo, tealMaterial);
  nearWingTip.position.set(0.8, -0.01, 2.35);
  airplaneGroup.add(nearWingTip);

  // Cánh xa
  const farWing = new THREE.Mesh(wingGeo, bodyMaterial);
  farWing.position.set(-0.35, -0.15, 0);
  farWing.scale.set(1, 1, -1);
  farWing.rotation.x = -0.06;
  airplaneGroup.add(farWing);

  const farWingTip = new THREE.Mesh(wingTipGeo, tealMaterial);
  farWingTip.position.set(0.8, -0.01, -2.35);
  airplaneGroup.add(farWingTip);

  // ---------------- 5. HAI ĐỘNG CƠ TRÒN BÉO BÉO CUTE ----------------
  const engineGeo = new THREE.SphereGeometry(0.36, 20, 16);
  engineGeo.scale(1.4, 1, 1);

  const engineRimGeo = new THREE.TorusGeometry(0.28, 0.06, 10, 20);
  engineRimGeo.rotateY(Math.PI / 2);

  // Động cơ gần
  const nearEngineGroup = new THREE.Group();
  const engBody1 = new THREE.Mesh(engineGeo, bodyMaterial);
  const engRim1 = new THREE.Mesh(engineRimGeo, tealMaterial);
  engRim1.position.set(-0.35, 0, 0);
  const engHole1 = new THREE.Mesh(new THREE.CircleGeometry(0.26, 16), metalMaterial);
  engHole1.rotateY(-Math.PI / 2);
  engHole1.position.set(-0.36, 0, 0);

  nearEngineGroup.add(engBody1, engRim1, engHole1);
  nearEngineGroup.position.set(-0.05, -0.65, 1.25);
  airplaneGroup.add(nearEngineGroup);

  // Động cơ xa
  const farEngineGroup = nearEngineGroup.clone();
  farEngineGroup.position.set(-0.05, -0.65, -1.25);
  airplaneGroup.add(farEngineGroup);

  // ---------------- 6. CÁNH ĐUÔI ĐỨNG MẬP MẠP CONG VÚT CUTE ----------------
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0);
  tailShape.lineTo(0.75, 1.6);
  tailShape.quadraticCurveTo(1.15, 1.75, 1.35, 1.55); // Đỉnh đuôi bo tròn mềm mại
  tailShape.lineTo(1.2, 0);
  tailShape.closePath();

  const tailGeo = new THREE.ExtrudeGeometry(tailShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.03,
    bevelThickness: 0.03,
  });

  const tailFin = new THREE.Mesh(tailGeo, tealMaterial);
  tailFin.position.set(0.9, 0.45, -0.06);
  airplaneGroup.add(tailFin);

  // Logo UTH / Chữ 'V' trắng nổi bật trên đuôi máy bay
  const logoGeo = new THREE.RingGeometry(0.14, 0.24, 16, 1, 0, Math.PI);
  logoGeo.rotateZ(Math.PI);
  const logoMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const tailLogo = new THREE.Mesh(logoGeo, logoMat);
  tailLogo.position.set(1.5, 1.32, 0.07);
  airplaneGroup.add(tailLogo);

  // Đuôi ngang bo tròn
  const hTailShape = new THREE.Shape();
  hTailShape.moveTo(0, 0);
  hTailShape.lineTo(0.5, 0.95);
  hTailShape.quadraticCurveTo(0.75, 1.05, 0.9, 0.9);
  hTailShape.lineTo(0.65, 0);
  hTailShape.closePath();

  const hTailGeo = new THREE.ExtrudeGeometry(hTailShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.02,
    bevelThickness: 0.02,
  });
  hTailGeo.rotateX(Math.PI / 2);

  const hTailNear = new THREE.Mesh(hTailGeo, bodyMaterial);
  hTailNear.position.set(1.4, 0.22, 0);
  airplaneGroup.add(hTailNear);

  const hTailFar = new THREE.Mesh(hTailGeo, bodyMaterial);
  hTailFar.position.set(1.4, 0.22, 0);
  hTailFar.scale.set(1, 1, -1);
  airplaneGroup.add(hTailFar);

  // Khuyên kim loại chóp đuôi máy bay để móc dây kéo (X = 2.25)
  const towHookGeo = new THREE.TorusGeometry(0.1, 0.035, 10, 20);
  towHookGeo.rotateY(Math.PI / 2);
  const towHook = new THREE.Mesh(towHookGeo, metalMaterial);
  towHook.position.set(2.28, 0.04, 0);
  airplaneGroup.add(towHook);

  // ---------------- 7. TỶ LỆ & GÓC NHÌN CHUẨN XÁC ----------------
  airplaneGroup.scale.set(0.68, 0.68, 0.68);
  airplaneGroup.rotation.set(-0.05, -0.25, 0.04);

  return airplaneGroup;
}

/**
 * Tạo cụm mây trắng 3D mềm mại phong cách Pixar.
 */
export function create3DCloud(scale = 1): THREE.Group {
  const cloudGroup = new THREE.Group();
  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.02,
  });

  const puffPositions = [
    { x: 0, y: 0, z: 0, r: 0.58 },
    { x: 0.4, y: -0.06, z: 0.08, r: 0.44 },
    { x: -0.4, y: -0.1, z: -0.08, r: 0.43 },
    { x: 0.16, y: 0.3, z: 0, r: 0.38 },
    { x: -0.16, y: 0.2, z: 0.08, r: 0.35 },
  ];

  puffPositions.forEach((p) => {
    const puffGeo = new THREE.SphereGeometry(p.r, 18, 14);
    const puffMesh = new THREE.Mesh(puffGeo, cloudMaterial);
    puffMesh.position.set(p.x, p.y, p.z);
    cloudGroup.add(puffMesh);
  });

  cloudGroup.scale.set(scale, scale * 0.78, scale);
  return cloudGroup;
}

/**
 * Quản lý Hiệu ứng Khói bồng bềnh 3D phía sau đuôi máy bay (Puff Smoke Trail).
 * Các hạt khói tròn bay ngược về sau (sang phải), nở to dần và tan mờ dần siêu dễ thương!
 */
export interface SmokeParticle {
  mesh: THREE.Mesh;
  initialX: number;
  initialY: number;
  initialZ: number;
  speed: number;
  maxDistance: number;
  progress: number;
}

export function createSmokeTrailSystem(scene: THREE.Scene): {
  particles: SmokeParticle[];
  update: (delta: number) => void;
} {
  const particles: SmokeParticle[] = [];
  const particleCount = 14;

  const smokeGeo = new THREE.SphereGeometry(0.18, 14, 12);
  const smokeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
    roughness: 0.5,
  });

  for (let i = 0; i < particleCount; i++) {
    const mesh = new THREE.Mesh(smokeGeo, smokeMat.clone());
    scene.add(mesh);

    // Vị trí xuất phát từ chóp đuôi & ống xả (X ~ 1.8 đến 2.3)
    const p: SmokeParticle = {
      mesh,
      initialX: 1.8 + (Math.random() - 0.5) * 0.2,
      initialY: (Math.random() - 0.5) * 0.25,
      initialZ: (Math.random() - 0.5) * 0.3,
      speed: 0.45 + Math.random() * 0.25,
      maxDistance: 1.6 + Math.random() * 0.8,
      progress: (i / particleCount), // Trải đều vòng đời
    };

    particles.push(p);
  }

  const update = (delta: number) => {
    particles.forEach((p) => {
      p.progress += delta * p.speed;
      if (p.progress >= 1.0) {
        p.progress = 0;
      }

      // Bay ngược về phía sau (sang phải trục X)
      const currentX = p.initialX + p.progress * p.maxDistance;
      const currentY = p.initialY + Math.sin(p.progress * Math.PI) * 0.15;
      const currentZ = p.initialZ;

      p.mesh.position.set(currentX, currentY, currentZ);

      // Nở to dần theo thời gian (từ 0.6x đến 1.5x)
      const currentScale = 0.6 + p.progress * 0.9;
      p.mesh.scale.set(currentScale, currentScale, currentScale);

      // Mờ dần về 0
      const mat = p.mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.max(0, 0.85 * (1 - p.progress));
    });
  };

  return { particles, update };
}
