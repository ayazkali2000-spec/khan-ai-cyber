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
import java.util.concurrent.TimeUnit

class GeminiClient(
    private val apiKey: String,
    private val model: String = "gemini-4-hydrogen",
    private val httpClient: OkHttpClient = sharedClient
) : AiProviderClient {

    override fun streamReply(
        systemInstruction: String,
        history: List<ChatEntity>,
        userPrompt: String
    ): Flow<String> = flow {
        if (apiKey.isBlank()) {
            throw IllegalStateException("Gemini API key is missing. Add your free-tier key in Settings.")
        }

        val contentsArray = JSONArray()
        history.takeLast(12).forEach { msg ->
            contentsArray.put(
                JSONObject().apply {
                    put("role", if (msg.role == "assistant") "model" else "user")
                    put("parts", JSONArray().put(JSONObject().put("text", msg.content)))
                }
            )
        }
        contentsArray.put(
            JSONObject().apply {
                put("role", "user")
                put("parts", JSONArray().put(JSONObject().put("text", userPrompt)))
            }
        )

        val payload = JSONObject().apply {
            put(
                "systemInstruction",
                JSONObject().put("parts", JSONArray().put(JSONObject().put("text", systemInstruction)))
            )
            put("contents", contentsArray)
        }

        val url = "https://generativelanguage.googleapis.com/v1beta/models/$model:streamGenerateContent?alt=sse"
        val request = Request.Builder()
            .url(url)
            .addHeader("x-goog-api-key", apiKey)
            .addHeader("Content-Type", "application/json")
            .post(payload.toString().toRequestBody("application/json; charset=utf-8".toMediaType()))
            .build()

        httpClient.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                val errBody = response.body?.string().orEmpty()
                throw IllegalStateException("Gemini API error (${response.code}): ${errBody.take(180)}")
            }

            val bodyStream = response.body?.byteStream()
                ?: throw IllegalStateException("Empty response stream from Gemini.")

            BufferedReader(bodyStream.reader(Charsets.UTF_8)).use { reader ->
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    val trimmed = line?.trim().orEmpty()
                    if (!trimmed.startsWith("data:")) continue
                    val jsonStr = trimmed.removePrefix("data:").trim()
                    if (jsonStr.isEmpty() || jsonStr == "[DONE]") continue

                    val root = JSONObject(jsonStr)
                    val candidates = root.optJSONArray("candidates") ?: continue
                    val firstCandidate = candidates.optJSONObject(0) ?: continue
                    val content = firstCandidate.optJSONObject("content") ?: continue
                    val parts = content.optJSONArray("parts") ?: continue
                    for (i in 0 until parts.length()) {
                        val chunkText = parts.optJSONObject(i)?.optString("text").orEmpty()
                        if (chunkText.isNotEmpty()) emit(chunkText)
                    }
                }
            }
        }
    }.flowOn(Dispatchers.IO)

    companion object {
        val sharedClient: OkHttpClient by lazy {
            OkHttpClient.Builder()
                .connectTimeout(20, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .build()
        }
    }
}
