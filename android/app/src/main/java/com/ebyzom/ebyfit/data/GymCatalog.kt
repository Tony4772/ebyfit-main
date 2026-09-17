package com.ebyzom.ebyfit.data

import androidx.annotation.DrawableRes
import com.ebyzom.ebyfit.R
import kotlinx.serialization.Serializable

@Serializable
data class GymClass(
    val id: String,
    val title: String,
    val coach: String,
    val room: String,
    val dayLabel: String,
    val time: String,
    val durationMin: Int,
    val spotsLeft: Int,
    val level: String,
    val category: String,
    @DrawableRes val image: Int,
)

@Serializable
data class Trainer(
    val id: String,
    val name: String,
    val specialty: String,
    val bio: String,
    val rating: Double,
    val sessions: Int,
    @DrawableRes val image: Int,
)

@Serializable
data class MembershipPlan(
    val id: String,
    val name: String,
    val priceLabel: String,
    val perks: List<String>,
    val highlighted: Boolean = false,
)

@Serializable
data class ClassBooking(
    val id: String,
    val classId: String,
    val userId: String,
    val date: String,
    val title: String,
    val time: String,
)

@Serializable
data class GymAccessCheckIn(
    val id: String,
    val userId: String,
    val date: String,
    val timestampMs: Long,
    val branch: String,
)

object GymCatalog {

    val classes: List<GymClass> = listOf(
        GymClass(
            id = "yoga-am",
            title = "Yoga flow matutino",
            coach = "Ana Ruiz",
            room = "Sala Zen",
            dayLabel = "Hoy",
            time = "07:30",
            durationMin = 50,
            spotsLeft = 6,
            level = "Todos",
            category = "Mind & Body",
            image = R.drawable.img_yoga,
        ),
        GymClass(
            id = "hiit-power",
            title = "HIIT Power 30",
            coach = "Marco Díaz",
            room = "Studio A",
            dayLabel = "Hoy",
            time = "12:15",
            durationMin = 30,
            spotsLeft = 3,
            level = "Intermedio",
            category = "Cardio",
            image = R.drawable.img_hiit,
        ),
        GymClass(
            id = "boxing-fit",
            title = "Boxing Fit",
            coach = "Marco Díaz",
            room = "Ring Zone",
            dayLabel = "Mañana",
            time = "18:00",
            durationMin = 45,
            spotsLeft = 8,
            level = "Principiante+",
            category = "Combate",
            image = R.drawable.img_boxing,
        ),
        GymClass(
            id = "spin-night",
            title = "Spinning Night Ride",
            coach = "Ana Ruiz",
            room = "Cycle Lab",
            dayLabel = "Mañana",
            time = "19:30",
            durationMin = 40,
            spotsLeft = 5,
            level = "Todos",
            category = "Cardio",
            image = R.drawable.img_spinning,
        ),
    )

    val trainers: List<Trainer> = listOf(
        Trainer(
            id = "ana",
            name = "Ana Ruiz",
            specialty = "Yoga · Movilidad · Recuperación",
            bio = "Entrenadora certificada con enfoque en movilidad y bienestar integral.",
            rating = 4.9,
            sessions = 1280,
            image = R.drawable.img_trainer_ana,
        ),
        Trainer(
            id = "marco",
            name = "Marco Díaz",
            specialty = "Fuerza · HIIT · Boxing",
            bio = "Coach de rendimiento para metas de fuerza, composición y energía.",
            rating = 4.8,
            sessions = 980,
            image = R.drawable.img_trainer_marco,
        ),
    )

    val memberships: List<MembershipPlan> = listOf(
        MembershipPlan(
            id = "basic",
            name = "Basic",
            priceLabel = "$29/mes",
            perks = listOf("Acceso a sala", "App de progreso", "2 clases/semana"),
        ),
        MembershipPlan(
            id = "pro",
            name = "Pro",
            priceLabel = "$49/mes",
            perks = listOf("Acceso ilimitado", "Clases ilimitadas", "Check-in QR", "Plan personalizado"),
            highlighted = true,
        ),
        MembershipPlan(
            id = "elite",
            name = "Elite",
            priceLabel = "$79/mes",
            perks = listOf("Todo Pro", "1 sesión PT/semana", "Nutrición básica", "Invitado 2x/mes"),
        ),
    )

    val branchName = "EbyFit Centro"
    val lobbyImage = R.drawable.img_gym_lobby
}
