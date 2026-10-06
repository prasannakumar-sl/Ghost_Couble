import { GLView } from "expo-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Image,
    PanResponder,
    Platform,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";
import * as THREE from "three";

import { cloneAlexHomeModel, loadAlexHomeGLTF } from "./AlexModelAssets";

interface AlexModelPreviewProps {
  interactive?: boolean;
  autoRotate?: boolean;
  showPedestal?: boolean;
  style?: StyleProp<ViewStyle>;
  onLoad?: () => void;
}

export default function AlexModelPreview({
  interactive = false,
  autoRotate = false,
  showPedestal = false,
  style,
  onLoad,
}: AlexModelPreviewProps) {
  const frameRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const contextCreatedRef = useRef(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const rotationYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastTouchXRef = useRef(0);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !!interactive,
        onMoveShouldSetPanResponder: (_, gesture) =>
          !!interactive && Math.abs(gesture.dx) > 3,
        onPanResponderGrant: (evt) => {
          isDraggingRef.current = true;
          lastTouchXRef.current = evt.nativeEvent.pageX;
        },
        onPanResponderMove: (evt) => {
          const currentX = evt.nativeEvent.pageX;
          const deltaX = currentX - lastTouchXRef.current;
          lastTouchXRef.current = currentX;
          rotationYRef.current += deltaX * 0.015;
        },
        onPanResponderRelease: () => {
          isDraggingRef.current = false;
        },
        onPanResponderTerminate: () => {
          isDraggingRef.current = false;
        },
      }),
    [interactive],
  );

  const onContextCreate = useCallback(
    async (gl: any) => {
      if (contextCreatedRef.current) return;
      contextCreatedRef.current = true;

      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 40);

      // Balanced lighting for rich character textures and highlights
      scene.add(new THREE.AmbientLight(0xffffff, 1.1));
      scene.add(new THREE.HemisphereLight(0x80e8ff, 0x1a0f30, 1.5));

      const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.2);
      keyLight.position.set(2.5, 4.5, 4);
      scene.add(keyLight);

      const cyanFillLight = new THREE.DirectionalLight(0x4deeea, 1.6);
      cyanFillLight.position.set(-3, 3, 3);
      scene.add(cyanFillLight);

      const warmRimLight = new THREE.DirectionalLight(0xffaa44, 1.4);
      warmRimLight.position.set(0, 3.5, -4);
      scene.add(warmRimLight);

      // Glowing pedestal disc at Alex's feet if requested
      if (showPedestal) {
        const discGeometry = new THREE.RingGeometry(0.01, 0.85, 48);
        discGeometry.rotateX(-Math.PI / 2);
        const discMaterial = new THREE.MeshBasicMaterial({
          color: 0x4deeea,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
        });
        const disc = new THREE.Mesh(discGeometry, discMaterial);
        disc.position.y = 0.01;
        scene.add(disc);

        const outerRingGeo = new THREE.RingGeometry(0.88, 0.94, 48);
        outerRingGeo.rotateX(-Math.PI / 2);
        const outerRingMat = new THREE.MeshBasicMaterial({
          color: 0xffd45c,
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide,
        });
        const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
        outerRing.position.y = 0.012;
        scene.add(outerRing);
      }

      const nativeCanvas = {
        width,
        height,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
      };

      const renderer = new THREE.WebGLRenderer({
        ...(Platform.OS === "web" && gl.canvas
          ? { canvas: gl.canvas }
          : typeof document !== "undefined"
            ? {}
            : { canvas: nativeCanvas as unknown as HTMLCanvasElement }),
        context: gl,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(
        Math.min(
          typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
          2,
        ),
      );
      renderer.setClearColor(0x000000, 0);

      const clock = new THREE.Clock();
      let model: THREE.Object3D | null = null;
      let renderedModel = false;
      let disposed = false;

      cleanupRef.current = () => {
        disposed = true;
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        renderer.dispose();
        contextCreatedRef.current = false;
      };

      try {
        const gltf = await loadAlexHomeGLTF();
        if (disposed) return;
        model = cloneAlexHomeModel(gltf, 2.45, true);
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const halfVerticalFov = THREE.MathUtils.degToRad(camera.fov) / 2;
        const halfHorizontalFov = Math.atan(
          Math.tan(halfVerticalFov) * camera.aspect,
        );
        const cameraDistance =
          Math.max(
            size.y / (2 * Math.tan(halfVerticalFov)),
            size.x / (2 * Math.tan(halfHorizontalFov)),
          ) * 1.18;
        camera.position.set(center.x, center.y, center.z + cameraDistance);
        camera.lookAt(center);
        scene.add(model);
      } catch (error) {
        console.error("[Alex Home preview] Unable to load GLB", error);
      }

      if (disposed) return;

      const animate = () => {
        frameRef.current = requestAnimationFrame(animate);
        const delta = clock.getDelta();

        if (autoRotate && !isDraggingRef.current) {
          rotationYRef.current += delta * 0.45;
        }

        if (model) {
          model.rotation.y = rotationYRef.current;
        }

        renderer.render(scene, camera);

        if (model && !renderedModel) {
          renderedModel = true;
          setModelLoaded(true);
          onLoad?.();
        }

        gl.endFrameEXP?.();
      };

      animate();
    },
    [autoRotate, onLoad, showPedestal],
  );

  useEffect(() => () => cleanupRef.current?.(), []);

  return (
    <View
      pointerEvents={interactive ? "auto" : "none"}
      style={[styles.container, style]}
      {...(interactive ? panResponder.panHandlers : {})}
    >
      <Image
        accessibilityLabel="Alex character preview"
        source={require("@/assets/images/characters/alex/Alex_Idle.png")}
        resizeMode="contain"
        style={[styles.fallback, modelLoaded && styles.fallbackHidden]}
      />
      <GLView
        style={[styles.glView, modelLoaded && styles.glViewVisible]}
        onContextCreate={onContextCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
  glView: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "transparent",
    opacity: 0,
  },
  glViewVisible: {
    opacity: 1,
  },
  fallback: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
  fallbackHidden: {
    opacity: 0,
  },
});
