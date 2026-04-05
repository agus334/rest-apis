/**
 * @author      ARR Official
 * @title       SaveTube YouTube to MP4 API
 * @description API endpoint untuk convert YouTube video ke MP4 menggunakan SaveTube dengan decrypt AES
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

async function convertToMp4(url, quality = '360') {
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
    
    if (!videoFormat) {
        videoFormat = json.video_formats.find(f => f.quality === '720') ||
                      json.video_formats.find(f => f.quality === '360') ||
                      json.video_formats[0];
    }
    
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
        downloadUrl: downloadRes.data?.data?.downloadUrl,
        quality: videoFormat.quality,
        size: videoFormat.size,
        thumbnail: json.thumbnail,
        formats: json.video_formats.map(f => ({
            quality: f.quality,
            size: f.size,
            format: f.format
        }))
    };
}

module.exports = function(app) {
    app.get('/ytmp4', async (req, res) => {
        const { url, quality = '360' } = req.query;
        
        if (!url) {
            return res.status(400).json({
                status: false,
                message: 'Parameter URL diperlukan',
                example: '/ytmp4?url=https://youtu.be/dQw4w9WgXcQ&quality=720'
            });
        }
        
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return res.status(400).json({
                status: false,
                message: 'URL YouTube tidak valid'
            });
        }
        
        const validQualities = ['144', '240', '360', '480', '720', '1080', '1440', '2160'];
        if (!validQualities.includes(quality)) {
            return res.status(400).json({
                status: false,
                message: `Kualitas tidak valid. Pilih: ${validQualities.join(', ')}`
            });
        }
        
        try {
            const result = await convertToMp4(url, quality);
            
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
    tag: "YTMP4",
    endpoints: [
        {
            method: "GET",
            path: "/ytmp4",
            desc: "Convert YouTube video ke MP4",
            tryUrl: "/ytmp4?url=https://youtu.be/dQw4w9WgXcQ&quality=720",
            params: [
                { name: "url", required: true, desc: "URL YouTube video" },
                { name: "quality", required: false, desc: "Kualitas video (144/240/360/480/720/1080/1440/2160)", default: "720" }
            ]
        }
    ]
};
