/* MaviBag line: the whole 3D world as build() + state(t). Every frame is a pure function of the frame number.
   Units: 1 unit ~ 13 cm. Floor y = 0. The bag station is at x = 0, z = 0; the bag hangs from its mouth at y = BAG_TOP.
   Physics (the peanuts) is simulated ONCE at build time, deterministically, and stored per frame; state() only looks it up. */
(function () {
  const FPS = 30;
  const W = 2.2, H = 3.0, BAG_TOP = 4.2;                 // the MaviBag
  const D_EMPTY = 0.27, D_FULL = 0.64, MOUTH_OPEN = 0.38, MOUTH_SHUT = 0.025;
  const N = 2580, PR = 0.078, WALL = 0.15, G = 25;      // peanuts: count, pair radius, wall margin, gravity (slow, light foam)
  const SUB = 4;                                         // physics substeps per frame
  const SIM0 = 112, SIM1 = 268;                          // simulated frames (rigid with the bag after SIM1)
  const EMIT0 = 114, EMIT1 = 180;                        // the pour
  const CHUTE = [-0.3, 1.45, -0.34];                     // chute lip, bag-local
  const TRAY_HINGE_IN_BAG = [0, -1.65, 0.17];            // tray hinge once inside the bag (bag-local)
  const PICK_X = -3.6, TRAY_X = -1.9, ROLLER_Y = 1.4, ROLLER_R = 0.1;
  const CARD_W = 0.92, CARD_H = 1.15, CARD_RZ = -0.21, CARD_REST = [0.22, -0.98];

  // ---------- small math ----------
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const sm5 = (t) => { t = clamp01(t); return t * t * t * (t * (t * 6 - 15) + 10); };
  const outCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);
  const outQuint = (t) => 1 - Math.pow(1 - clamp01(t), 5);
  const inQuad = (t) => clamp01(t) ** 2;
  const seg = (f, a, b) => clamp01((f - a) / (b - a));
  // piecewise keys over FRAMES: [[frame, value(s), easeFn?], ...]
  function kf(f, keys) {
    if (f <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [f1, v1, e] = keys[i];
      if (f <= f1) {
        const [f0, v0] = keys[i - 1];
        const u = (e || sm5)((f - f0) / (f1 - f0));
        return Array.isArray(v0) ? v0.map((a, k) => lerp(a, v1[k], u)) : lerp(v0, v1, u);
      }
    }
    return keys[keys.length - 1][1];
  }
  function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }
  function mkRng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ---------- timeline of the bag (frames) ----------
  const fillOf = (f) => sstep(EMIT0 + 4, EMIT1 + 2, f);                       // how full the bag looks (drives the swell)
  const bodyD = (f) => lerp(D_EMPTY, D_FULL, fillOf(f));
  const spreaderLift = (f) => sstep(234, 241, f);                                // spreaders hold the mouth open, then lift out
  const rollerX = (f) => kf(f, [[242, -1.32], [264, 1.32, (t) => sstep(0, 1, t)]]);
  function mouthAt(x, f) {                                                       // half-opening of the mouth at x
    const open = lerp(MOUTH_OPEN, 0.3, spreaderLift(f));
    if (f < 242) return open;
    const xr = rollerX(f);
    return lerp(MOUTH_SHUT, open, sstep(xr - 0.05, xr + 0.35, x));
  }
  function depthAt(x, y, f) {                                                    // half-thickness of the bag at (x, y) bag-local, y in [-H, 0]
    const ax = Math.min(1, Math.abs(x) / (W / 2));
    const px = Math.sqrt(Math.max(0, 1 - ax ** 2.6));
    const sb = Math.min(1, Math.max(0, (y + H) / 0.36));
    const pb = Math.sqrt(Math.max(0, 1 - (1 - sb) ** 2));
    const body = bodyD(f) * px * pb;
    const mouth = mouthAt(x, f) * Math.sqrt(Math.max(0, 1 - ax ** 3));
    const tt = sstep(-0.75, 0, y);
    return body * (1 - tt) + mouth * tt;
  }
  const pinch = (y, f) => 1 - 0.07 * fillOf(f) * Math.sin(Math.PI * clamp01(-y / H));   // a full pillow pulls its sides in

  // card path (bag-local): enters the mouth at the front, slides down, settles against the plastic
  function cardPose(f) {
    const zRest = depthAt(CARD_REST[0], CARD_REST[1], 300) * 0.985 - 0.03;
    const y = kf(f, [[190, 1.25], [204, 0.75, outCubic], [226, CARD_REST[1], (t) => sstep(0, 1, t)]]);
    const z = kf(f, [[204, 0.2], [226, zRest, (t) => sstep(0, 1, t)]]);
    const rz = kf(f, [[196, CARD_RZ * 0.4], [226, CARD_RZ]]);
    const rx = kf(f, [[206, 0], [226, -0.12]]);
    const x = kf(f, [[190, 0.55], [212, CARD_REST[0]]]);
    return { x, y, z, rz, rx };
  }

  // ---------- peanut simulation (bag-local) ----------
  function simulate() {
    const rnd = mkRng(20261018);
    const P = new Float32Array(N * 3), V = new Float32Array(N * 3), Q = new Float32Array(N * 4), Wv = new Float32Array(N * 3);
    const born = new Int32Array(N), alive = new Uint8Array(N), contact = new Uint8Array(N);
    const steps0 = SIM0 * SUB, emitA = EMIT0 * SUB, emitB = EMIT1 * SUB;
    for (let i = 0; i < N; i++) {
      born[i] = Math.floor(emitA + (i / N) * (emitB - emitA));
      const a = rnd() * Math.PI * 2, b = Math.acos(2 * rnd() - 1), c = rnd() * Math.PI * 2;  // random orientation
      const s = Math.sin(c / 2); Q.set([Math.sin(b) * Math.cos(a) * s, Math.sin(b) * Math.sin(a) * s, Math.cos(b) * s, Math.cos(c / 2)], i * 4);
      Wv.set([(rnd() - 0.5) * 14, (rnd() - 0.5) * 14, (rnd() - 0.5) * 14], i * 3);
    }
    const nF = SIM1 - SIM0 + 1;
    const outP = new Float32Array(nF * N * 3), outQ = new Float32Array(nF * N * 4), outA = new Uint8Array(nF * N);
    const CS = PR * 2, GX = 36, GY = 80, GZ = 24, X0 = -1.4, Y0 = -3.3, Z0 = -0.95;
    const head = new Int32Array(GX * GY * GZ), next = new Int32Array(N);
    const dt = 1 / (FPS * SUB), e = 0.28;
    const card = { on: false };
    for (let step = steps0; step <= SIM1 * SUB; step++) {
      const f = step / SUB;
      // spawn
      for (let i = 0; i < N; i++) if (!alive[i] && born[i] <= step) {
        alive[i] = 1;
        const r1 = hash(i * 7 + 1), r2 = hash(i * 7 + 2), r3 = hash(i * 7 + 3);
        P[i * 3] = CHUTE[0] + (r1 - 0.5) * 0.62; P[i * 3 + 1] = CHUTE[1] + r3 * 0.06; P[i * 3 + 2] = CHUTE[2] + (r2 - 0.5) * 0.1;
        V[i * 3] = 0.22 + (r1 - 0.5) * 0.5; V[i * 3 + 1] = -0.5 - r3 * 0.4; V[i * 3 + 2] = 0.42 + (r2 - 0.5) * 0.2;
      }
      // integrate
      for (let i = 0; i < N; i++) if (alive[i]) {
        V[i * 3 + 1] -= G * dt;
        const damp = contact[i] > 2 ? 0.94 : 0.998;
        V[i * 3] *= damp; V[i * 3 + 1] *= contact[i] > 2 ? 0.97 : 0.998; V[i * 3 + 2] *= damp;
        P[i * 3] += V[i * 3] * dt; P[i * 3 + 1] += V[i * 3 + 1] * dt; P[i * 3 + 2] += V[i * 3 + 2] * dt;
        contact[i] = 0;
      }
      // card obstacle
      let cp = null;
      if (f >= 196) { const c = cardPose(f); cp = { ...c, cz: Math.cos(-c.rz), sz: Math.sin(-c.rz) }; }
      for (let it = 0; it < 3; it++) {
        // hash
        head.fill(-1);
        for (let i = 0; i < N; i++) if (alive[i]) {
          const cx = Math.floor((P[i * 3] - X0) / CS), cy = Math.floor((P[i * 3 + 1] - Y0) / CS), cz = Math.floor((P[i * 3 + 2] - Z0) / CS);
          if (cx < 0 || cy < 0 || cz < 0 || cx >= GX || cy >= GY || cz >= GZ) { next[i] = -1; continue; }
          const k = (cx * GY + cy) * GZ + cz; next[i] = head[k]; head[k] = i;
        }
        // pairs
        for (let i = 0; i < N; i++) if (alive[i]) {
          const xi = P[i * 3], yi = P[i * 3 + 1], zi = P[i * 3 + 2];
          const cx = Math.floor((xi - X0) / CS), cy = Math.floor((yi - Y0) / CS), cz = Math.floor((zi - Z0) / CS);
          for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
            const ax = cx + dx, ay = cy + dy, az = cz + dz;
            if (ax < 0 || ay < 0 || az < 0 || ax >= GX || ay >= GY || az >= GZ) continue;
            for (let j = head[(ax * GY + ay) * GZ + az]; j !== -1; j = next[j]) {
              if (j <= i) continue;
              let nx = P[i * 3] - P[j * 3], ny = P[i * 3 + 1] - P[j * 3 + 1], nz = P[i * 3 + 2] - P[j * 3 + 2];
              const d2 = nx * nx + ny * ny + nz * nz;
              if (d2 >= CS * CS || d2 < 1e-12) continue;
              const d = Math.sqrt(d2); nx /= d; ny /= d; nz /= d;
              const pen = (CS - d) * 0.5;
              P[i * 3] += nx * pen; P[i * 3 + 1] += ny * pen; P[i * 3 + 2] += nz * pen;
              P[j * 3] -= nx * pen; P[j * 3 + 1] -= ny * pen; P[j * 3 + 2] -= nz * pen;
              if (it === 0) {
                const rvx = V[i * 3] - V[j * 3], rvy = V[i * 3 + 1] - V[j * 3 + 1], rvz = V[i * 3 + 2] - V[j * 3 + 2];
                const vn = rvx * nx + rvy * ny + rvz * nz;
                if (vn < 0) {
                  const J = -(1 + e) * vn * 0.5;
                  V[i * 3] += J * nx; V[i * 3 + 1] += J * ny; V[i * 3 + 2] += J * nz;
                  V[j * 3] -= J * nx; V[j * 3 + 1] -= J * ny; V[j * 3 + 2] -= J * nz;
                  const tx = (rvx - vn * nx) * 0.12, ty = (rvy - vn * ny) * 0.12, tz = (rvz - vn * nz) * 0.12;
                  V[i * 3] -= tx; V[i * 3 + 1] -= ty; V[i * 3 + 2] -= tz; V[j * 3] += tx; V[j * 3 + 1] += ty; V[j * 3 + 2] += tz;
                }
                contact[i]++; contact[j]++;
              }
            }
          }
        }
        // walls
        for (let i = 0; i < N; i++) if (alive[i]) {
          let x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
          if (y < 0.05) {
            const yy = Math.min(y, 0);
            const hw = (W / 2) * pinch(yy, f) - WALL - 0.09;
            if (x > hw) { x = hw; if (V[i * 3] > 0) V[i * 3] *= -e; contact[i]++; }
            if (x < -hw) { x = -hw; if (V[i * 3] < 0) V[i * 3] *= -e; contact[i]++; }
            const yb = -H + 0.26;
            if (y < yb) { y = yb; if (V[i * 3 + 1] < 0) { V[i * 3 + 1] *= -e; V[i * 3] *= 0.7; V[i * 3 + 2] *= 0.7; } contact[i] += 2; }
            const yc = Math.min(y, 0), pn = pinch(yc, f);
            let dz = depthAt(x / pn, yc, f) - WALL;
            for (let k = 0; k < 24 && dz < 0.15 && Math.abs(x) > 0.05; k++) { x *= 0.975; dz = depthAt(x / pn, yc, f) - WALL; }
            dz = Math.max(0, dz);
            if (z > dz) { z = dz; if (V[i * 3 + 2] > 0) V[i * 3 + 2] *= -e; V[i * 3] *= 0.85; V[i * 3 + 1] *= 0.92; contact[i]++; }
            if (z < -dz) { z = -dz; if (V[i * 3 + 2] < 0) V[i * 3 + 2] *= -e; V[i * 3] *= 0.85; V[i * 3 + 1] *= 0.92; contact[i]++; }
            // tray + box block
            const tx0 = -0.8 - PR, tx1 = 0.8 + PR, ty0 = -2.85 - PR, ty1 = -1.65 + PR, tz0 = -0.17 - PR, tz1 = 0.17 + PR;
            if (x > tx0 && x < tx1 && y > ty0 && y < ty1 && z > tz0 && z < tz1) {
              const c = [x - tx0, tx1 - x, y - ty0, ty1 - y, z - tz0, tz1 - z];
              let m = 0; for (let k = 1; k < 6; k++) if (c[k] < c[m]) m = k;
              if (m === 0) { x = tx0; V[i * 3] = Math.min(V[i * 3], 0); } else if (m === 1) { x = tx1; V[i * 3] = Math.max(V[i * 3], 0); }
              else if (m === 2) { y = ty0; V[i * 3 + 1] = Math.min(V[i * 3 + 1], 0); } else if (m === 3) { y = ty1; if (V[i * 3 + 1] < 0) V[i * 3 + 1] *= -e; V[i * 3] *= 0.8; V[i * 3 + 2] *= 0.8; }
              else if (m === 4) { z = tz0; V[i * 3 + 2] = Math.min(V[i * 3 + 2], 0); } else { z = tz1; V[i * 3 + 2] = Math.max(V[i * 3 + 2], 0); }
              contact[i] += 2;
            }
            // card
            if (cp) {
              const lx = (x - cp.x) * cp.cz - (y - cp.y) * cp.sz, ly = (x - cp.x) * cp.sz + (y - cp.y) * cp.cz;
              if (Math.abs(lx) < CARD_W / 2 + PR * 0.5 && Math.abs(ly) < CARD_H / 2 + PR * 0.5) {
                const zc = cp.z - ly * Math.sin(cp.rx) - 0.03 - PR * 1.6;
                if (z > zc) { z = zc; V[i * 3 + 2] = Math.min(V[i * 3 + 2], 0); contact[i] += 2; }
              }
            }
          }
          if (f > 196 && y > -WALL) { y = -WALL; if (V[i * 3 + 1] > 0) V[i * 3 + 1] = 0; }
          P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
        }
      }
      // rest: kill the micro-jitter of a settled pile so scrubbing does not shimmer
      for (let i = 0; i < N; i++) if (alive[i]) {
        const sp = Math.hypot(V[i * 3], V[i * 3 + 1], V[i * 3 + 2]);
        if (contact[i] > 3 && sp < 0.25) { V[i * 3] *= 0.5; V[i * 3 + 1] *= 0.5; V[i * 3 + 2] *= 0.5; }
        // spin: tumble in the air, stop in the pile
        const wd = contact[i] > 0 ? (contact[i] > 3 ? 0.6 : 0.85) : 1;
        let wx = Wv[i * 3] *= wd, wy = Wv[i * 3 + 1] *= wd, wz = Wv[i * 3 + 2] *= wd;
        const qx = Q[i * 4], qy = Q[i * 4 + 1], qz = Q[i * 4 + 2], qw = Q[i * 4 + 3], h = 0.5 * dt;
        let nx = qx + h * (wx * qw + wy * qz - wz * qy), ny = qy + h * (wy * qw + wz * qx - wx * qz), nz = qz + h * (wz * qw + wx * qy - wy * qx), nw = qw - h * (wx * qx + wy * qy + wz * qz);
        const l = Math.hypot(nx, ny, nz, nw); Q[i * 4] = nx / l; Q[i * 4 + 1] = ny / l; Q[i * 4 + 2] = nz / l; Q[i * 4 + 3] = nw / l;
      }
      if (step % SUB === 0) {
        const fi = step / SUB - SIM0;
        outP.set(P, fi * N * 3); outQ.set(Q, fi * N * 4); outA.set(alive, fi * N);
      }
    }
    // stats for the console
    for (const ff of [150, 170, 185, 200]) { const o = (ff - SIM0) * N; const ys = []; for (let i = 0; i < N; i++) if (outA[o + i] && outP[(o + i) * 3 + 1] < 0) ys.push(outP[(o + i) * 3 + 1]); ys.sort((a, b) => a - b); console.log(`[mavi] f${ff} inside ${ys.length} top97 ${ys[Math.floor(ys.length * 0.97)]?.toFixed(3)} above ${N - ys.length}`); }
    const last = (SIM1 - SIM0) * N;
    let top = -9, cnt = 0, ys = [];
    for (let i = 0; i < N; i++) if (outA[last + i]) { cnt++; ys.push(outP[(last + i) * 3 + 1]); }
    ys.sort((a, b) => a - b); top = ys[Math.floor(ys.length * 0.97)];
    console.log(`[mavi] peanuts alive ${cnt}/${N}, 97th pct height ${top.toFixed(3)} (bag-local; mouth = 0)`);
    return { outP, outQ, outA };
  }

  // ---------- textures ----------
  function canvasTex(THREE, w, h, draw, srgb = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8; return t;
  }
  function printTexture(THREE) {
    return canvasTex(THREE, 1024, 1396, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#ffffff';
      // the giant vertical wordmark along the right edge, reading bottom to top
      g.save(); g.translate(w - 105, h - 95); g.rotate(-Math.PI / 2);
      let size = 300; g.font = `${size}px Anton`;
      const m = g.measureText('MARIADAMAVI'); size = size * (h - 200) / m.width; g.font = `${size}px Anton`;
      g.textBaseline = 'alphabetic'; g.fillText('MARIADAMAVI', 0, 0);
      g.restore();
      // the small mark top-left
      g.font = '30px Anton'; g.fillText('MARIADAMAVI', 78, 96);
    });
  }
  function cardTexture(THREE) {
    return canvasTex(THREE, 800, 1000, (g, w, h) => {
      g.fillStyle = '#0c0b0d'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#E8197F'; g.font = '232px Anton'; g.textBaseline = 'alphabetic'; g.fillText('CHEGOU.', 58, 280);
      g.fillStyle = '#ffffff'; g.font = '600 44px Inter'; g.fillText('Seu novo Apple chegou.', 64, 352);
      g.fillStyle = '#E8197F'; g.fillRect(64, 440, 470, 380);
      g.fillStyle = '#0c0b0d'; g.font = '300px Anton'; g.fillText('3%', 96, 760);
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, w, 6);
    });
  }
  function veilAlpha(THREE) {   // milky, uneven frosting; denser seams; the zip band at the top
    return canvasTex(THREE, 512, 700, (g, w, h) => {
      const img = g.createImageData(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const u = x / w, v = y / h;
        let a = 0.42 + 0.22 * (fbm(u * 9, v * 11) - 0.5) + 0.05 * (hash(x * 912 + y * 7) - 0.5);
        const edge = Math.min(u, 1 - u, 1 - v) * w;
        if (edge < 10) a = 0.95;
        if (v < 0.035) a = 0.92; else if (v < 0.05) a = 0.5;
        const c = Math.max(0, Math.min(255, a * 255));
        const k = (y * w + x) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = c; img.data[k + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    }, false);
  }
  function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const h = (a, b) => hash((a * 73856093) ^ (b * 19349663)); const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v); }
  function fbm(x, y) { let a = 0, s = 0.5; for (let o = 0; o < 4; o++) { a += s * vnoise(x, y); x = x * 2.03 + 17.1; y = y * 2.01 + 3.7; s *= 0.5; } return a; }
  function crinkleNormal(THREE) {   // soft wrinkles of thin plastic
    return canvasTex(THREE, 512, 700, (g, w, h) => {
      const hf = new Float32Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const u = x / w, v = y / h;
        hf[y * w + x] = fbm(u * 7, v * 9.5) + 0.55 * Math.abs(fbm(u * 3 + 4.1, v * 2.2 + 1.3) - 0.5) * -1 + 0.25 * fbm(u * 26, v * 31);
      }
      const img = g.createImageData(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const xl = hf[y * w + Math.max(0, x - 1)], xr = hf[y * w + Math.min(w - 1, x + 1)], yu = hf[Math.max(0, y - 1) * w + x], yd = hf[Math.min(h - 1, y + 1) * w + x];
        let nx = (xl - xr) * 9, ny = (yu - yd) * 9, nz = 1; const l = Math.hypot(nx, ny, nz);
        const k = (y * w + x) * 4; img.data[k] = (nx / l * 0.5 + 0.5) * 255; img.data[k + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[k + 2] = (nz / l * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    }, false);
  }
  function radialTex(THREE, inner, outer) {
    return canvasTex(THREE, 256, 256, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
  }
  // equirect environment plate: dark wine room, a warm soft key, a pink strip behind-right, a pink floor glow
  window.MAVI_ENV = function () {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, 512); bg.addColorStop(0, '#060204'); bg.addColorStop(0.5, '#10050b'); bg.addColorStop(1, '#030102');
    g.fillStyle = bg; g.fillRect(0, 0, 1024, 512);
    const soft = (x, y, rw, rh, col, blur) => { g.save(); g.filter = `blur(${blur}px)`; g.fillStyle = col; g.fillRect(x, y, rw, rh); g.restore(); };
    soft(120, 90, 180, 120, '#fff4ec', 14);       // warm key softbox
    soft(620, 140, 46, 220, '#ff3f98', 10);      // pink rim strip
    soft(880, 150, 60, 160, '#ffd6ea', 12);      // small cool-pink card
    soft(0, 300, 1024, 40, '#3a0821', 30);       // low pink horizon
    soft(420, 30, 240, 40, '#ffffff', 16);       // overhead strip
    return c.toDataURL('image/png');
  };

  // ---------- geometry helpers ----------
  function peanutGeometry(THREE, variant) {
    const g = new THREE.CapsuleGeometry(0.05, 0.17, 5, 10, 14);
    const p = g.attributes.position, v = new THREE.Vector3();
    const bend = [9.5, 6.0, 7.5][variant], s = [0, 1, 0.5][variant];
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const a = v.y * bend;                           // bend along the length (y) into an arc
      const th = Math.atan2(v.z, v.x); const ridge = (1 + 0.12 * Math.sin(v.y * 55 + th * 3 + variant) + 0.07 * Math.sin(th * 5 + v.y * 20)) * (1 + 0.18 * Math.sin(v.y * 14 + variant * 2));
      const x = v.x * ridge, z = v.z * ridge;
      const R = 1 / bend;
      let nx = (R - x) * Math.cos(a) - R, ny = (R - x) * Math.sin(a);
      const nz = z + s * 2.2 * v.y * Math.abs(v.y);   // an S twist for one variant
      p.setXYZ(i, -nx, ny, nz);
    }
    g.computeVertexNormals();
    return g;
  }

  // =================================================================================================
  window.MaviScene = function (opts) {
    const MOBILE = !!opts.mobile;
    let T = null, sim = null;
    const R = {};   // references
    const tmpM = { m: null, q: null, p: null, s: null };

    async function build(THREE, scene, camera, ctx) {
      T = THREE;
      const { RoundedBoxGeometry } = await import('./runtime/hero3d/vendor/addons/geometries/RoundedBoxGeometry.js');
      await document.fonts.load('100px Anton'); await document.fonts.load('600 44px Inter');
      tmpM.m = new THREE.Matrix4(); tmpM.q = new THREE.Quaternion(); tmpM.p = new THREE.Vector3(); tmpM.s = new THREE.Vector3(1, 1, 1);
      const t0 = performance.now(); sim = simulate(); console.log(`[mavi] sim ${(performance.now() - t0).toFixed(0)} ms`);

      scene.background = new THREE.Color('#0a0208');
      scene.fog = new THREE.FogExp2('#0b0309', 0.034);
      const world = new THREE.Group(); world.name = 'world';

      // materials
      const anod = new THREE.MeshPhysicalMaterial({ color: '#1d1219', metalness: 0.75, roughness: 0.34, clearcoat: 0.35, clearcoatRoughness: 0.3 });
      const satinBlack = new THREE.MeshPhysicalMaterial({ color: '#0d0b0d', metalness: 0.2, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.25, sheen: 0.4, sheenColor: new THREE.Color('#ff7ab8'), sheenRoughness: 0.5 });
      const led = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff3d9a').multiplyScalar(2.2), fog: true });
      R.led = led;
      const box = (w, h, d, mat, r = 0.03) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.1, h / 2.1, d / 2.1)), mat);
      const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };

      // floor with the slot under the bag
      const shape = new THREE.Shape(); shape.moveTo(-60, -60); shape.lineTo(60, -60); shape.lineTo(60, 60); shape.lineTo(-60, 60); shape.lineTo(-60, -60);
      const hole = new THREE.Path(); hole.moveTo(-1.55, -0.95); hole.lineTo(1.55, -0.95); hole.lineTo(1.55, 0.95); hole.lineTo(-1.55, 0.95); hole.lineTo(-1.55, -0.95); shape.holes.push(hole);
      const floorMat = new THREE.MeshPhysicalMaterial({ color: '#0a0407', roughness: 0.3, metalness: 0.7, clearcoat: 0.3, clearcoatRoughness: 0.3 });
      const floor = new THREE.Mesh(new THREE.ShapeGeometry(shape), floorMat); floor.rotation.x = -Math.PI / 2; world.add(floor);
      // slot rim + pit
      const rimMat = anod;
      [[0, -0.95, 3.3, 0.12], [0, 0.95, 3.3, 0.12]].forEach(([x, z, w, d]) => world.add(at(box(w, 0.06, d, rimMat, 0.02), x, 0.03, z)));
      [[-1.6, 0], [1.6, 0]].forEach(([x, z]) => world.add(at(box(0.12, 0.06, 2.0, rimMat, 0.02), x, 0.03, z)));
      const pitMat = new THREE.MeshStandardMaterial({ color: '#12040b', roughness: 0.9, side: THREE.BackSide });
      world.add(at(new THREE.Mesh(new THREE.BoxGeometry(3.1, 6, 1.9), pitMat), 0, -3.0, 0));
      const pitGlow = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#E8197F').multiplyScalar(1.4), fog: false }));
      pitGlow.rotation.x = -Math.PI / 2; pitGlow.position.y = -2.2; world.add(pitGlow); R.pitGlow = pitGlow;
      R.pitLight = new THREE.PointLight('#ff2a8c', 30, 9, 1.6); R.pitLight.position.set(0, -0.6, 0.3); world.add(R.pitLight);
      // glow pooled on the floor around the slot (light leaking)
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), new THREE.MeshBasicMaterial({ map: radialTex(THREE, 'rgba(232,25,127,0.32)', 'rgba(232,25,127,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      pool.rotation.x = -Math.PI / 2; pool.position.y = 0.004; world.add(pool); R.pool = pool;
      // backdrop glow (haze behind the station)
      const haze = new THREE.Mesh(new THREE.PlaneGeometry(34, 18), new THREE.MeshBasicMaterial({ map: radialTex(THREE, 'rgba(110,12,60,0.22)', 'rgba(20,4,12,0)'), transparent: true, depthWrite: false, fog: false }));
      haze.position.set(-1, 4.5, -14); world.add(haze); R.haze = haze;
      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 7), new THREE.MeshBasicMaterial({ map: canvasTex(THREE, 64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(232,25,127,0.35)'); gr.addColorStop(1, 'rgba(232,25,127,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      shaft.position.set(0, 3.5, -1.2); world.add(shaft); R.shaft = shaft;

      // overhead rail (one slim anodized beam) with an LED line under it
      world.add(at(box(14.5, 0.22, 0.34, anod, 0.05), -4.3, 6.75, 0));
      const railLed = at(new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.012, 0.03), led), -4.3, 6.635, 0.12); world.add(railLed);
      [-8.5, -3.0, 1.9].forEach((x) => world.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 8, 8), anod), x, 10.8, 0)));

      // infeed conveyor: two side rails, rollers, legs
      const convX0 = -12, convX1 = -2.8, convL = convX1 - convX0, convC = (convX0 + convX1) / 2;
      [-0.66, 0.66].forEach((z) => { world.add(at(box(convL, 0.24, 0.08, anod, 0.03), convC, ROLLER_Y + 0.02, z)); world.add(at(new THREE.Mesh(new THREE.BoxGeometry(convL, 0.01, 0.012), led), convC, ROLLER_Y - 0.1, z + Math.sign(z) * 0.045)); });
      for (let x = convX0 + 0.8; x < convX1; x += 2.2) [-0.66, 0.66].forEach((z) => world.add(at(box(0.12, ROLLER_Y, 0.12, anod, 0.03), x, ROLLER_Y / 2, z)));
      const rollerGeo = new THREE.CylinderGeometry(ROLLER_R, ROLLER_R, 1.24, 24); rollerGeo.rotateX(Math.PI / 2);
      R.rollers = [];
      for (let x = convX1 - 0.16; x > convX0; x -= 0.29) { const r = new THREE.Mesh(rollerGeo, satinBlack); r.position.set(x, ROLLER_Y, 0); world.add(r); R.rollers.push(r); }
      // a groove ring on each roller so the spin is visible
      const ringGeo = new THREE.TorusGeometry(ROLLER_R + 0.002, 0.006, 6, 24);
      R.rollers.forEach((r) => { [-0.3, 0.3].forEach((z) => { const k = new THREE.Mesh(ringGeo, anod); k.position.z = z; r.add(k); }); const mark = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 1.2), new THREE.MeshStandardMaterial({ color: '#3a2531', roughness: 0.5 })); mark.position.y = ROLLER_R; r.add(mark); });

      // pedestal where the tray waits
      world.add(at(box(1.9, ROLLER_Y + 0.1, 1.5, anod, 0.06), TRAY_X, (ROLLER_Y + 0.1) / 2, 0));
      world.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.012, 0.012), led), TRAY_X, ROLLER_Y - 0.05, 0.756));
      // scanner bridge above the pedestal
      [-0.7, 0.7].forEach((z) => world.add(at(box(0.1, 1.5, 0.1, anod, 0.03), TRAY_X - 0.95, ROLLER_Y + 0.85, z)));
      world.add(at(box(0.18, 0.12, 1.5, anod, 0.03), TRAY_X - 0.95, ROLLER_Y + 1.62, 0));
      R.scanHead = at(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 1.3), led), TRAY_X - 0.95, ROLLER_Y + 1.55, 0); world.add(R.scanHead);
      const fanGeo = new THREE.BufferGeometry();
      fanGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.65, 0, 0, 0.65, 0, -1, 0.65, 0, 0, -0.65, 0, -1, 0.65, 0, -1, -0.65], 3));
      R.fan = new THREE.Mesh(fanGeo, new THREE.MeshBasicMaterial({ color: '#ff3d9a', transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      world.add(R.fan);
      R.scanLine = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.006, 1.02), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff5aa8').multiplyScalar(3), fog: false }));
      world.add(R.scanLine);

      // the product: sealed white box, no marks
      const boxMat = new THREE.MeshPhysicalMaterial({ color: '#f3f2f0', roughness: 0.42, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.3, sheenColor: new THREE.Color('#ffffff') });
      R.product = new THREE.Group();
      R.product.add(box(1.4, 0.28, 1.0, boxMat, 0.025));
      const seam = new THREE.Mesh(new THREE.BoxGeometry(1.404, 0.004, 1.004), new THREE.MeshStandardMaterial({ color: '#b9b6b3', roughness: 0.6 })); seam.position.y = 0.075; R.product.add(seam);
      const tab = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.285, 0.004), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.2, clearcoat: 1 })); tab.position.set(0.52, 0, 0.501); R.product.add(tab);

      // the dark tray: origin at its hinge (back edge, top); spans x +-0.8, y -0.34..0, z 0..1.2
      const trayMat = new THREE.MeshPhysicalMaterial({ color: '#141015', roughness: 0.55, metalness: 0.05, clearcoat: 0.4, clearcoatRoughness: 0.4 });
      R.tray = new THREE.Group();
      const tf = box(1.6, 0.06, 1.2, trayMat, 0.025); tf.position.set(0, -0.31, 0.6); R.tray.add(tf);
      [[0, -0.17, 0.03, 1.6, 0.34, 0.06], [0, -0.17, 1.17, 1.6, 0.34, 0.06], [-0.77, -0.17, 0.6, 0.06, 0.34, 1.2], [0.77, -0.17, 0.6, 0.06, 0.34, 1.2]].forEach(([x, y, z, w, h, d]) => { const m = box(w, h, d, trayMat, 0.025); m.position.set(x, y, z); R.tray.add(m); });
      R.trayBox = R.product;   // the product rides in the tray once set
      world.add(R.tray); world.add(R.product);

      // the soft arm (carriage on the rail + telescoping rod + head)
      const arm = (ledCol) => {
        const g = new THREE.Group();
        const car = box(0.5, 0.26, 0.5, anod, 0.06); car.position.y = 6.75; g.add(car);
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 16), satinBlack); g.add(rod);
        const head = new THREE.Group();
        const hb = box(0.6, 0.16, 0.24, anod, 0.05); hb.position.y = 0.09; head.add(hb);
        const ring = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.012, 0.16), ledCol); ring.position.y = 0.006; head.add(ring);
        g.add(head);
        return { g, car, rod, head };
      };
      R.arm = arm(led); world.add(R.arm.g);
      R.arm2 = arm(led); world.add(R.arm2.g);

      // hopper + chute (behind the bag mouth)
      R.hopper = new THREE.Group();
      const hop = box(1.3, 1.2, 1.1, anod, 0.08); hop.position.set(-0.3, 6.95, -1.95); R.hopper.add(hop);
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), new THREE.MeshBasicMaterial({ color: new THREE.Color('#E8197F').multiplyScalar(0.35) })); win.position.set(-0.3, 6.9, -1.394); R.hopper.add(win);
      const chuteLen = 1.65, chuteGeo = new THREE.BoxGeometry(0.7, 0.05, chuteLen);
      const chute = new THREE.Mesh(chuteGeo, anod); chute.position.set(-0.3, 6.15, -0.98); chute.rotation.x = 0.62; R.hopper.add(chute);
      [-0.36, 0.36].forEach((dx) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, chuteLen), anod); s.position.set(-0.3 + dx, 6.22, -0.98); s.rotation.x = 0.62; R.hopper.add(s); });
      R.gate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.32, 0.03), anod); R.hopper.add(R.gate);
      world.add(R.hopper);

      // ---------- the MaviBag ----------
      const printTex = printTexture(THREE), alphaTex = veilAlpha(THREE), nrm = crinkleNormal(THREE);
      const makeBag = () => {
        const b = { group: new THREE.Group() };
        b.front = new THREE.PlaneGeometry(W, H, 44, 60); b.back = new THREE.PlaneGeometry(W, H, 44, 60);
        b.base = b.front.attributes.position.array.slice();
        const veil = new THREE.MeshPhysicalMaterial({ color: '#f4ecf0', roughness: 0.5, metalness: 0, transparent: true, opacity: 0.85, alphaMap: alphaTex, normalMap: nrm, normalScale: new THREE.Vector2(0.3, 0.3), depthWrite: false, side: THREE.DoubleSide, emissive: new THREE.Color('#E8197F'), emissiveIntensity: 0 });
        const gloss = new THREE.MeshPhysicalMaterial({ color: '#000000', roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.16, normalMap: nrm, normalScale: new THREE.Vector2(0.5, 0.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
        const ink = new THREE.MeshPhysicalMaterial({ color: '#E8197F', map: printTex, alphaMap: null, transparent: true, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.2, emissive: new THREE.Color('#E8197F'), emissiveIntensity: 0.18, depthWrite: false, normalMap: nrm, normalScale: new THREE.Vector2(0.2, 0.2) });
        // map is white glyphs on transparent: use it as alpha, colour comes from `color`
        ink.map = null; ink.alphaMap = printTex; ink.alphaTest = 0.02;
        b.veilMat = veil;
        const fv = new THREE.Mesh(b.front, veil), fg = new THREE.Mesh(b.front, gloss), fi = new THREE.Mesh(b.front, ink);
        const bv = new THREE.Mesh(b.back, veil.clone()), bg = new THREE.Mesh(b.back, gloss);
        bv.material.opacity = 0.4; b.backVeil = bv.material;
        bv.renderOrder = 1; bg.renderOrder = 2; fv.renderOrder = 5; fg.renderOrder = 6; fi.renderOrder = 7;
        b.noShadow = [fv, fg, fi, bv, bg];
        [bv, bg, fv, fg, fi].forEach((m) => b.group.add(m));
        b.inner = new THREE.Group(); b.group.add(b.inner);
        return b;
      };
      R.bag = makeBag(); world.add(R.bag.group);
      R.bag2 = makeBag(); world.add(R.bag2.group);
      R.bagLight = new THREE.PointLight('#ff2a8c', 0, 4.5, 1.4); R.bag.inner.add(R.bagLight);
      R.spot = new THREE.SpotLight('#ffe6f1', 42, 22, 0.32, 0.7, 1.5); R.spot.position.set(-7, 8.5, 5); R.spot.target.position.set(0, 2.6, 0); world.add(R.spot); world.add(R.spot.target);

      // peanuts: three bent-foam variants, instanced, in the bag's local space
      const pMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.78, metalness: 0, emissive: new THREE.Color('#b00c58'), emissiveIntensity: 0.28, sheen: 0.6, sheenColor: new THREE.Color('#ff8cc4'), sheenRoughness: 0.6 });
      R.peanuts = [0, 1, 2].map((v) => { const im = new THREE.InstancedMesh(peanutGeometry(THREE, v), pMat, Math.floor((N - 1 - v) / 3) + 1); im.frustumCulled = false; R.bag.inner.add(im); return im; });
      const pal = ['#d8106f', '#E8197F', '#c90c63', '#e0157a', '#f02a8c', '#b80a5a'].map((c) => new THREE.Color(c));
      for (let i = 0; i < N; i++) R.peanuts[i % 3].setColorAt(Math.floor(i / 3), pal[Math.floor(hash(i * 31 + 5) * pal.length)]);
      R.peanuts.forEach((im) => (im.instanceColor.needsUpdate = true));

      // the card
      const cardMat = new THREE.MeshPhysicalMaterial({ map: cardTexture(THREE), roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.3 });
      R.card = new THREE.Mesh(new THREE.BoxGeometry(CARD_W, CARD_H, 0.012), [anod, anod, anod, anod, cardMat, anod]);
      R.bag.inner.add(R.card);

      // clamp: a bar over the mouth, two corner clips, two spreader rods, two zip rollers
      R.clamp = new THREE.Group();
      const bar = box(2.8, 0.14, 0.2, anod, 0.04); bar.position.set(0, BAG_TOP + 0.36, 0); R.clamp.add(bar);
      [-1.25, 1.25].forEach((x) => { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.0, 10), anod); h.position.set(x, BAG_TOP + 1.45, 0); R.clamp.add(h); });
      R.clips = [-1.02, 1.02].map((x) => { const c = new THREE.Group(); c.position.set(x, BAG_TOP + 0.36, 0); [-1, 1].forEach((s) => { const j = box(0.18, 0.42, 0.06, anod, 0.025); j.position.set(0, -0.26, s * 0.05); j.userData.s = s; c.add(j); }); const l = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.012), led); l.position.set(0, -0.08, 0.1); c.add(l); R.clamp.add(c); return c; });
      R.spreaders = [-1, 1].map((s) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.7, 10), satinBlack); r.rotation.z = Math.PI / 2; r.userData.s = s; R.clamp.add(r); return r; });
      R.zip = [-1, 1].map((s) => { const g = new THREE.Group(); const r = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.16, 24), satinBlack); g.add(r); const l = new THREE.Mesh(new THREE.TorusGeometry(0.076, 0.006, 6, 24), led); l.rotation.x = Math.PI / 2; g.add(l); const y = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.06), anod); y.position.y = 0.2; g.add(y); g.userData.s = s; g.userData.r = r; R.clamp.add(g); return g; });
      world.add(R.clamp);

      // hanger for the next bag
      R.hook = new THREE.Group();
      const hk = box(2.5, 0.1, 0.16, anod, 0.03); hk.position.y = 0.32; R.hook.add(hk);
      const hr = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 10), anod); hr.position.y = 1.45; R.hook.add(hr);
      world.add(R.hook);

      R.world = world;
      return { world };
    }

    // ---------- per-frame state ----------
    function setBagGeometry(b, f, statik) {
      const fa = b.front.attributes.position, ba = b.back.attributes.position, base = b.base;
      const fill = statik ? 0 : fillOf(f);
      for (let i = 0; i < fa.count; i++) {
        const x0 = base[i * 3], yy = base[i * 3 + 1] - H / 2;           // plane is centred; shift so y in [-H, 0]
        const x = x0 * (statik ? 1 : pinch(yy, f));
        let d = statik ? statik(x0, yy) : depthAt(x0, yy, f);
        const wr = (1 - 0.8 * fill) * 0.018 * (Math.sin(x0 * 9 + yy * 4) * Math.sin(yy * 7 - x0 * 3)) * Math.min(1, d * 8);
        const sag = statik ? 0 : -0.04 * (1 - fill) * Math.sin(Math.PI * (x0 / W + 0.5)) * clamp01(-yy / 0.8) * (yy > -0.8 ? 1 : 0);
        fa.setXYZ(i, x, yy + sag, d + wr + 0.003);
        ba.setXYZ(i, x, yy + sag, -d + wr * 0.6 - 0.003);
      }
      fa.needsUpdate = true; ba.needsUpdate = true;
      b.front.computeVertexNormals(); b.back.computeVertexNormals();
      b.noShadow.forEach((m) => (m.castShadow = false));
    }

    // the soft arm: grip point G (bottom of the head) in world
    function armPose(f) {
      return kf(f, [
        [0, [PICK_X, 3.5, 0]], [44, [PICK_X, 3.3, 0]],
        [55, [PICK_X, 1.78, 0], outQuint],
        [59, [PICK_X, 1.78, 0]],
        [66, [-2.75, 2.36, 0]],
        [72, [TRAY_X, 1.84, 0], outCubic],
        [75, [TRAY_X, 1.84, 0]],
        [80, [TRAY_X, 2.5, 0], outCubic],
        [87, [TRAY_X, 1.88, -0.6], outCubic],
        [90, [TRAY_X, 1.84, -0.6]],
        [97, [-1.0, 5.2, -0.25]],
        [102, [0, 5.75, 0.17], outCubic],
        [110, [0, BAG_TOP + TRAY_HINGE_IN_BAG[1], 0.17], (t) => sstep(0, 1, t)],
        [114, [0, BAG_TOP + TRAY_HINGE_IN_BAG[1], 0.17]],
        [122, [0, 5.4, 0.17], outCubic],
        [134, [-2.6, 5.2, 0.4], outCubic],
        [300, [-3.2, 5.0, 0.4]],
      ]);
    }
    function boxWorld(f) {   // product centre while it is not in the tray
      const xIn = kf(f, [[0, -16], [30, -16], [55, PICK_X, outQuint]]);
      if (f < 59) return [xIn, ROLLER_Y + ROLLER_R + 0.14, 0];
      if (f < 75) { const g = armPose(f); return [g[0], g[1] - 0.14, 0]; }
      return null;
    }
    function trayPose(f) {   // hinge world position + rotation about x
      const hingeRest = [TRAY_X, ROLLER_Y + ROLLER_R + 0.34, -0.6];
      if (f < 90) return { p: hingeRest, rx: 0 };
      const g = armPose(f);
      const rx = (Math.PI / 2) * sstep(92, 101, f);
      return { p: [g[0], g[1], g[2]], rx };
    }

    function camState(f) {
      if (!MOBILE) {
        const pos = kf(f, [
          [0, [4.6, 4.25, 10.9]], [30, [4.1, 4.08, 10.2], (t) => t],
          [75, [3.6, 3.95, 10.6]], [112, [2.0, 3.75, 9.9]],
          [190, [0.9, 3.45, 8.7]], [232, [0.55, 3.25, 7.3]],
          [262, [0.35, 3.75, 7.7]], [280, [0.5, 3.2, 8.6]], [300, [1.5, 3.8, 9.9]],
        ]);
        const tgt = kf(f, [
          [0, [-0.75, 3.2, 0]], [30, [-0.9, 3.12, 0], (t) => t],
          [75, [-1.45, 2.85, 0]], [112, [-0.3, 2.9, 0]],
          [190, [0.0, 2.65, 0]], [232, [0.15, 2.55, 0]],
          [262, [0.0, 3.05, 0]], [280, [0.0, 1.55, 0]], [300, [0.0, 2.75, 0]],
        ]);
        return { position: pos, target: tgt, fov: 28 };
      }
      const pos = kf(f, [
        [0, [3.06, 4.60, 13.64]], [30, [2.88, 4.50, 13.38], (t) => t],
        [75, [1.98, 4.30, 12.50]], [112, [0.99, 4.00, 11.44]],
        [190, [0.54, 3.80, 10.21]], [232, [0.36, 3.50, 8.80]],
        [262, [0.23, 3.90, 9.15]], [280, [0.36, 3.40, 9.86]], [300, [0.90, 4.10, 11.26]],
      ]);
      const tgt = kf(f, [
        [0, [-0.9, 3.05, 0]], [30, [-1.0, 3.0, 0], (t) => t],
        [75, [-1.2, 2.8, 0]], [112, [-0.2, 3.0, 0]],
        [190, [0.0, 2.9, 0]], [232, [0.1, 2.75, 0]],
        [262, [0.0, 3.2, 0]], [280, [0.0, 1.7, 0]], [300, [0.0, 3.0, 0]],
      ]);
      return { position: pos, target: tgt, fov: 34 };
    }

    function state(t, objs, ctx) {
      const f = Math.round(t * FPS);
      const THREE = T;

      // rollers spin while the box rides them (angle = distance / r), plus a slow idle creep so they never freeze
      const xb = kf(f, [[0, -16], [30, -16], [55, PICK_X, outQuint]]);
      const ang = -((xb + 16) / ROLLER_R) - f * 0.02;
      R.rollers.forEach((r) => (r.rotation.z = ang));

      // product + tray
      const tp = trayPose(f);
      R.tray.position.set(...tp.p); R.tray.rotation.set(tp.rx, 0, 0);
      const bw = boxWorld(f);
      if (bw) { R.product.position.set(...bw); R.product.rotation.set(0, 0, 0); R.product.scale.setScalar(1); }
      else {   // ride in the tray: local (0, -0.14, 0.6) rotated by rx about the hinge
        const ly = -0.14, lz = 0.6, c = Math.cos(tp.rx), s = Math.sin(tp.rx);
        R.product.position.set(tp.p[0], tp.p[1] + ly * c - lz * s, tp.p[2] + ly * s + lz * c);
        R.product.rotation.set(tp.rx, 0, 0);
      }
      // once inside the bag, tray + product follow the bag (rigid) during the release
      const drop = f >= 270 ? (f - 270) / FPS : 0;
      const bagY = BAG_TOP - 0.5 * 17 * drop * drop;
      const bagRx = 0.32 * sstep(270, 286, f), bagRz = -0.05 * sstep(270, 284, f), bagX = 0.12 * drop;
      const breath = (1 - sstep(60, 100, f)) * Math.sin(f * 0.11 + 0.6);   // the empty bag sways a little on its clamp
      R.bag.group.position.set(bagX, bagY, 0); R.bag.group.rotation.set(bagRx + 0.012 * breath, 0, bagRz + 0.016 * breath);
      if (f >= 114) {   // re-parent tray+product into the bag's frame (pure: computed every frame)
        R.bag.group.updateMatrixWorld(true);
        const m = R.bag.group.matrixWorld;
        const hingeLocal = new THREE.Vector3(...TRAY_HINGE_IN_BAG).applyMatrix4(m);
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(bagRx, 0, bagRz)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)));
        R.tray.position.copy(hingeLocal); R.tray.quaternion.copy(q);
        const pl = new THREE.Vector3(0, -0.14, 0.6).applyQuaternion(q).add(hingeLocal);
        R.product.position.copy(pl); R.product.quaternion.copy(q);
      }
      R.tray.visible = R.product.visible = bagY > -6;

      // arm
      const g = armPose(f);
      R.arm.head.position.set(g[0], g[1], g[2]);
      R.arm.car.position.set(g[0], 6.75, 0);
      const rodLen = 6.62 - (g[1] + 0.17); R.arm.rod.scale.set(1, Math.max(0.01, rodLen), 1); R.arm.rod.position.set(g[0], g[1] + 0.17 + rodLen / 2, g[2] * 0.5);
      R.arm.head.rotation.set(0, 0, 0);
      // squash on grip (2-3 f), the "soft" part of the arm
      const press = Math.max(sstep(55, 57, f) * (1 - sstep(57, 60, f)), sstep(87, 89, f) * (1 - sstep(89, 92, f)));
      R.arm.head.scale.set(1 + 0.06 * press, 1 - 0.12 * press, 1 + 0.06 * press);

      // scanner: a thin pink line crosses the box in the tray
      const sc = seg(f, 76, 90), scanOn = f >= 75 && f <= 91;
      const sx = lerp(TRAY_X - 0.82, TRAY_X + 0.82, sm5(sc));
      R.scanLine.visible = R.fan.visible = scanOn;
      R.scanLine.position.set(sx, ROLLER_Y + ROLLER_R + 0.343, 0);
      R.fan.position.set(TRAY_X - 0.95, ROLLER_Y + 1.55, 0);
      { const dx = sx - (TRAY_X - 0.95), dy = -(1.55 - 0.343 - ROLLER_R); R.fan.rotation.set(0, 0, Math.atan2(dx, -dy)); R.fan.scale.set(1, Math.hypot(dx, dy), 1); }
      R.fan.material.opacity = 0.14 * Math.sin(Math.PI * sc);
      R.led.color.setRGB(2.2, 0.24 * 2.2 / 1, 0.6 * 2.2 / 1.0).multiplyScalar(0.85 + 0.15 * Math.sin(f * 0.21) + (scanOn ? 0.3 * Math.sin(Math.PI * sc) : 0));

      // hopper gate opens for the pour
      const gOpen = sstep(106, 113, f) * (1 - sstep(180, 186, f));
      R.gate.position.set(-0.3, 5.66 + 0.25 * gOpen, -0.34 - 0.02);
      R.gate.rotation.set(-1.2 * gOpen, 0, 0);
      const chuteFix = BAG_TOP + CHUTE[1];   // lip height in world (for reference)
      void chuteFix;

      // bag geometry + glow
      setBagGeometry(R.bag, f);
      const fill = fillOf(f);
      R.bagLight.position.set(0, -1.1, 0.35);
      R.bagLight.intensity = (0.3 + 3.2 * fill) * (0.92 + 0.08 * Math.sin(f * 0.17));
      R.bag.veilMat.emissiveIntensity = 0.05 + 0.1 * fill;
      R.bag.backVeil.emissiveIntensity = 0.04 + 0.08 * fill;
      R.bag.group.visible = bagY > -6;

      // peanuts
      const fi = Math.min(SIM1, f) - SIM0;
      const cnt = [0, 0, 0];
      for (let i = 0; i < N; i++) {
        const im = R.peanuts[i % 3], k = Math.floor(i / 3);
        if (fi < 0 || !sim.outA[fi * N + i]) { tmpM.m.makeScale(0, 0, 0); im.setMatrixAt(k, tmpM.m); continue; }
        const o = (fi * N + i);
        tmpM.p.set(sim.outP[o * 3], sim.outP[o * 3 + 1], sim.outP[o * 3 + 2]);
        tmpM.q.set(sim.outQ[o * 4], sim.outQ[o * 4 + 1], sim.outQ[o * 4 + 2], sim.outQ[o * 4 + 3]);
        const sz = 0.9 + 0.08 * hash(i * 13 + 7);
        tmpM.s.set(sz, sz, sz);
        tmpM.m.compose(tmpM.p, tmpM.q, tmpM.s); im.setMatrixAt(k, tmpM.m); cnt[i % 3]++;
      }
      R.peanuts.forEach((im) => (im.instanceMatrix.needsUpdate = true));

      // card + its arm
      const cp = cardPose(f);
      R.card.visible = f >= 190;
      R.card.position.set(cp.x, cp.y, cp.z); R.card.rotation.set(cp.rx, 0, cp.rz);
      const a2 = kf(f, [[0, [1.9, 5.6, 0.25]], [188, [1.9, 5.6, 0.25]], [196, [0.55, 5.6, 0.25], outCubic], [300, [0.55, 5.6, 0.25]]]);
      let gx = a2[0], gy = a2[1], gz = a2[2];
      if (f >= 190 && f <= 228) {   // grip rides the card's top edge (bag frame = world while the bag is still)
        gx = cp.x - Math.sin(-cp.rz) * CARD_H / 2 * -1; gy = BAG_TOP + cp.y + Math.cos(cp.rz) * CARD_H / 2; gz = cp.z;
        gx = cp.x + Math.sin(-cp.rz) * CARD_H / 2;
      }
      if (f > 228) { const u = outCubic(seg(f, 229, 244)); const e = [cp.x + Math.sin(-cp.rz) * CARD_H / 2, BAG_TOP + cp.y + Math.cos(cp.rz) * CARD_H / 2, cp.z]; gx = lerp(e[0], 1.9, sstep(236, 252, f)); gy = lerp(e[1], 5.6, u); gz = lerp(e[2], 0.25, u); }
      R.arm2.head.position.set(gx, gy, gz); R.arm2.car.position.set(gx, 6.75, 0);
      const rl2 = 6.62 - (gy + 0.17); R.arm2.rod.scale.set(1, Math.max(0.01, rl2), 1); R.arm2.rod.position.set(gx, gy + 0.17 + rl2 / 2, gz * 0.5);
      R.arm2.head.rotation.set(0, 0, f >= 190 && f <= 232 ? cp.rz : 0);
      R.arm2.head.scale.set(0.6, 0.8, 0.6);

      // clamp: clips hold the corners, open at the release
      const clipOpen = sstep(266, 271, f) * (1 - sstep(292, 297, f));
      R.clips.forEach((c) => c.children.forEach((j) => { if (j.userData.s) { j.position.z = j.userData.s * (0.05 + 0.12 * clipOpen); j.rotation.x = j.userData.s * 0.35 * clipOpen; } }));
      const lift = spreaderLift(f);
      R.spreaders.forEach((r) => { r.position.set(0, BAG_TOP - 0.12 + 0.52 * lift, r.userData.s * (mouthAt(0, f) - 0.05) * (1 - lift) + r.userData.s * 0.12 * lift); });
      const zx = rollerX(f), zipOn = f >= 238 && f <= 268;
      R.zip.forEach((z) => { const s = z.userData.s; const close = sstep(238, 243, f) * (1 - sstep(265, 270, f)); z.position.set(f < 242 ? -1.32 : zx, BAG_TOP + 0.02 + 0.3 * (1 - close), s * lerp(0.42, 0.095, close)); z.userData.r.rotation.y = -s * (zx + 1.32) / 0.075; z.visible = true; });
      void zipOn;

      // next bag swings in on its hanger, settles, still swaying on the last frame
      const nb = f >= 272;
      R.bag2.group.visible = R.hook.visible = nb;
      const hx = kf(f, [[0, 7.5], [272, 7.5], [292, 0, (t) => 1 - Math.pow(1 - t, 4)]]);
      const st = Math.max(0, (f - 286) / FPS);
      const swing = f < 272 ? 0 : (f < 286 ? -0.16 * sstep(272, 284, f) : -0.16 * Math.exp(-st * 2.2) * Math.cos(st * 7.5));
      R.hook.position.set(hx, BAG_TOP, 0); R.hook.rotation.set(0, 0, 0);
      R.bag2.group.position.set(hx, BAG_TOP, 0); R.bag2.group.rotation.set(0, 0, swing);
      setBagGeometry(R.bag2, f, (x, y) => { const ax = Math.min(1, Math.abs(x) / (W / 2)); const px = Math.sqrt(Math.max(0, 1 - ax ** 4)); const sb = Math.min(1, Math.max(0, (y + H) / 0.36)); return 0.07 * px * Math.sqrt(Math.max(0, 1 - (1 - sb) ** 2)) * (0.6 + 0.4 * sstep(-3, 0, y)); });
      R.bag2.veilMat.emissiveIntensity = 0.03; R.bag2.backVeil.emissiveIntensity = 0.03;

      // light: the floor slot breathes; brighter when the bag falls into it
      const breathe = 0.9 + 0.1 * Math.sin(f * 0.13);
      R.pitLight.intensity = (22 + 26 * sstep(268, 285, f) * (1 - 0.5 * sstep(288, 300, f))) * breathe;
      R.pool.material.opacity = 0.75 * breathe + 0.25 * sstep(268, 285, f);
      R.shaft.material.opacity = 0.5 * breathe;

      const cam = camState(f);
      const focusPt = new THREE.Vector3(f < 100 ? lerp(-2.2, -0.2, sstep(60, 100, f)) : 0, 2.7, 0.3);
      if (f < 30) focusPt.x = -0.3;
      else if (f < 60) focusPt.x = lerp(-0.3, -2.6, sstep(30, 55, f));
      const focus = new THREE.Vector3(...cam.position).distanceTo(focusPt);
      return {
        camera: cam,
        focus,
        keyIntensity: 1.0 + 0.06 * Math.sin(f * 0.05),
        rimIntensity: 3.2 + 1.2 * fill,
        keyPosition: [-6, 9, 7],
        rimPosition: [6, 5, -6],
      };
    }

    return { build, state };
  };
})();
