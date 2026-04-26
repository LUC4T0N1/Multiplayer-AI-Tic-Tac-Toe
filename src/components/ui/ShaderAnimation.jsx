import { useEffect, useRef } from "react";

function ShaderAnimation() {
  const containerRef = useRef(null);
  const stateRef = useRef({ animationId: null, renderer: null, resizeHandler: null, script: null });

  useEffect(() => {
    let mounted = true;

    const initThreeJS = () => {
      if (!mounted || !containerRef.current || !window.THREE) return;
      const THREE = window.THREE;
      const container = containerRef.current;
      container.innerHTML = "";

      const camera = new THREE.Camera();
      camera.position.z = 1;
      const scene = new THREE.Scene();
      const geometry = new THREE.PlaneBufferGeometry(2, 2);
      const uniforms = {
        time: { type: "f", value: 1.0 },
        resolution: { type: "v2", value: new THREE.Vector2() },
      };

      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
        fragmentShader: `
          precision highp float;
          uniform vec2 resolution;
          uniform float time;
          float rnd(in float x) { return fract(sin(x)*1e4); }
          float rnd(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233)))*43758.5453); }
          void main(void) {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
            uv.x = floor(uv.x * 64.0) / 64.0;
            uv.y = floor(uv.y * 128.0) / 128.0;
            float t = time * 0.06 + rnd(uv.x) * 0.4;
            float lw = 0.0008;
            vec3 color = vec3(0.0);
            for(int j = 0; j < 3; j++){
              for(int i = 0; i < 5; i++){
                color[j] += lw * float(i*i) / abs(fract(t - 0.01*float(j) + float(i)*0.01) - length(uv));
              }
            }
            gl_FragColor = vec4(color[2], color[1], color[0], 1.0);
          }
        `,
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      const renderer = new THREE.WebGLRenderer();
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);

      const onResize = () => {
        const rect = container.getBoundingClientRect();
        renderer.setSize(rect.width, rect.height);
        uniforms.resolution.value.x = renderer.domElement.width;
        uniforms.resolution.value.y = renderer.domElement.height;
      };
      onResize();
      window.addEventListener("resize", onResize);

      const animate = () => {
        stateRef.current.animationId = requestAnimationFrame(animate);
        uniforms.time.value += 0.05;
        renderer.render(scene, camera);
      };
      animate();

      stateRef.current.renderer = renderer;
      stateRef.current.resizeHandler = onResize;
    };

    if (window.THREE) {
      initThreeJS();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/89/three.min.js";
      script.onload = initThreeJS;
      document.head.appendChild(script);
      stateRef.current.script = script;
    }

    return () => {
      mounted = false;
      if (stateRef.current.animationId) cancelAnimationFrame(stateRef.current.animationId);
      if (stateRef.current.renderer) stateRef.current.renderer.dispose();
      if (stateRef.current.resizeHandler) window.removeEventListener("resize", stateRef.current.resizeHandler);
      if (stateRef.current.script && document.head.contains(stateRef.current.script)) {
        document.head.removeChild(stateRef.current.script);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
}

export default ShaderAnimation;
