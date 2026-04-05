/**
 * @author      ARR Official
 * @title       SSWeb - Website Screenshot API
 * @description Ambil screenshot dari website menggunakan Imagy.app
 * @baseurl     https://gcp.imagy.app
 * @tags        tools, api, screenshot, ssweb
 * @language    javascript
 */

const express = require('express');
const axios = require('axios');
const app = express();

async function takeScreenshot(url, options = {}) {
    const {
        width = 1280,
        height = 720,
        full_page = false,
        device_scale = 1
    } = options;
    
    if (!url.startsWith('https://')) {
        throw new Error('URL harus menggunakan protokol HTTPS');
    }
    
    const { data } = await axios.post('https://gcp.imagy.app/screenshot/createscreenshot', {
        url: url,
        browserWidth: parseInt(width),
        browserHeight: parseInt(height),
        fullPage: full_page,
        deviceScaleFactor: parseInt(device_scale),
        format: 'png'
    }, {
        headers: {
            'content-type': 'application/json',
            'referer': 'https://imagy.app/full-page-screenshot-taker/',
            'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
        },
        timeout: 30000
    });
    
    return data.fileUrl;
}

app.get('/ssweb', async (req, res) => {
    const { url, width, height, full_page, device_scale } = req.query;
    
    if (!url) {
        return res.status(400).json({
            status: 400,
            creator: "ARR Official",
            message: 'Parameter url diperlukan',
            example: '/ssweb?url=https://nekolabs.my.id'
        });
    }
    
    try {
        const screenshotUrl = await takeScreenshot(url, {
            width: width || 1280,
            height: height || 720,
            full_page: full_page === 'true',
            device_scale: device_scale || 1
        });
        
        res.status(200).json({
            status: 200,
            creator: "ARR Official",
            data: {
                url: url,
                screenshot: screenshotUrl
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            creator: "ARR Official",
            message: error.message
        });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
