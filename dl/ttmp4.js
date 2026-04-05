
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

async function getCsrfToken() {
    const mainPage = await axios.get('https://kol.id/download-video/tiktok', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8'
        }
    });
    
    const tokenMatch = /name="_token"\s+value="([^"]+)"/i.exec(mainPage.data);
    return tokenMatch ? tokenMatch[1] : null;
}

async function downloadTikTok(url) {
    const csrfToken = await getCsrfToken();
    
    if (!csrfToken) {
        throw new Error('Gagal mendapatkan CSRF token');
    }
    
    const formData = {
        url: url,
        _token: csrfToken,
        _method: 'POST'
    };
    
    const response = await axios.post('https://kol.id/download-video/tiktok', qs.stringify(formData), {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Referer': 'https://kol.id/download-video/tiktok',
            'Origin': 'https://kol.id',
            'X-Requested-With': 'XMLHttpRequest'
        }
    });
    
    const html = response.data.html || response.data;
    
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
        
        if (!url.includes('tiktok.com') && !url.includes('vt.tiktok.com')) {
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
