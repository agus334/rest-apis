/**
 * @author      ARR Official
 * @title       TikTok Video Downloader API (No Watermark)
 * @description API endpoint untuk download video TikTok tanpa watermark dari KOL.ID
 * @baseurl     https://kol.id
 * @tags        tools, api, downloader, tiktok
 * @language    javascript
 */

const axios = require('axios');
const qs = require('querystring');

let cachedToken = null;
let cookieJar = null;

async function getFreshToken() {
    const response = await axios.get('https://kol.id/download-video/tiktok', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8'
        }
    });
    
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
        cookieJar = setCookie.map(c => c.split(';')[0]).join('; ');
    }
    
    const tokenMatch = /name="_token"\s+value="([^"]+)"/i.exec(response.data);
    if (!tokenMatch) {
        throw new Error('Gagal mendapatkan CSRF token');
    }
    
    cachedToken = tokenMatch[1];
    return { token: cachedToken, cookie: cookieJar };
}

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
};                    title: data.title,
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
