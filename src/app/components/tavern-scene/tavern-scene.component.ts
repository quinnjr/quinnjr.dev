import { isPlatformBrowser, CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  AfterViewInit,
  ViewChild,
  NgZone,
  PLATFORM_ID,
  inject,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import * as THREE from 'three';

/**
 * Hearthside tavern interior.
 *
 * The camera sits at a table inside a dim tavern, looking toward a stone
 * fireplace on the back wall. A shader-driven fire is the focal glow and the
 * scene's key light (a warm point light whose intensity flickers with the
 * flames). Low wooden beams cross overhead, iron lanterns hang and breathe
 * amber, and embers drift up from the hearth. A single cold ice-blue shaft
 * leaks in from a window off-frame so the warm light has something to push
 * against. Everything else in the page stays quiet around this.
 */
@Component({
  selector: 'app-tavern-scene',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="scene-container" #sceneContainer aria-hidden="true">
      @if (prefersReducedMotion()) {
        <div class="static-fallback"></div>
      } @else {
        <canvas #canvas></canvas>
        @if (isLoading()) {
          <div class="loading-overlay">
            <div class="loading-ember"></div>
            <p>Stoking the hearth…</p>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .scene-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        z-index: 0;
      }

      canvas {
        display: block;
        width: 100%;
        height: 100%;
      }

      .loading-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: radial-gradient(ellipse at 50% 60%, #1a0f08 0%, #0a0a0f 70%);
        color: #e8c46a;
        font-family: 'Cinzel', serif;
        font-size: 0.9rem;
        letter-spacing: 0.15em;
        z-index: 10;
      }

      .loading-ember {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: radial-gradient(circle, #ffd27f 0%, #ff6b35 55%, transparent 75%);
        box-shadow: 0 0 24px rgba(255, 107, 53, 0.8);
        animation: ember-pulse 1.4s ease-in-out infinite;
        margin-bottom: 1rem;
      }

      @keyframes ember-pulse {
        0%,
        100% {
          transform: scale(0.8);
          opacity: 0.7;
        }
        50% {
          transform: scale(1.25);
          opacity: 1;
        }
      }

      /* Reduced-motion: a still, warm hearth glow on the back wall. */
      .static-fallback {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(46% 52% at 50% 70%, rgba(255, 107, 53, 0.32) 0%, transparent 70%),
          radial-gradient(70% 80% at 50% 80%, rgba(201, 120, 50, 0.16) 0%, transparent 70%),
          radial-gradient(80% 60% at 18% 10%, rgba(74, 158, 255, 0.05) 0%, transparent 60%),
          linear-gradient(180deg, #0a0a0f 0%, #060507 100%);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TavernSceneComponent implements OnInit, AfterViewInit, OnDestroy {
  // static: false — both refs live inside the @if/@else control-flow block, so
  // they only resolve after the first change detection (i.e. by ngAfterViewInit).
  @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('sceneContainer') containerRef?: ElementRef<HTMLDivElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  isLoading = signal(true);
  prefersReducedMotion = signal(false);

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private animationFrameId: number | null = null;
  private isRunning = false;

  // Scene objects we animate every frame.
  private fireMaterial: THREE.ShaderMaterial | null = null;
  private hearthLight: THREE.PointLight | null = null;
  private hearthGlow: THREE.Mesh | null = null;
  private lanternLights: THREE.PointLight[] = [];
  private embers: THREE.Points | null = null;
  private emberVelocities: Float32Array | null = null;
  private emberCount = 0;
  private dust: THREE.Points | null = null;

  // Camera parallax.
  private mouseX = 0;
  private mouseY = 0;

  private resizeObserver: ResizeObserver | null = null;
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundVisibilityChange: (() => void) | null = null;

  // ── Fire shader ──────────────────────────────────────────────────────────
  // Domain-warped value-noise flames: white-gold at the base licking up into
  // orange then deep red, narrowing and dissolving toward the top.
  private readonly fireVertex = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  private readonly fireFragment = `
    precision highp float;
    uniform float u_time;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.55;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.03;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = vUv;
      float x = uv.x - 0.5;

      // Upward-scrolling, domain-warped noise field.
      vec2 q = vec2(uv.x * 2.6, uv.y * 2.2 - u_time * 1.5);
      float warp = fbm(q + u_time * 0.15);
      float n = fbm(q + warp);

      // Flame envelope: rises from the base, narrows with height.
      float base = smoothstep(0.0, 0.16, uv.y);
      float top = 1.0 - smoothstep(0.5, 1.0, uv.y);
      float width = mix(0.40, 0.06, uv.y);
      float horiz = smoothstep(width, 0.0, abs(x));
      float flame = horiz * base * top;

      float d = flame * (0.55 + n * 0.9);
      float intensity = smoothstep(0.20, 0.62, d);
      if (intensity < 0.02) discard;

      // Heat ramp by height: white-gold core -> orange -> ember red.
      vec3 col = mix(vec3(1.0, 0.88, 0.5), vec3(1.0, 0.46, 0.10), smoothstep(0.0, 0.45, uv.y));
      col = mix(col, vec3(0.70, 0.13, 0.03), smoothstep(0.42, 0.95, uv.y));
      col += vec3(0.45, 0.30, 0.12) * smoothstep(0.55, 1.0, intensity);

      gl_FragColor = vec4(col, intensity * 0.95);
    }
  `;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion.set(mq.matches);

    mq.addEventListener('change', event => {
      this.ngZone.run(() => {
        this.prefersReducedMotion.set(event.matches);
        if (event.matches) {
          this.cleanup();
        }
      });
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.prefersReducedMotion()) {
      this.isLoading.set(false);
      return;
    }

    // Refs live inside @if/@else; bail gracefully if they didn't resolve.
    if (!this.canvasRef || !this.containerRef) {
      this.isLoading.set(false);
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.initScene();
      this.createRoom();
      this.createHearth();
      this.createBeams();
      this.createLanterns();
      this.createFurniture();
      this.createEmbers();
      this.createDust();
      this.setupEventListeners();
      this.startAnimation();

      setTimeout(() => {
        this.ngZone.run(() => this.isLoading.set(false));
      }, 700);
    });
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private initScene(): void {
    if (!this.containerRef || !this.canvasRef) {
      return;
    }
    const container = this.containerRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    // Warm-black haze for depth toward the back wall.
    this.scene.fog = new THREE.FogExp2(0x0a0706, 0.058);

    this.camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 100);
    // Seated at a table, looking across the room to the hearth on the back wall.
    this.camera.position.set(0, 1.65, 6.2);
    this.camera.lookAt(0, 1.4, -6);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Very low cold ambient — the hearth does almost all the lighting.
    this.scene.add(new THREE.AmbientLight(0x0a0c18, 0.55));

    // A single cold shaft from an off-frame window, upper-left, for contrast.
    const moon = new THREE.DirectionalLight(0x4a9eff, 0.35);
    moon.position.set(-7, 6, 3);
    this.scene.add(moon);
  }

  /** Wooden plank floor, dark plaster/stone walls, suggested ceiling. */
  private createRoom(): void {
    if (!this.scene) {
      return;
    }

    const woodFloor = new THREE.MeshStandardMaterial({
      color: 0x2a1a10,
      roughness: 0.92,
      metalness: 0.04,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), woodFloor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.scene.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1a140f,
      roughness: 0.98,
      metalness: 0.02,
    });

    // Back wall (behind the hearth).
    const back = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), wallMat);
    back.position.set(0, 8, -8);
    this.scene.add(back);

    // Side walls angled in for a cozier, enclosed feel.
    const left = new THREE.Mesh(new THREE.PlaneGeometry(28, 16), wallMat);
    left.position.set(-9, 8, 3);
    left.rotation.y = Math.PI / 2;
    this.scene.add(left);

    const right = new THREE.Mesh(new THREE.PlaneGeometry(28, 16), wallMat);
    right.position.set(9, 8, 3);
    right.rotation.y = -Math.PI / 2;
    this.scene.add(right);

    // Faint cold window glow on the left wall (the source of the moon shaft).
    const windowGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 3.4),
      new THREE.MeshBasicMaterial({ color: 0x2c5a99, transparent: true, opacity: 0.28 })
    );
    windowGlow.position.set(-8.92, 5.2, -1.5);
    windowGlow.rotation.y = Math.PI / 2;
    this.scene.add(windowGlow);
  }

  /** Stone fireplace masonry + the shader fire + an emissive backing glow. */
  private createHearth(): void {
    if (!this.scene) {
      return;
    }

    const stone = new THREE.MeshStandardMaterial({
      color: 0x2b2622,
      roughness: 0.95,
      metalness: 0.03,
    });
    const zBack = -7.8;

    // Hearth base / raised stone platform.
    const baseSlab = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.5, 1.4), stone);
    baseSlab.position.set(0, 0.25, zBack + 0.7);
    this.scene.add(baseSlab);

    // Side jambs framing the firebox.
    const jambGeo = new THREE.BoxGeometry(0.9, 3.4, 1.2);
    const leftJamb = new THREE.Mesh(jambGeo, stone);
    leftJamb.position.set(-1.85, 1.7, zBack + 0.6);
    this.scene.add(leftJamb);
    const rightJamb = new THREE.Mesh(jambGeo, stone);
    rightJamb.position.set(1.85, 1.7, zBack + 0.6);
    this.scene.add(rightJamb);

    // Dark firebox recess behind the flames.
    const recess = new THREE.Mesh(
      new THREE.BoxGeometry(2.9, 3.0, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x0a0604, roughness: 1.0 })
    );
    recess.position.set(0, 1.7, zBack + 0.2);
    this.scene.add(recess);

    // Mantel beam (wood) across the top.
    const mantel = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 0.55, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.85 })
    );
    mantel.position.set(0, 3.55, zBack + 0.75);
    this.scene.add(mantel);

    // Chimney breast above the mantel.
    const breast = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4.0, 1.0), stone);
    breast.position.set(0, 5.8, zBack + 0.5);
    this.scene.add(breast);

    // Emissive backing glow so the recess reads as lit even behind the flames,
    // and so warm light bleeds wide enough to be seen around (and through) the
    // translucent hero panel that sits in front of it.
    this.hearthGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(5.0, 5.0),
      new THREE.MeshBasicMaterial({ color: 0xff7a33, transparent: true, opacity: 0.5 })
    );
    this.hearthGlow.position.set(0, 1.9, zBack + 0.46);
    this.scene.add(this.hearthGlow);

    // Two crossed flame planes so the fire holds up from off-axis angles. Tall
    // enough that the tips clear the hero card on most viewports.
    this.fireMaterial = new THREE.ShaderMaterial({
      vertexShader: this.fireVertex,
      fragmentShader: this.fireFragment,
      uniforms: { u_time: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    const flameGeo = new THREE.PlaneGeometry(3.0, 4.4);
    const flameA = new THREE.Mesh(flameGeo, this.fireMaterial);
    flameA.position.set(0, 2.1, zBack + 0.55);
    this.scene.add(flameA);
    const flameB = new THREE.Mesh(flameGeo, this.fireMaterial);
    flameB.position.set(0, 2.1, zBack + 0.55);
    flameB.rotation.y = Math.PI / 2.2;
    this.scene.add(flameB);

    // Glowing log embers at the base of the fire.
    const logMat = new THREE.MeshBasicMaterial({ color: 0xff5a1e });
    for (let i = -1; i <= 1; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.6, 6), logMat);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = i * 0.5;
      log.position.set(i * 0.3, 0.65, zBack + 0.55);
      this.scene.add(log);
    }

    // The hearth fire IS the key light. Warm, bright, and it flickers in animate().
    this.hearthLight = new THREE.PointLight(0xff7a30, 9.0, 36, 1.6);
    this.hearthLight.position.set(0, 1.9, zBack + 1.3);
    this.scene.add(this.hearthLight);

    // A soft warm fill spilling onto the floor and tables in front of the hearth.
    const floorFill = new THREE.PointLight(0xff8a40, 3.4, 18, 2);
    floorFill.position.set(0, 0.7, zBack + 4.0);
    this.scene.add(floorFill);
  }

  /** Low wooden ceiling beams crossing overhead. */
  private createBeams(): void {
    if (!this.scene) {
      return;
    }
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x241710, roughness: 0.9 });
    for (let i = 0; i < 4; i++) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(20, 0.45, 0.5), beamMat);
      beam.position.set(0, 5.6, -6 + i * 3.4);
      this.scene.add(beam);
    }
  }

  /** Hanging iron lanterns with a small emissive flame and a breathing light. */
  private createLanterns(): void {
    if (!this.scene) {
      return;
    }

    const positions: Array<[number, number, number]> = [
      [-4.2, 4.2, -1.5],
      [4.2, 4.2, -1.5],
      [0, 4.6, 1.8],
    ];

    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x14110d,
      roughness: 0.6,
      metalness: 0.5,
    });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffc874 });

    positions.forEach(([x, y, z]) => {
      // Hang cord.
      const cord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 1.4, 4),
        new THREE.MeshBasicMaterial({ color: 0x0a0805 })
      );
      cord.position.set(x, y + 0.9, z);
      this.scene?.add(cord);

      // Lantern cage.
      const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.5, 6), ironMat);
      cage.position.set(x, y, z);
      this.scene?.add(cage);

      // Inner flame bead.
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), flameMat);
      flame.position.set(x, y, z);
      this.scene?.add(flame);

      // Each lantern casts a small amber pool.
      const light = new THREE.PointLight(0xe8a850, 1.3, 6, 2);
      light.position.set(x, y, z);
      this.scene?.add(light);
      this.lanternLights.push(light);
    });
  }

  /** A heavy table in the mid-ground and a couple of stools. */
  private createFurniture(): void {
    if (!this.scene) {
      return;
    }
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x35200f, roughness: 0.85 });

    const buildTable = (cx: number, cz: number, w: number): void => {
      const topY = 1.0;
      const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, w * 0.55), woodMat);
      top.position.set(cx, topY, cz);
      this.scene?.add(top);
      const legGeo = new THREE.BoxGeometry(0.16, topY, 0.16);
      const dx = w / 2 - 0.2;
      const dz = (w * 0.55) / 2 - 0.2;
      for (const sx of [-dx, dx]) {
        for (const sz of [-dz, dz]) {
          const leg = new THREE.Mesh(legGeo, woodMat);
          leg.position.set(cx + sx, topY / 2, cz + sz);
          this.scene?.add(leg);
        }
      }
    };

    const buildStool = (cx: number, cz: number): void => {
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.32, 0.12, 10), woodMat);
      seat.position.set(cx, 0.62, cz);
      this.scene?.add(seat);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.62, 6), woodMat);
      post.position.set(cx, 0.31, cz);
      this.scene?.add(post);
    };

    // Foreground table just below the camera, framing the view.
    buildTable(-2.6, 3.6, 2.4);
    buildStool(-2.6, 4.6);
    // A smaller table to the right, deeper in.
    buildTable(3.4, 1.0, 1.8);
  }

  /** Embers rising from the hearth on a slow updraft. */
  private createEmbers(): void {
    if (!this.scene) {
      return;
    }
    const isMobile = window.innerWidth < 768;
    this.emberCount = isMobile ? 60 : 170;

    const positions = new Float32Array(this.emberCount * 3);
    const colors = new Float32Array(this.emberCount * 3);
    this.emberVelocities = new Float32Array(this.emberCount * 3);

    const hot = new THREE.Color(0xffb24d);
    const cool = new THREE.Color(0xe2541f);

    for (let i = 0; i < this.emberCount; i++) {
      this.seedEmber(positions, i);
      const c = hot.clone().lerp(cool, Math.random());
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      this.emberVelocities[i * 3] = (Math.random() - 0.5) * 0.006;
      this.emberVelocities[i * 3 + 1] = 0.014 + Math.random() * 0.024;
      this.emberVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.embers = new THREE.Points(geo, mat);
    this.scene.add(this.embers);
  }

  /** Reset one ember to a random spot just above the logs. */
  private seedEmber(positions: Float32Array, i: number): void {
    positions[i * 3] = (Math.random() - 0.5) * 2.8;
    positions[i * 3 + 1] = 0.7 + Math.random() * 0.6;
    positions[i * 3 + 2] = -7.2 + (Math.random() - 0.5) * 0.7;
  }

  /** Faint ambient dust drifting through the lantern light. */
  private createDust(): void {
    if (!this.scene) {
      return;
    }
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 80 : 220;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 6;
      positions[i * 3 + 2] = -7 + Math.random() * 13;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xc9a86a,
      size: 0.02,
      transparent: true,
      opacity: 0.28,
      sizeAttenuation: true,
      depthWrite: false,
    });

    this.dust = new THREE.Points(geo, mat);
    this.scene.add(this.dust);
  }

  private setupEventListeners(): void {
    this.boundMouseMove = (e: MouseEvent) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', this.boundMouseMove);

    this.boundVisibilityChange = () => {
      if (document.hidden) {
        this.pauseAnimation();
      } else {
        this.startAnimation();
      }
    };
    document.addEventListener('visibilitychange', this.boundVisibilityChange);

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (this.camera && this.renderer && width > 0 && height > 0) {
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(width, height);
        }
      }
    });
    this.resizeObserver = observer;
    const container = this.containerRef;
    if (container) {
      observer.observe(container.nativeElement);
    }
  }

  private startAnimation(): void {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.animate();
  }

  private pauseAnimation(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private animate = (): void => {
    if (!this.isRunning) {
      return;
    }
    this.animationFrameId = requestAnimationFrame(this.animate);

    if (!this.camera || !this.renderer || !this.scene) {
      return;
    }

    const time = performance.now() * 0.001;

    if (this.fireMaterial) {
      this.fireMaterial.uniforms['u_time'].value = time;
    }

    // Hearth flicker — layered sines + noise for an organic, restless fire.
    if (this.hearthLight) {
      const flicker =
        8.5 +
        Math.sin(time * 11.0) * 0.7 +
        Math.sin(time * 23.0) * 0.4 +
        Math.sin(time * 3.0) * 0.8;
      this.hearthLight.intensity = flicker;
    }
    if (this.hearthGlow) {
      const m = this.hearthGlow.material as THREE.MeshBasicMaterial;
      m.opacity = 0.46 + Math.sin(time * 9.0) * 0.08;
    }

    // Lanterns breathe gently, each on its own phase.
    this.lanternLights.forEach((light, i) => {
      light.intensity = 1.2 + Math.sin(time * 2.2 + i * 1.7) * 0.25;
    });

    // Embers rise, wobble, and recycle once past the mantel.
    if (this.embers && this.emberVelocities) {
      const pos = this.embers.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < this.emberCount; i++) {
        arr[i * 3] += this.emberVelocities[i * 3] + Math.sin(time * 2 + i) * 0.0015;
        arr[i * 3 + 1] += this.emberVelocities[i * 3 + 1];
        arr[i * 3 + 2] += this.emberVelocities[i * 3 + 2];
        if (arr[i * 3 + 1] > 5.6) {
          this.seedEmber(arr, i);
        }
      }
      pos.needsUpdate = true;
    }

    // Dust drifts slowly sideways.
    if (this.dust) {
      this.dust.rotation.y += 0.0002;
    }

    // Subtle parallax + a slow seated sway, easing toward the target.
    const targetX = this.mouseX * 0.5 + Math.sin(time * 0.18) * 0.18;
    const targetY = 1.65 + this.mouseY * 0.18;
    this.camera.position.x += (targetX - this.camera.position.x) * 0.02;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.02;
    this.camera.lookAt(0, 1.4, -6);

    this.renderer.render(this.scene, this.camera);
  };

  private cleanup(): void {
    this.pauseAnimation();

    if (this.boundMouseMove) {
      window.removeEventListener('mousemove', this.boundMouseMove);
      this.boundMouseMove = null;
    }

    if (this.boundVisibilityChange) {
      document.removeEventListener('visibilitychange', this.boundVisibilityChange);
      this.boundVisibilityChange = null;
    }

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    this.fireMaterial?.dispose();

    this.scene?.traverse(obj => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        (obj.geometry as THREE.BufferGeometry).dispose();
        const material = obj.material as THREE.Material | THREE.Material[];
        if (Array.isArray(material)) {
          material.forEach(m => {
            m.dispose();
          });
        } else {
          material.dispose();
        }
      }
    });

    this.lanternLights = [];
    this.embers = null;
    this.emberVelocities = null;
    this.dust = null;
    this.renderer?.dispose();
  }
}
