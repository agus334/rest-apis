/**
 * @author      ARR Official
 * @title       F-Droid App Repository API
 * @description API endpoint untuk mencari aplikasi FOSS Android di F-Droid repository
 * @baseurl     https://search.f-droid.org
 * @tags        tools, api, search
 * @language    javascript
 */

const axios = require('axios');

const BASE_URL = 'https://search.f-droid.org';
const FDROID_BASE = 'https://f-droid.org';
const PER_PAGE = 20;

async function searchFdroid(query, page = 0) {
    const offset = page * PER_PAGE;

    const response = await axios.post(
        `${BASE_URL}/indexes/apps/search`,
        {
            q: query,
            limit: PER_PAGE,
            offset: offset,
            attributesToRetrieve: [
                'packageName', 'name', 'summary', 'description',
                'license', 'categories', 'added', 'lastUpdated',
                'suggestedVersionName', 'icon'
            ]
        },
        {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': BASE_URL,
                'Referer': `${BASE_URL}/`
            }
        }
    );

    const data = response.data;
    const hits = data?.hits ?? [];
    const results = [];

    for (const hit of hits) {
        const packageName = hit?.packageName ?? hit?.id ?? '-';
        const rawDesc = hit?.description ?? '-';
        const description = rawDesc.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

        results.push({
            name: hit?.name ?? '-',
            packageName: packageName,
            version: hit?.suggestedVersionName ?? '-',
            summary: hit?.summary ?? '-',
            description: description.substring(0, 300) + (description.length > 300 ? '...' : ''),
            license: hit?.license ?? '-',
            categories: Array.isArray(hit?.categories) ? hit.categories.join(', ') : (hit?.categories ?? '-'),
            added: hit?.added ? new Date(hit.added).toISOString().split('T')[0] : '-',
            lastUpdated: hit?.lastUpdated ? new Date(hit.lastUpdated).toISOString().split('T')[0] : '-',
            icon: packageName !== '-' ? `${FDROID_BASE}/repo/${packageName}/en-US/icon.png` : null,
            url: packageName !== '-' ? `${FDROID_BASE}/en/packages/${packageName}/` : null
        });
    }

    return {
        total: data?.estimatedTotalHits ?? data?.nbHits ?? 0,
        page: page,
        perPage: PER_PAGE,
        results: results
    };
}

async function searchFdroidFallback(query) {
    const response = await axios.get(`${BASE_URL}/`, {
        params: { q: query, lang: 'en' },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
    });

    const html = response.data;
    const results = [];

    const packageRegex = /<a[^>]+class="[^"]*package-header[^"]*"[^>]+href="([^"]+)"[^>]*>[\s\S]*?<span[^>]+class="[^"]*package-name[^"]*"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<span[^>]+class="[^"]*package-summary[^"]*"[^>]*>([\s\S]*?)<\/span>/g;
    
    let match;
    while ((match = packageRegex.exec(html)) !== null) {
        const href = match[1];
        const name = match[2].replace(/<[^>]*>/g, '').trim();
        const summary = match[3].replace(/<[^>]*>/g, '').trim();
        const pkgMatch = href.match(/\/packages\/([^\/]+)\//);
        const packageName = pkgMatch ? pkgMatch[1] : '-';

        results.push({
            name: name,
            packageName: packageName,
            version: '-',
            summary: summary,
            description: '-',
            license: '-',
            categories: '-',
            added: '-',
            lastUpdated: '-',
            icon: packageName !== '-' ? `${FDROID_BASE}/repo/${packageName}/en-US/icon.png` : null,
            url: href.startsWith('http') ? href : `${FDROID_BASE}${href}`
        });
    }

    return {
        total: results.length,
        page: 0,
        perPage: results.length,
        results: results
    };
}

module.exports = function(app) {
    app.get('/fdroid', async (req, res) => {
        const { q, page = 0 } = req.query;

        if (!q) {
            return res.status(400).json({
                status: false,
                message: 'Parameter q diperlukan',
                example: '/fdroid?q=termux&page=0'
            });
        }

        try {
            let result;
            try {
                result = await searchFdroid(q, parseInt(page));
            } catch (e) {
                result = await searchFdroidFallback(q);
            }

            res.status(200).json({
                status: true,
                query: q,
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
    category: "Search",
    tag: "FDROID",
    endpoints: [
        {
            method: "GET",
            path: "/fdroid",
            desc: "Cari aplikasi FOSS di F-Droid repository",
            tryUrl: "/fdroid?q=termux",
            params: [
                { name: "q", required: true, desc: "Kata kunci pencarian" },
                { name: "page", required: false, desc: "Halaman hasil (default: 0)" }
            ]
        }
    ]
};
