const axios = require('axios');

module.exports = function(app) {

  // Full Kode Di Github Saya : https://github.com/Lenwyy/

async function fetchContent(content) {
  try {
    const response = await axios.post('https://luminai.my.id/', { content });
    return response.data;
  } catch (error) {
    console.error("Error fetching content from LuminAI:", error);
    throw error;
  }
}

// Endpoint LuminAI
app.get('/luminai', async (req, res) => {
    try {
      const { text } = req.query;
      if (!text) {
        return res.status(400).json({ error: 'Parameter "text" Tidak Ditemukan, Tolong Masukkan Perintah' });
      }
      const response = await fetchContent(text);
      res.status(200).json({
        status: 200,
        creator: "Lenwy",
        data: response
      });
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
            path: "/luminai",
            desc: "Chat dengan LuminAI",
            tryUrl: "/luminai?text=hai",
            params: [{ name: "text", required: true, desc: "Pesan yang ingin dikirim" }]
        }
    ]
};
