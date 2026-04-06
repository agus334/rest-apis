/**
 * @author      ARR Official
 * @title       Claude Online AI Chat API
 * @description API endpoint untuk mengakses Claude AI melalui claude.online
 * @baseurl     https://claude.online
 * @tags        ai, chat, claude, api
 * @language    javascript
 */

const axios = require('axios');

module.exports = function(app) {
    app.get('/claude', async (req, res) => {
        try {
            const prompt = req.query.q || req.query.prompt || req.query.text;
            
            if (!prompt) {
                return res.status(400).json({
                    status: false,
                    error: "Parameter 'q' diperlukan",
                    example: "/claude?q=siapa Jokowi",
                    creator: "ARR Official"
                });
            }

            const headers = {
                "accept": "*/*",
                "accept-encoding": "gzip, deflate, br, zstd",
                "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
                "connection": "keep-alive",
                "content-type": "application/json",
                "origin": "https://claude.online",
                "referer": "https://claude.online/",
                "sec-ch-ua": '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
                "sec-ch-ua-mobile": "?1",
                "sec-ch-ua-platform": '"Android"',
                "sec-fetch-dest": "empty",
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
