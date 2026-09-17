// Fallback para usar MaterialIcons en Android y web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "figure.strengthtraining.traditional": "fitness-center",
  "chart.bar.fill": "bar-chart",
  "person.crop.circle.fill": "account-circle",
  "checkmark.circle.fill": "check-circle",
  "play.fill": "play-arrow",
  "flame.fill": "local-fire-department",
  "bolt.fill": "bolt",
  "calendar": "calendar-today",
  "plus": "add",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "info.circle.fill": "info",
  "lock.fill": "lock",
  "arrow.triangle.2.circlepath": "sync",
  "cloud.fill": "cloud",
  "checkmark.icloud.fill": "cloud-done",
  "person.crop.circle": "person-outline",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
