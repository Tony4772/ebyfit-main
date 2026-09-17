package com.ebyzom.ebyfit.data

import kotlinx.serialization.Serializable

@Serializable
enum class Mood {
    ENERGIA_ALTA, BIEN, CANSADO, NECESITO_RECUPERAR;

    val label: String
        get() = when (this) {
            ENERGIA_ALTA -> "Energía alta"
            BIEN -> "Bien"
            CANSADO -> "Cansado"
            NECESITO_RECUPERAR -> "Necesito recuperar"
        }

    val emoji: String
        get() = when (this) {
            ENERGIA_ALTA -> "⚡"
            BIEN -> "🙂"
            CANSADO -> "😴"
            NECESITO_RECUPERAR -> "🌙"
        }
}

@Serializable
data class CheckIn(
    val date: String,
    val mood: Mood,
    val energy: Int,
    val note: String = "",
)

@Serializable
data class WorkoutLog(
    val id: String,
    val workoutId: String,
    val date: String,
)

@Serializable
data class WeightEntry(
    val id: String,
    val date: String,
    val value: Double,
)

@Serializable
data class FitnessState(
    val workoutLogs: List<WorkoutLog> = emptyList(),
    val checkIns: Map<String, CheckIn> = emptyMap(),
    val weightEntries: List<WeightEntry> = emptyList(),
)
