'use strict'

// ----------------------------------------------------------------------------

const [processPath, , exchangeId = null, exchangeSymbol = null] = process.argv.filter ((x) => !x.startsWith ('--'))
const verbose = process.argv.includes ('--verbose') || false
const debug = process.argv.includes ('--debug') || false

// ----------------------------------------------------------------------------

const fs = require ('fs')
    , assert = require ('assert')
    , { Agent } = require ('https')
    , ccxt = require ('../../ccxt.js') // eslint-disable-line import/order

// to have unified function name
function dump(...args) {
    console.log(...args);
}

// ----------------------------------------------------------------------------

process.on ('uncaughtException',  (e) => { dump (e, e.stack); process.exit (1) })
process.on ('unhandledRejection', (e) => { dump (e, e.stack); process.exit (1) })

// ----------------------------------------------------------------------------

dump ('\nTESTING', { 'exchange': exchangeId, 'symbol': exchangeSymbol || 'all' }, '\n')

// ----------------------------------------------------------------------------

const proxies = [
    '',
    'https://cors-anywhere.herokuapp.com/'
]

//-----------------------------------------------------------------------------

const enableRateLimit = true

const httpsAgent = new Agent ({
    'ecdhCurve': 'auto',
})

const timeout = 20000

const exchange = new (ccxt)[exchangeId] ({
    httpsAgent,
    verbose,
    enableRateLimit,
    debug,
    timeout,
})

//-----------------------------------------------------------------------------

const tests = {}
const properties = Object.keys (exchange.has)
properties
    // eslint-disable-next-line no-path-concat
    .filter ((property) => fs.existsSync (__dirname + '/Exchange/test.' + property + '.js'))
    .forEach ((property) => {
        // eslint-disable-next-line global-require, import/no-dynamic-require, no-path-concat
        tests[property] = require (__dirname + '/Exchange/test.' + property + '.js')
    })

const errors = require ('../base/errors.js')

Object.keys (errors)
    // eslint-disable-next-line no-path-concat
    .filter ((error) => fs.existsSync (__dirname + '/errors/test.' + error + '.js'))
    .forEach ((error) => {
        // eslint-disable-next-line global-require, import/no-dynamic-require, no-path-concat
        tests[error] = require (__dirname + '/errors/test.' + error + '.js')
    })

//-----------------------------------------------------------------------------

const keysGlobal = 'keys.json'
const keysLocal = 'keys.local.json'

const keysFile = fs.existsSync (keysLocal) ? keysLocal : keysGlobal
// eslint-disable-next-line import/no-dynamic-require, no-path-concat
const settings = require (__dirname + '/../../' + keysFile)[exchangeId]

if (settings) {
    const keys = Object.keys (settings)
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (settings[key]) {
            settings[key] = ccxt.deepExtend (exchange[key] || {}, settings[key])
        }
    }
}

Object.assign (exchange, settings)


// check auth keys in env var
const requiredCredentials = exchange.requiredCredentials;
for (const [credential, isRequired] of Object.entries (requiredCredentials)) {
    if (isRequired && exchange[credential] === undefined) {
        const credentialEnvName = (exchangeId + '_' + credential).toUpperCase () // example: KRAKEN_APIKEY
        const credentialValue = process.env[credentialEnvName]
        if (credentialValue) {
            exchange[credential] = credentialValue
        }
    }
}

if (settings && settings.skip) {
    dump ('[Skipped]', { 'exchange': exchangeId, 'symbol': exchangeSymbol || 'all' })
    process.exit ()
}

//-----------------------------------------------------------------------------

async function tester_func (methodName, exchange, ... args) {
    if (exchange.has[methodName]) {
        dump ('Testing', exchange.id, methodName, '(', ... args, ')')
        return await (tests[methodName] (exchange, ... args))
    } else {
        dump (' # Skipping Test : ',  exchange.id, '->', methodName, ' (not supported)')
    }
}

