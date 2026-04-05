
/**
 * @author      ARR Official
 * @title       YouTube MP3 Downloader API
 * @description Endpoint to download YouTube audio as MP3 format
 * @baseurl     https://save-tube.com
 * @tags        tools
 * @language    javascript
 */

const axios = require('axios');
const crypto = require('crypto');

const KEY = Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex');

function decrypt(enc) {
    const b = Buffer.from(enc.replace(/\s/g, ''), 'base64');
    const iv = b.subarray(0, 16);
    const data = b.subarray(16);
    const d = crypto.createDecipheriv('aes-128-cbc', KEY, iv);
    return JSON.parse(Buffer.concat([d.update(data), d.final()]).toString());
}

async function getRandomCDN() {
    const response = await axios.get('https://media.savetube.vip/api/random-cdn', {
        headers: {
            origin: 'https://save-tube.com',
            referer: 'https://save-tube.com/'
        }
    });
    return response.data.cdn;
}

async function getVideoInfo(cdn, url) {
    const response = await axios.post(`https://${cdn}/v2/info`,
        { url },
        {
            headers: {
                'Content-Type': 'application/json',
                origin: 'https://save-tube.com'
            }
        }
    );
    
    if (!response.data?.status) {
        throw new Error('Could not get video info');
    }
    
    const json = decrypt(response.data.data);
    return json;
}

async function getDownloadUrl(cdn, videoId, videoKey, quality) {
    const response = await axios.post(`https://${cdn}/download`,
        {
            id: videoId,
            key: videoKey,
            downloadType: 'audio',
            quality: String(quality)
        },
        {
            headers: {
                'Content-Type': 'application/json',
                origin: 'https://save-tube.com'
            }
        }
    );
    
    if (!response.data?.data?.downloadUrl) {
        throw new Error('Could not get download URL');
    }
    
    return response.data.data.downloadUrl;
}

module.exports = function(app) {
    app.get('/ytmp3', async (req, res) => {
        try {
            const url = req.query.url;
            
            if (!url) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter "url" tidak ditemukan',
                    example: '/ytmp3?url=https://youtube.com/watch?v=xxx'
                });
            }
            
            if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
                return res.status(400).json({
                    status: 400,
                    error: 'Invalid YouTube URL'
                });
            }
            
            const cdn = await getRandomCDN();
            
            const videoInfo = await getVideoInfo(cdn, url);
            
            const audioFormat = videoInfo.audio_formats.find(f => f.quality === '128') || videoInfo.audio_formats[0];
            
            if (!audioFormat) {
                throw new Error('No audio format found');
            }
            
            const audioUrl = await getDownloadUrl(cdn, videoInfo.id, videoInfo.key, audioFormat.quality);
            
            res.status(200).json({
                status: 200,
                creator: 'ARR Official',
                data: {
                    title: videoInfo.title,
                    duration: videoInfo.duration,
                    thumbnail: videoInfo.thumbnail,
                    quality: audioFormat.quality,
                    size: audioFormat.size,
                    download_url: audioUrl
                }
            });
            
        } catch (error) {
            res.status(500).json({
                status: 500,
                error: error.message
            });
        }
    });
    
    app.get('/ytmp3/info', async (req, res) => {
        try {
            const url = req.query.url;
            
            if (!url) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter "url" tidak ditemukan'
                });
            }
            
            if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
                return res.status(400).json({
                    status: 400,
                    error: 'Invalid YouTube URL'
                });
            }
            
            const cdn = await getRandomCDN();
            
            const videoInfo = await getVideoInfo(cdn, url);
            
            const formats = videoInfo.audio_formats.map(f => ({
                quality: f.quality,
                size: f.size,
                extension: f.extension
            }));
            
            res.status(200).json({
                status: 200,
                creator: 'ARR Official',
                data: {
                    title: videoInfo.title,
                    duration: videoInfo.duration,
                    thumbnail: videoInfo.thumbnail,
                    author: videoInfo.author,
                    available_formats: formats
                }
            });
            
        } catch (error) {
            res.status(500).json({
                status: 500,
                error: error.message
            });
        }
    });
};
