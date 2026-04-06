/**
 * @author      ARR Official
 * @title       TikTok Downloader API
 * @description Download video TikTok tanpa watermark menggunakan multiple API
 * @baseurl     https://tiksave.io
 * @tags        tools, api, downloader
 * @language    javascript
 */

const axios = require('axios');

class TikTokDownloader {
    constructor() {
        this.apis = [
            {
                name: 'tiksave',
                url: 'https://tiksave.io/api/ajaxSearch',
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                buildBody: (url) => `q=${encodeURIComponent(url)}`,
                extractor: (data) => ({
                    video_url: data.video || data.links?.[0]?.url,
                    title: data.title || data.desc,
                    thumbnail: data.thumbnail || data.cover,
                    duration: data.duration,
                    author: data.author
                })
            },
            {
                name: 'tikmate',
                url: 'https://tikmate.app/api/single',
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                buildBody: (url) => `url=${encodeURIComponent(url)}`,
                extractor: (data) => ({
                    video_url: data.video_url || data.url,
                    title: data.title,
                    thumbnail: data.thumbnail,
                    duration: data.duration,
                    author: data.author
                })
            },
            {
                name: 'snaptik',
                url: 'https://snaptik.zone/action.php',
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                buildBody: (url) => `url=${encodeURIComponent(url)}&submit=`,
                extractor: (data) => ({
                    video_url: data.data?.[0]?.url || data.url,
                    title: data.title,
                    thumbnail: data.thumbnail
                })
            },
            {
                name: 'ssstik',
                url: 'https://ssstik.io/abc?url=dl',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Hx-Request': 'true',
                    'Hx-Target': 'target',
                    'Hx-Current-Url': 'https://ssstik.io/id'
                },
                buildBody: (url) => `id=${encodeURIComponent(url)}&locale=id`,
                extractor: (data) => {
                    const match = data.match(/https?:\/\/[^\s"']+\.mp4/);
                    return {
                        video_url: match ? match[0] : null,
                        title: 'TikTok Video'
                    };
                }
            }
        ];
    }

    async download(url) {
        if (!url || !url.includes('tiktok.com')) {
            throw new Error('URL tidak valid. Harus URL TikTok');
        }

        let lastError = null;

        for (const api of this.apis) {
            try {
                let response;
                const body = api.buildBody(url);
                
                if (api.method === 'POST') {
                    response = await axios.post(api.url, body, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/144.0.0.0 Mobile Safari/537.36',
                            'Accept': 'application/json',
                            ...api.headers
                        },
                        timeout: 20000
                    });
                }

                const extracted = api.extractor(response.data);
                
                if (extracted && extracted.video_url) {
                    return {
                        success: true,
                        source: api.name,
                        video_url: extracted.video_url,
                        title: extracted.title || 'TikTok Video',
                        thumbnail: extracted.thumbnail || null,
                        duration: extracted.duration || null,
                        author: extracted.author || null
                    };
                }
            } catch (error) {
                lastError = error;
                continue;
            }
        }

        throw new Error(`Gagal download: ${lastError?.message}`);
    }
}

const tiktok = new TikTokDownloader();

module.exports = function(app) {
    app.get('/tiktok', async (req, res) => {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({
                status: false,
                message: 'Parameter url diperlukan',
                example: '/tiktok?url=https://www.tiktok.com/@username/video/123456789'
            });
        }
        
        try {
            console.log(`[*] Mendownload TikTok: ${url}`);
            const result = await tiktok.download(url);
            
            console.log(`[+] Berhasil: ${result.title}`);
            
            res.status(200).json({
                status: true,
                watermark: "ARR Official - TikTok Downloader",
                data: {
                    url_request: url,
                    video: {
                        title: result.title,
                        author: result.author,
                        duration: result.duration,
                        thumbnail: result.thumbnail,
                        video_url: result.video_url
                    },
                    source_api: result.source
                }
            });
            
        } catch (error) {
            console.error('[ERROR]', error.message);
            res.status(500).json({
                status: false,
                message: 'Error: ' + error.message
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
            tryUrl: "/tiktok?url=https://www.tiktok.com/@username/video/123456789",
            params: [
                { name: "url", required: true, desc: "URL video TikTok" }
            ]
        }
    ]
};
