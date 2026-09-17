package com.ebyzom.ebyfit.data

import androidx.annotation.DrawableRes
import com.ebyzom.ebyfit.R

data class Workout(
    val id: String,
    val title: String,
    val category: String,
    val duration: String,
    val level: String,
    val accent: Accent,
    @DrawableRes val image: Int,
    val exercises: List<String>,
)

enum class Accent { PRIMARY, AQUA, ORANGE }

object WorkoutCatalog {

    val workouts: List<Workout> = listOf(
        Workout(
            id = "full-body-foundation",
            title = "Fundamentos full body",
            category = "Fuerza",
            duration = "32 min",
            level = "Intermedio",
            accent = Accent.PRIMARY,
            image = R.drawable.img_strength,
            exercises = listOf("Sentadilla goblet", "Press de hombros", "Remo con mancuerna", "Plancha activa"),
        ),
        Workout(
            id = "mobility-reset",
            title = "Reset de movilidad",
            category = "Movilidad",
            duration = "18 min",
            level = "Todos los niveles",
            accent = Accent.AQUA,
            image = R.drawable.img_mobility,
            exercises = listOf("Respiración 90/90", "Rotación torácica", "Cadera del corredor", "Estiramiento posterior"),
        ),
        Workout(
            id = "home-energy",
            title = "Energía en casa",
            category = "Cardio",
            duration = "24 min",
            level = "Principiante",
            accent = Accent.ORANGE,
            image = R.drawable.img_home,
            exercises = listOf("Marcha alta", "Escaladores", "Zancada atrás", "Core controlado"),
        ),
        Workout(
            id = "yoga-restore",
            title = "Yoga restaurativo",
            category = "Mind & Body",
            duration = "28 min",
            level = "Todos los niveles",
            accent = Accent.AQUA,
            image = R.drawable.img_yoga,
            exercises = listOf("Gato-vaca", "Pigeon pose", "Twist sentado", "Savasana guiada"),
        ),
        Workout(
            id = "hiit-burn",
            title = "Quema HIIT",
            category = "Cardio",
            duration = "22 min",
            level = "Avanzado",
            accent = Accent.ORANGE,
            image = R.drawable.img_hiit,
            exercises = listOf("Jumping jacks", "Burpees controlados", "Mountain climbers", "Sprint en sitio"),
        ),
        Workout(
            id = "boxing-basics",
            title = "Boxing basics",
            category = "Combate",
            duration = "35 min",
            level = "Principiante",
            accent = Accent.PRIMARY,
            image = R.drawable.img_boxing,
            exercises = listOf("Guardia y footwork", "Jab-cross", "Ganchos al saco", "Core antirotación"),
        ),
        Workout(
            id = "spin-endurance",
            title = "Resistencia en bici",
            category = "Cardio",
            duration = "40 min",
            level = "Intermedio",
            accent = Accent.ORANGE,
            image = R.drawable.img_spinning,
            exercises = listOf("Warm-up cadence", "Climb intervals", "Sprint finish", "Cool down"),
        ),
    )

    val weekLabels: List<String> = listOf("L", "M", "X", "J", "V", "S", "D")

    val goals: List<Pair<String, String>> = listOf(
        "Fuerza" to "68%",
        "Constancia" to "82%",
        "Movilidad" to "54%",
    )

    val progressHighlights: List<Triple<String, String, String>> = listOf(
        Triple("Sesiones completadas", "12", "+3 este mes"),
        Triple("Tiempo en movimiento", "6h 40m", "+18% vs. mes anterior"),
        Triple("Mejor racha", "7 días", "Tu nuevo récord"),
    )
}
