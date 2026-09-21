import React, { useEffect, useMemo, useRef } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { GLView } from 'expo-gl';
import { PanResponder, Platform, StyleSheet, View } from 'react-native';
import * as THREE from 'three';

import { CameraController } from './CameraController';
import { PlayerController } from './PlayerController';
import { PlayerState } from './PlayerTypes';
import { InputCommand, SwipeInput } from './SwipeInput';
import { ChunkManager } from './ChunkManager';
import { CollisionSystem } from './CollisionSystem';
import { ObstacleManager } from './ObstacleManager';
import { CoinManager } from './collectibles/CoinManager';
import { GameRuntime, GameState } from './GameRuntime';
import { ShieldManager } from './powerups/ShieldManager';
import { GAME_CONFIG } from './config/gameConfig';
import { GameSnapshot } from './GameSnapshot';
import { createGhost, updateGhostVisual } from './ghost/Ghost';
import { GhostAudio } from './ghost/GhostAudio';
import { GhostController } from './ghost/GhostController';
import { GhostState } from './ghost/GhostState';

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

interface ThreeGameViewProps {
  restartToken: number;
  previousBestDistance: number;
  bestStatsLoaded: boolean;
  onSnapshot: (snapshot: GameSnapshot) => void;
  onCoinsCollected: (amount: number) => void;
}

const ambientAudio = require('../../assets/audio/ghost_ambient.wav');
const chaseAudio = require('../../assets/audio/ghost_chase.wav');
const attackAudio = require('../../assets/audio/ghost_attack.wav');

