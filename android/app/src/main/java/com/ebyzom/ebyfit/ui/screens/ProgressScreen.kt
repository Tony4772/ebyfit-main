package com.ebyzom.ebyfit.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ebyzom.ebyfit.data.FitnessCalculations
import com.ebyzom.ebyfit.data.FitnessRepository
import com.ebyzom.ebyfit.data.WorkoutCatalog
import com.ebyzom.ebyfit.feedback.FeedbackManager
import com.ebyzom.ebyfit.feedback.Sfx
import com.ebyzom.ebyfit.ui.components.EbyfitButton
import com.ebyzom.ebyfit.ui.components.ScreenHeader
import com.ebyzom.ebyfit.ui.components.SectionCard
import com.ebyzom.ebyfit.ui.theme.LocalEbyfitColors

@Composable
fun ProgressScreen(
    fitness: FitnessRepository,
    feedback: FeedbackManager,
) {
    val state by fitness.state.collectAsStateWithLifecycle()
    val c = LocalEbyfitColors.current
    val view = LocalView.current
    var showWeightDialog by remember { mutableStateOf(false) }
    var weightInput by remember { mutableStateOf("") }
    val weekDates = remember { FitnessCalculations.weekDates() }
    val todayKey = remember { FitnessCalculations.todayKey() }

    val loggedByDate = remember(state.workoutLogs) {
        state.workoutLogs.groupBy { it.date }.mapValues { entry -> entry.value.size }
    }
    val maxCount = (loggedByDate.values.maxOrNull() ?: 0).coerceAtLeast(1)
    val latestWeight = state.weightEntries.maxByOrNull { it.date }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        ScreenHeader(title = "Progreso", subtitle = "Tu constancia, día a día")

        SectionCard {
            Text(text = "Sesiones por día (esta semana)", color = c.muted, fontSize = 13.sp)
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                weekDates.forEachIndexed { index, calendar ->
                    val key = FitnessCalculations.dateKey(calendar)
                    val count = loggedByDate[key] ?: 0
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        WeekBar(
                            fraction = count / maxCount.toFloat(),
                            active = count > 0,
                        )
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = WorkoutCatalog.weekLabels[index],
                            color = if (key == todayKey) c.primary else c.muted,
                            fontSize = 12.sp,
                            fontWeight = if (key == todayKey) FontWeight.Bold else FontWeight.Normal,
                        )
                    }
                }
            }
        }

        SectionCard {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(text = "Resumen", color = c.foreground, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                Text(
                    text = "Sesiones totales: ${state.workoutLogs.size}",
                    color = c.muted,
                    fontSize = 13.sp,
                )
                Text(
                    text = "Check-ins guardados: ${state.checkIns.size}",
                    color = c.muted,
                    fontSize = 13.sp,
                )
                Text(
                    text = "Racha actual: ${FitnessCalculations.streak(state.workoutLogs)} días",
                    color = c.muted,
                    fontSize = 13.sp,
                )
            }
        }

        SectionCard {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text(text = "Peso", color = c.foreground, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(2.dp))
                        Text(
                            text = latestWeight?.let { "%.1f kg".format(it.value) } ?: "Sin registros",
                            color = c.muted,
                            fontSize = 13.sp,
                        )
                    }
                }
                EbyfitButton(
                    label = if (latestWeight == null) "Registrar peso" else "Actualizar peso",
                    onClick = { showWeightDialog = true },
                    feedback = feedback,
                    sfx = Sfx.SELECT,
                )
            }
        }
    }

    if (showWeightDialog) {
        AlertDialog(
            onDismissRequest = { showWeightDialog = false },
            title = { Text("Peso de hoy", color = c.foreground) },
            text = {
                OutlinedTextField(
                    value = weightInput,
                    onValueChange = { weightInput = it.filter { ch -> ch.isDigit() || ch == '.' || ch == ',' } },
                    label = { Text("Kilogramos") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        val value = weightInput.replace(',', '.').toDoubleOrNull()
                        if (value != null && value > 0) {
                            fitness.addWeight(todayKey, value)
                            feedback.play(Sfx.SUCCESS)
                            feedback.haptic(view)
                            weightInput = ""
                            showWeightDialog = false
                        }
                    },
                ) { Text("Guardar") }
            },
            dismissButton = {
                TextButton(onClick = { showWeightDialog = false }) { Text("Cancelar") }
            },
        )
    }
}

@Composable
private fun WeekBar(fraction: Float, active: Boolean, modifier: Modifier = Modifier) {
    val c = LocalEbyfitColors.current
    val animated by animateFloatAsState(
        targetValue = fraction,
        animationSpec = tween(durationMillis = 600),
        label = "weekBar",
    )
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = modifier) {
        Spacer(
            modifier = Modifier
                .width(24.dp)
                .height((30 + (animated * 60)).dp)
                .clip(RoundedCornerShape(10.dp))
                .background(if (active) c.primary else c.surface),
        )
    }
}
