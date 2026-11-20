package com.abanoubai.companion

import java.util.Base64
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * Rejects a Supabase session issued by a different project before the companion
 * sends it to this app's configured Supabase URL.
 *
 * This is only a project-alignment guard. It does not validate the JWT signature
 * or replace Supabase Auth/PostgREST verification on the server.
 */
internal object SupabaseSessionPolicy {
    fun issuer(accessToken: String): String? {
        val parts = accessToken.split('.')
        if (parts.size != 3 || parts[1].isBlank()) return null

        return runCatching {
            val payload = Base64.getUrlDecoder().decode(parts[1]).toString(Charsets.UTF_8)
            Json.parseToJsonElement(payload).jsonObject["iss"]?.jsonPrimitive?.contentOrNull
        }.getOrNull()?.takeIf { it.isNotBlank() }
    }

    fun matchesProject(accessToken: String, supabaseUrl: String): Boolean {
        val baseUrl = supabaseUrl.trim().trimEnd('/')
        if (!baseUrl.startsWith("https://")) return false
        return issuer(accessToken) == "$baseUrl/auth/v1"
    }
}
