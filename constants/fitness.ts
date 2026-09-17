import type { ImageSourcePropType } from "react-native";

export type Workout = {
  id: string;
  title: string;
  category: string;
  duration: string;
  level: string;
  accent: string;
  image: ImageSourcePropType;
  exercises: string[];
};

export const workouts: Workout[] = [
  {
    id: "full-body-foundation",
    title: "Fundamentos full body",
    category: "Fuerza",
    duration: "32 min",
    level: "Intermedio",
    accent: "primary",
    image: require("@/assets/images/workout-strength.jpg"),
    exercises: ["Sentadilla goblet", "Press de hombros", "Remo con mancuerna", "Plancha activa"],
  },
  {
    id: "mobility-reset",
    title: "Reset de movilidad",
    category: "Movilidad",
    duration: "18 min",
    level: "Todos los niveles",
    accent: "aqua",
    image: require("@/assets/images/workout-mobility.jpg"),
    exercises: ["Respiración 90/90", "Rotación torácica", "Cadera del corredor", "Estiramiento posterior"],
  },
  {
    id: "home-energy",
    title: "Energía en casa",
    category: "Cardio",
    duration: "24 min",
    level: "Principiante",
    accent: "orange",
    image: require("@/assets/images/workout-home.jpg"),
    exercises: ["Marcha alta", "Escaladores", "Zancada atrás", "Core controlado"],
  },
];

export const weekLabels = ["L", "M", "X", "J", "V", "S", "D"];

export const goals = [
  { label: "Fuerza", value: "68%", tone: "primary" },
  { label: "Constancia", value: "82%", tone: "aqua" },
  { label: "Movilidad", value: "54%", tone: "orange" },
];

export const moodOptions = ["Energía alta", "Bien", "Cansado", "Necesito recuperar"] as const;

export const progressHighlights = [
  { label: "Sesiones completadas", value: "12", delta: "+3 este mes" },
  { label: "Tiempo en movimiento", value: "6h 40m", delta: "+18% vs. mes anterior" },
  { label: "Mejor racha", value: "7 días", delta: "Tu nuevo récord" },
];
