package com.ebyzom.ebyfit.data

import java.util.Calendar
import java.util.Locale

/** Funciones puras de dominio. Usan Calendar (API 1) para soportar minSdk 24 sin desugaring. */
object FitnessCalculations {

    const val WEEKLY_GOAL = 4

    fun dateKey(year: Int, month1Based: Int, day: Int): String =
        String.format(Locale.US, "%04d-%02d-%02d", year, month1Based, day)

    fun dateKey(calendar: Calendar): String =
        dateKey(calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH) + 1, calendar.get(Calendar.DAY_OF_MONTH))

    fun todayKey(now: Calendar = Calendar.getInstance()): String = dateKey(now)

    /** Lunes de la semana de [now], a medianoche. */
    fun weekStart(now: Calendar = Calendar.getInstance()): Calendar {
        val result = now.clone() as Calendar
        result.set(Calendar.HOUR_OF_DAY, 0)
        result.set(Calendar.MINUTE, 0)
        result.set(Calendar.SECOND, 0)
        result.set(Calendar.MILLISECOND, 0)
        val mondayOffset = (result.get(Calendar.DAY_OF_WEEK) + 5) % 7
        result.add(Calendar.DAY_OF_MONTH, -mondayOffset)
        return result
    }

    /** Los 7 días (lunes a domingo) de la semana de [now]. */
    fun weekDates(now: Calendar = Calendar.getInstance()): List<Calendar> {
        val monday = weekStart(now)
        return (0..6).map { offset ->
            (monday.clone() as Calendar).apply { add(Calendar.DAY_OF_MONTH, offset) }
        }
    }

    /** Sesiones con fecha dentro de la semana (lunes-domingo) de [now]. */
    fun weeklySessions(logs: List<WorkoutLog>, now: Calendar = Calendar.getInstance()): Int {
        val start = weekStart(now).timeInMillis
        val end = start + 7L * 24 * 60 * 60 * 1000
        return logs.count { log ->
            val time = parseNoon(log.date)
            time != null && time >= start && time < end
        }
    }

    /**
     * Racha de días consecutivos con al menos una sesión, contando hacia atrás desde [now]
     * (día actual incluido). Espejo exacto de countStreak() en lib/fitness-store.tsx.
     */
    fun streak(logs: List<WorkoutLog>, now: Calendar = Calendar.getInstance()): Int {
        val dates = logs.map { it.date }.toSet()
        val cursor = (now.clone() as Calendar).apply { set(Calendar.HOUR_OF_DAY, 12) }
        var result = 0
        while (dates.contains(dateKey(cursor))) {
            result += 1
            cursor.add(Calendar.DAY_OF_MONTH, -1)
        }
        return result
    }

    /** Progreso hacia la meta semanal, 0..100. */
    fun weeklyProgressPercent(sessions: Int, goal: Int = WEEKLY_GOAL): Int =
        (sessions * 100 / goal).coerceAtMost(100)

    fun parseDateKey(key: String, hour: Int = 12): Long? {
        val parts = key.split("-")
        if (parts.size != 3) return null
        val year = parts[0].toIntOrNull() ?: return null
        val month = parts[1].toIntOrNull() ?: return null
        val day = parts[2].toIntOrNull() ?: return null
        return (Calendar.getInstance().apply { clear() }.apply {
            set(year, month - 1, day, hour, 0, 0)
        }).timeInMillis
    }

    private fun parseNoon(key: String): Long? = parseDateKey(key, hour = 12)
}
