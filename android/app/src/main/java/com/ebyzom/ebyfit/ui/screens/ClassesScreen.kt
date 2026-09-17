package com.ebyzom.ebyfit.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EventAvailable
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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
import com.ebyzom.ebyfit.auth.FirebaseAuthManager
import com.ebyzom.ebyfit.data.FitnessRepository
import com.ebyzom.ebyfit.data.GymCatalog
import com.ebyzom.ebyfit.data.GymClass
import com.ebyzom.ebyfit.data.Trainer
import com.ebyzom.ebyfit.feedback.FeedbackManager
import com.ebyzom.ebyfit.feedback.Sfx
import com.ebyzom.ebyfit.ui.components.EbyfitButton
import com.ebyzom.ebyfit.ui.components.ScreenHeader
import com.ebyzom.ebyfit.ui.components.clickableWithSound
import com.ebyzom.ebyfit.ui.theme.LocalEbyfitColors

@Composable
fun ClassesScreen(
    fitness: FitnessRepository,
    auth: FirebaseAuthManager,
    feedback: FeedbackManager,
    onNeedLogin: () -> Unit,
) {
    val bookings by fitness.bookings.collectAsStateWithLifecycle()
    val user by auth.user.collectAsStateWithLifecycle()
    val lastCheckIn by fitness.lastGymCheckIn.collectAsStateWithLifecycle()
    val c = LocalEbyfitColors.current
    val view = LocalView.current
    var status by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    val bookedIds = remember(bookings) { bookings.map { it.classId }.toSet() }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(c.background),
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            ScreenHeader(
                title = "Clases y acceso",
                subtitle = GymCatalog.branchName,
            )
        }

        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .height(170.dp),
            ) {
                Image(
                    painter = painterResource(GymCatalog.lobbyImage),
                    contentDescription = "Lobby del gimnasio",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color.Transparent, Color(0xCC0B0F0D)),
                            ),
                        ),
                )
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(16.dp),
                ) {
                    Text("Bienvenido a EbyFit", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
                    Text(
                        lastCheckIn?.let { "Último acceso hoy · ${GymCatalog.branchName}" }
                            ?: "Haz check-in al llegar al centro",
                        color = Color(0xCCFFFFFF),
                        fontSize = 13.sp,
                    )
                }
            }
        }

        item {
            EbyfitButton(
                label = if (busy) "Registrando..." else "Check-in de acceso al gym",
                onClick = {
                    if (user == null) {
                        onNeedLogin()
                        return@EbyfitButton
                    }
                    busy = true
                    feedback.play(Sfx.SUCCESS)
                    feedback.haptic(view, strong = true)
                    fitness.gymAccessCheckIn { result ->
                        busy = false
                        status = result.fold(
                            onSuccess = { "Acceso registrado en ${it.branch}" },
                            onFailure = { it.message ?: "No se pudo registrar el acceso" },
                        )
                    }
                },
                feedback = feedback,
                sfx = Sfx.STREAK,
            )
        }

        item {
            Text("Entrenadores", color = c.foreground, fontWeight = FontWeight.Bold, fontSize = 18.sp)
        }

        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                items(GymCatalog.trainers, key = { it.id }) { trainer ->
                    TrainerCard(trainer)
                }
            }
        }

        item {
            Text("Horario de clases", color = c.foreground, fontWeight = FontWeight.Bold, fontSize = 18.sp)
        }

        items(GymCatalog.classes, key = { it.id }) { gymClass ->
            ClassCard(
                gymClass = gymClass,
                booked = bookedIds.contains(gymClass.id),
                onBook = {
                    if (user == null) {
                        onNeedLogin()
                        return@ClassCard
                    }
                    feedback.play(Sfx.SELECT)
                    feedback.haptic(view)
                    fitness.bookClass(gymClass) { result ->
                        status = result.fold(
                            onSuccess = { "Reservaste ${it.title} · ${it.time}" },
                            onFailure = { it.message ?: "No se pudo reservar" },
                        )
                    }
                },
                onCancel = {
                    val booking = bookings.firstOrNull { it.classId == gymClass.id } ?: return@ClassCard
                    feedback.play(Sfx.TOGGLE)
                    fitness.cancelBooking(booking.id) { result ->
                        status = result.fold(
                            onSuccess = { "Reserva cancelada" },
                            onFailure = { it.message ?: "No se pudo cancelar" },
                        )
                    }
                },
            )
        }

        if (!status.isNullOrBlank()) {
            item {
                Text(text = status!!, color = c.primary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        if (bookings.isNotEmpty()) {
            item {
                Text("Tus reservas", color = c.foreground, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            }
            items(bookings, key = { it.id }) { booking ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(c.surface)
                        .border(1.dp, c.border, RoundedCornerShape(16.dp))
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(Icons.Filled.EventAvailable, contentDescription = null, tint = c.primary)
                    Spacer(Modifier.width(10.dp))
                    Column(Modifier.weight(1f)) {
                        Text(booking.title, color = c.foreground, fontWeight = FontWeight.Bold)
                        Text("${booking.date} · ${booking.time}", color = c.muted, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun TrainerCard(trainer: Trainer) {
    val c = LocalEbyfitColors.current
    Column(
        modifier = Modifier
            .width(180.dp)
            .clip(RoundedCornerShape(20.dp))
            .background(c.surface)
            .border(1.dp, c.border, RoundedCornerShape(20.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Image(
            painter = painterResource(trainer.image),
            contentDescription = trainer.name,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape),
        )
        Text(trainer.name, color = c.foreground, fontWeight = FontWeight.Bold, fontSize = 15.sp)
        Text(trainer.specialty, color = c.muted, fontSize = 12.sp, maxLines = 2)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Filled.Star, contentDescription = null, tint = c.warning, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(4.dp))
            Text("${trainer.rating} · ${trainer.sessions} sesiones", color = c.muted, fontSize = 11.sp)
        }
    }
}

@Composable
private fun ClassCard(
    gymClass: GymClass,
    booked: Boolean,
    onBook: () -> Unit,
    onCancel: () -> Unit,
) {
    val c = LocalEbyfitColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(c.surface)
            .border(1.dp, if (booked) c.primary else c.border, RoundedCornerShape(22.dp)),
    ) {
        Box {
            Image(
                painter = painterResource(gymClass.image),
                contentDescription = gymClass.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp),
            )
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(10.dp)
                    .clip(RoundedCornerShape(50))
                    .background(Color(0xCC0B0F0D))
                    .padding(horizontal = 10.dp, vertical = 4.dp),
            ) {
                Text("${gymClass.spotsLeft} cupos", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }
        Column(
            Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(gymClass.title, color = c.foreground, fontWeight = FontWeight.Bold, fontSize = 17.sp)
            Text(
                "${gymClass.dayLabel} · ${gymClass.time} · ${gymClass.durationMin} min",
                color = c.muted,
                fontSize = 13.sp,
            )
            Text(
                "${gymClass.coach} · ${gymClass.room} · ${gymClass.level}",
                color = c.muted,
                fontSize = 12.sp,
            )
            Spacer(Modifier.height(4.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(if (booked) c.border else c.primary)
                    .clickableWithSound { if (booked) onCancel() else onBook() }
                    .padding(vertical = 12.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = if (booked) "Cancelar reserva" else "Reservar clase",
                    color = if (booked) c.foreground else Color(0xFF0B0F0D),
                    fontWeight = FontWeight.Bold,
                )
            }
        }
    }
}
