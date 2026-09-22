import { useEffect, useState } from "react";
import {
    Animated,
    Easing,
    ImageBackground,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Platform,
    Switch,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { audioManager } from "@/audio/AudioManager";
import { BestStats, loadBestStats } from "@/game/BestStatsStore";

interface GhostCoupleHomeProps {
  onStartGame: () => void;
}

const MOBILE_BACKGROUND = require("@/assets/images/homepage.png");
const DESKTOP_BACKGROUND = require("@/assets/images/homepageweb.png");

const INITIAL_STATS: BestStats = {
  bestScore: 0,
  bestDistance: 0,
  bestCoins: 0,
  totalCoins: 0,
};

const PARTICLES = [
  { left: "12%", top: "19%", size: 3, delay: 0 },
  { left: "24%", top: "29%", size: 2, delay: 500 },
  { left: "78%", top: "23%", size: 3, delay: 900 },
  { left: "88%", top: "39%", size: 2, delay: 250 },
  { left: "7%", top: "45%", size: 2, delay: 750 },
  { left: "67%", top: "49%", size: 2, delay: 350 },
  { left: "31%", top: "57%", size: 3, delay: 1100 },
  { left: "91%", top: "62%", size: 2, delay: 650 },
] as const;

export default function GhostCoupleHome({ onStartGame }: GhostCoupleHomeProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 1024;
  const [best, setBest] = useState(INITIAL_STATS);
  const [howToPlayVisible, setHowToPlayVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(() => audioManager.getAudioSettings().musicEnabled);
  const [sfxEnabled, setSfxEnabled] = useState(() => audioManager.getAudioSettings().sfxEnabled);
  const [uiSoundsEnabled, setUiSoundsEnabled] = useState(() => audioManager.getAudioSettings().uiSoundsEnabled);
  const [fogProgress] = useState(() => new Animated.Value(0));
  const [titleGlow] = useState(() => new Animated.Value(0.68));
  const [buttonPulse] = useState(() => new Animated.Value(1));
  const [pressScale] = useState(() => new Animated.Value(1));
  const [playerFloat] = useState(() => new Animated.Value(0));
  const [ghostFloat] = useState(() => new Animated.Value(0));
  const [particleProgress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    void loadBestStats().then(setBest);
  }, []);

  useEffect(() => {
    let active = true;
    void audioManager.initialize().then(() => {
      if (!active) return;
      const settings = audioManager.getAudioSettings();
      setMusicEnabled(settings.musicEnabled);
      setSfxEnabled(settings.sfxEnabled);
      setUiSoundsEnabled(settings.uiSoundsEnabled);
      audioManager.playMusic("HOME");
    });
    return () => {
      active = false;
      audioManager.stopMusic();
    };
  }, []);

  useEffect(() => {
    const animations = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(fogProgress, {
            toValue: 1,
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(fogProgress, {
            toValue: 0,
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(titleGlow, {
            toValue: 1,
            duration: 1900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(titleGlow, {
            toValue: 0.62,
            duration: 1900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonPulse, {
            toValue: 1.035,
            duration: 1300,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(buttonPulse, {
            toValue: 1,
            duration: 1300,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(playerFloat, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(playerFloat, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(ghostFloat, {
            toValue: 1,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(ghostFloat, {
            toValue: 0,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(particleProgress, {
            toValue: 1,
            duration: 4200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(particleProgress, {
            toValue: 0,
            duration: 4200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    ];
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [
    buttonPulse,
    fogProgress,
    ghostFloat,
    particleProgress,
    playerFloat,
    titleGlow,
  ]);

  const startButtonScale = Animated.multiply(buttonPulse, pressScale);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.96,
      speed: 24,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      speed: 20,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleStartGame = () => {
    audioManager.playSFX("button");
    audioManager.stopMusic();
    onStartGame();
  };

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={isDesktopWeb ? DESKTOP_BACKGROUND : MOBILE_BACKGROUND}
        resizeMode="cover"
        style={[styles.backgroundImage, isDesktopWeb && styles.backgroundImageWeb]}
      />
      <View style={styles.skyGlow} />
      <View style={styles.moonHalo} />
      <View style={styles.moon} />
      <View style={styles.moonShadow} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.fogBand,
          {
            opacity: fogProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.16, 0.3],
            }),
            transform: [
              {
                translateX: fogProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-34, 22],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.fogBand,
          styles.fogBandLower,
          {
            opacity: fogProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.22],
            }),
            transform: [
              {
                translateX: fogProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [28, -28],
                }),
              },
            ],
          },
        ]}
      />

      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 14, 24),
            paddingBottom: Math.max(insets.bottom + 18, 28),
          },
        ]}
      >
        <Animated.View style={[styles.header, { opacity: titleGlow }]}>
          <Text style={styles.eyebrow}>A NIGHT OF TWO</Text>
          <Text style={styles.title}>GHOST COUPLE</Text>
          <Text style={styles.subtitle}>
            RUN <Text style={styles.dot}>•</Text> ESCAPE{" "}
            <Text style={styles.dot}>•</Text> SURVIVE
          </Text>
        </Animated.View>

        <View style={[styles.scene, { height }]} pointerEvents="none">
          <View style={styles.moonRoad} />
          <View style={styles.road} />
          <View style={styles.roadCenterLine} />
          <View style={styles.roadEdgeLeft} />
          <View style={styles.roadEdgeRight} />
          <View style={styles.roadReflection} />
          <View style={styles.roadCrack} />
          <View style={styles.bridgeRail} />
          <View style={[styles.lamp, styles.lampLeft]}>
            <View style={styles.lampGlow} />
            <View style={styles.lampPole} />
            <View style={styles.lampLight} />
          </View>
          <View style={[styles.lamp, styles.lampRight]}>
            <View style={styles.lampGlow} />
            <View style={styles.lampPole} />
            <View style={styles.lampLight} />
          </View>
          <View style={styles.skyCouple} pointerEvents="none">
            <View style={styles.skyCoupleHeadLeft} />
            <View style={styles.skyCoupleBodyLeft} />
            <View style={styles.skyCoupleHeadRight} />
            <View style={styles.skyCoupleBodyRight} />
          </View>
          <Text style={styles.bats}>⌁ ︿ ⌁</Text>
          <View style={styles.castle}>
            <View style={[styles.tower, styles.towerLeft]} />
            <View style={[styles.tower, styles.towerCenter]} />
            <View style={[styles.tower, styles.towerRight]} />
            <View style={styles.castleBody} />
            <View style={[styles.window, styles.windowLeft]} />
            <View style={[styles.window, styles.windowRight]} />
          </View>
          <View style={styles.waterfall}>
            <View style={styles.waterfallGlow} />
            <View style={styles.waterfallStream} />
            <View style={styles.waterfallStreamSmall} />
          </View>
          <View style={[styles.tree, styles.treeFarLeft]} />
          <View style={[styles.tree, styles.treeLeft]} />
          <View style={[styles.tree, styles.treeRight]} />
          <View style={[styles.tree, styles.treeFarRight]} />
          <View style={styles.groundMist} />

          <View style={styles.leftVillage}>
            <View style={styles.villageRoof} />
            <View style={styles.villageWall} />
            <View style={styles.villageLamp} />
            <View style={styles.logoBoard}>
              <Text style={styles.logoGhost}>GHOST</Text>
              <Text style={styles.logoCouple}>COUPLE</Text>
            </View>
            <View style={styles.hangingBanner}>
              <Text style={styles.bannerGhost}>☠</Text>
            </View>
          </View>

          <View style={[styles.pumpkin, styles.pumpkinLeft]}>
            <Text style={styles.pumpkinFace}>◉</Text>
          </View>
          <View style={[styles.pumpkin, styles.pumpkinRight]}>
            <Text style={styles.pumpkinFace}>◉</Text>
          </View>

          <View style={styles.signpost}>
            <Text style={styles.signText}>RUN</Text>
            <Text style={styles.signText}>EXPLORE</Text>
            <Text style={styles.signText}>SURVIVE</Text>
            <Text style={styles.signText}>TOGETHER</Text>
          </View>

          <Animated.View
            style={[
              styles.ghostFigure,
              {
                transform: [
                  {
                    translateY: ghostFloat.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, -9],
                    }),
                  },
                  {
                    rotate: ghostFloat.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["-2deg", "2deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.ghostAura} />
            <View style={styles.ghostHead} />
            <View style={styles.ghostBody} />
            <View style={styles.ghostEyeRow}>
              <View style={styles.ghostEye} />
              <View style={styles.ghostEye} />
            </View>
            <View style={styles.ghostMouth} />
          </Animated.View>

          <Animated.View
            style={[
              styles.playerFigure,
              {
                transform: [
                  {
                    translateY: playerFloat.interpolate({
                      inputRange: [0, 1],
                      outputRange: [3, -4],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.playerShadow} />
            <View style={styles.playerCloak} />
            <View style={styles.playerHead} />
            <View style={styles.playerEyeRow}>
              <View style={styles.playerEye} />
              <View style={styles.playerEye} />
            </View>
            <View style={styles.playerBootLeft} />
            <View style={styles.playerBootRight} />
          </Animated.View>

          {PARTICLES.map((particle) => (
            <Animated.View
              key={`${particle.left}-${particle.top}`}
              style={[
                styles.particle,
                {
                  left: particle.left,
                  top: particle.top,
                  width: particle.size,
                  height: particle.size,
                },
                {
                  opacity: particleProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.28, 0.9],
                  }),
                  transform: [
                    {
                      translateY: particleProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          particle.delay / 180,
                          -particle.delay / 260,
                        ],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.bottomPanel}>
          <View style={styles.records}>
            <View style={styles.recordMain}>
              <Text style={styles.recordLabel}>BEST DISTANCE</Text>
              <Text style={styles.recordValue}>
                {best.bestDistance} <Text style={styles.recordUnit}>m</Text>
              </Text>
            </View>
            <View style={styles.recordDivider} />
            <View style={styles.recordSmall}>
              <Text style={styles.recordLabel}>BEST SCORE</Text>
              <Text style={styles.smallValue}>{best.bestScore}</Text>
            </View>
            <View style={styles.recordSmall}>
              <Text style={styles.recordLabel}>BEST COINS</Text>
              <Text style={styles.smallValue}>{best.bestCoins}</Text>
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: startButtonScale }] }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start game"
              onPress={handleStartGame}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={({ pressed }) => [
                styles.startButton,
                pressed && styles.startButtonPressed,
              ]}
            >
              <View style={styles.startButtonShine} />
              <Text style={styles.startIcon}>▶</Text>
              <Text style={styles.startText}>START GAME</Text>
            </Pressable>
          </Animated.View>

          <View style={styles.secondaryActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setHowToPlayVisible(true)}
              style={({ pressed }) => [
                styles.howButton,
                pressed && styles.secondaryPressed,
              ]}
            >
              <Text style={styles.howButtonText}>HOW TO PLAY</Text>
              <Text style={styles.howButtonArrow}>↗</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              onPress={() => setSettingsVisible(true)}
              style={({ pressed }) => [
                styles.howButton,
                pressed && styles.secondaryPressed,
              ]}
            >
              <Text style={styles.howButtonText}>SETTINGS</Text>
              <Text style={styles.howButtonArrow}>⚙</Text>
            </Pressable>
          </View>
          <Text style={styles.footer}>THE NIGHT IS WAITING</Text>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={settingsVisible}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>GAME PREFERENCES</Text>
            <Text style={styles.modalTitle}>AUDIO SETTINGS</Text>
            <AudioSettingRow
              label="🎵 MUSIC"
              enabled={musicEnabled}
              onValueChange={(enabled) => {
                setMusicEnabled(enabled);
                audioManager.setMusicEnabled(enabled);
              }}
            />
            <AudioSettingRow
              label="🔊 SOUND EFFECTS"
              enabled={sfxEnabled}
              onValueChange={(enabled) => {
                setSfxEnabled(enabled);
                audioManager.setSFXEnabled(enabled);
              }}
            />
            <AudioSettingRow
              label="🔔 UI SOUNDS"
              enabled={uiSoundsEnabled}
              onValueChange={(enabled) => {
                setUiSoundsEnabled(enabled);
                audioManager.setUISoundsEnabled(enabled);
              }}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => setSettingsVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>BACK TO MENU</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={howToPlayVisible}
        onRequestClose={() => setHowToPlayVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>SURVIVE THE NIGHT</Text>
            <Text style={styles.modalTitle}>HOW TO PLAY</Text>
            <ScrollView
              contentContainerStyle={styles.controlList}
              showsVerticalScrollIndicator={false}
            >
              <ControlRow gesture="SWIPE LEFT" action="Move left" />
              <ControlRow gesture="SWIPE RIGHT" action="Move right" />
              <ControlRow gesture="SWIPE UP" action="Jump" />
              <ControlRow gesture="SWIPE DOWN" action="Slide" />
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              onPress={() => setHowToPlayVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>BACK TO MENU</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AudioSettingRow({
  label,
  enabled,
  onValueChange,
}: {
  label: string;
  enabled: boolean;
  onValueChange: (enabled: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingValue}>{enabled ? "ON" : "OFF"}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={enabled}
        onValueChange={onValueChange}
        trackColor={{ false: "#303d64", true: "#42d8e8" }}
        thumbColor={enabled ? "#effaff" : "#8b91b8"}
      />
    </View>
  );
}

function ControlRow({ gesture, action }: { gesture: string; action: string }) {
  return (
    <View style={styles.controlRow}>
      <View style={styles.gestureBadge}>
        <Text style={styles.gestureText}>{gesture}</Text>
      </View>
      <Text style={styles.actionText}>{action}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#070817", overflow: "hidden" },
  backgroundImage: { ...StyleSheet.absoluteFill, zIndex: 0 },
  backgroundImageWeb: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 0,
  } as any,
  skyGlow: {
    position: "absolute",
    width: "130%",
    height: "66%",
    left: "-15%",
    top: "-18%",
    borderRadius: 999,
    backgroundColor: "#171e4d",
    opacity: 0,
  },
  moonHalo: {
    position: "absolute",
    width: 214,
    height: 214,
    borderRadius: 107,
    right: -54,
    top: 54,
    backgroundColor: "#a7d7ff",
    opacity: 0,
  },
  moon: {
    position: "absolute",
    width: 132,
    height: 132,
    borderRadius: 66,
    right: -13,
    top: 95,
    backgroundColor: "#e0f3ff",
    opacity: 0,
  },
  moonShadow: {
    position: "absolute",
    width: 125,
    height: 125,
    borderRadius: 63,
    right: -31,
    top: 84,
    backgroundColor: "#101536",
    opacity: 0,
  },
  fogBand: {
    position: "absolute",
    width: "130%",
    height: 84,
    left: "-15%",
    top: "49%",
    borderRadius: 50,
    backgroundColor: "#b7d8e9",
    display: "none",
  },
  fogBandLower: { top: "62%", height: 68, display: "none" },
  content: { flex: 1, justifyContent: "space-between", zIndex: 1 },
  header: { display: "none" },
  eyebrow: {
    color: "#c5bdd0",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 3.2,
    marginBottom: 7,
  },
  title: {
    color: "#f4f3ff",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 4.5,
    textShadowColor: "#b319d9",
    textShadowRadius: 14,
    textAlign: "center",
  },
  subtitle: {
    color: "#dfbddf",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 3,
    marginTop: 8,
  },
  dot: { color: "#5be4ec" },
  scene: {
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    marginTop: 0,
    overflow: "hidden",
    display: "none",
  },
  moonRoad: {
    position: "absolute",
    width: 204,
    height: 204,
    borderRadius: 102,
    right: -27,
    top: "8%",
    backgroundColor: "#d6eaff",
    opacity: 0.9,
    shadowColor: "#c0e1ff",
    shadowRadius: 35,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
  },
  road: {
    position: "absolute",
    left: "24%",
    right: "24%",
    bottom: "-4%",
    height: "58%",
    backgroundColor: "#15152b",
    transform: [{ perspective: 400 }, { rotateX: "18deg" }],
    borderTopWidth: 2,
    borderTopColor: "#786d82",
  },
  roadCenterLine: {
    position: "absolute",
    alignSelf: "center",
    bottom: "-2%",
    width: 7,
    height: "49%",
    backgroundColor: "#d4c6d4",
    opacity: 0.72,
  },
  roadEdgeLeft: {
    position: "absolute",
    left: "25%",
    bottom: "0%",
    width: 4,
    height: "53%",
    backgroundColor: "#d69a54",
    opacity: 0.8,
    transform: [{ rotate: "10deg" }],
  },
  roadEdgeRight: {
    position: "absolute",
    right: "25%",
    bottom: "0%",
    width: 4,
    height: "53%",
    backgroundColor: "#d69a54",
    opacity: 0.8,
    transform: [{ rotate: "-10deg" }],
  },
  roadReflection: {
    position: "absolute",
    alignSelf: "center",
    bottom: "4%",
    width: "28%",
    height: "14%",
    borderRadius: 100,
    backgroundColor: "#c27643",
    opacity: 0.12,
  },
  roadCrack: {
    position: "absolute",
    left: "39%",
    bottom: "9%",
    width: 52,
    height: 2,
    backgroundColor: "#090b18",
    opacity: 0.8,
    transform: [{ rotate: "-21deg" }],
  },
  bridgeRail: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "27%",
    height: 3,
    backgroundColor: "#4a3b54",
    opacity: 0.9,
  },
  lamp: {
    position: "absolute",
    bottom: "28%",
    width: 24,
    height: 92,
    alignItems: "center",
  },
  lampLeft: { left: "12%" },
  lampRight: { right: "12%" },
  lampGlow: {
    position: "absolute",
    top: 2,
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#ff9d48",
    opacity: 0.18,
  },
  lampPole: {
    position: "absolute",
    bottom: 0,
    width: 3,
    height: 74,
    backgroundColor: "#211b2c",
  },
  lampLight: {
    position: "absolute",
    top: 5,
    width: 15,
    height: 20,
    borderRadius: 5,
    backgroundColor: "#ffb75c",
    borderWidth: 2,
    borderColor: "#d87939",
    shadowColor: "#ff9d48",
    shadowRadius: 12,
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
  },
  skyCouple: {
    position: "absolute",
    top: "8%",
    left: "9%",
    width: "52%",
    height: "35%",
    opacity: 0.2,
  },
  skyCoupleHeadLeft: {
    position: "absolute",
    top: "13%",
    left: "10%",
    width: "29%",
    height: "43%",
    borderRadius: 999,
    backgroundColor: "#a3c9e8",
    shadowColor: "#96c7ff",
    shadowRadius: 16,
    shadowOpacity: 0.7,
    shadowOffset: { width: 0, height: 0 },
  },
  skyCoupleBodyLeft: {
    position: "absolute",
    top: "44%",
    left: "2%",
    width: "47%",
    height: "48%",
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
    backgroundColor: "#8ba8d0",
  },
  skyCoupleHeadRight: {
    position: "absolute",
    top: "1%",
    right: "5%",
    width: "28%",
    height: "46%",
    borderRadius: 999,
    backgroundColor: "#6c91c1",
  },
  skyCoupleBodyRight: {
    position: "absolute",
    top: "34%",
    right: "0%",
    width: "45%",
    height: "59%",
    borderTopLeftRadius: 70,
    borderTopRightRadius: 70,
    backgroundColor: "#5874a6",
  },
  bats: {
    position: "absolute",
    top: "19%",
    right: "31%",
    color: "#13172d",
    fontSize: 15,
    letterSpacing: 6,
  },
  castle: {
    position: "absolute",
    top: "19%",
    left: "16%",
    width: "68%",
    height: "37%",
    opacity: 0.78,
  },
  castleBody: {
    position: "absolute",
    bottom: 0,
    left: "10%",
    right: "10%",
    height: "48%",
    backgroundColor: "#11152d",
    borderTopWidth: 2,
    borderTopColor: "#242d50",
  },
  tower: {
    position: "absolute",
    bottom: "30%",
    width: 34,
    backgroundColor: "#0e1228",
    borderTopWidth: 2,
    borderTopColor: "#252d4d",
  },
  towerLeft: { left: 0, height: "64%" },
  towerCenter: { left: "42%", height: "100%", width: 39 },
  towerRight: { right: 0, height: "72%" },
  window: {
    position: "absolute",
    bottom: "15%",
    width: 5,
    height: 13,
    borderRadius: 3,
    backgroundColor: "#79d8ed",
    opacity: 0.34,
  },
  windowLeft: { left: "30%" },
  windowRight: { right: "29%" },
  waterfall: {
    position: "absolute",
    left: "9%",
    top: "47%",
    width: 36,
    height: "37%",
  },
  waterfallGlow: {
    position: "absolute",
    left: 2,
    top: 0,
    width: 27,
    height: "100%",
    borderRadius: 20,
    backgroundColor: "#76dbea",
    opacity: 0.12,
  },
  waterfallStream: {
    position: "absolute",
    left: 9,
    top: 0,
    width: 9,
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#a4eff5",
    opacity: 0.42,
  },
  waterfallStreamSmall: {
    position: "absolute",
    left: 22,
    top: 15,
    width: 4,
    height: "72%",
    borderRadius: 10,
    backgroundColor: "#c4f8ff",
    opacity: 0.34,
  },
  tree: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftWidth: 42,
    borderRightWidth: 42,
    borderBottomWidth: 110,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#0b1023",
    opacity: 0.94,
  },
  treeFarLeft: { left: -25, bottom: "5%", transform: [{ scale: 1.3 }] },
  treeLeft: { left: 4, bottom: "3%", transform: [{ scale: 0.92 }] },
  treeRight: { right: -2, bottom: "5%", transform: [{ scale: 1.12 }] },
  treeFarRight: { right: -34, bottom: "7%", transform: [{ scale: 1.4 }] },
  groundMist: {
    position: "absolute",
    bottom: "3%",
    left: "10%",
    right: "10%",
    height: 45,
    borderRadius: 50,
    backgroundColor: "#b1b4d3",
    opacity: 0.18,
  },
  leftVillage: {
    position: "absolute",
    left: "-4%",
    bottom: "21%",
    width: "31%",
    height: "35%",
  },
  villageRoof: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "28%",
    backgroundColor: "#201529",
    transform: [{ skewX: "-18deg" }],
  },
  villageWall: {
    position: "absolute",
    top: "19%",
    left: "10%",
    width: "75%",
    height: "81%",
    backgroundColor: "#3b2631",
    borderRightWidth: 3,
    borderRightColor: "#6c4438",
  },
  villageLamp: {
    position: "absolute",
    right: "4%",
    top: "35%",
    width: 12,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#ff9a43",
    shadowColor: "#ff9a43",
    shadowRadius: 14,
    shadowOpacity: 0.95,
    shadowOffset: { width: 0, height: 0 },
  },
  logoBoard: {
    position: "absolute",
    top: "27%",
    left: "16%",
    width: "92%",
    paddingVertical: 4,
    backgroundColor: "#4b2b33",
    borderWidth: 2,
    borderColor: "#1e1823",
    transform: [{ rotate: "-3deg" }],
    alignItems: "center",
  },
  logoGhost: {
    color: "#b9e8ff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: "#5fb3ff",
    textShadowRadius: 8,
  },
  logoCouple: {
    color: "#e835d3",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.4,
    textShadowColor: "#9d18d6",
    textShadowRadius: 8,
  },
  hangingBanner: {
    position: "absolute",
    right: "11%",
    bottom: "-20%",
    width: 27,
    height: 66,
    backgroundColor: "#4c174b",
    alignItems: "center",
    paddingTop: 7,
  },
  bannerGhost: { color: "#f8e7ef", fontSize: 16 },
  pumpkin: {
    position: "absolute",
    bottom: "13%",
    width: 34,
    height: 27,
    borderRadius: 18,
    backgroundColor: "#d66326",
    borderWidth: 3,
    borderColor: "#7b351f",
    alignItems: "center",
    justifyContent: "center",
  },
  pumpkinLeft: { left: "17%" },
  pumpkinRight: { right: "12%" },
  pumpkinFace: { color: "#ffcb5b", fontSize: 11 },
  signpost: {
    position: "absolute",
    right: "-2%",
    bottom: "25%",
    width: 92,
    paddingVertical: 5,
    backgroundColor: "#3c2638",
    borderLeftWidth: 4,
    borderLeftColor: "#2a1926",
    transform: [{ rotate: "-3deg" }],
    zIndex: 1,
  },
  signText: {
    color: "#e9c2c6",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
    paddingVertical: 3,
    paddingLeft: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#694659",
  },
  ghostFigure: {
    position: "absolute",
    alignSelf: "center",
    top: "27%",
    width: 124,
    height: 190,
    alignItems: "center",
    opacity: 0.72,
  },
  ghostAura: {
    position: "absolute",
    top: 3,
    width: 128,
    height: 168,
    borderRadius: 64,
    backgroundColor: "#85e6ff",
    opacity: 0.12,
  },
  ghostHead: {
    position: "absolute",
    top: 19,
    width: 62,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#bdedf2",
    opacity: 0.6,
  },
  ghostBody: {
    position: "absolute",
    top: 73,
    width: 104,
    height: 102,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: "#a5dfe7",
    opacity: 0.5,
  },
  ghostEyeRow: { position: "absolute", top: 48, flexDirection: "row", gap: 16 },
  ghostEye: {
    width: 9,
    height: 12,
    borderRadius: 5,
    backgroundColor: "#ff5b9c",
    shadowColor: "#ff4f91",
    shadowRadius: 10,
    shadowOpacity: 0.95,
    shadowOffset: { width: 0, height: 0 },
  },
  ghostMouth: {
    position: "absolute",
    top: 69,
    width: 14,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#150d2d",
    opacity: 0.7,
  },
  playerFigure: {
    position: "absolute",
    alignSelf: "center",
    top: "31%",
    width: 122,
    height: 220,
    alignItems: "center",
  },
  playerShadow: {
    position: "absolute",
    bottom: 4,
    width: 94,
    height: 18,
    borderRadius: 48,
    backgroundColor: "#03040c",
    opacity: 0.62,
  },
  playerCloak: {
    position: "absolute",
    top: 74,
    width: 94,
    height: 124,
    borderTopLeftRadius: 47,
    borderTopRightRadius: 47,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: "#2e2863",
    borderWidth: 1,
    borderColor: "#6555b2",
    shadowColor: "#706dff",
    shadowRadius: 18,
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 0 },
  },
  playerHead: {
    position: "absolute",
    top: 27,
    width: 59,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#d6f5f6",
    borderWidth: 1,
    borderColor: "#a2e9f0",
    shadowColor: "#54dcf2",
    shadowRadius: 16,
    shadowOpacity: 0.64,
    shadowOffset: { width: 0, height: 0 },
  },
  playerEyeRow: {
    position: "absolute",
    top: 51,
    flexDirection: "row",
    gap: 15,
  },
  playerEye: {
    width: 7,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#130e2d",
  },
  playerBootLeft: {
    position: "absolute",
    bottom: 0,
    left: 34,
    width: 25,
    height: 28,
    borderRadius: 12,
    backgroundColor: "#161531",
  },
  playerBootRight: {
    position: "absolute",
    bottom: 0,
    right: 34,
    width: 25,
    height: 28,
    borderRadius: 12,
    backgroundColor: "#161531",
  },
  particle: {
    position: "absolute",
    borderRadius: 10,
    backgroundColor: "#9befff",
    shadowColor: "#79e5ff",
    shadowRadius: 7,
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
  },
  bottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  records: {
    width: "100%",
    maxWidth: 380,
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(14, 19, 47, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(123, 155, 205, 0.28)",
  },
  recordMain: { minWidth: 118 },
  recordDivider: {
    width: 1,
    height: 35,
    backgroundColor: "#536289",
    opacity: 0.45,
  },
  recordSmall: { alignItems: "center", minWidth: 62 },
  recordLabel: {
    color: "#8d9fc6",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  recordValue: {
    color: "#e7fbff",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 2,
  },
  recordUnit: { color: "#72dae9", fontSize: 12, letterSpacing: 1 },
  smallValue: {
    color: "#dce8ff",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 5,
  },
  startButton: {
    minWidth: 238,
    height: 58,
    marginTop: 17,
    paddingHorizontal: 25,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#59e5eb",
    borderWidth: 1,
    borderColor: "#b4ffff",
    shadowColor: "#54e6f4",
    shadowRadius: 18,
    shadowOpacity: 0.7,
    shadowOffset: { width: 0, height: 0 },
    overflow: "hidden",
  },
  startButtonPressed: { opacity: 0.94 },
  startButtonShine: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: "#efffff",
    opacity: 0.8,
  },
  startIcon: { color: "#071526", fontSize: 14, marginRight: 11 },
  startText: {
    color: "#071526",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 2.2,
  },
  secondaryActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  howButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 18,
    marginTop: 5,
  },
  secondaryPressed: { opacity: 0.62 },
  howButtonText: {
    color: "#b4c8e9",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },
  howButtonArrow: { color: "#63e5ed", fontSize: 15 },
  footer: {
    color: "#526285",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 2.8,
    marginTop: 1,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(2, 3, 13, 0.86)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    padding: 25,
    borderRadius: 24,
    backgroundColor: "#11152f",
    borderWidth: 1,
    borderColor: "#42527f",
    shadowColor: "#42dfed",
    shadowRadius: 20,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 0 },
  },
  modalEyebrow: {
    color: "#71e8ee",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2.5,
  },
  modalTitle: {
    color: "#effaff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 2.5,
    marginTop: 6,
  },
  settingRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#191f40",
    borderWidth: 1,
    borderColor: "#303d64",
  },
  settingCopy: { gap: 4 },
  settingLabel: {
    color: "#effaff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.8,
  },
  settingValue: {
    color: "#71e8ee",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  controlList: { gap: 11, paddingVertical: 24 },
  controlRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#191f40",
    borderWidth: 1,
    borderColor: "#303d64",
  },
  gestureBadge: {
    width: 102,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#27305b",
    alignItems: "center",
  },
  gestureText: {
    color: "#8ff5f5",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  actionText: { color: "#e0ebff", fontSize: 15, fontWeight: "700" },
  closeButton: {
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 22,
    backgroundColor: "#59e5eb",
  },
  closeButtonText: {
    color: "#071526",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
  },
});
