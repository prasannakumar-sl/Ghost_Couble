import { Image, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface AlexModelPreviewProps {
  showPedestal?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function AlexModelPreview({
  showPedestal = false,
  style,
}: AlexModelPreviewProps) {
  return (
    <View style={[styles.container, style]}>
      {showPedestal ? (
        <View style={styles.pedestal}>
          <View style={styles.pedestalInner} />
        </View>
      ) : null}
      <Image
        accessibilityLabel="Alex character preview"
        source={require("@/assets/images/characters/alex/Alex_Idle.png")}
        resizeMode="contain"
        style={styles.character}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  character: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
  pedestal: {
    position: "absolute",
    bottom: "8%",
    width: "72%",
    height: "12%",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255, 212, 92, 0.75)",
    backgroundColor: "rgba(77, 238, 234, 0.2)",
  },
  pedestalInner: {
    ...StyleSheet.absoluteFill,
    margin: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(77, 238, 234, 0.5)",
  },
});
