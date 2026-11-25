package com.khanai.assistant.network

import com.khanai.assistant.storage.ChatEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader

class OllamaClient(
    private val baseUrl: String,
    private val model: String = "llama3.2:3b",
    private val httpClient: OkHttpClient = GeminiClient.sharedClient
) : AiProviderClient {

    override fun streamReply(
        systemInstruction: String,
        history: List<ChatEntity>,
        userPrompt: String
    ): Flow<String> = flow {
        if (baseUrl.isBlank()) {
            throw IllegalStateException("Ollama URL is empty. Set your local/private server URL in Settings.")
        }

        val messagesArray = JSONArray().apply {
            put(JSONObject().put("role", "system").put("content", systemInstruction))
            history.takeLast(10).forEach { msg ->
                put(JSONObject().put("role", msg.role).put("content", msg.content))
            }
            put(JSONObject().put("role", "user").put("content", userPrompt))
        }

        val payload = JSONObject().apply {
            put("model", model)
            put("messages", messagesArray)
            put("stream", true)
        }

        val endpoint = "${baseUrl.trimEnd('/')}/api/chat"
        val request = Request.Builder()
            .url(endpoint)
            .addHeader("Content-Type", "application/json")
            .post(payload.toString().toRequestBody("application/json; charset=utf-8".toMediaType()))
            .build()

        httpClient.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IllegalStateException("Ollama endpoint error (${response.code}). Check URL and server status.")
            }
            val bodyStream = response.body?.byteStream()
                ?: throw IllegalStateException("Empty stream from Ollama.")

            BufferedReader(bodyStream.reader(Charsets.UTF_8)).use { reader ->
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    val trimmed = line?.trim().orEmpty()
                    if (trimmed.isEmpty()) continue
                    val chunkJson = JSONObject(trimmed)
                    val delta = chunkJson.optJSONObject("message")?.optString("content").orEmpty()
                    if (delta.isNotEmpty()) emit(delta)
                    if (chunkJson.optBoolean("done", false)) break
                }
            }
        }
    }.flowOn(Dispatchers.IO)
}
