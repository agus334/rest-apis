/**
 * @author      ARR Official
 * @title       ChatGPT API Without Login
 * @description API endpoint untuk mengakses ChatGPT tanpa login, support streaming, web search, dan upload gambar
 * @baseurl     https://chatgpt.com
 * @tags        ai, chat, chatgpt, openai, api
 * @language    javascript
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { fetch: _fetch } = require("undici");

class ChatGPT {
  constructor(cfg = {}) {
    this.baseUrl = "https://chatgpt.com";
    this.userAgent = cfg.userAgent ?? "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36";
    this.oaiDid = cfg.did ?? crypto.randomUUID();
    this.screenWidth = cfg.screenWidth ?? 423;
    this.screenHeight = cfg.screenHeight ?? 965;
    this.lang = cfg.lang ?? "id-ID";
    this.buildNumber = cfg.buildNumber ?? "prod-69a06c53754594935887d6c16b844885964a78fc";
    this.authToken = cfg.authToken ?? null;
  }

  async send(message, opts = {}) {
    if (!message?.trim()) throw new Error("Pesan tidak boleh kosong.");

    const {
      conversationId = null,
      parentMessageId = null,
      imagePath = null,
      webSearch = false,
      stream = false,
      onChunk,
    } = opts;

    const parentMsgId = parentMessageId ?? "client-created-root";
    const msgId = crypto.randomUUID();

    let image = null;
    if (imagePath) {
      image = await this._uploadImage(imagePath, { conversationId, parentMsgId });
    }

    const [tokens, conduitToken] = await Promise.all([
      this._generateSentinelTokens(),
      this._getConduitToken(message, msgId, { conversationId, parentMsgId, webSearch, image }),
    ]);

    const body = this._buildMessageBody(message, msgId, {
      conversationId, parentMsgId, webSearch, image,
    });

    const res = await _fetch(`${this.baseUrl}/backend-anon/f/conversation`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: this._headers({
        "accept": "text/event-stream",
        "OAI-Language": this.lang,
        "OpenAI-Sentinel-Chat-Requirements-Token": tokens.chatRequirementsToken,
        "OpenAI-Sentinel-Turnstile-Token": tokens.turnstile,
        "OpenAI-Sentinel-Proof-Token": tokens.pow,
        "X-Conduit-Token": conduitToken,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "(no body)");
      throw new Error(`HTTP ${res.status}: ${err}`);
    }

    return this._parseSSE(res.body, { stream, onChunk });
  }

  async _uploadImage(filePath, ctx = {}) {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const mimeType = this._getMimeType(fileName);
    const sizeBytes = fileBuffer.length;
    const { width, height } = this._getImageDimensions(fileBuffer, mimeType);

    const registerRes = await _fetch(`${this.baseUrl}/backend-anon/files`, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({
        file_name: fileName,
        file_size: sizeBytes,
        use_case: "multimodal",
        timezone_offset_min: new Date().getTimezoneOffset(),
        reset_rate_limits: false,
      }),
    }).then(r => r.json());

    const { upload_url, file_id } = registerRes;
    if (!upload_url || !file_id) {
      throw new Error(`Gagal mendaftar file: ${JSON.stringify(registerRes)}`);
    }

    const uploadRes = await _fetch(upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
        "x-ms-blob-type": "BlockBlob",
        "x-ms-version": "2020-04-08",
      },
      body: fileBuffer,
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload blob gagal: HTTP ${uploadRes.status}`);
    }

    const processBody = {
      file_id,
      use_case: "multimodal",
      index_for_retrieval: false,
      file_name: fileName,
    };

    if (ctx.conversationId || ctx.parentMsgId) {
      processBody.metadata = {
        library_file_info: {
          origination_message_id: ctx.parentMsgId ?? null,
          origination_thread_id: ctx.conversationId ?? null,
        },
      };
    }

    const processRes = await _fetch(
      `${this.baseUrl}/backend-anon/files/process_upload_stream`,
      { method: "POST", headers: this._headers(), body: JSON.stringify(processBody) }
    );

    const decoder = new TextDecoder();
    let buf = "";
    for await (const chunk of processRes.body) {
      buf += decoder.decode(chunk, { stream: true });
      if (buf.includes("file.processing.completed")) break;
    }

    return { fileId: file_id, fileName, mimeType, sizeBytes, width, height };
  }

  _headers(extra = {}) {
    return {
      "User-Agent": this.userAgent,
      "accept": "*/*",
      "accept-language": `${this.lang},en-US;q=0.9,en;q=0.8`,
      "content-type": "application/json",
      "OAI-Device-Id": this.oaiDid,
      "sec-ch-ua": '"Chromium";v="144", "Not/A)Brand";v="24"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "origin": "https://chatgpt.com",
      "referer": "https://chatgpt.com/",
      ...(this.authToken ? { "authorization": `Bearer ${this.authToken}` } : {}),
      ...extra,
    };
  }

  _fnv1a(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    h ^= h >>> 16; h = Math.imul(h, 2246822507) >>> 0;
    h ^= h >>> 13; h = Math.imul(h, 3266489909) >>> 0;
    h ^= h >>> 16;
    return (h >>> 0).toString(16).padStart(8, "0");
  }

  _encodeConfig(cfg) {
    return Buffer.from(JSON.stringify(cfg)).toString("base64");
  }

  _makeBrowserConfig() {
    return [
      this.screenWidth + this.screenHeight,
      String(new Date()),
      2172649472,
      0,
      this.userAgent,
      null,
      this.buildNumber,
      this.lang,
      `${this.lang},en`,
      0,
      "contacts\u2212[object ContactsManager]",
      "_reactListening",
      "User",
      performance.now(),
      crypto.randomUUID(),
      "",
      8,
      performance.timeOrigin,
      0, 0, 0, 0, 0, 0, 0,
    ];
  }

  _computePow(seed, difficulty, cfg) {
    const start = performance.now();
    for (let i = 0; i < 500000; i++) {
      cfg[3] = i;
      cfg[9] = Math.round(performance.now() - start);
      const encoded = this._encodeConfig(cfg);
      if (this._fnv1a(seed + encoded).substring(0, difficulty.length) <= difficulty) {
        return "gAAAAAB" + encoded + "~S";
      }
    }
    return "wQ8Lk5FbGpA2NcR9dShT6gYjU7VxZ4De";
  }

  async _generateSentinelTokens() {
    const initCfg = this._makeBrowserConfig();
    initCfg[3] = 1; initCfg[9] = 0;
    const initToken = "gAAAAAC" + this._encodeConfig(initCfg);

    const prepareRes = await _fetch(
      `${this.baseUrl}/backend-anon/sentinel/chat-requirements/prepare`,
      { method: "POST", headers: this._headers(), body: JSON.stringify({ p: initToken }) }
    ).then(r => r.json());

    let pow = null;
    if (prepareRes.proofofwork?.required) {
      pow = this._computePow(
        prepareRes.proofofwork.seed,
        prepareRes.proofofwork.difficulty,
        this._makeBrowserConfig()
      );
    }

    const turnstile = crypto
      .randomBytes(Math.floor((2256 / 4) * 3))
      .toString("base64")
      .slice(0, 2256);

    const finalizeBody = { prepare_token: prepareRes.prepare_token ?? "" };
    if (pow) finalizeBody.proofofwork = pow;
    if (turnstile) finalizeBody.turnstile = turnstile;

    const finalizeRes = await _fetch(
      `${this.baseUrl}/backend-anon/sentinel/chat-requirements/finalize`,
      { method: "POST", headers: this._headers(), body: JSON.stringify(finalizeBody) }
    ).then(r => r.json());

    return { pow, turnstile, chatRequirementsToken: finalizeRes.token ?? null };
  }

  async _getConduitToken(message, msgId, { conversationId, parentMsgId, webSearch, image }) {
    const body = {
      action: "next",
      fork_from_shared_post: false,
      parent_message_id: parentMsgId,
      model: "auto",
      timezone_offset_min: new Date().getTimezoneOffset(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      conversation_mode: { kind: "primary_assistant" },
      system_hints: webSearch ? ["search"] : [],
      supports_buffering: true,
      supported_encodings: ["v1"],
      partial_query: {
        id: msgId,
        author: { role: "user" },
        content: { content_type: "text", parts: [message] },
      },
      client_contextual_info: { app_name: "chatgpt.com" },
    };

    if (conversationId) body.conversation_id = conversationId;
    if (image) body.attachment_mime_types = [image.mimeType];

    const res = await _fetch(
      `${this.baseUrl}/backend-anon/f/conversation/prepare`,
      {
        method: "POST",
        headers: this._headers({ "X-Conduit-Token": "no-token" }),
        body: JSON.stringify(body),
      }
    );
    const data = await res.json();
    return data.token ?? data.conduit_token;
  }

  _buildMessageBody(message, msgId, { conversationId, parentMsgId, webSearch, image }) {
    let content, msgMeta;

    if (image) {
      content = {
        content_type: "multimodal_text",
        parts: [
          {
            content_type: "image_asset_pointer",
            asset_pointer: `file-service://${image.fileId}`,
            size_bytes: image.sizeBytes,
            width: image.width,
            height: image.height,
          },
          message,
        ],
      };
      msgMeta = {
        attachments: [{
          id: image.fileId,
          size: image.sizeBytes,
          name: image.fileName,
          mime_type: image.mimeType,
          width: image.width,
          height: image.height,
          source: "local",
          is_big_paste: false,
        }],
        selected_github_repos: [],
        selected_all_github_repos: false,
        serialization_metadata: { custom_symbol_offsets: [] },
      };
    } else {
      content = { content_type: "text", parts: [message] };
      msgMeta = {
        selected_github_repos: [],
        selected_all_github_repos: false,
        serialization_metadata: { custom_symbol_offsets: [] },
        ...(webSearch ? { system_hints: ["search"] } : {}),
      };
    }

    const body = {
      action: "next",
      messages: [{
        id: msgId,
        author: { role: "user" },
        create_time: Date.now() / 1000,
        content,
        metadata: msgMeta,
      }],
      parent_message_id: parentMsgId,
      model: "auto",
      timezone_offset_min: new Date().getTimezoneOffset(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      conversation_mode: { kind: "primary_assistant" },
      enable_message_followups: true,
      system_hints: webSearch ? ["search"] : [],
      supports_buffering: true,
      supported_encodings: ["v1"],
      client_contextual_info: {
        is_dark_mode: true,
        time_since_loaded: 10,
        page_height: 845,
        page_width: 423,
        pixel_ratio: 1.7,
        screen_height: this.screenHeight,
        screen_width: this.screenWidth,
        app_name: "chatgpt.com",
      },
      no_auth_ad_preferences: {
        personalization_enabled: true,
        history_enabled: true,
      },
      paragen_cot_summary_display_override: "allow",
      force_parallel_switch: "auto",
    };

    if (conversationId) body.conversation_id = conversationId;
    if (webSearch) {
      body.force_use_search = true;
      body.client_reported_search_source = "conversation_composer_web_icon";
    }

    return body;
  }

  async _parseSSE(body, { stream, onChunk }) {
    const decoder = new TextDecoder();
    let buf = "";
    let fullText = "";
    let title = null;
    let model = null;
    let convId = null;
    let assistantMsgId = null;

    for await (const chunk of body) {
      buf += decoder.decode(chunk, { stream: true });

      const lines = buf.split("\n");
      buf = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;

        let json;
        try { json = JSON.parse(raw); } catch { continue; }

        if (json.conversation_id) {
          convId = json.conversation_id;
        } else if (json.v?.conversation_id) {
          convId = json.v.conversation_id;
        }

        if (json.v && !Array.isArray(json.v) && json.v.message?.author?.role === "assistant" && json.v.message?.id) {
          assistantMsgId = json.v.message.id;
        }

        if (json.type === "title_generation") title = json.title;
        if (json.type === "server_ste_metadata") model = json.metadata?.model_slug ?? null;

        const patches = Array.isArray(json.v) ? json.v : [];
        for (const p of patches) {
          if (p.o === "append" && p.p?.includes("/message/content/parts/0")) {
            fullText += p.v;
            if (stream && typeof onChunk === "function") onChunk(p.v);
          }
        }
      }
    }

    return { text: fullText, title, model, conversationId: convId, messageId: assistantMsgId };
  }

  _getMimeType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
      ".gif": "image/gif", ".webp": "image/webp"
    };
    return mimeTypes[ext] ?? "application/octet-stream";
  }

  _getImageDimensions(buffer, mimeType) {
    try {
      if (mimeType === "image/png") {
        return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
      }
      if (mimeType === "image/jpeg") {
        let i = 2;
        while (i < buffer.length - 8) {
          if (buffer[i] !== 0xFF) break;
          const marker = buffer[i + 1];
          const segLen = buffer.readUInt16BE(i + 2);
          if (marker >= 0xC0 && marker <= 0xC3) {
            return { height: buffer.readUInt16BE(i + 5), width: buffer.readUInt16BE(i + 7) };
          }
          i += 2 + segLen;
        }
      }
    } catch { }
    return { width: 0, height: 0 };
  }
}

