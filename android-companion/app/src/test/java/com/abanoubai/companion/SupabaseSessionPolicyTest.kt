package com.abanoubai.companion

import java.util.Base64
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SupabaseSessionPolicyTest {
    private fun jwt(issuer: String): String {
        fun encode(value: String) =
            Base64.getUrlEncoder().withoutPadding().encodeToString(value.toByteArray(Charsets.UTF_8))

        val header = encode("""{"alg":"HS256","typ":"JWT"}""")
        val payload = encode("""{"iss":"$issuer"}""")
        return "$header.$payload.test-signature"
    }

    @Test
    fun acceptsSessionFromConfiguredProject() {
        val url = "https://wobfdslqlmvlatyrtgkd.supabase.co"
        assertTrue(SupabaseSessionPolicy.matchesProject(jwt("$url/auth/v1"), url))
    }

    @Test
    fun normalizesTrailingSlashInConfiguredUrl() {
        val url = "https://wobfdslqlmvlatyrtgkd.supabase.co/"
        assertTrue(SupabaseSessionPolicy.matchesProject(
            jwt("https://wobfdslqlmvlatyrtgkd.supabase.co/auth/v1"),
            url
        ))
    }

    @Test
    fun rejectsSessionFromAnotherSupabaseProject() {
        val token = jwt("https://another-project.supabase.co/auth/v1")
        assertFalse(SupabaseSessionPolicy.matchesProject(
            token,
            "https://wobfdslqlmvlatyrtgkd.supabase.co"
        ))
    }

    @Test
    fun rejectsMalformedOrMissingIssuer() {
        assertFalse(SupabaseSessionPolicy.matchesProject("not-a-jwt", "https://wobfdslqlmvlatyrtgkd.supabase.co"))
        assertFalse(SupabaseSessionPolicy.matchesProject(
            "header.e30.signature",
            "https://wobfdslqlmvlatyrtgkd.supabase.co"
        ))
    }

    @Test
    fun rejectsNonHttpsOrMissingProjectUrl() {
        val token = jwt("https://wobfdslqlmvlatyrtgkd.supabase.co/auth/v1")
        assertFalse(SupabaseSessionPolicy.matchesProject(token, "http://wobfdslqlmvlatyrtgkd.supabase.co"))
        assertFalse(SupabaseSessionPolicy.matchesProject(token, ""))
    }
}
