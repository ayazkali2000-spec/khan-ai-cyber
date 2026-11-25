package com.khanai.assistant.storage

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "chat_messages")
data class ChatEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val sessionId: String,
    val modeId: String,
    val role: String, // "user" or "assistant"
    val content: String,
    val timestampMs: Long = System.currentTimeMillis()
)
