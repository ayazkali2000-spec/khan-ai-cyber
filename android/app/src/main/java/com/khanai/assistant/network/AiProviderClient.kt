package com.khanai.assistant.network

import com.khanai.assistant.storage.ChatEntity
import kotlinx.coroutines.flow.Flow

interface AiProviderClient {
    fun streamReply(
        systemInstruction: String,
        history: List<ChatEntity>,
        userPrompt: String
    ): Flow<String>
}
