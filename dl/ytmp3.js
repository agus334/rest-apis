/**
 * @author      ARR Official
 * @title       SaveTube YouTube to MP3 Downloader API
 * @description API endpoint untuk convert YouTube ke MP3 menggunakan SaveTube dengan decrypt AES
 * @baseurl     https://media.savetube.vip
 * @tags        tools, api, downloader
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
    try {
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
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}

module.exports = function(app) {
    app.get('/ytmp3', async (req, res) => {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({ 
                status: false, 
                message: 'Parameter URL diperlukan',
                example: '/ytmp3?url=https://youtu.be/dQw4w9WgXcQ'
            });
        }
        
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return res.status(400).json({ 
                status: false, 
                message: 'URL YouTube tidak valid' 
            });
        }
        
        try {
            const result = await ytmp3(url);
            
            if (!result || !result.downloadUrl) {
                return res.status(500).json({ 
                    status: false, 
                    message: 'Gagal mengconvert video' 
                });
            }
            
            res.status(200).json({
                status: true,
                data: result
            });
        } catch (error) {
            res.status(500).json({ 
                status: false, 
                message: 'Error: ' + error.message 
            });
        }
    });
};

module.exports.meta = {
    category: "Downloader",
    tag: "YTMP3",
    endpoints: [
        {
            method: "GET",
            path: "/ytmp3",
            desc: "Convert YouTube video ke MP3",
            tryUrl: "/ytmp3?url=https://youtu.be/dQw4w9WgXcQ",
            params: [{ name: "url", required: true, desc: "URL YouTube video" }]
        }
    ]
};
