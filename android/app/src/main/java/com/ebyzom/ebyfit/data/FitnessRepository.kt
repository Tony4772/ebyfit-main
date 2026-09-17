package com.ebyzom.ebyfit.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

private val Context.fitnessStore by preferencesDataStore(name = "ebyfit_fitness")

class FitnessRepository(context: Context) {

    private val store = context.applicationContext.fitnessStore
    private val json = Json { ignoreUnknownKeys = true }
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val cloud = CloudSyncRepository()

    private val _state = MutableStateFlow(FitnessState())
    val state: StateFlow<FitnessState> = _state.asStateFlow()

    private val _hydrated = MutableStateFlow(false)
    val hydrated: StateFlow<Boolean> = _hydrated.asStateFlow()

    private val _bookings = MutableStateFlow<List<ClassBooking>>(emptyList())
    val bookings: StateFlow<List<ClassBooking>> = _bookings.asStateFlow()

    private val _lastGymCheckIn = MutableStateFlow<GymAccessCheckIn?>(null)
    val lastGymCheckIn: StateFlow<GymAccessCheckIn?> = _lastGymCheckIn.asStateFlow()

    private val _syncMessage = MutableStateFlow<String?>(null)
    val syncMessage: StateFlow<String?> = _syncMessage.asStateFlow()

    init {
        scope.launch {
            val raw = store.data.first()[KEY_STATE]
            if (raw != null) {
                runCatching { json.decodeFromString<FitnessState>(raw) }
                    .getOrNull()
                    ?.let { _state.value = it }
            }
            _hydrated.value = true
            pullFromCloudIfNeeded()
            refreshBookings()
        }
        runCatching {
            FirebaseAuth.getInstance().addAuthStateListener {
                scope.launch {
                    pullFromCloudIfNeeded()
                    refreshBookings()
                }
            }
        }
    }

    fun toggleWorkout(workoutId: String, dateKey: String = FitnessCalculations.todayKey()) {
        val current = _state.value
        val existing = current.workoutLogs.firstOrNull { it.workoutId == workoutId && it.date == dateKey }
        val next = if (existing != null) {
            current.copy(workoutLogs = current.workoutLogs.filterNot { it.id == existing.id })
        } else {
            current.copy(
                workoutLogs = current.workoutLogs + WorkoutLog(
                    id = "$workoutId-$dateKey",
                    workoutId = workoutId,
                    date = dateKey,
                ),
            )
        }
        update(next)
    }

    fun isWorkoutComplete(workoutId: String, dateKey: String = FitnessCalculations.todayKey()): Boolean =
        _state.value.workoutLogs.any { it.workoutId == workoutId && it.date == dateKey }

    fun saveCheckIn(dateKey: String, mood: Mood, energy: Int, note: String) {
        val current = _state.value
        update(current.copy(checkIns = current.checkIns + (dateKey to CheckIn(dateKey, mood, energy, note))))
    }

    fun addWeight(dateKey: String, value: Double) {
        val current = _state.value
        update(
            current.copy(
                weightEntries = (current.weightEntries.filterNot { it.date == dateKey } +
                    WeightEntry(id = "$dateKey-${System.currentTimeMillis()}", date = dateKey, value = value))
                    .sortedByDescending { it.date },
            ),
        )
    }

    fun bookClass(gymClass: GymClass, onDone: (Result<ClassBooking>) -> Unit) {
        scope.launch {
            val result = runCatching {
                cloud.bookClass(gymClass, FitnessCalculations.todayKey()).also {
                    refreshBookings()
                }
            }
            onDone(result)
        }
    }

    fun cancelBooking(bookingId: String, onDone: (Result<Unit>) -> Unit) {
        scope.launch {
            val result = runCatching {
                cloud.cancelBooking(bookingId)
                refreshBookings()
            }
            onDone(result)
        }
    }

    fun gymAccessCheckIn(onDone: (Result<GymAccessCheckIn>) -> Unit) {
        scope.launch {
            val result = runCatching {
                cloud.registerGymAccess().also { _lastGymCheckIn.value = it }
            }
            onDone(result)
        }
    }

    fun clearSyncMessage() {
        _syncMessage.value = null
    }

    private fun update(next: FitnessState) {
        _state.value = next
        scope.launch {
            store.edit { it[KEY_STATE] = json.encodeToString(next) }
            runCatching { cloud.pushFitnessState(next) }
                .onFailure { _syncMessage.value = "Sin conexión a la nube: progreso guardado en el dispositivo" }
        }
    }

    private suspend fun pullFromCloudIfNeeded() {
        val remote = runCatching { cloud.pullFitnessState() }.getOrNull() ?: return
        if (remote.workoutLogs.size >= _state.value.workoutLogs.size ||
            remote.checkIns.size >= _state.value.checkIns.size
        ) {
            _state.value = remote
            store.edit { it[KEY_STATE] = json.encodeToString(remote) }
        }
    }

    private suspend fun refreshBookings() {
        _bookings.value = runCatching { cloud.listBookings() }.getOrDefault(emptyList())
    }

    private companion object {
        val KEY_STATE = stringPreferencesKey("state_json")
    }
}
