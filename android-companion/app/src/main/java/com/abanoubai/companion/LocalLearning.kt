package com.abanoubai.companion

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** Small bounded on-device memory: successful plans, corrections, and important contacts. */
object LocalLearning {
    private const val PREFS = "companion_learning"
    private const val SUCCESSFUL = "successful_plans"
    private const val CONTACTS = "important_contacts"

    fun rememberSuccess(context: Context, request: String, plan: String) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val array = runCatching { JSONArray(prefs.getString(SUCCESSFUL, "[]")) }.getOrDefault(JSONArray())
        array.put(JSONObject().put("request", request.take(500)).put("plan", plan.take(4000)).put("at", System.currentTimeMillis().toString()))
        while (array.length() > 40) array.remove(0)
        prefs.edit().putString(SUCCESSFUL, array.toString()).apply()
    }

    fun rememberContact(context: Context, name: String, value: String) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val contacts = runCatching { JSONObject(prefs.getString(CONTACTS, "{}") ?: "{}") }.getOrDefault(JSONObject())
        contacts.put(name.take(80), value.take(160))
        prefs.edit().putString(CONTACTS, contacts.toString()).apply()
    }

    fun rag(context: Context, request: String): String {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val array = runCatching { JSONArray(prefs.getString(SUCCESSFUL, "[]")) }.getOrDefault(JSONArray())
        val terms = request.lowercase().split(Regex("\\s+")).filter { it.length > 2 }.toSet()
        val matches = (0 until array.length()).mapNotNull { array.optJSONObject(it) }.filter { obj ->
            val text = obj.optString("request").lowercase()
            terms.any { text.contains(it) }
        }.takeLast(4)
        return matches.joinToString("\n") { "طلب سابق: ${it.optString("request")}\nخطة ناجحة: ${it.optString("plan")}" }
    }

    fun contactsSummary(context: Context): String = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(CONTACTS, "{}") ?: "{}"
}
