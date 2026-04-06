/**
 * @author      ARR Official
 * @title       Claude AI Chat API (Alternative)
 * @description API endpoint alternatif untuk mengakses Claude AI
 * @baseurl     https://claude.ai
 * @tags        ai, chat, claude, api
 * @language    javascript
 */

const axios = require('axios');

module.exports = function(app) {
    app.get('/claude2', async (req, res) => {
        try {
            const prompt = req.query.q || req.query.prompt || req.query.text;
            
            if (!prompt) {
                return res.status(400).json({
                    status: false,
                    error: "Parameter 'q' diperlukan",
                    example: "/claude2?q=siapa Jokowi",
                    creator: "ARR Official"
                });
            }

            // Menggunakan API alternative yang lebih stabil
            const response = await axios.post('https://api.claude.ai/v1/messages', {
                model: "claude-3-haiku-20240307",
                max_tokens: 1024,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json"
                },
                timeout: 30000
            }).catch(() => {
                // Fallback ke API gratis
                return axios.post('https://api.itsmeow.dev/v1/chat/completions', {
                    model: "claude-3-haiku",
                    messages: [{ role: "user", content: prompt }]
                }, { timeout: 30000 });
            });

            res.json({
                status: true,
                creator: "ARR Official",
                pertanyaan: prompt,
                jawaban: response.data.choices?.[0]?.message?.content || response.data.content || "Maaf, tidak bisa mendapatkan respons"
            });

        } catch (error) {
            res.status(500).json({
                status: false,
                error: "Layanan Claude sedang sibuk, coba lagi nanti",
                detail: error.message,
                creator: "ARR Official"
            });
        }
    });
};                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site",
                "user-agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36"
            };

            const { data: chat } = await axios.post('https://wewordle.org/gptapi/v1/web/turbo', {
                messages: [
                    {
                        content: prompt,
                        role: "user"
                    }
                ],
            }, { headers });

            res.json({
                status: true,
                creator: "ARR Official",
                pertanyaan: prompt,
                limit: chat?.limit,
                fullLimit: chat?.fullLimit,
                jawaban: {
                    id: chat?.message?.id,
                    created: chat?.message?.created,
                    role: chat?.message?.role,
                    content: chat?.message?.content
                }
            });

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
    tag: "claude",
    endpoints: [
        {
            method: "GET",
            path: "/claude",
            desc: "Chat dengan Claude AI",
            tryUrl: "/claude?q=siapa Jokowi",
            params: [
                { name: "q", required: true, desc: "Pertanyaan atau prompt untuk Claude" }
            ]
        }
    ]
};
