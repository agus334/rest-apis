/**
 * @author      ARR Official
 * @title       YouTube MP4 Downloader API
 * @description Download video YouTube ke format MP4 dengan resolusi 360p/480p/720p/1080p
 * @baseurl     multiple APIs
 * @tags        tools, api, downloader
 * @language    javascript
 */

const axios = require('axios');
const cors = require('cors');

class YouTubeDownloader {
    constructor() {
        this.apis = [
            {
                name: 'savetube',
                url: 'https://api.savetube.me/download',
                method: 'GET',
                buildUrl: (url, quality) => `https://api.savetube.me/download?url=${encodeURIComponent(url)}`,
                extractor: (data, quality) => {
                    let videoUrl = null;
                    if (data.video_urls) {
                        const found = data.video_urls.find(v => v.quality === quality);
                        videoUrl = found?.url || data.video_urls[0]?.url;
                    }
                    return {
                        video_url: videoUrl || data.video,
                        title: data.title,
                        thumbnail: data.thumbnail,
                        duration: data.duration,
                        author: data.author,
                        available_qualities: data.video_urls?.map(v => v.quality) || []
                    };
                }
            },
            {
                name: 'yt5s',
                url: 'https://yt5s.com/api/ajaxSearch',
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                buildBody: (url) => `q=${encodeURIComponent(url)}&vt=home`,
                extractor: (data, quality) => {
                    let videoUrl = null;
                    if (data.links) {
                        const qualityMap = { '360': 'mp4', '480': 'mp4', '720': 'mp4', '1080': 'mp4' };
                        videoUrl = data.links[qualityMap[quality]] || data.links.mp4;
                    }
                    return {
                        video_url: videoUrl || data.video,
                        title: data.title,
                        thumbnail: data.thumbnail,
                        duration: data.duration,
                        available_qualities: Object.keys(data.links || {})
                    };
                }
            }
        ];
    }

    async download(url, quality = '360') {
        if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
            throw new Error('URL tidak valid. Harus URL YouTube');
        }

        const validQualities = ['360', '480', '720', '1080'];
        if (!validQualities.includes(quality)) {
            quality = '360';
        }

        let lastError = null;

        for (const api of this.apis) {
            try {
                console.log(`[*] Mencoba ${api.name} dengan kualitas ${quality}p...`);
                let response;

                if (api.method === 'GET') {
                    response = await axios.get(api.buildUrl(url, quality), {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/144.0.0.0 Mobile Safari/537.36',
                            'Accept': 'application/json'
                        },
                        timeout: 20000
                    });
                } else {
                    response = await axios.post(api.url, api.buildBody(url), {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/144.0.0.0 Mobile Safari/537.36',
                            'Content-Type': 'application/json',
                            ...api.headers
                        },
                        timeout: 20000
                    });
                }

                const extracted = api.extractor(response.data, quality);
                
                if (extracted && extracted.video_url) {
                    console.log(`[+] Berhasil dari ${api.name} - ${quality}p`);
                    return {
                        success: true,
                        source: api.name,
                        video_url: extracted.video_url,
                        title: extracted.title || 'YouTube Video',
                        thumbnail: extracted.thumbnail || null,
                        duration: extracted.duration || null,
                        author: extracted.author || null,
                        quality: quality + 'p',
                        available_qualities: extracted.available_qualities
                    };
                }
            } catch (error) {
                console.log(`[-] ${api.name} gagal: ${error.message}`);
                lastError = error;
                continue;
            }
        }

        throw new Error(`Gagal download: ${lastError?.message}`);
    }
}

const yt = new YouTubeDownloader();

module.exports = function(app) {
    app.use(cors());
    
    app.get('/ytmp4', async (req, res) => {
        const { url, quality } = req.query;
        
        if (!url) {
            return res.status(400).json({
                status: false,
                message: 'Parameter url diperlukan',
                example: '/ytmp4?url=https://youtu.be/j3ps4h8Z0Ho&quality=720'
            });
        }
        
        try {
            const selectedQuality = quality || '360';
            console.log(`[*] Mendownload YouTube: ${url} dengan kualitas ${selectedQuality}p`);
            const result = await yt.download(url, selectedQuality);
            
            console.log(`[+] Berhasil: ${result.title} - ${result.quality}`);
            
            res.status(200).json({
                status: true,
                watermark: "ARR Official - YouTube Downloader",
                data: {
                    url_request: url,
                    video: {
                        title: result.title,
                        author: result.author,
                        duration: result.duration,
                        thumbnail: result.thumbnail,
                        quality: result.quality,
                        available_qualities: result.available_qualities,
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
    tag: "YTMP4",
    endpoints: [
        {
            method: "GET",
            path: "/ytmp4",
            desc: "Download video YouTube ke MP4 (360p/480p/720p/1080p)",
            tryUrl: "/ytmp4?url=https://youtu.be/j3ps4h8Z0Ho&quality=720",
            params: [
                { name: "url", required: true, desc: "URL video YouTube" },
                { name: "quality", required: false, desc: "Kualitas video (360/480/720/1080), default 360" }
            ]
        }
    ]
};
