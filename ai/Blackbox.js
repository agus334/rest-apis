const axios = require('axios');

module.exports = function(app) {

    async function blackboxAIChat(message) {
        try {
          const response = await axios.post('https://www.blackbox.ai/api/chat', {
            messages: [{ id: null, content: message, role: 'user' }],
            id: null,
            previewToken: null,
            userId: null,
            codeModelMode: true,
            agentMode: {},
            trendingAgentMode: {},
            isMicMode: false,
            isChromeExt: false,
            githubToken: null
          });
          return response.data;
        } catch (error) {
          throw error;
        }
    }

    app.get('/blackboxai', async (req, res) => {
        try {
          const text = req.query.text;
          if (!text) return res.status(400).json({ error: 'Parameter "text" tidak ditemukan' });
          const response = await blackboxAIChat(text);
          res.status(200).json({ status: 200, creator: "ARR Official", data: { response } });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
    });
};

module.exports.meta = {
    category: "Artificial Intelligence",
    tag: "AI",
    endpoints: [
        {
            method: "GET",
            path: "/blackboxai",
            desc: "Chat dengan BlackboxAI — AI serba guna",
            tryUrl: "/blackboxai?text=hai",
            params: [{ name: "text", required: true, desc: "Pesan yang ingin dikirim" }]
        }
    ]
};
