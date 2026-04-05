/**
 * @author      ARR Official
 * @title       YouTube Download API (Temp CDN)
 * @description Download YouTube MP3/MP4 dengan link temporary anti down
 * @baseurl     https://media.savetube.vip
 * @tags        tools, api, downloader
 * @language    javascript
 */

const axios = require('axios');
const crypto = require('crypto');
const yts = require('yt-search');

const KEY = Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex');

function decrypt(enc) {
    const b = Buffer.from(enc.replace(/\s/g, ''), 'base64');
    const iv = b.subarray(0, 16);
    const data = b.subarray(16);
    const decipher = crypto.createDecipheriv('aes-128-cbc', KEY, iv);
    return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString());
}

async function getRandomCdn() {
    const res = await axios.get('https://media.savetube.vip/api/random-cdn', {
        headers: {
            'Origin': 'https://save-tube.com',
            'Referer': 'https://save-tube.com/',
            'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0'
        }
    });
    return res.data.cdn;
}

async function ytmp3(url, quality = '128') {
    const cdn = await getRandomCdn();
    
    const infoRes = await axios.post(`https://${cdn}/v2/info`, { url }, {
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://save-tube.com',
            'Referer': 'https://save-tube.com/'
        }
    });
    
    if (!infoRes.data?.status) throw new Error('Gagal get info video');
    
    const json = decrypt(infoRes.data.data);
    
    let audioFormat = json.audio_formats.find(f => f.quality === quality);
    if (!audioFormat) audioFormat = json.audio_formats.find(f => f.quality === '128') || json.audio_formats[0];
    
    const downloadRes = await axios.post(`https://${cdn}/download`, {
        id: json.id,
        key: json.key,
        downloadType: 'audio',
        quality: String(audioFormat.quality)
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://save-tube.com',
            'Referer': 'https://save-tube.com/'
        }
    });
    
    return {
        title: json.title,
        duration: json.duration,
        author: json.author,
        quality: audioFormat.quality + 'kbps',
        downloadUrl: downloadRes.data?.data?.downloadUrl,
        thumbnail: json.thumbnail
    };
}

async function ytmp4(url, quality = '360') {
    const cdn = await getRandomCdn();
    
    const infoRes = await axios.post(`https://${cdn}/v2/info`, { url }, {
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://save-tube.com',
            'Referer': 'https://save-tube.com/'
        }
    });
    
    if (!infoRes.data?.status) throw new Error('Gagal get info video');
    
    const json = decrypt(infoRes.data.data);
    
    let videoFormat = json.video_formats.find(f => f.quality === quality);
    if (!videoFormat) videoFormat = json.video_formats.find(f => f.quality === '360') || json.video_formats[0];
    
    const downloadRes = await axios.post(`https://${cdn}/download`, {
        id: json.id,
        key: json.key,
        downloadType: 'video',
        quality: String(videoFormat.quality)
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://save-tube.com',
            'Referer': 'https://save-tube.com/'
        }
    });
    
    return {
        title: json.title,
        duration: json.duration,
        author: json.author,
        quality: videoFormat.quality + 'p',
        downloadUrl: downloadRes.data?.data?.downloadUrl,
        thumbnail: json.thumbnail,
        size: videoFormat.size
    };
}

async function searchYoutube(query) {
    const result = await yts(query);
    return result.videos.slice(0, 5).map(video => ({
        title: video.title,
        videoId: video.videoId,
        url: video.url,
        duration: video.duration,
        timestamp: video.timestamp,
        thumbnail: video.thumbnail,
        author: video.author.name,
        views: video.views
    }));
}

module.exports = function(app) {
    app.get('/play', async (req, res) => {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({
                status: false,
                message: 'Parameter q diperlukan',
                example: '/play?q=heavenly jumpsyle'
            });
        }
        
        try {
            const searchResults = await searchYoutube(q);
            if (searchResults.length === 0) {
                return res.status(404).json({ status: false, message: 'Tidak ada hasil' });
            }
            
            const topResult = searchResults[0];
            const audio = await ytmp3(topResult.url, '128');
            
            res.status(200).json({
                status: true,
                watermark: "ARR Official - YouTube Downloader",
                data: {
                    search_query: q,
                    video: topResult,
                    audio: audio
                }
            });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    });
    
    app.get('/ytmp3', async (req, res) => {
        const { url, quality = '128' } = req.query;
        
        if (!url) {
            return res.status(400).json({
                status: false,
                message: 'Parameter url diperlukan',
                example: '/ytmp3?url=https://youtu.be/xxx&quality=128'
            });
        }
        
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return res.status(400).json({ status: false, message: 'URL YouTube tidak valid' });
        }
        
        try {
            const result = await ytmp3(url, quality);
            res.status(200).json({
                status: true,
                watermark: "ARR Official - YouTube Downloader",
                data: result
            });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    });
    
    app.get('/ytmp4', async (req, res) => {
        const { url, quality = '360' } = req.query;
        
        if (!url) {
            return res.status(400).json({
                status: false,
                message: 'Parameter url diperlukan',
                example: '/ytmp4?url=https://youtu.be/xxx&quality=720'
            });
        }
        
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return res.status(400).json({ status: false, message: 'URL YouTube tidak valid' });
        }
        
        const validQualities = ['144', '240', '360', '480', '720', '1080', '1440', '2160'];
        if (!validQualities.includes(quality)) {
            return res.status(400).json({
                status: false,
                message: `Kualitas tidak valid. Pilih: ${validQualities.join(', ')}`
            });
        }
        
        try {
            const result = await ytmp4(url, quality);
            res.status(200).json({
                status: true,
                watermark: "ARR Official - YouTube Downloader",
                data: result
            });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    });
};

module.exports.meta = {
    category: "Downloader",
    tag: "YOUTUBE",
    endpoints: [
        {
            method: "GET",
            path: "/play",
            desc: "Cari dan download lagu ke MP3",
            tryUrl: "/play?q=heavenly jumpsyle",
            params: [{ name: "q", required: true, desc: "Judul lagu" }]
        },
        {
            method: "GET",
            path: "/ytmp3",
            desc: "Download YouTube ke MP3",
            tryUrl: "/ytmp3?url=https://youtu.be/dQw4w9WgXcQ",
            params: [
                { name: "url", required: true, desc: "URL YouTube" },
                { name: "quality", required: false, desc: "128/192/320", default: "128" }
            ]
        },
        {
            method: "GET",
            path: "/ytmp4",
            desc: "Download YouTube ke MP4",
            tryUrl: "/ytmp4?url=https://youtu.be/dQw4w9WgXcQ&quality=720",
            params: [
                { name: "url", required: true, desc: "URL YouTube" },
                { name: "quality", required: false, desc: "144/240/360/480/720/1080", default: "360" }
            ]
        }
    ]
};
