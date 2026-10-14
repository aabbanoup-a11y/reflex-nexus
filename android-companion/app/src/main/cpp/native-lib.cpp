#include <jni.h>
#include <android/log.h>
#include <algorithm>
#include <mutex>
#include <string>
#include <vector>
#include <unistd.h>
#include "llama.h"

#define TAG "QwenEngine"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

static llama_model * g_model = nullptr;
static std::mutex g_mutex;

static std::string jstring_to_string(JNIEnv * env, jstring value) {
    if (!value) return {};
    const char * raw = env->GetStringUTFChars(value, nullptr);
    std::string result = raw ? raw : "";
    env->ReleaseStringUTFChars(value, raw);
    return result;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_abanoubai_companion_QwenEngine_nativeLoad(JNIEnv * env, jobject, jstring path) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_model) return JNI_TRUE;
    llama_backend_init();
    auto params = llama_model_default_params();
    params.n_gpu_layers = 0;
    const std::string model_path = jstring_to_string(env, path);
    g_model = llama_model_load_from_file(model_path.c_str(), params);
    if (!g_model) LOGE("Unable to load model: %s", model_path.c_str());
    return g_model ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_abanoubai_companion_QwenEngine_nativeGenerate(JNIEnv * env, jobject, jstring prompt, jint maxTokens) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (!g_model) return env->NewStringUTF("");
    const auto * vocab = llama_model_get_vocab(g_model);
    const std::string input = jstring_to_string(env, prompt);
    const int n_prompt = -llama_tokenize(vocab, input.c_str(), (int32_t) input.size(), nullptr, 0, true, true);
    if (n_prompt <= 0) return env->NewStringUTF("");
    std::vector<llama_token> tokens(n_prompt);
    if (llama_tokenize(vocab, input.c_str(), (int32_t) input.size(), tokens.data(), tokens.size(), true, true) < 0) return env->NewStringUTF("");

    auto ctx_params = llama_context_default_params();
    // Keep the context small for 2 GB Android devices. The model is optional;
    // deterministic handlers remain available if allocation still fails.
    ctx_params.n_ctx = std::min<uint32_t>(2048, std::max<uint32_t>(768, n_prompt + maxTokens + 8));
    ctx_params.n_batch = std::min<uint32_t>(64, ctx_params.n_ctx);
    ctx_params.n_threads = std::max(2, std::min(2, (int) sysconf(_SC_NPROCESSORS_ONLN)));
    ctx_params.n_threads_batch = ctx_params.n_threads;
    llama_context * ctx = llama_init_from_model(g_model, ctx_params);
    if (!ctx) return env->NewStringUTF("");

    llama_batch batch = llama_batch_init(std::max(n_prompt, 1), 0, 1);
    for (int i = 0; i < n_prompt; ++i) {
        batch.token[i] = tokens[i];
        batch.pos[i] = i;
        batch.n_seq_id[i] = 1;
        batch.seq_id[i][0] = 0;
        batch.logits[i] = (i == n_prompt - 1);
    }
    batch.n_tokens = n_prompt;
    std::string output;
    auto sampler_params = llama_sampler_chain_default_params();
    auto * sampler = llama_sampler_chain_init(sampler_params);
    llama_sampler_chain_add(sampler, llama_sampler_init_greedy());
    if (llama_decode(ctx, batch) != 0) {
        llama_sampler_free(sampler); llama_batch_free(batch); llama_free(ctx); return env->NewStringUTF("");
    }
    int pos = n_prompt;
    const int limit = std::clamp((int) maxTokens, 1, 160);
    for (int i = 0; i < limit; ++i) {
        const llama_token token = llama_sampler_sample(sampler, ctx, -1);
        if (llama_vocab_is_eog(vocab, token)) break;
        char piece[256];
        const int n = llama_token_to_piece(vocab, token, piece, sizeof(piece), 0, true);
        if (n > 0) output.append(piece, n);
        batch.n_tokens = 1;
        batch.token[0] = token;
        batch.pos[0] = pos++;
        batch.n_seq_id[0] = 1;
        batch.seq_id[0][0] = 0;
        batch.logits[0] = true;
        if (llama_decode(ctx, batch) != 0) break;
    }
    llama_sampler_free(sampler);
    llama_batch_free(batch);
    llama_free(ctx);
    return env->NewStringUTF(output.c_str());
}

extern "C" JNIEXPORT void JNICALL
Java_com_abanoubai_companion_QwenEngine_nativeShutdown(JNIEnv *, jobject) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_model) { llama_model_free(g_model); g_model = nullptr; }
    llama_backend_free();
}