module.exports = function(app) {
  const chat = new ChatGPT({ lang: "id-ID" });

  app.get('/chatgpt', async (req, res) => {
    try {
      const prompt = req.query.q || req.query.prompt || req.query.text;
      const conversationId = req.query.conversation_id || null;
      const parentMessageId = req.query.parent_message_id || null;
      const webSearch = req.query.web_search === 'true';
      const stream = req.query.stream === 'true';

      if (!prompt) {
        return res.status(400).json({
          status: false,
          error: "Parameter 'q' diperlukan",
          example: "/chatgpt?q=siapa Jokowi",
          creator: "ARR Official"
        });
      }

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let fullText = '';
        
        await chat.send(prompt, {
          conversationId,
          parentMessageId,
          webSearch,
          stream: true,
          onChunk: (chunk) => {
            fullText += chunk;
            res.write(`data: ${JSON.stringify({ chunk, fullText })}\n\n`);
          }
        });

        res.write(`data: [DONE]\n\n`);
        res.end();
      } else {
        const result = await chat.send(prompt, {
          conversationId,
          parentMessageId,
          webSearch,
          stream: false
        });

        res.json({
          status: true,
          creator: "ARR Official",
          pertanyaan: prompt,
          conversation_id: result.conversationId,
          message_id: result.messageId,
          model: result.model,
          title: result.title,
          jawaban: result.text
        });
      }
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message,
        creator: "ARR Official"
      });
    }
  });
};

module.exports.meta = {
  category: "AI Chat",
  tag: "chatgpt",
  endpoints: [
    {
      method: "GET",
      path: "/chatgpt",
      desc: "Chat dengan ChatGPT tanpa login, support streaming dan web search",
      tryUrl: "/chatgpt?q=siapa Jokowi",
      params: [
        { name: "q", required: true, desc: "Pertanyaan atau prompt untuk ChatGPT" },
        { name: "conversation_id", required: false, desc: "ID percakapan untuk melanjutkan chat" },
        { name: "parent_message_id", required: false, desc: "ID pesan sebelumnya" },
        { name: "web_search", required: false, desc: "Aktifkan web search (true/false)" },
        { name: "stream", required: false, desc: "Mode streaming (true/false)" }
      ]
    }
  ]
};
