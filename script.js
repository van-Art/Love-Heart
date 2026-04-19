import * as THREE from "https://cdn.skypack.dev/three@0.135.0";
import { gsap } from "https://cdn.skypack.dev/gsap@3.8.0";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.135.0/examples/jsm/loaders/GLTFLoader";

class World {
  constructor({
    canvas,
    width,
    height,
    cameraPosition,
    fieldOfView = 75,
    nearPlane = 0.1,
    farPlane = 100
  }) {
    this.parameters = {
      count: 1500,
      max: 12.5 * Math.PI,
      a: 2,
      c: 4.5
    };

    this.canvasOverscan = 48;

    this.textureLoader = new THREE.TextureLoader();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x16000a);
    this.clock = new THREE.Clock();
    this.data = 0;
    this.time = { current: 0, t0: 0, t1: 0, t: 0, frequency: 0.0005 };
    this.angle = { x: 0, z: 0 };
    this.width = width || window.innerWidth;
    this.height = height || window.innerHeight;
    this.aspectRatio = this.width / this.height;
    this.fieldOfView = fieldOfView;

    this.camera = new THREE.PerspectiveCamera(
      fieldOfView,
      this.aspectRatio,
      nearPlane,
      farPlane
    );

    this.camera.position.set(
      cameraPosition.x,
      cameraPosition.y,
      cameraPosition.z
    );

    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false
    });

    this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(
      this.width + this.canvasOverscan,
      this.height + this.canvasOverscan
    );

    this.renderer.domElement.style.border = "none";
    this.renderer.domElement.style.outline = "none";
    this.renderer.domElement.style.boxShadow = "none";
    this.renderer.domElement.style.display = "block";

    this.timer = 0;
    this.addToScene();
    this.addButton();

    this.render();
    this.listenToResize();
    this.listenToMouseMove();
  }

  start() {}

  render() {
    this.renderer.render(this.scene, this.camera);
    this.composer && this.composer.render();
  }

  loop() {
    this.time.elapsed = this.clock.getElapsedTime();
    this.time.delta = Math.min(
      60,
      (this.time.current - this.time.elapsed) * 1000
    );

    if (this.analyser && this.isRunning) {
      this.time.t = this.time.elapsed - this.time.t0 + this.time.t1;
      this.data = this.analyser.getAverageFrequency();
      this.data *= this.data / 2000;
      this.angle.x += this.time.delta * 0.001 * 0.63;
      this.angle.z += this.time.delta * 0.001 * 0.39;

      const justFinished = this.isRunning && !this.sound.isPlaying;

      if (justFinished) {
        this.time.t1 = this.time.t;
        this.audioBtn.disabled = false;
        this.isRunning = false;

        const tl = gsap.timeline();
        this.angle.x = 0;
        this.angle.z = 0;

        tl.to(this.camera.position, {
          x: 0,
          z: 4.5,
          duration: 4,
          ease: "expo.in"
        });

        tl.to(this.audioBtn, {
          opacity: 1,
          duration: 1,
          ease: "power1.out"
        });
      } else {
        this.camera.position.x = Math.sin(this.angle.x) * this.parameters.a;
        this.camera.position.z = Math.min(
          Math.max(Math.cos(this.angle.z) * this.parameters.c, 1.75),
          6.5
        );
      }
    }

    this.camera.lookAt(this.scene.position);

    if (this.heartMaterial) {
      this.heartMaterial.uniforms.uTime.value +=
        this.time.delta * this.time.frequency * (1 + this.data * 0.2);
    }

    if (this.model) {
      this.model.rotation.y -= 0.0005 * this.time.delta * (1 + this.data);
    }

    if (this.snowMaterial) {
      this.snowMaterial.uniforms.uTime.value +=
        this.time.delta * 0.0004 * (1 + this.data);
    }

    this.render();

    this.time.current = this.time.elapsed;
    requestAnimationFrame(this.loop.bind(this));
  }

  listenToResize() {
    window.addEventListener("resize", () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;

      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(
        this.width + this.canvasOverscan,
        this.height + this.canvasOverscan
      );
    });
  }
}