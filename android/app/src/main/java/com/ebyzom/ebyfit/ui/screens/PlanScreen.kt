package com.ebyzom.ebyfit.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ebyzom.ebyfit.data.Accent
import com.ebyzom.ebyfit.data.FitnessCalculations
import com.ebyzom.ebyfit.data.FitnessRepository
import com.ebyzom.ebyfit.data.Workout
import com.ebyzom.ebyfit.data.WorkoutCatalog
import com.ebyzom.ebyfit.feedback.FeedbackManager
import com.ebyzom.ebyfit.feedback.Sfx
import com.ebyzom.ebyfit.ui.components.AnimatedProgressBar
import com.ebyzom.ebyfit.ui.components.ScreenHeader
import com.ebyzom.ebyfit.ui.theme.LocalEbyfitColors
import com.ebyzom.ebyfit.ui.theme.primarySubtle

@Composable
fun PlanScreen(
    fitness: FitnessRepository,
    feedback: FeedbackManager,
) {
    val state by fitness.state.collectAsStateWithLifecycle()
    val c = LocalEbyfitColors.current
    val view = LocalView.current

    val sessions = FitnessCalculations.weeklySessions(state.workoutLogs)
    val percent = FitnessCalculations.weeklyProgressPercent(sessions)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(c.background),
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item { ScreenHeader(title = "Plan semanal", subtitle = "Tu meta: ${FitnessCalculations.WEEKLY_GOAL} sesiones por semana") }
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(22.dp))
                    .background(c.surface)
                    .padding(16.dp),
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(text = "Progreso de la semana", color = c.muted, fontSize = 13.sp)
                        Text(
                            text = "$sessions/${FitnessCalculations.WEEKLY_GOAL}",
                            color = c.primary,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold,
                        )
                    }
                    Spacer(Modifier.height(10.dp))
                    AnimatedProgressBar(fraction = percent / 100f)
                }
            }
        }
        item {
            Text(text = "Entrenamientos disponibles", color = c.foreground, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        }
        items(WorkoutCatalog.workouts, key = { it.id }) { workout ->
            val doneToday = fitness.isWorkoutComplete(workout.id)
            WorkoutPlanRow(
                workout = workout,
                doneToday = doneToday,
                onToggle = {
                    fitness.toggleWorkout(workout.id)
                    if (!doneToday) {
                        feedback.play(Sfx.SUCCESS)
                        feedback.haptic(view, strong = true)
                    } else {
                        feedback.play(Sfx.TAP)
                        feedback.haptic(view)
                    }
                },
            )
        }
        item {
            Text(text = "Objetivos", color = c.foreground, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        }
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(22.dp))
                    .background(c.surface)
                    .padding(16.dp),
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    WorkoutCatalog.goals.forEach { (name, value) ->
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Text(text = name, color = c.foreground, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                                Text(text = value, color = c.primary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            }
                            Spacer(Modifier.height(6.dp))
                            AnimatedProgressBar(fraction = value.removeSuffix("%").toIntOrNull()?.div(100f) ?: 0.5f)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun WorkoutPlanRow(
    workout: Workout,
    doneToday: Boolean,
    onToggle: () -> Unit,
) {
    val c = LocalEbyfitColors.current
    val accent = when (workout.accent) {
        Accent.PRIMARY -> c.primary
        Accent.AQUA -> Color(0xFF6FD8C0)
        Accent.ORANGE -> Color(0xFFF2A45C)
    }
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(c.surface)
            .border(1.dp, if (doneToday) accent else c.border, RoundedCornerShape(20.dp))
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onToggle,
            )
            .padding(14.dp),
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .background(if (doneToday) accent else c.primarySubtle),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = Icons.Filled.PlayArrow,
                contentDescription = if (doneToday) "Completado" else "Completar",
                tint = if (doneToday) Color(0xFF0B0F0D) else c.primary,
            )
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(text = workout.title, color = c.foreground, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(2.dp))
            Text(
                text = "${workout.category} · ${workout.duration} · ${workout.level}",
                color = c.muted,
                fontSize = 12.sp,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = workout.exercises.joinToString(" · "),
                color = c.muted,
                fontSize = 11.sp,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}
