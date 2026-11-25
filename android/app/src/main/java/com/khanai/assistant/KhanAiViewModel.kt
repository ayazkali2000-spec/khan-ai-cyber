package com.khanai.assistant

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.khanai.assistant.agents.AssistantMode
import com.khanai.assistant.agents.ModePromptRouter
import com.khanai.assistant.network.AiProviderClient
import com.khanai.assistant.network.GeminiClient
import com.khanai.assistant.network.OllamaClient
import com.khanai.assistant.storage.AiSettings
import com.khanai.assistant.storage.ChatDatabase
import com.khanai.assistant.storage.ChatEntity
import com.khanai.assistant.storage.SettingsStore
import com.khanai.assistant.voice.VoiceInputManager
import com.khanai.assistant.voice.VoiceOutputManager
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class KhanAiViewModel(application: Application) : AndroidViewModel(application) {

    private val chatDao = ChatDatabase.getInstance(application).chatDao()
    private val settingsStore = SettingsStore(application)
    private val voiceInput = VoiceInputManager(application)
    private val voiceOutput = VoiceOutputManager(application)

    private val _activeMode = MutableStateFlow(AssistantMode.GENERAL)
    val activeMode: StateFlow<AssistantMode> = _activeMode.asStateFlow()

    private val _isStreaming = MutableStateFlow(false)
    val isStreaming: StateFlow<Boolean> = _isStreaming.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    val settings: StateFlow<AiSettings> = settingsStore.settingsFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, AiSettings())

    @OptIn(ExperimentalCoroutinesApi::class)
    val messages: StateFlow<List<ChatEntity>> = _activeMode
        .flatMapLatest { mode -> chatDao.observeMessagesByMode(mode.id) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun selectMode(mode: AssistantMode) {
        _activeMode.value = mode
        _errorMessage.value = null
    }

    fun saveSettings(updated: AiSettings) {
        viewModelScope.launch {
            settingsStore.saveSettings(updated)
            _errorMessage.value = null
        }
    }

    fun sendMessage(userText: String) {
        if (userText.isBlank() || _isStreaming.value) return
        val mode = _activeMode.value
        val currentSettings = settings.value
        val historySnapshot = messages.value

        viewModelScope.launch {
            _isStreaming.value = true
            _errorMessage.value = null

            chatDao.insertMessage(
                ChatEntity(sessionId = "default", modeId = mode.id, role = "user", content = userText)
            )
            val assistantRowId = chatDao.insertMessage(
                ChatEntity(sessionId = "default", modeId = mode.id, role = "assistant", content = "")
            )

            val client: AiProviderClient = if (currentSettings.provider == "ollama") {
                OllamaClient(
                    baseUrl = currentSettings.ollamaBaseUrl,
                    model = currentSettings.ollamaModel
                )
            } else {
                GeminiClient(
                    apiKey = currentSettings.geminiApiKey,
                    model = currentSettings.geminiModel
                )
            }

            val accumulated = StringBuilder()
            try {
                client.streamReply(
                    systemInstruction = ModePromptRouter.systemInstructionFor(mode),
                    history = historySnapshot,
                    userPrompt = userText
                ).collect { chunk ->
                    accumulated.append(chunk)
                    chatDao.updateMessageContent(assistantRowId, accumulated.toString())
                }
            } catch (ex: Exception) {
                _errorMessage.value = ex.message ?: "Request failed. Check API key or network."
                if (accumulated.isEmpty()) {
                    chatDao.updateMessageContent(assistantRowId, "Error: ${_errorMessage.value}")
                }
            } finally {
                _isStreaming.value = false
            }
        }
    }

    fun clearCurrentModeChat() {
        viewModelScope.launch {
            chatDao.clearModeHistory(_activeMode.value.id)
        }
    }

    fun startVoiceInput(
        localeTag: String,
        onPartial: (String) -> Unit,
        onFinal: (String) -> Unit,
        onError: () -> Unit
    ) {
        voiceInput.startListening(
            localeTag = localeTag,
            onPartialResult = onPartial,
            onFinalResult = onFinal,
            onError = { msg ->
                _errorMessage.value = msg
                onError()
            }
        )
    }

    fun stopVoiceInput() {
        voiceInput.stopListening()
    }

    fun speakReply(text: String, localeTag: String) {
        voiceOutput.speak(text, localeTag)
    }

    override fun onCleared() {
        super.onCleared()
        voiceInput.stopListening()
        voiceOutput.release()
    }
}
