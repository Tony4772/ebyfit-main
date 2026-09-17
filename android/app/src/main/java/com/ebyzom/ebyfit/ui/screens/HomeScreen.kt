package com.ebyzom.ebyfit.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ebyzom.ebyfit.data.FitnessCalculations
import com.ebyzom.ebyfit.data.FitnessRepository
import com.ebyzom.ebyfit.data.GymCatalog
import com.ebyzom.ebyfit.data.SettingsRepository
import com.ebyzom.ebyfit.data.WorkoutCatalog
import com.ebyzom.ebyfit.feedback.FeedbackManager
import com.ebyzom.ebyfit.feedback.Sfx
import com.ebyzom.ebyfit.ui.components.AnimatedProgressBar
import com.ebyzom.ebyfit.ui.components.DayCell
import com.ebyzom.ebyfit.ui.components.EbyfitButton
import com.ebyzom.ebyfit.ui.components.WorkoutCard
import com.ebyzom.ebyfit.ui.theme.LocalEbyfitColors
import com.ebyzom.ebyfit.ui.theme.primaryDeep

@Composable
fun HomeScreen(
    fitness: FitnessRepository,
    @Suppress("UNUSED_PARAMETER") settings: SettingsRepository,
    feedback: FeedbackManager,
    onOpenProfile: () -> Unit,
    onOpenPlan: () -> Unit = {},
    onOpenClasses: () -> Unit = {},
    onOpenCheckIn: () -> Unit = {},
) {
    val state by fitness.state.collectAsStateWithLifecycle()
    val bookings by fitness.bookings.collectAsStateWithLifecycle()
    val c = LocalEbyfitColors.current
    val view = LocalView.current

    val sessions = FitnessCalculations.weeklySessions(state.workoutLogs)
    val streak = FitnessCalculations.streak(state.workoutLogs)
    val percent = FitnessCalculations.weeklyProgressPercent(sessions)
    val weekDates = remember { FitnessCalculations.weekDates() }
    val todayKey = remember { FitnessCalculations.todayKey() }
    val loggedDates = remember(state.workoutLogs) { state.workoutLogs.map { it.date }.toSet() }
    val todayClasses = remember { GymCatalog.classes.filter { it.dayLabel == "Hoy" }.take(2) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(26.dp))
                .height(168.dp),
        ) {
            Image(
                painter = painterResource(GymCatalog.lobbyImage),
                contentDescription = "EbyFit gym",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color(0x660B0F0D), Color(0xE60B0F0D)),
                        ),
                    ),
            )
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(18.dp),
            ) {
                Text("EBYFIT", color = c.primary, fontWeight = FontWeight.ExtraBold, letterSpacing = 2.sp, fontSize = 13.sp)
                Text("$streak días de racha", color = Color.White, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
                Text(
                    "Llevas $sessions de ${FitnessCalculations.WEEKLY_GOAL} sesiones · ${GymCatalog.branchName}",
                    color = Color(0xCCFFFFFF),
                    fontSize = 13.sp,
                )
            }
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .background(Brush.linearGradient(listOf(c.primary, c.primaryDeep)))
                .padding(18.dp),
        ) {
            Column {
                Text("Progreso semanal", color = Color(0xB30B0F0D), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                AnimatedProgressBar(fraction = percent / 100f, barColor = Color(0xFF0B0F0D))
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    EbyfitButton(
                        label = "Clases",
                        onClick = onOpenClasses,
                        feedback = feedback,
                        sfx = Sfx.SELECT,
                        container = Color(0xFF0B0F0D),
                        content = c.primary,
                        modifier = Modifier.weight(1f),
                    )
                    EbyfitButton(
                        label = "Check-in",
                        onClick = onOpenCheckIn,
                        feedback = feedback,
                        sfx = Sfx.TAP,
                        container = Color(0x330B0F0D),
                        content = Color(0xFF0B0F0D),
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }

        // Tira de la semana
        Row(
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth(),
        ) {
            weekDates.forEachIndexed { index, calendar ->
                val key = FitnessCalculations.dateKey(calendar)
                DayCell(
                    label = WorkoutCatalog.weekLabels[index],
                    active = loggedDates.contains(key),
                    today = key == todayKey,
                )
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            StatCard(label = "Sesiones", value = "$sessions/${FitnessCalculations.WEEKLY_GOAL}", modifier = Modifier.weight(1f))
            StatCard(label = "Racha", value = "$streak d", modifier = Modifier.weight(1f))
            StatCard(
                label = "Reservas",
                value = "${bookings.size}",
                modifier = Modifier.weight(1f),
            )
        }

        Text("Clases de hoy", color = c.foreground, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        todayClasses.forEach { gymClass ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(c.surface)
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Image(
                    painter = painterResource(gymClass.image),
                    contentDescription = gymClass.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .width(72.dp)
                        .height(72.dp)
                        .clip(RoundedCornerShape(14.dp)),
                )
                Column(Modifier.weight(1f)) {
                    Text(gymClass.title, color = c.foreground, fontWeight = FontWeight.Bold)
                    Text("${gymClass.time} · ${gymClass.coach}", color = c.muted, fontSize = 12.sp)
                    Text(gymClass.room, color = c.muted, fontSize = 12.sp)
                }
            }
        }
        EbyfitButton(
            label = "Ver todas las clases",
            onClick = onOpenClasses,
            feedback = feedback,
            sfx = Sfx.SELECT,
        )

        Text("Entrenamientos destacados", color = c.foreground, fontSize = 18.sp, fontWeight = FontWeight.Bold)

        WorkoutCatalog.workouts.take(4).forEach { workout ->
            val complete = fitness.isWorkoutComplete(workout.id)
            WorkoutCard(
                workout = workout,
                complete = complete,
                onToggle = {
                    fitness.toggleWorkout(workout.id)
                    if (!complete) {
                        feedback.play(Sfx.SUCCESS)
                        feedback.haptic(view, strong = true)
                    } else {
                        feedback.play(Sfx.TAP)
                        feedback.haptic(view)
                    }
                },
                feedback = feedback,
            )
        }

        EbyfitButton(
            label = "Ver plan completo",
            onClick = onOpenPlan,
            feedback = feedback,
            sfx = Sfx.WHOOSH,
        )
        EbyfitButton(
            label = "Mi perfil",
            onClick = onOpenProfile,
            feedback = feedback,
            sfx = Sfx.TAP,
            container = c.border,
            content = c.foreground,
        )
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun StatCard(label: String, value: String, modifier: Modifier = Modifier) {
    val c = LocalEbyfitColors.current
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .background(c.surface)
            .padding(14.dp),
    ) {
        Text(text = label, color = c.muted, fontSize = 12.sp)
        Spacer(Modifier.height(4.dp))
        Text(text = value, color = c.foreground, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
    }
}
