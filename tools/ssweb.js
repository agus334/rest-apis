/**
 * @author      ARR Official
 * @title       SSWeb - Website Screenshot API
 * @description Ambil screenshot dari website menggunakan Imagy.app
 * @baseurl     https://gcp.imagy.app
 * @tags        tools, api, screenshot, ssweb
 * @language    javascript
 */

const axios = require('axios');

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
    
    if (isNaN(width) || isNaN(height) || isNaN(device_scale)) {
        throw new Error('Width, height, dan scale harus berupa angka');
    }
    
    if (typeof full_page !== 'boolean') {
        throw new Error('Full page harus berupa boolean (true/false)');
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

module.exports = function(app) {
    app.get('/ssweb', async (req, res) => {
        const { url, width, height, full_page, device_scale } = req.query;
        
        if (!url) {
            return res.status(400).json({
                status: 400,
                creator: "ARR Official",
                message: 'Parameter url diperlukan',
                example: '/ssweb?url=https://nekolabs.my.id&width=1280&height=720&full_page=false&device_scale=1'
            });
        }
        
        try {
            const screenshotUrl = await takeScreenshot(url, {
                width: width || 1280,
                height: height || 720,
                full_page: full_page === 'true' || full_page === true,
                device_scale: device_scale || 1
            });
            
            res.status(200).json({
                status: 200,
                creator: "ARR Official",
                data: {
                    url: url,
                    screenshot: screenshotUrl,
                    options: {
                        width: parseInt(width) || 1280,
                        height: parseInt(height) || 720,
                        full_page: full_page === 'true' || full_page === true,
                        device_scale: parseInt(device_scale) || 1
                    }
                }
            });
        } catch (error) {
            console.error('[ERROR]', error.message);
            res.status(500).json({
                status: 500,
                creator: "ARR Official",
                message: error.message
            });
        }
    });
};

module.exports.meta = {
    category: "Tools",
    tag: "SSWEB",
    endpoints: [
        {
            method: "GET",
            path: "/ssweb",
            desc: "Ambil screenshot dari website",
            tryUrl: "/ssweb?url=https://api.arr-official.my.id",
            params: [
                { name: "url", required: true, desc: "URL website yang akan di-screenshot" },
                { name: "width", required: false, desc: "Lebar viewport (default: 1280)" },
                { name: "height", required: false, desc: "Tinggi viewport (default: 720)" },
                { name: "full_page", required: false, desc: "Screenshot full halaman (true/false, default: false)" },
                { name: "device_scale", required: false, desc: "Skala perangkat (default: 1)" }
            ]
        }
    ]
};
