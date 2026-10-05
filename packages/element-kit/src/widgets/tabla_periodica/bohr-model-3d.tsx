'use client';

import type { ElementCategory } from '@lumina/chemistry';
import { useEffect, useRef } from 'react';
import {
  AmbientLight,
  BufferGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineLoop,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import {
  capasOrbitales,
  faseElectron,
  posicionesNucleo,
  puntoEnOrbita,
  radioNucleo,
} from './bohr-geometry.js';
import styles from './tabla-periodica.module.css';

interface BohrModel3DProps {
  z: number;
  name: string;
  /** Número másico (protones + neutrones), p. ej. `round(masa atómica)`. */
  masaNumero: number;
  /** Hereda `--pt-fg` de la categoría (`[data-cat]` del módulo CSS). */
  categoria: ElementCategory;
  /** WebGL no disponible o la escena falló: el padre vuelve al modelo 2D. */
  onError: () => void;
}

const COLOR_PROTON = '#ef4444';
const COLOR_NEUTRON = '#94a3b8';
const PUNTOS_ORBITA = 96;

function liberar(objeto: Object3D): void {
  objeto.traverse((hijo) => {
    const malla = hijo as Mesh;
    malla.geometry?.dispose();
    const material = malla.material as Material | Material[] | undefined;
    if (Array.isArray(material)) material.forEach((m) => m.dispose());
    else material?.dispose();
  });
}

/**
 * Modelo atómico en 3D (three.js): núcleo de nucleones, una órbita inclinada
 * por capa y electrones en movimiento. Arrastrar rota; rueda/pellizco hace zoom
 * acotado. Se carga con `React.lazy` desde la ficha (DQ4: sin `three` en el
 * chunk inicial). Libera geometrías, materiales y el contexto WebGL al desmontar.
 */
export default function BohrModel3D({ z, name, masaNumero, categoria, onError }: BohrModel3DProps) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      onError();
      return;
    }

    let raf = 0;
    let observador: ResizeObserver | null = null;
    const scene = new Scene();
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    try {
      const colorCategoria =
        getComputedStyle(el).getPropertyValue('--pt-fg').trim() || '#334155';

      const capas = capasOrbitales(z, masaNumero);
      const radioMax = capas.length > 0 ? capas[capas.length - 1]!.radio : radioNucleo(masaNumero) + 1;

      const camara = new PerspectiveCamera(45, 1, 0.1, 100);
      camara.position.set(0, radioMax * 0.9, radioMax * 2.5);

      scene.add(new AmbientLight(0xffffff, 1.1));
      const luz = new DirectionalLight(0xffffff, 2.2);
      luz.position.set(4, 6, 5);
      scene.add(luz);

      // Núcleo: un solo InstancedMesh (hasta ~300 nucleones).
      const nucleones = posicionesNucleo(z, masaNumero);
      const radioNucleon = Math.max(0.05, ((radioNucleo(nucleones.length) * 0.8) / Math.cbrt(nucleones.length)) * 0.85);
      const nucleo = new InstancedMesh(
        new SphereGeometry(radioNucleon, 14, 10),
        new MeshStandardMaterial({ roughness: 0.45, metalness: 0.1 }),
        nucleones.length,
      );
      const auxiliar = new Object3D();
      nucleones.forEach(({ tipo, pos }, i) => {
        auxiliar.position.set(pos[0], pos[1], pos[2]);
        auxiliar.updateMatrix();
        nucleo.setMatrixAt(i, auxiliar.matrix);
        nucleo.setColorAt(i, new Color(tipo === 'p' ? COLOR_PROTON : COLOR_NEUTRON));
      });
      scene.add(nucleo);

      // Capas: anillo + electrones animados.
      const radioElectron = capas.some((c) => c.electrones > 18) ? 0.06 : 0.08;
      const animadas = capas.map((capa) => {
        const grupo = new Group();
        grupo.rotation.set(capa.inclinacionX, 0, capa.inclinacionZ);

        const puntos: number[] = [];
        for (let i = 0; i < PUNTOS_ORBITA; i++) {
          const [x, y, zz] = puntoEnOrbita(capa.radio, (2 * Math.PI * i) / PUNTOS_ORBITA);
          puntos.push(x, y, zz);
        }
        const geometria = new BufferGeometry();
        geometria.setAttribute('position', new Float32BufferAttribute(puntos, 3));
        grupo.add(
          new LineLoop(
            geometria,
            new LineBasicMaterial({ color: colorCategoria, transparent: true, opacity: 0.35 }),
          ),
        );

        const electrones = new InstancedMesh(
          new SphereGeometry(radioElectron, 12, 8),
          new MeshStandardMaterial({ color: colorCategoria, roughness: 0.35, metalness: 0.2 }),
          capa.electrones,
        );
        grupo.add(electrones);
        scene.add(grupo);
        return { capa, electrones };
      });

      const colocarElectrones = (t: number) => {
        for (const { capa, electrones } of animadas) {
          for (let k = 0; k < capa.electrones; k++) {
            const [x, y, zz] = puntoEnOrbita(
              capa.radio,
              faseElectron(k, capa.electrones) + capa.velocidad * t,
            );
            auxiliar.position.set(x, y, zz);
            auxiliar.updateMatrix();
            electrones.setMatrixAt(k, auxiliar.matrix);
          }
          electrones.instanceMatrix.needsUpdate = true;
        }
      };

      const controles = new OrbitControls(camara, renderer.domElement);
      controles.enablePan = false;
      controles.enableDamping = true;
      controles.minDistance = radioMax * 1.3;
      controles.maxDistance = radioMax * 4.5;
      controles.autoRotate = !reducido;
      controles.autoRotateSpeed = 0.9;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.setAttribute('aria-hidden', 'true');
      el.appendChild(renderer.domElement);

      const pintar = (t: number) => {
        colocarElectrones(t);
        controles.update();
        renderer.render(scene, camara);
      };

      const ajustar = () => {
        const lado = Math.max(120, Math.round(el.clientWidth));
        renderer.setSize(lado, lado);
        pintar(performance.now() / 1000);
      };
      ajustar();
      observador = new ResizeObserver(ajustar);
      observador.observe(el);

      if (reducido) {
        // Sin animación: solo se repinta al arrastrar o hacer zoom.
        controles.addEventListener('change', () => pintar(0));
      } else {
        const bucle = (ms: number) => {
          raf = requestAnimationFrame(bucle);
          pintar(ms / 1000);
        };
        raf = requestAnimationFrame(bucle);
      }

      return () => {
        cancelAnimationFrame(raf);
        observador?.disconnect();
        controles.dispose();
        liberar(scene);
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      };
    } catch {
      cancelAnimationFrame(raf);
      observador?.disconnect();
      liberar(scene);
      renderer.dispose();
      renderer.domElement.remove();
      onError();
      return;
    }
  }, [z, masaNumero, categoria, onError]);

  return (
    <div
      ref={host}
      data-cat={categoria}
      className={styles.ptBohr3d}
      role="img"
      aria-label={`Modelo atómico 3D de ${name}: ${z} electrones. Arrastra para rotar.`}
    />
  );
}
