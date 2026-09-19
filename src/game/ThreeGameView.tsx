import React, { useEffect, useMemo, useRef } from 'react';
import { GLView } from 'expo-gl';
import { PanResponder, Platform, StyleSheet, View } from 'react-native';
import * as THREE from 'three';

import { CameraController } from './CameraController';
import { PlayerController } from './PlayerController';
import { PlayerState } from './PlayerTypes';
import { InputCommand, SwipeInput } from './SwipeInput';
import { ChunkManager } from './ChunkManager';

function createPlayer() {
  const player = new THREE.Group();
  const cloak = new THREE.Mesh(
    new THREE.ConeGeometry(0.7, 1.9, 8),
    new THREE.MeshStandardMaterial({ color: 0x30245e, emissive: 0x09051e, roughness: 0.82 }),
  );
  cloak.position.y = 1;
  player.add(cloak);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.43, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xd9f9ff, emissive: 0x4bd8ff, emissiveIntensity: 0.45 }),
  );
  head.position.y = 2.05;
  player.add(head);

  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x160c35 });
  for (const x of [-0.14, 0.14]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMaterial);
    eye.position.set(x, 2.08, -0.39);
    player.add(eye);
  }
  return player;
}

function createWorld(scene: THREE.Scene) {
  scene.background = new THREE.Color(0x08091a);
  scene.fog = new THREE.Fog(0x08091a, 32, 125);

  scene.add(new THREE.HemisphereLight(0x9db7ff, 0x110b22, 1.7));
  const moon = new THREE.DirectionalLight(0xb8d8ff, 2.2);
  moon.position.set(-8, 14, 8);
  scene.add(moon);
}

function applyCommand(controller: PlayerController, command: InputCommand) {
  if (command === 'LEFT') controller.moveLane(-1);
  if (command === 'RIGHT') controller.moveLane(1);
  if (command === 'JUMP') controller.jump();
  if (command === 'SLIDE') controller.slide();
}

export default function ThreeGameView() {
  const playerController = useMemo(() => new PlayerController(), []);
  const swipeInput = useMemo(() => new SwipeInput(), []);
  const animationRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const contextCreatedRef = useRef(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: swipeInput.onGrant.bind(swipeInput),
        onPanResponderMove: swipeInput.onMove.bind(swipeInput),
        onPanResponderRelease: (event) => {
          const command = swipeInput.onRelease(event);
          if (command) applyCommand(playerController, command);
        },
        onPanResponderTerminate: () => {},
      }),
    [playerController, swipeInput],
  );

  const onContextCreate = async (gl: any) => {
  if (contextCreatedRef.current) return;
  contextCreatedRef.current = true;

  console.log('========== GHOST COUPLE GL INFO ==========');
  console.log('GL VERSION:', gl.getParameter(gl.VERSION));
  console.log(
    'GL SHADING LANGUAGE:',
    gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
  );
  console.log(
    'GL RENDERER:',
    gl.getParameter(gl.RENDERER)
  );
  console.log(
    'GL VENDOR:',
    gl.getParameter(gl.VENDOR)
  );
    const scene = new THREE.Scene();
    createWorld(scene);
    const chunkManager = new ChunkManager(scene);

    const camera = new THREE.PerspectiveCamera(58, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 180);
    camera.position.set(0, 5.2, 8.5);
    const nativeCanvas = {
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    const renderer = new THREE.WebGLRenderer({
      ...(Platform.OS === 'web' ? {} : { canvas: nativeCanvas as unknown as HTMLCanvasElement }),
      context: gl,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
    renderer.setPixelRatio(1);

    const player = createPlayer();
    scene.add(player);
    const cameraController = new CameraController();
    const cameraAnchor = new THREE.Vector3();
    const clock = new THREE.Clock();
    let elapsed = 0;
    playerController.start();

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      elapsed += delta;
      playerController.update(delta);
      chunkManager.update(playerController.position.z);
      const snapshot = playerController.getSnapshot();

      cameraAnchor.set(playerController.position.x, playerController.position.y, playerController.position.z);
      player.position.copy(cameraAnchor);
      const isSliding = snapshot.state === PlayerState.SLIDE;
      player.scale.set(1, isSliding ? 0.58 : 1, 1);
      player.position.y += isSliding ? 0.58 : 0;
      player.position.y += snapshot.state === PlayerState.RUN ? Math.sin(elapsed * 12) * 0.045 : 0;
      player.rotation.y = Math.sin(elapsed * 2.4) * 0.025;
      cameraController.update(camera, cameraAnchor, delta);
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
    cleanupRef.current = () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      chunkManager.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
        else if (mesh.material) mesh.material.dispose();
      });
      contextCreatedRef.current = false;
    };
  };

  useEffect(() => () => {
    cleanupRef.current?.();
  }, []);

  return (
    <View style={styles.container}>
      <GLView style={styles.glView} onContextCreate={onContextCreate} />
      <View style={styles.touchSurface} {...panResponder.panHandlers} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08091a' },
  glView: { flex: 1 },
  touchSurface: { ...StyleSheet.absoluteFill, backgroundColor: 'transparent' },
});