async function testSymbol (exchange, symbol) {

    await tester_func ('loadMarkets', exchange);
    await tester_func ('fetchCurrencies', exchange);
    await tester_func ('fetchTicker', exchange, symbol);
    await tester_func ('fetchTickers', exchange, symbol);
    await tester_func ('fetchOHLCV', exchange, symbol);
    await tester_func ('fetchTrades', exchange, symbol);

    if (exchange.id === 'coinbase') {

        // nothing for now

    } else {

        await tester_func ('fetchOrderBook', exchange, symbol);
        await tester_func ('fetchL2OrderBook', exchange, symbol);
        await tester_func ('fetchOrderBooks', exchange);
    }
}

//-----------------------------------------------------------------------------

async function loadExchange (exchange) {

    const markets = await exchange.loadMarkets ()

    assert (typeof exchange.markets === 'object', '.markets is not an object')
    assert (Array.isArray (exchange.symbols), '.symbols is not an array')
    assert (exchange.symbols.length > 0, '.symbols.length <= 0 (less than or equal to zero)')
    assert (Object.keys (exchange.markets).length > 0, 'Object.keys (.markets).length <= 0 (less than or equal to zero)')
    assert (exchange.symbols.length === Object.keys (exchange.markets).length, 'number of .symbols is not equal to the number of .markets')

    const symbols = [
        'BTC/CNY',
        'BTC/USD',
        'BTC/USDT',
        'BTC/EUR',
        'BTC/ETH',
        'ETH/BTC',
        'BTC/JPY',
        'ETH/EUR',
        'ETH/JPY',
        'ETH/CNY',
        'ETH/USD',
        'LTC/CNY',
        'DASH/BTC',
        'DOGE/BTC',
        'BTC/AUD',
        'BTC/PLN',
        'USD/SLL',
        'BTC/RUB',
        'BTC/UAH',
        'LTC/BTC',
        'EUR/USD',
    ]

    let result = exchange.symbols.filter ((symbol) => symbols.indexOf (symbol) >= 0)

    if (result.length > 0) {
        if (exchange.symbols.length > result.length) {
            result = result.join (', ') + ' + more...'
        } else {
            result = result.join (', ')
        }
    }

    dump (exchange.symbols.length, 'symbols', result)
}

//-----------------------------------------------------------------------------

function getTestSymbol (exchange, symbols) {
    let symbol = undefined
    for (let i = 0; i < symbols.length; i++) {
        const s = symbols[i]
        const market = exchange.safeValue (exchange.markets, s)
        if (market !== undefined) {
            const active = exchange.safeValue (market, 'active')
            if (active || (active === undefined)) {
                symbol = s
                break;
            }
        }
    }
    return symbol
}

