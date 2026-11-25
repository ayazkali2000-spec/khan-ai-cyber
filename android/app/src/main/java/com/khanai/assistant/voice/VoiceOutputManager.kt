package com.khanai.assistant.voice

import android.content.Context
import android.speech.tts.TextToSpeech
import java.util.Locale

class VoiceOutputManager(context: Context) {
    private var tts: TextToSpeech? = null
    private var isReady = false

    init {
        tts = TextToSpeech(context.applicationContext) { status ->
            isReady = status == TextToSpeech.SUCCESS
        }
    }

    fun speak(text: String, localeTag: String) {
        if (!isReady || text.isBlank()) return
        val cleanText = text
            .replace("```", " ")
            .replace("*", "")
            .replace("#", "")
            .trim()
        val locale = if (localeTag.startsWith("ur")) Locale("ur", "PK") else Locale.US
        tts?.language = locale
        tts?.speak(cleanText, TextToSpeech.QUEUE_FLUSH, null, "khan_ai_tts")
    }

    fun stop() {
        tts?.stop()
    }

    fun release() {
        tts?.stop()
        tts?.shutdown()
        tts = null
    }
}
