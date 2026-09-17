package com.ebyzom.ebyfit.data

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.tasks.await
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Sincroniza el progreso del socio y las reservas con Cloud Firestore.
 */
class CloudSyncRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val db: FirebaseFirestore = FirebaseFirestore.getInstance(),
) {
    private val json = Json { ignoreUnknownKeys = true }

    val uid: String? get() = auth.currentUser?.uid

    suspend fun upsertUserProfile(displayName: String?, email: String?) {
        val userId = uid ?: return
        val payload = hashMapOf(
            "displayName" to (displayName ?: ""),
            "email" to (email ?: ""),
            "membershipId" to "pro",
            "branch" to GymCatalog.branchName,
            "updatedAt" to System.currentTimeMillis(),
        )
        db.collection("users").document(userId).set(payload, SetOptions.merge()).await()
    }

    suspend fun pushFitnessState(state: FitnessState) {
        val userId = uid ?: return
        db.collection("users").document(userId)
            .collection("meta").document("fitness")
            .set(
                mapOf(
                    "payload" to json.encodeToString(state),
                    "updatedAt" to System.currentTimeMillis(),
                ),
                SetOptions.merge(),
            ).await()
    }

    suspend fun pullFitnessState(): FitnessState? {
        val userId = uid ?: return null
        val snap = db.collection("users").document(userId)
            .collection("meta").document("fitness")
            .get().await()
        val raw = snap.getString("payload") ?: return null
        return runCatching { json.decodeFromString<FitnessState>(raw) }.getOrNull()
    }

    suspend fun bookClass(gymClass: GymClass, dateKey: String): ClassBooking {
        val userId = uid ?: error("Debes iniciar sesión para reservar")
        val booking = ClassBooking(
            id = "${gymClass.id}-$dateKey-$userId",
            classId = gymClass.id,
            userId = userId,
            date = dateKey,
            title = gymClass.title,
            time = gymClass.time,
        )
        db.collection("bookings").document(booking.id).set(
            mapOf(
                "id" to booking.id,
                "classId" to booking.classId,
                "userId" to booking.userId,
                "date" to booking.date,
                "title" to booking.title,
                "time" to booking.time,
                "createdAt" to System.currentTimeMillis(),
            ),
        ).await()
        return booking
    }

    suspend fun cancelBooking(bookingId: String) {
        db.collection("bookings").document(bookingId).delete().await()
    }

    suspend fun listBookings(): List<ClassBooking> {
        val userId = uid ?: return emptyList()
        val snap = db.collection("bookings").whereEqualTo("userId", userId).get().await()
        return snap.documents.mapNotNull { doc ->
            ClassBooking(
                id = doc.getString("id") ?: doc.id,
                classId = doc.getString("classId") ?: return@mapNotNull null,
                userId = doc.getString("userId") ?: userId,
                date = doc.getString("date") ?: "",
                title = doc.getString("title") ?: "",
                time = doc.getString("time") ?: "",
            )
        }
    }

    suspend fun registerGymAccess(): GymAccessCheckIn {
        val userId = uid ?: error("Debes iniciar sesión para hacer check-in")
        val now = System.currentTimeMillis()
        val date = FitnessCalculations.todayKey()
        val checkIn = GymAccessCheckIn(
            id = "$userId-$now",
            userId = userId,
            date = date,
            timestampMs = now,
            branch = GymCatalog.branchName,
        )
        db.collection("gymCheckIns").document(checkIn.id).set(
            mapOf(
                "id" to checkIn.id,
                "userId" to checkIn.userId,
                "date" to checkIn.date,
                "timestampMs" to checkIn.timestampMs,
                "branch" to checkIn.branch,
            ),
        ).await()
        return checkIn
    }
}