async function testExchange (exchange) {

    await loadExchange (exchange)

    const codes = [
        'BTC',
        'ETH',
        'XRP',
        'LTC',
        'BCH',
        'EOS',
        'BNB',
        'BSV',
        'USDT',
        'ATOM',
        'BAT',
        'BTG',
        'DASH',
        'DOGE',
        'ETC',
        'IOTA',
        'LSK',
        'MKR',
        'NEO',
        'PAX',
        'QTUM',
        'TRX',
        'TUSD',
        'USD',
        'USDC',
        'WAVES',
        'XEM',
        'XMR',
        'ZEC',
        'ZRX',
    ]

    let code = undefined
    for (let i = 0; i < codes.length; i++) {
        if (codes[i] in exchange.currencies) {
            code = codes[i]
        }
    }

    let symbol = getTestSymbol (exchange, [
        'BTC/USD',
        'BTC/USDT',
        'BTC/CNY',
        'BTC/EUR',
        'BTC/ETH',
        'ETH/BTC',
        'ETH/USD',
        'ETH/USDT',
        'BTC/JPY',
        'LTC/BTC',
        'ZRX/WETH',
        'EUR/USD',
    ])

    if (symbol === undefined) {
        for (let i = 0; i < codes.length; i++) {
            const markets = Object.values (exchange.markets)
            const activeMarkets = markets.filter ((market) => (market['base'] === codes[i]))
            if (activeMarkets.length) {
                const activeSymbols = activeMarkets.map (market => market['symbol'])
                symbol = getTestSymbol (exchange, activeSymbols)
                break;
            }
        }
    }

    if (symbol === undefined) {
        const markets = Object.values (exchange.markets)
        const activeMarkets = markets.filter ((market) => !exchange.safeValue (market, 'active', false))
        const activeSymbols = activeMarkets.map (market => market['symbol'])
        symbol = getTestSymbol (exchange, activeSymbols)
    }

    if (symbol === undefined) {
        symbol = getTestSymbol (exchange, exchange.symbols)
    }

    if (symbol === undefined) {
        symbol = exchange.symbols[0]
    }

    dump ('SYMBOL:', symbol)
    if ((symbol.indexOf ('.d') < 0)) {
        await testSymbol (exchange, symbol)
    }

    if (!exchange.privateKey && (!exchange.apiKey || (exchange.apiKey.length < 1))) {
        return true
    }

    exchange.checkRequiredCredentials ()

    await tester_func ('signIn', exchange)

    // move to testnet/sandbox if possible before accessing the balance
    // if (exchange.urls['test'])
    //    exchange.urls['api'] = exchange.urls['test']

    const balance = await tester_func ('fetchBalance', exchange)
    await tester_func ('fetchAccounts', exchange)
    await tester_func ('fetchTransactionFees', exchange)
    await tester_func ('fetchTradingFees', exchange)
    await tester_func ('fetchStatus', exchange)
    await tester_func ('fetchOpenInterestHistory', exchange, symbol)
    await tester_func ('fetchOrders', exchange, symbol)
    await tester_func ('fetchOpenOrders', exchange, symbol)
    await tester_func ('fetchClosedOrders', exchange, symbol)
    await tester_func ('fetchMyTrades', exchange, symbol)
    await tester_func ('fetchLeverageTiers', exchange, symbol)
    await tester_func ('fetchOpenInterestHistory', exchange, symbol)

    await tester_func ('fetchPositions', exchange, symbol)

    if ('fetchLedger' in tests) {
        await tester_func ('fetchLedger', exchange, code)
    }

    await tester_func ('fetchTransactions', exchange, code)
    await tester_func ('fetchDeposits', exchange, code)
    await tester_func ('fetchWithdrawals', exchange, code)
    await tester_func ('fetchBorrowRate', exchange, code)
    await tester_func ('fetchBorrowRates', exchange)
    await tester_func ('fetchBorrowInterest', exchange, code)
    await tester_func ('fetchBorrowInterest', exchange, code, symbol)

    if (exchange.extendedTest) {

        await tester_func ('InvalidNonce', exchange, symbol)
        await tester_func ('OrderNotFound', exchange, symbol)
        await tester_func ('InvalidOrder', exchange, symbol)
        await tester_func ('InsufficientFunds', exchange, symbol, balance) // danger zone - won't execute with non-empty balance
    }
}

//-----------------------------------------------------------------------------

async function tryAllProxies (exchange, proxies) {

    const index = proxies.indexOf (exchange.proxy)
    let currentProxy = (index >= 0) ? index : 0
    const maxRetries = proxies.length

    if (settings && ('proxy' in settings)) {
        currentProxy = proxies.indexOf (settings.proxy)
    }

    for (let numRetries = 0; numRetries < maxRetries; numRetries++) {

        try {

            exchange.proxy = proxies[currentProxy]

            // add random origin for proxies
            if (exchange.proxy.length > 0) {
                exchange.origin = exchange.uuid ()
            }

            await testExchange (exchange)

            break

        } catch (e) {

            currentProxy = ++currentProxy % proxies.length
            dump ('[' + e.constructor.name + '] ' + e.message.slice (0, 200))
            if (e instanceof ccxt.DDoSProtection) {
                continue
            } else if (e instanceof ccxt.RequestTimeout) {
                continue
            } else if (e instanceof ccxt.ExchangeNotAvailable) {
                continue
            } else if (e instanceof ccxt.AuthenticationError) {
                return
            } else if (e instanceof ccxt.InvalidNonce) {
                return
            } else {
                throw e
            }
        }
    }
}

//-----------------------------------------------------------------------------

async function main () {

    if (exchangeSymbol) {

        await loadExchange (exchange)
        await testSymbol (exchange, exchangeSymbol)

    } else {

        await tryAllProxies (exchange, proxies)
    }

}

main ()
