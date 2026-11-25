package com.khanai.assistant.storage

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "khan_ai_settings")

data class AiSettings(
    val provider: String = "gemini", // "gemini" or "ollama"
    val geminiApiKey: String = "",
    val geminiModel: String = "gemini-4-hydrogen",
    val ollamaBaseUrl: String = "http://192.168.1.10:11434",
    val ollamaModel: String = "llama3.2:3b",
    val voiceLocale: String = "en-US" // "en-US" or "ur-PK"
)

class SettingsStore(private val context: Context) {
    private object Keys {
        val PROVIDER = stringPreferencesKey("provider")
        val GEMINI_KEY = stringPreferencesKey("gemini_api_key")
        val GEMINI_MODEL = stringPreferencesKey("gemini_model")
        val OLLAMA_URL = stringPreferencesKey("ollama_base_url")
        val OLLAMA_MODEL = stringPreferencesKey("ollama_model")
        val VOICE_LOCALE = stringPreferencesKey("voice_locale")
    }

    val settingsFlow: Flow<AiSettings> = context.dataStore.data.map { prefs ->
        AiSettings(
            provider = prefs[Keys.PROVIDER] ?: "gemini",
            geminiApiKey = prefs[Keys.GEMINI_KEY] ?: "",
            geminiModel = prefs[Keys.GEMINI_MODEL] ?: "gemini-4-hydrogen",
            ollamaBaseUrl = prefs[Keys.OLLAMA_URL] ?: "http://192.168.1.10:11434",
            ollamaModel = prefs[Keys.OLLAMA_MODEL] ?: "llama3.2:3b",
            voiceLocale = prefs[Keys.VOICE_LOCALE] ?: "en-US"
        )
    }

    suspend fun saveSettings(settings: AiSettings) {
        context.dataStore.edit { prefs ->
            prefs[Keys.PROVIDER] = settings.provider
            prefs[Keys.GEMINI_KEY] = settings.geminiApiKey.trim()
            prefs[Keys.GEMINI_MODEL] = settings.geminiModel.trim().ifEmpty { "gemini-4-hydrogen" }
            prefs[Keys.OLLAMA_URL] = settings.ollamaBaseUrl.trim().trimEnd('/')
            prefs[Keys.OLLAMA_MODEL] = settings.ollamaModel.trim().ifEmpty { "llama3.2:3b" }
            prefs[Keys.VOICE_LOCALE] = settings.voiceLocale
        }
    }
}
