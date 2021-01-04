const https = require('https')

const fetchEtherscanApi = async () => {
    return new Promise( (resolve, reject) => {
        if (!process.env['ETHERSCAN_API_KEY']) {
            reject(new Error('API Key are required'))
        }

        const apiKey = process.env['ETHERSCAN_API_KEY']

        https.get({
            host: 'api.etherscan.io',
            path: `/api?module=gastracker&action=gasoracle&apikey=${apiKey}`
        }, response => {
            let body = ''

            response.on('data', chunk => body += chunk)
            response.on('end', () => resolve(body))
        }).on('error', (error) => {
            reject(new Error(`Fetch error: ${error}`))
        })
    })
}

const prepareStreamEvent = response => {
    return new Promise( (resolve, reject) => {
        const data = {}
        const json = JSON.parse(response)

        if (json.message !== 'OK') {
            return reject(new Error('Response not OK'))
        }

        for (const [key, value] of Object.entries(json.result)) {
            data[key] = parseInt(value.toString(), 10)
        }

        return resolve(data)
    })
}

const publishStreamEvent = async data => {
    return new Promise((resolve, reject) => {
        if (!process.env['STREAMR_SESSION_TOKEN']) {
            reject(new Error('Streamr session token are required'))
        }

        const body = JSON.stringify(data)
        const streamId = encodeURIComponent(process.env['STREAMR_STREAM_ID'])
        const sessionToken = process.env['STREAMR_SESSION_TOKEN']

        https.request({
            host: 'streamr.network',
            path: `/api/v1/streams/${streamId}/data`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'Authorization': `Bearer ${sessionToken}`,
            }
        }, response => {
            let body = ''

            response.on('data', chunk => body += chunk)
            response.on('end', () => resolve(body))
        }).on('error', (error) => {
            reject(new Error(`Fetch error: ${error}`))
        }).end(body)
    })
}

(async () => {
    fetchEtherscanApi()
        .then(response => prepareStreamEvent(response))
        .then(data => publishStreamEvent(data))
        .then(() => process.exit())
        .catch(error => console.log(error))
})()