export default function ThreeGameView({
  restartToken,
  previousBestDistance,
  bestStatsLoaded,
  onSnapshot,
  onCoinsCollected,
}: ThreeGameViewProps) {
  const playerController = useMemo(() => new PlayerController(), []);
  const swipeInput = useMemo(() => new SwipeInput(), []);
  const ambientPlayer = useAudioPlayer(ambientAudio);
  const chasePlayer = useAudioPlayer(chaseAudio);
  const attackPlayer = useAudioPlayer(attackAudio);
  const ghostAudio = useMemo(
    () => new GhostAudio(ambientPlayer, chasePlayer, attackPlayer),
    [ambientPlayer, attackPlayer, chasePlayer],
  );
  const animationRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const contextCreatedRef = useRef(false);
  const restartTokenRef = useRef(restartToken);
  const previousBestDistanceRef = useRef(previousBestDistance);
  const bestStatsLoadedRef = useRef(bestStatsLoaded);
  const onSnapshotRef = useRef(onSnapshot);
  const onCoinsCollectedRef = useRef(onCoinsCollected);

  useEffect(() => {
    restartTokenRef.current = restartToken;
    previousBestDistanceRef.current = previousBestDistance;
    bestStatsLoadedRef.current = bestStatsLoaded;
    onSnapshotRef.current = onSnapshot;
    onCoinsCollectedRef.current = onCoinsCollected;
  }, [bestStatsLoaded, onCoinsCollected, onSnapshot, previousBestDistance, restartToken]);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'doNotMix' });
    return () => ghostAudio.dispose();
  }, [ghostAudio]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          ghostAudio.startAmbient();
          swipeInput.onGrant(event);
        },
        onPanResponderMove: swipeInput.onMove.bind(swipeInput),
        onPanResponderRelease: (event) => {
          const command = swipeInput.onRelease(event);
          if (command) applyCommand(playerController, command);
        },
        onPanResponderTerminate: () => {},
      }),
    [ghostAudio, playerController, swipeInput],
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
    const obstacleManager = new ObstacleManager(chunkManager);
    const collisionSystem = new CollisionSystem();
    const runtime = new GameRuntime();
    const ghostController = new GhostController();
    const coinManager = new CoinManager(chunkManager, runtime);
    const shieldManager = new ShieldManager(chunkManager);
    obstacleManager.update();
    coinManager.update(0, 0);
    shieldManager.update(0, 0, playerController.position.z, 0, GameState.RUNNING);

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
    const ghost = createGhost();
    const shieldAura = new THREE.Mesh(
      new THREE.SphereGeometry(1.65, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x48e7ff, transparent: true, opacity: 0.16, wireframe: true }),
    );
    shieldAura.visible = false;
    scene.add(player);
    scene.add(ghost);
    scene.add(shieldAura);
    ghostController.reset(playerController.position);
    const cameraController = new CameraController();
    const cameraAnchor = new THREE.Vector3();
    const clock = new THREE.Clock();
    let elapsed = 0;
    let hudElapsed = 0;
    let handledRestartToken = restartTokenRef.current;
    let cameraShakeRemaining = 0;
    let deathSequenceStarted = false;
    let deathEffectActive = false;
    let deathEffectElapsed = 0;
    let gameOverDelayRemaining = 0;
    let shieldBreakRemaining = 0;

    let hasBeatenPreviousBest = false;
    playerController.start();
    ghostAudio.startAmbient();

    const createSnapshot = (): GameSnapshot => {
      const ghostSnapshot = ghostController.getSnapshot(playerController.position.z);
      return {
        ...runtime.getSnapshot(),
        ghostState: ghostSnapshot.state,
        ghostChaseRemaining: ghostSnapshot.chaseRemaining,
        ghostDistanceBehind: ghostSnapshot.distanceBehind,
      };
    };

    const handleGhostEvent = (event: 'CHASE_STARTED' | 'CHASE_ENDED' | 'ATTACK_STARTED' | 'ATTACK_FINISHED' | null) => {
      if (event === 'CHASE_STARTED') ghostAudio.startChase();
      if (event === 'CHASE_ENDED') {
        ghostAudio.endChase();
        ghostAudio.startAmbient();
      }
      if (event === 'ATTACK_STARTED') {

        cameraShakeRemaining = 0.35;
        ghostAudio.playAttack();
      }
      if (event === 'ATTACK_FINISHED') {
        deathEffectActive = true;
        deathEffectElapsed = 0;
        gameOverDelayRemaining = 0.75;
        playerController.die();
        cameraShakeRemaining = 0.35;
        console.log('[GHOST] Player caught');
        console.log('[PLAYER] Death completed');
      }
      if (event) onSnapshotRef.current(createSnapshot());
    };

    onSnapshotRef.current(createSnapshot());

    const restart = () => {
      runtime.reset();
      playerController.reset();
      chunkManager.reset();
      obstacleManager.reset();
      coinManager.reset();
      collisionSystem.reset();
      ghostController.reset(playerController.position);
      ghostAudio.reset();
      shieldManager.reset();
      cameraShakeRemaining = 0;
      shieldBreakRemaining = 0;
      deathSequenceStarted = false;
      deathEffectActive = false;
      deathEffectElapsed = 0;
      gameOverDelayRemaining = 0;

      hasBeatenPreviousBest = false;
      console.log('[GAME] Restarting');
      obstacleManager.update();
      coinManager.update(0, elapsed);
      shieldManager.update(0, elapsed, playerController.position.z, 0, GameState.RUNNING);
      hudElapsed = 0;
      onSnapshotRef.current(createSnapshot());
    };

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      elapsed += delta;
      if (restartTokenRef.current !== handledRestartToken) {
        handledRestartToken = restartTokenRef.current;
        restart();
      }

      if (runtime.getSnapshot().gameState !== GameState.DEAD) {
        runtime.update(delta, playerController.config.speed);
        const runtimeBeforeGhost = runtime.getSnapshot();
        if (
          !deathSequenceStarted &&
          bestStatsLoadedRef.current &&
          !hasBeatenPreviousBest &&
          runtimeBeforeGhost.distance > previousBestDistanceRef.current
        ) {
          hasBeatenPreviousBest = true;
          ghostController.hide();
          ghostAudio.endChase();
          ghostAudio.stopAmbient();
        }
        if (!deathSequenceStarted) {
          if (runtimeBeforeGhost.gameState === GameState.RUNNING) playerController.recoverHit();
          playerController.update(delta);
          chunkManager.update(playerController.position.z);
          obstacleManager.update();
          const coinsBeforeCollection = runtime.getSnapshot().coins;
          coinManager.update(delta, elapsed);
          coinManager.collect(playerController.position.x, playerController.position.y, playerController.position.z);
          const collectedCoins = runtime.getSnapshot().coins - coinsBeforeCollection;
          if (collectedCoins > 0) onCoinsCollectedRef.current(collectedCoins);
          shieldManager.update(delta, elapsed, playerController.position.z, runtimeBeforeGhost.distance, runtimeBeforeGhost.gameState);
          if (
            runtime.getSnapshot().gameState === GameState.RUNNING &&
            shieldManager.collect(playerController.position.x, playerController.position.y, playerController.position.z)
          ) {
            runtime.activateShield(GAME_CONFIG.shieldDuration);
            onSnapshotRef.current(createSnapshot());
          }
        }
        handleGhostEvent(ghostController.update(
          delta,
          playerController.position,
          deathSequenceStarted ? 0 : playerController.config.speed,
        ));

        if (!deathSequenceStarted && runtime.getSnapshot().gameState !== GameState.DEAD) {
          const collisionSnapshot = playerController.getSnapshot();
          collisionSystem.update(playerController, collisionSnapshot, obstacleManager.obstacles, (obstacle) => {
            console.log('[COLLISION] Player hit obstacle', obstacle.uuid);
            if (runtime.consumeShield()) {
              shieldBreakRemaining = 0.25;
              cameraShakeRemaining = 0.25;
              console.log('[HEALTH] Damage prevented by shield');
              onSnapshotRef.current(createSnapshot());
              return true;
            }
            const damaged = runtime.takeDamage(1);
            if (!damaged) return false;
            const damagedSnapshot = runtime.getSnapshot();
            if (damagedSnapshot.hearts === 0) {
              if (!deathSequenceStarted) {
                deathSequenceStarted = true;
                console.log('[HEALTH] Health reached 0');
                console.log('[GAME] Entering death state');
                console.log('[GHOST] Starting attack');
                runtime.beginGhostAttack();
                playerController.die();
                handleGhostEvent(ghostController.startAttack());
              }
            } else {
              playerController.hit();
              console.log('[GHOST] Chase started because player lost a heart');
              handleGhostEvent(ghostController.startChase());
            }
            onSnapshotRef.current(createSnapshot());
            return true;
          });
        }

        if (deathEffectActive) {
          deathEffectElapsed += delta;
          gameOverDelayRemaining = Math.max(0, gameOverDelayRemaining - delta);
          if (gameOverDelayRemaining === 0) {
            deathEffectActive = false;
            runtime.finishGhostAttack();
          }
        }
      }

      shieldBreakRemaining = Math.max(0, shieldBreakRemaining - delta);
      const runtimeSnapshot = createSnapshot();
      hudElapsed += delta;
      if (hudElapsed >= 0.12 || runtimeSnapshot.gameState === GameState.DEAD) {
        hudElapsed = 0;
        onSnapshotRef.current(runtimeSnapshot);
      }
      const snapshot = playerController.getSnapshot();
      const deathProgress = deathEffectActive ? Math.min(1, deathEffectElapsed / 0.75) : 0;
      const ghostSnapshot = ghostController.getSnapshot(playerController.position.z);
      shieldAura.position.set(playerController.position.x, playerController.position.y + 1.25, playerController.position.z);
      shieldAura.visible = runtimeSnapshot.shieldActive || shieldBreakRemaining > 0;
      shieldAura.scale.setScalar(1 + shieldBreakRemaining * 2);
      (shieldAura.material as THREE.MeshBasicMaterial).opacity = runtimeSnapshot.shieldActive ? 0.16 : shieldBreakRemaining * 0.7;
      shieldAura.rotation.y += delta * 1.2;
      ghost.visible = ghostSnapshot.state !== GhostState.HIDDEN;
      ghost.position.set(
        ghostController.position.x,
        ghostController.position.y + Math.sin(elapsed * 3) * 0.15,
        ghostController.position.z,
      );
      updateGhostVisual(ghost, ghostSnapshot.state, elapsed);

      cameraAnchor.set(playerController.position.x, playerController.position.y, playerController.position.z);
      player.position.copy(cameraAnchor);
      const isSliding = snapshot.state === PlayerState.SLIDE;
      player.scale.set(1, isSliding ? 0.58 : 1, 1);
      player.position.y += isSliding ? 0.58 : 0;
      player.position.y += snapshot.state === PlayerState.RUN ? Math.sin(elapsed * 12) * 0.045 : 0;
      player.rotation.y = Math.sin(elapsed * 2.4) * 0.025;
      player.rotation.z = deathProgress * Math.PI * 0.5;
      player.scale.multiplyScalar(1 - deathProgress * 0.15);
      cameraController.update(camera, cameraAnchor, delta);
      if (cameraShakeRemaining > 0) {
        cameraShakeRemaining = Math.max(0, cameraShakeRemaining - delta);
        const shakeStrength = cameraShakeRemaining * 0.22;
        camera.position.x += (Math.random() - 0.5) * shakeStrength;
        camera.position.y += (Math.random() - 0.5) * shakeStrength;
      }
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
    cleanupRef.current = () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      coinManager.dispose();
      shieldManager.dispose();
      obstacleManager.dispose();
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
