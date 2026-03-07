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

@Component({
  selector: 'app-tavern-scene',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="scene-container" #sceneContainer aria-hidden="true">
      @if (prefersReducedMotion()) {
        <div class="static-fallback">
          <div class="static-sigil"></div>
        </div>
      } @else {
        <canvas #canvas></canvas>
        @if (isLoading()) {
          <div class="loading-overlay">
            <div class="loading-sigil"></div>
            <p>Entering the realm...</p>
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
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #0a0a0f;
        color: #c9a84c;
        font-family: 'Cinzel', serif;
        font-size: 0.9rem;
        letter-spacing: 0.15em;
        z-index: 10;
      }

      .loading-sigil {
        width: 48px;
        height: 48px;
        border: 1px solid #c9a84c;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1.2s linear infinite;
        margin-bottom: 1rem;
        opacity: 0.7;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      .static-fallback {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background:
          radial-gradient(ellipse at center bottom, rgba(201, 168, 76, 0.06) 0%, transparent 60%),
          linear-gradient(180deg, #0a0a0f 0%, #050508 100%);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .static-sigil {
        width: 280px;
        height: 280px;
        border-radius: 50%;
        border: 1px solid rgba(201, 168, 76, 0.25);
        box-shadow:
          0 0 40px rgba(201, 168, 76, 0.08),
          inset 0 0 40px rgba(201, 168, 76, 0.04);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TavernSceneComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sceneContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  isLoading = signal(true);
  prefersReducedMotion = signal(false);

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private animationFrameId: number | null = null;
  private isRunning = false;

  // Scene objects
  private sigilMesh: THREE.Mesh | null = null;
  private sigilMaterial: THREE.ShaderMaterial | null = null;
  private pillarLights: THREE.PointLight[] = [];
  private debrisParticles: THREE.Points | null = null;
  private groundDisc: THREE.Mesh | null = null;

  // Camera parallax
  private mouseX = 0;
  private mouseY = 0;
  private baseY = 3;

  private resizeObserver: ResizeObserver | null = null;
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundVisibilityChange: (() => void) | null = null;

  // Sigil vertex shader — standard UV passthrough
  private readonly vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // Sigil fragment shader — concentric rings + 8 radial spokes + glow pulse
  private readonly fragmentShader = `
    uniform float u_time;
    varying vec2 vUv;

    const float PI = 3.14159265358979;
    const vec3 amber = vec3(0.788, 0.659, 0.298);
    const vec3 amberBright = vec3(0.906, 0.769, 0.392);

    void main() {
      vec2 uv = vUv - 0.5;
      float r = length(uv);
      float angle = atan(uv.y, uv.x);

      float alpha = 0.0;

      // Outer border ring
      float border = smoothstep(0.012, 0.0, abs(r - 0.47));
      alpha += border;

      // 3 concentric inner rings
      float ringPulse = sin(u_time * 0.4) * 0.008;
      alpha += smoothstep(0.008, 0.0, abs(r - (0.36 + ringPulse)));
      alpha += smoothstep(0.007, 0.0, abs(r - 0.24));
      alpha += smoothstep(0.006, 0.0, abs(r - 0.12));

      // 8 radial spokes
      float numSpokes = 8.0;
      float segAngle = 2.0 * PI / numSpokes;
      float normAngle = mod(angle + PI + u_time * 0.05, segAngle);
      float spokeDist = abs(normAngle - segAngle * 0.5);
      float spokeInner = smoothstep(0.0, 0.03, r);
      float spokeOuter = smoothstep(0.47, 0.44, r);
      float spoke = smoothstep(0.14, 0.0, spokeDist) * spokeInner * spokeOuter;
      alpha += spoke * 0.7;

      // Center glyph dot
      alpha += smoothstep(0.04, 0.0, r);

      alpha = clamp(alpha, 0.0, 1.0);
      if (alpha < 0.01) discard;

      // Glow pulse modulation
      float glow = 0.65 + 0.35 * sin(u_time * 1.2);
      vec3 color = mix(amber, amberBright, glow);

      gl_FragColor = vec4(color, alpha * 0.9);
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

    this.ngZone.runOutsideAngular(() => {
      this.initScene();
      this.createGround();
      this.createSigil();
      this.createPillars();
      this.createDebris();
      this.setupEventListeners();
      this.startAnimation();

      setTimeout(() => {
        this.ngZone.run(() => this.isLoading.set(false));
      }, 800);
    });
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private initScene(): void {
    const container = this.containerRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050508, 0.018);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
    this.camera.position.set(0, 3, 9);
    this.camera.lookAt(0, 1, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Ambient cold blue-black
    const ambient = new THREE.AmbientLight(0x05050f, 0.6);
    this.scene.add(ambient);
  }

  private createGround(): void {
    const geo = new THREE.CylinderGeometry(12, 12, 0.08, 64);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0e0e1a,
      roughness: 0.95,
      metalness: 0.05,
    });
    this.groundDisc = new THREE.Mesh(geo, mat);
    this.groundDisc.position.set(0, -1, 0);
    this.groundDisc.receiveShadow = true;
    this.scene.add(this.groundDisc);
  }

  private createSigil(): void {
    const geo = new THREE.PlaneGeometry(6, 6);
    this.sigilMaterial = new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      uniforms: { u_time: { value: 0 } },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.sigilMesh = new THREE.Mesh(geo, this.sigilMaterial);
    this.sigilMesh.rotation.x = -Math.PI / 2;
    this.sigilMesh.position.set(0, -0.94, 0);
    this.scene.add(this.sigilMesh);

    // Emissive glow beneath the sigil
    const glowGeo = new THREE.CylinderGeometry(3.2, 3.4, 0.02, 48);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xc9a84c,
      transparent: true,
      opacity: 0.04,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(0, -0.95, 0);
    this.scene.add(glow);
  }

  private createPillars(): void {
    const pillarPositions: Array<[number, number, number]> = [
      [-4, 0, -3],
      [0, 0, -5],
      [4, 0, -3],
    ];

    const pillarGeo = new THREE.CylinderGeometry(0.25, 0.3, 5, 8);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x12121e,
      roughness: 0.9,
      metalness: 0.1,
    });

    pillarPositions.forEach(([x, , z]) => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(x, 1.5, z);
      pillar.castShadow = true;
      this.scene.add(pillar);

      // Amber point light at pillar base
      const light = new THREE.PointLight(0xc9a84c, 2, 8);
      light.position.set(x, -0.3, z);
      this.scene.add(light);
      this.pillarLights.push(light);

      // Small amber ember on pillar top
      const capGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const capMat = new THREE.MeshBasicMaterial({
        color: 0xe8c46a,
        transparent: true,
        opacity: 0.8,
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(x, 4.05, z);
      this.scene.add(cap);
    });
  }

  private createDebris(): void {
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 150 : 400;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const amberColor = new THREE.Color(0xc9a84c);
    const iceColor = new THREE.Color(0x4a9eff);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * 7;
      const height = (Math.random() - 0.3) * 6;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Mix amber and ice particles
      const t = Math.random();
      const c = t > 0.7 ? iceColor : amberColor;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 0.012 + Math.random() * 0.018;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.015,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      sizeAttenuation: true,
    });

    this.debrisParticles = new THREE.Points(geo, mat);
    this.scene.add(this.debrisParticles);
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

    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (this.camera && this.renderer && width > 0 && height > 0) {
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(width, height);
        }
      }
    });
    this.resizeObserver.observe(this.containerRef.nativeElement);
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

    const time = performance.now() * 0.001;

    // Update sigil shader time uniform
    if (this.sigilMaterial) {
      this.sigilMaterial.uniforms['u_time'].value = time;
    }

    // Rotate sigil slowly
    if (this.sigilMesh) {
      this.sigilMesh.rotation.z += 0.002;
    }

    // Pillar light flicker — subtle amber pulse
    this.pillarLights.forEach((light, i) => {
      light.intensity = 2 + 0.4 * Math.sin(time * 2.5 + i * 1.1);
    });

    // Orbit debris particles
    if (this.debrisParticles) {
      this.debrisParticles.rotation.y += 0.0003;
    }

    // Camera auto-rotate Y
    const autoRotateX = Math.sin(time * 0.05) * 0.4;

    // Mouse parallax
    const targetX = autoRotateX + this.mouseX * 0.8;
    const targetY = this.baseY + this.mouseY * 0.3;

    this.camera.position.x += (targetX - this.camera.position.x) * 0.015;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.015;
    this.camera.lookAt(0, 1, 0);

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

    this.sigilMaterial?.dispose();

    if (this.debrisParticles) {
      this.debrisParticles.geometry.dispose();
      (this.debrisParticles.material as THREE.Material).dispose();
    }

    this.scene?.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        (obj.geometry as THREE.BufferGeometry).dispose();
        if (Array.isArray(obj.material)) {
          (obj.material as THREE.Material[]).forEach((m: THREE.Material) => {
            m.dispose();
          });
        } else {
          (obj.material as THREE.Material).dispose();
        }
      }
    });

    this.renderer?.dispose();
  }
}
