/**
 * @author      ARR Official
 * @title       YouTube Search & Download API
 * @description API endpoint untuk mencari video YouTube dan download MP3 otomatis
 * @baseurl     https://yt-api.com
 * @tags        tools, api, downloader, search
 * @language    javascript
 */

const axios = require('axios');
const crypto = require('crypto');

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

async function ytmp3(url) {
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
    
    const audioFormat = json.audio_formats.find(f => f.quality === '128') || json.audio_formats[0];
    
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

async function searchYoutube(query) {
    const response = await axios.get('https://yt-api.com/api/search', {
        params: {
            query: query,
            type: 'video',
            limit: 5
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
        }
    });
    
    const results = response.data?.data || [];
    
    return results.map(item => ({
        title: item.title,
        videoId: item.videoId,
        url: `https://youtube.com/watch?v=${item.videoId}`,
        duration: item.duration,
        thumbnail: item.thumbnail?.[0]?.url,
        author: item.channelTitle
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
            console.log(`[*] Mencari: ${q}`);
            const searchResults = await searchYoutube(q);
            
            if (searchResults.length === 0) {
                return res.status(404).json({
                    status: false,
                    message: 'Tidak ada hasil ditemukan'
                });
            }
            
            const topResult = searchResults[0];
            console.log(`[+] Video teratas: ${topResult.title}`);
            
            console.log('[*] Mengconvert ke MP3...');
            const audio = await ytmp3(topResult.url);
            
            res.status(200).json({
                status: true,
                data: {
                    search_query: q,
                    video: {
                        title: topResult.title,
                        author: topResult.author,
                        duration: topResult.duration,
                        url: topResult.url,
                        thumbnail: topResult.thumbnail
                    },
                    audio: {
                        title: audio.title,
                        author: audio.author,
                        quality: audio.quality,
                        downloadUrl: audio.downloadUrl,
                        duration: audio.duration
                    }
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
    tag: "PLAY",
    endpoints: [
        {
            method: "GET",
            path: "/play",
            desc: "Cari dan download lagu dari YouTube ke MP3",
            tryUrl: "/play?q=heavenly jumpsyle",
            params: [
                { name: "q", required: true, desc: "Judul lagu atau kata kunci" }
            ]
        }
    ]
};
