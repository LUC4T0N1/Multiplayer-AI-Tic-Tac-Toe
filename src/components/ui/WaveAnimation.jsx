import { useEffect, useRef } from "react";
import * as THREE from "three";

function WaveAnimation({
  width,
  height,
  pointSize = 1.5,
  waveSpeed = 1.5,
  waveIntensity = 12.0,
  particleColor = "#ffffff",
  gridDistance = 5,
  style,
}) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const container = canvasRef.current;
    const w = width || window.innerWidth;
    const h = height || window.innerHeight;
    const dpr = window.devicePixelRatio;

    const fov = 60;
    const fovRad = (fov / 2) * (Math.PI / 180);
    const dist = h / 2 / Math.tan(fovRad);
    const clock = new THREE.Clock();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(dpr);
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(fov, w / h, 1, dist * 2);
    camera.position.set(0, 0, 10);

    const scene = new THREE.Scene();

    const geo = new THREE.BufferGeometry();
    const positions = [];
    const gridWidth = 400 * (w / h);
    const depth = 400;

    for (let x = 0; x < gridWidth; x += gridDistance) {
      for (let z = 0; z < depth; z += gridDistance) {
        positions.push(-gridWidth / 2 + x, -30, -depth / 2 + z);
      }
    }

    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0.0 },
        u_point_size: { value: pointSize },
        u_color: { value: new THREE.Color(particleColor) },
      },
      vertexShader: `
        #define M_PI 3.1415926535897932384626433832795
        precision mediump float;
        uniform float u_time;
        uniform float u_point_size;
        void main() {
          vec3 p = position;
          p.y += (
            cos(p.x / M_PI * ${waveIntensity.toFixed(1)} + u_time * ${waveSpeed.toFixed(1)}) +
            sin(p.z / M_PI * ${waveIntensity.toFixed(1)} + u_time * ${waveSpeed.toFixed(1)})
          );
          gl_PointSize = u_point_size;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform vec3 u_color;
        void main() {
          gl_FragColor = vec4(u_color, 1.0);
        }
      `,
      transparent: true,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    function render() {
      mat.uniforms.u_time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(render);
    }

    render();

    const handleResize = () => {
      if (!width && !height) {
        const newW = window.innerWidth;
        const newH = window.innerHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      geo.dispose();
      mat.dispose();
    };
  }, [width, height, pointSize, waveSpeed, waveIntensity, particleColor, gridDistance]);

  return (
    <div
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}

export default WaveAnimation;
