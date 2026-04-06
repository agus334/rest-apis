/**
 * @author      ARR Official
 * @title       TikTok Downloader API Endpoint
 * @description Endpoint untuk download video TikTok tanpa watermark
 * @baseurl     multiple fallback APIs
 * @tags        downloader, tiktok, api
 * @language    javascript
 */

const TikTokDownloader = require('./TikTokDownloader');

module.exports = function(app) {
    const tiktok = new TikTokDownloader();

    app.get('/tiktok', async (req, res) => {
        try {
            const url = req.query.url || req.query.q;
            
            if (!url) {
                return res.status(400).json({
                    status: false,
                    error: "Parameter 'url' diperlukan",
                    example: "/tiktok?url=https://www.tiktok.com/@username/video/123456789",
                    creator: "ARR Official"
                });
            }

            const result = await tiktok.download(url);
            
            res.json({
                status: true,
                creator: "ARR Official",
                ...result
            });

        } catch (error) {
            res.status(500).json({
                status: false,
                error: error.message,
                hint: "Pastikan URL TikTok valid dan tidak diblokir region",
                creator: "ARR Official"
            });
        }
    });

    app.get('/tiktok/stream', async (req, res) => {
        try {
            const url = req.query.url;
            if (!url) {
                return res.status(400).json({ error: "Parameter 'url' diperlukan" });
            }

            const result = await tiktok.downloadWithBuffer(url);
            
            res.setHeader('Content-Type', result.content_type);
            res.setHeader('Content-Disposition', `attachment; filename="${result.title}.mp4"`);
            res.send(result.video_buffer);
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
};

module.exports.meta = {
    category: "Downloader",
    tag: "tiktok",
    endpoints: [
        {
            method: "GET",
            path: "/tiktok",
            desc: "Download video TikTok tanpa watermark",
            tryUrl: "/tiktok?url=https://www.tiktok.com/@username/video/123456789",
            params: [{ name: "url", required: true, desc: "URL video TikTok" }]
        },
        {
            method: "GET",
            path: "/tiktok/stream",
            desc: "Stream/download langsung file video TikTok",
            tryUrl: "/tiktok/stream?url=https://www.tiktok.com/@username/video/123456789",
            params: [{ name: "url", required: true, desc: "URL video TikTok" }]
        }
    ]
};}

async function downloadTikTok(url) {
    let tokenData;
    try {
        tokenData = await getFreshToken();
    } catch (error) {
        throw new Error('Gagal mendapatkan token: ' + error.message);
    }
    
    const formData = {
        url: url,
        _token: tokenData.token,
        _method: 'POST'
    };
    
    const response = await axios.post('https://kol.id/download-video/tiktok', qs.stringify(formData), {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json, text/html, */*',
            'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
            'Referer': 'https://kol.id/download-video/tiktok',
            'Origin': 'https://kol.id',
            'X-Requested-With': 'XMLHttpRequest',
            'Cookie': tokenData.cookie || ''
        },
        maxRedirects: 5
    });
    
    let html = response.data;
    
    if (typeof response.data === 'object' && response.data.html) {
        html = response.data.html;
    }
    
    const downloadUrlMatch = /<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?Download\s*Video<\/a>/i.exec(html);
    let videoUrl = null;
    
    if (downloadUrlMatch) {
        videoUrl = downloadUrlMatch[1];
    } else {
        const mp4Match = /(https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*)/i.exec(html);
        if (mp4Match) videoUrl = mp4Match[1];
    }
    
    const titleMatch = /<h[23][^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h[23]>/i.exec(html);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'TikTok Video';
    
    const authorMatch = /<[^>]*class="[^"]*author[^"]*"[^>]*>([\s\S]*?)<\/[^>]*>/i.exec(html);
    const author = authorMatch ? authorMatch[1].replace(/<[^>]*>/g, '').trim() : 'Unknown';
    
    if (!videoUrl) {
        throw new Error('Tidak dapat menemukan URL download video');
    }
    
    return {
        title: title,
        author: author,
        downloadUrl: videoUrl
    };
}

module.exports = function(app) {
    app.get('/tiktok', async (req, res) => {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "ARR Official",
                message: 'Parameter url diperlukan',
                example: '/tiktok?url=https://vt.tiktok.com/ZSHDVuapU'
            });
        }
        
        if (!url.includes('tiktok.com') && !url.includes('vt.tiktok.com') && !url.includes('vm.tiktok.com')) {
            return res.status(400).json({
                status: false,
                creator: "ARR Official",
                message: 'URL TikTok tidak valid'
            });
        }
        
        try {
            const result = await downloadTikTok(url);
            
            res.status(200).json({
                status: true,
                creator: "ARR Official",
                data: result
            });
        } catch (error) {
            console.error('[ERROR]', error.message);
            if (error.response) {
                console.error('[STATUS]', error.response.status);
                console.error('[DATA]', error.response.data);
            }
            res.status(500).json({
                status: false,
                creator: "ARR Official",
                message: error.message
            });
        }
    });
};

module.exports.meta = {
    category: "Downloader",
    tag: "TIKTOK",
    endpoints: [
        {
            method: "GET",
            path: "/tiktok",
            desc: "Download video TikTok tanpa watermark",
            tryUrl: "/tiktok?url=https://vt.tiktok.com/ZSHDVuapU",
            params: [
                { name: "url", required: true, desc: "URL video TikTok" }
            ]
        }
    ]
};
