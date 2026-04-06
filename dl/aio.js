/**
 * @author      ARR Official
 * @title       All In One Downloader API
 * @description API endpoint untuk mendownload video dari berbagai platform (TikTok, Instagram, YouTube, dll)
 * @baseurl     https://allinonedownloader.com
 * @tags        downloader, tiktok, instagram, youtube, api
 * @language    javascript
 */

const axios = require('axios');

module.exports = function(app) {
    app.get('/allinone', async (req, res) => {
        try {
            const url = req.query.url || req.query.link;
            
            if (!url) {
                return res.status(400).json({
                    status: false,
                    error: "Parameter 'url' diperlukan",
                    example: "/allinone?url=https://www.tiktok.com/@username/video/123456789",
                    creator: "ARR Official"
                });
            }

            const headers = {
                'accept': '*/*',
                'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'cookie': 'PHPSESSID=8367e29121fc8693ddf09840eaf9a645; _gid=GA1.2.897919413.1770899682; crs_ALLINONEDOWNLOADER_COM=blah; popFirst=blah; _ga_BKWXCG81DF=GS2.1.s1770899681$o1$g1$t1770899775$j56$l0$h0; _ga=GA1.1.751815724.1770899682',
                'origin': 'https://allinonedownloader.com',
                'referer': 'https://allinonedownloader.com/',
                'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36',
                'x-requested-with': 'XMLHttpRequest'
            };

            const payload = new URLSearchParams({
                url: url,
                token: 'ac98e0708b18806a7e0aedaf8bfd135b9605ce9e617aebbdf3118d402ae6f15f',
                urlhash: '/EW6oWxKREb5Ji1lQRgY2f4FkImCr6gbFo1HX4VAUuiJrN+7veIcnrr+ZrfMg0Jyo46ABKmFUhf2LpwuIxiFJZZObl9tfJG7E9EMVNIbkNyiqCIdpc61WKeMmmbMW+n6'
            });

            const response = await axios.post('https://allinonedownloader.com/system/3c829fbbcf0387c.php', payload.toString(), { headers });
            
            res.json({
                status: true,
                creator: "ARR Official",
                url_request: url,
                result: response.data
            });

        } catch (error) {
            res.status(500).json({
                status: false,
                error: error.message,
                creator: "ARR Official"
            });
        }
    });
};

module.exports.meta = {
    category: "Downloader",
    tag: "allinone",
    endpoints: [
        {
            method: "GET",
            path: "/allinone",
            desc: "Download video dari TikTok, Instagram, YouTube, Facebook, Twitter, dll",
            tryUrl: "/allinone?url=https://www.tiktok.com/@yuukiituru/video/7595515280441330951",
            params: [
                { name: "url", required: true, desc: "URL video yang ingin didownload" }
            ]
        }
    ]
};
