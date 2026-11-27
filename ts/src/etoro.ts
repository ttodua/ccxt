//  ---------------------------------------------------------------------------

import Exchange from './abstract/etoro.js';
import { ArgumentsRequired, AuthenticationError, BadSymbol, BadRequest, ExchangeError, InvalidOrder, NotSupported, OrderNotFound, PermissionDenied, RateLimitExceeded } from './base/errors.js';
import { Precise } from './base/Precise.js';
import { TICK_SIZE } from './base/functions/number.js';
import type { Account, Balances, Bool, Currency, Dict, Endpoint, Int, LedgerEntry, List, Market, Num, NullableDict, OHLCV, Order, OrderSide, OrderType, Position, Str, Strings, Ticker, Tickers, Trade, TransferEntry, int } from './base/types.js';

//  ---------------------------------------------------------------------------

/**
 * @class etoro
 * @augments Exchange
 */
export default class etoro extends Exchange {
    override describe (): Dict {
        return this.deepExtend (super.describe (), {
            'id': 'etoro',
            'name': 'eToro',
            'countries': [ 'IL' ],
            'version': 'v1',
            // market data shares a 120 requests / 60 s quota (cost 1), the other endpoints share 60 requests / 60 s (cost 2)
            // and the order execution, eligibility and cost endpoints share 20 requests / 60 s (cost 6)
            'rateLimit': 500,
            'certified': false,
            'pro': false,
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': false,
                'swap': true,
                'future': false,
                'option': false,
                'addMargin': false,
                'cancelAllOrders': false,
                'cancelOrder': true,
                'cancelOrders': false,
                'closeAllPositions': false,
                'closePosition': true,
                'createLimitBuyOrder': true,
                'createLimitOrder': true,
                'createLimitSellOrder': true,
                'createMarketBuyOrder': true,
                'createMarketBuyOrderWithCost': true,
                'createMarketOrder': true,
                'createMarketOrderWithCost': true,
                'createMarketSellOrder': true,
                'createMarketSellOrderWithCost': true,
                'createOrder': true,
                'createOrderWithTakeProfitAndStopLoss': true,
                'createPostOnlyOrder': false,
                'createReduceOnlyOrder': false,
                'createStopOrder': false,
                'createTriggerOrder': true,
                'editOrder': true,
                'fetchAccounts': true,
                'fetchBalance': true,
                'fetchBidsAsks': true,
                'fetchCanceledOrders': false,
                'fetchClosedOrders': false,
                'fetchCurrencies': false,
                'fetchLedger': true,
                'fetchMarkets': true,
                'fetchMyTrades': true,
                'fetchOHLCV': true,
                'fetchOpenOrders': true,
                'fetchOrder': true,
                'fetchOrderBook': false,
                'fetchOrders': true,
                'fetchPosition': true,
                'fetchPositions': true,
                'fetchPositionsForSymbol': true,
                'fetchStatus': false,
                'fetchTicker': true,
                'fetchTickers': true,
                'fetchTrades': false,
                'fetchTradingFee': false,
                'fetchTradingFees': false,
                'fetchTransfer': true,
                'fetchTransfers': true,
                'reduceMargin': false,
                'sandbox': true,
                'setLeverage': false,
                'setMarginMode': false,
                'setPositionMode': false,
                'signIn': false,
                'transfer': true,
                'withdraw': false,
            },
            // the recent candles endpoint (v1/market-data) uses the exchange names, the historical one (v1/data) uses the unified ones
            'timeframes': {
                '1m': 'OneMinute',
                '5m': 'FiveMinutes',
                '10m': 'TenMinutes',
                '15m': 'FifteenMinutes',
                '30m': 'ThirtyMinutes',
                '1h': 'OneHour',
                '4h': 'FourHours',
                '1d': 'OneDay',
                '1w': 'OneWeek',
            },
            'urls': {
                'www': 'https://www.etoro.com',
                'api': {
                    'public': 'https://public-api.etoro.com/api',
                    'private': 'https://public-api.etoro.com/api',
                },
                'doc': [
                    'https://api-portal.etoro.com/',
                ],
                'fees': 'https://www.etoro.com/trading/fees.aspx',
            },
            'api': {
                // every endpoint is authenticated with the key pair, the market data endpoints included
                'public': {
                    'get': {
                        // market data, a shared 120 requests / 60 s quota
                        'v1/market-data/exchanges': { 'cost': 1 } as Endpoint<List>,
                        'v1/market-data/instrument-types': { 'cost': 1 } as Endpoint<List>,
                        'v1/market-data/instruments': { 'cost': 1 } as Endpoint<Dict>,
                        'v1/market-data/instruments/history/closing-price': { 'cost': 1 } as Endpoint<List>,
                        'v1/market-data/instruments/rates': { 'cost': 1 } as Endpoint<Dict>,
                        'v1/market-data/instruments/{instrumentId}/history/candles/{direction}/{interval}/{candlesCount}': { 'cost': 1 } as Endpoint<Dict>,
                        'v1/market-data/search': { 'cost': 1 } as Endpoint<Dict>,
                        'v1/market-data/stocks-industries': { 'cost': 1 } as Endpoint<List>,
                        'v1/data/instruments/{instrumentId}/candles': { 'cost': 1 } as Endpoint<Dict>,
                        'v1/data/instruments/{instrumentId}/candles/coverage': { 'cost': 1 } as Endpoint<Dict>,
                        'v2/market-data/instruments': { 'cost': 1 } as Endpoint<Dict>,
                        'v2/market-data/instruments/search': { 'cost': 1 } as Endpoint<Dict>,
                        'v2/market-data/rates': { 'cost': 1 } as Endpoint<Dict>,
                    },
                },
                'private': {
                    'get': {
                        // identity, balances, money
                        'v1/me': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/balances': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/balances/history': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/balances/{accountType}': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/balances/{accountType}/history': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/balances/{accountType}/{accountId}': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/balances/{accountType}/{accountId}/history': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/money/accounts/cash/{accountId}/transactions': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/money/transfer-eligibility': { 'cost': 2 } as Endpoint<List>,
                        'v1/money/transfer-fee-configurations': { 'cost': 2 } as Endpoint<List>,
                        'v1/money/transfer-limits': { 'cost': 2 } as Endpoint<List>,
                        'v1/money/transferable-balance': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/money/transfers/{transferId}': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/money/transfers:lookup': { 'cost': 2 } as Endpoint<Dict>,
                        // portfolio, real and demo accounts
                        'v1/trading/info/portfolio': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/trading/info/aggregate-portfolio': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/trading/info/real/pnl': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/trading/info/real/close-orders/{orderId}': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/trading/info/trade/history': { 'cost': 2 } as Endpoint<List>,
                        'v1/trading/info/demo/portfolio': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/trading/info/demo/aggregate-portfolio': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/trading/info/demo/pnl': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/trading/info/demo/close-orders/{orderId}': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/trading/info/trade/demo/history': { 'cost': 2 } as Endpoint<List>,
                        'v2/trading/info/orders:lookup': { 'cost': 2 } as Endpoint<Dict>,
                        'v2/trading/info/demo/orders:lookup': { 'cost': 2 } as Endpoint<Dict>,
                        'v2/trading/info/instrument-breakdown': { 'cost': 2 } as Endpoint<Dict>,
                        'v2/trading/info/demo/instrument-breakdown': { 'cost': 2 } as Endpoint<Dict>,
                        // watchlists
                        'v1/watchlists': { 'cost': 2 } as Endpoint<List>,
                        'v1/watchlists/{watchlistId}': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/watchlists/default-watchlists/items': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/watchlists/public/{userId}': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/watchlists/public/{userId}/{watchlistId}': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/curated-lists': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/market-recommendations/{itemsCount}': { 'cost': 2 } as Endpoint<Dict>,
                        // notifications, price alerts
                        'v1/notifications/messages': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/price-alerts': { 'cost': 2 } as Endpoint<List>,
                    },
                    'post': {
                        // order execution, a shared 20 requests / 60 s quota
                        'v2/trading/execution/orders': { 'cost': 6 } as Endpoint<Dict>,
                        'v2/trading/execution/demo/orders': { 'cost': 6 } as Endpoint<Dict>,
                        'v1/trading/execution/market-close-orders/positions/{positionId}': { 'cost': 6 } as Endpoint<Dict>,
                        'v1/trading/execution/demo/market-close-orders/positions/{positionId}': { 'cost': 6 } as Endpoint<Dict>,
                        // the what-if costs and the eligibility endpoints have their own 20 requests / 60 s quota
                        'v2/trading/info/costs': { 'cost': 6 } as Endpoint<Dict>,
                        'v2/trading/info/demo/costs': { 'cost': 6 } as Endpoint<Dict>,
                        'v2/trading/info/eligibility': { 'cost': 6 } as Endpoint<Dict>,
                        'v2/trading/info/demo/eligibility': { 'cost': 6 } as Endpoint<Dict>,
                        // portfolio filters
                        'v1/trading/info/aggregate-portfolio': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/trading/info/demo/aggregate-portfolio': { 'cost': 2 } as Endpoint<Dict>,
                        // internal transfers
                        'v1/money/transfers': { 'cost': 2 } as Endpoint<Dict>,
                        // watchlists, a shared 20 requests / 60 s quota
                        'v1/watchlists': { 'cost': 6 } as Endpoint<Dict>,
                        'v1/watchlists/{watchlistId}/items': { 'cost': 6 } as Endpoint<Dict>,
                        'v1/watchlists/default-watchlist/selected-items': { 'cost': 6 } as Endpoint<Dict>,
                        'v1/watchlists/newasdefault-watchlist': { 'cost': 6 } as Endpoint<Dict>,
                        'v2/watchlists': { 'cost': 2 } as Endpoint<Dict>,
                        // price alerts, notifications
                        'v1/price-alerts': { 'cost': 2 } as Endpoint<Dict>,
                        'v2/agent-portfolios': { 'cost': 2 } as Endpoint<Dict>,
                        'v2/agent-portfolios/{agentPortfolioId}/user-tokens': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/sub-accounts/etoro-trading/money-transfers': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/sub-accounts/etoro-trading/user-tokens': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/sub-accounts/me/accounts': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/sso/applications': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/sso/applications/{clientId}/client-secret': { 'cost': 2 } as Endpoint<Dict>,
                        // copy trading
                        'v2/trading/copy': { 'cost': 2 } as Endpoint<Dict>,
                        'v2/trading/copy/close': { 'cost': 2 } as Endpoint<Dict>,
                        'v2/trading/copy/eligibility': { 'cost': 2 } as Endpoint<Dict>,
                        'v2/trading/copy/demo': { 'cost': 2 } as Endpoint<Dict>,
                        'v2/trading/copy/demo/close': { 'cost': 2 } as Endpoint<Dict>,
                        'v2/trading/copy/demo/eligibility': { 'cost': 2 } as Endpoint<Dict>,
                    },
                    'put': {
                        'v1/watchlists/{watchlistId}': { 'cost': 6 } as Endpoint<Dict>,
                        'v1/watchlists/{watchlistId}/items': { 'cost': 6 } as Endpoint<Dict>,
                        'v1/watchlists/rank/{watchlistId}': { 'cost': 6 } as Endpoint<Dict>,
                        'v1/watchlists/setUserSelectedUserDefault/{watchlistId}': { 'cost': 6 } as Endpoint<Dict>,
                        'v1/sso/applications/{clientId}': { 'cost': 2 } as Endpoint<Dict>,
                    },
                    'patch': {
                        // stop-loss and take-profit of an open position
                        'v2/trading/positions/{positionId}': { 'cost': 2 } as Endpoint<Dict>,
                        'v2/trading/demo/positions/{positionId}': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/notifications/messages': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/price-alerts/{alertId}': { 'cost': 2 } as Endpoint<Dict>,
                        'v2/agent-portfolios/{agentPortfolioId}/user-tokens/{userTokenId}': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/sub-accounts/etoro-trading/user-tokens/{userTokenId}': { 'cost': 2 } as Endpoint<Dict>,
                    },
                    'delete': {
                        // order execution, a shared 20 requests / 60 s quota
                        'v2/trading/execution/orders/{orderId}': { 'cost': 6 } as Endpoint<Dict>,
                        'v2/trading/execution/demo/orders/{orderId}': { 'cost': 6 } as Endpoint<Dict>,
                        'v1/trading/execution/market-close-orders/{orderId}': { 'cost': 6 } as Endpoint<Dict>,
                        'v1/trading/execution/demo/market-close-orders/{orderId}': { 'cost': 6 } as Endpoint<Dict>,
                        'v1/watchlists/{watchlistId}': { 'cost': 6 } as Endpoint<Dict>,
                        'v1/watchlists/{watchlistId}/items': { 'cost': 6 } as Endpoint<Dict>,
                        'v1/price-alerts/{alertId}': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/agent-portfolios/{agentPortfolioId}': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/agent-portfolios/{agentPortfolioId}/user-tokens/{userTokenId}': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/sub-accounts/etoro-trading/user-tokens/{userTokenId}': { 'cost': 2 } as Endpoint<Dict>,
                        'v1/sso/applications/{clientId}': { 'cost': 2 } as Endpoint<Dict>,
                        'v2/trading/copy': { 'cost': 2 } as Endpoint<Dict>,
                        'v2/trading/copy/demo': { 'cost': 2 } as Endpoint<Dict>,
                    },
                },
            },
            'fees': {
                'trading': {
                    // eToro has no per-fill commission, its costs are the spread, a markup and per-instrument fees, see fetchTradingCosts
                    'tierBased': false,
                    'percentage': true,
                    'maker': this.parseNumber ('0'),
                    'taker': this.parseNumber ('0'),
                },
            },
            'precisionMode': TICK_SIZE,
            'requiredCredentials': {
                'apiKey': true, // the public api key of the application, sent as x-api-key
                'secret': true, // the user key of the account, sent as x-user-key
            },
            'options': {
                // the demo account lives on the same host, its trading endpoints carry a "demo" path segment, also set with setSandboxMode (true)
                'sandboxMode': 'real',
                'fetchMarkets': {
                    // only the instruments that are active in the platform, set to false to also load the inactive ones (active = false)
                    'activeOnly': true,
                    // the native currency of the instruments of each exchange, the ones of the exchanges that are not listed are quoted in usd
                    'exchangeCurrencies': {
                        '6': 'EUR', // FRA
                        '7': 'GBX', // LSE
                        '9': 'EUR', // Euronext Paris
                        '10': 'EUR', // Bolsa De Madrid
                        '11': 'EUR', // Borsa Italiana
                        '12': 'CHF', // SIX
                        '14': 'NOK', // Oslo Stock Exchange
                        '15': 'SEK', // Stockholm Stock Exchange
                        '16': 'DKK', // Copenhagen Stock Exchange
                        '17': 'EUR', // Helsinki Stock Exchange
                        '22': 'EUR', // Euronext Lisbon
                        '23': 'EUR', // Euronext Brussels
                        '30': 'EUR', // Euronext Amsterdam
                        '38': 'EUR', // Xetra ETFs
                        '44': 'GBX', // LSE Auction
                    },
                    // the native currency of the instruments that are quoted in another currency than the one of their exchange, verified live 2026-11-27
                    // against the conversion rates and the candle coverage symbols, an instrument that is not listed is quoted in the currency of its exchange
                    'quoteCurrencies': {
                        // CFD (exchange id 3)
                        '30': 'GBP', '31': 'EUR', '32': 'EUR', '33': 'AUD', '34': 'EUR', '36': 'JPY', '38': 'HKD', '43': 'EUR', '301': 'SGD', '321': 'EUR', '322': 'CHF', '353': 'EUR', '626': 'SEK',
                        // Commodity (exchange id 2)
                        '319': 'EUR', '333': 'EUR', '388': 'EUR', '389': 'GBP', '422': 'CAD',
                        // LSE (exchange id 7)
                        '1442': 'USD', '2175': 'USD', '2180': 'GBP', '2861': 'USD', '2864': 'USD', '2865': 'USD', '3030': 'USD', '3048': 'USD', '3063': 'USD',
                        '3068': 'EUR', '3297': 'EUR', '3388': 'GBP', '3431': 'GBP', '3432': 'GBP', '3433': 'EUR', '3434': 'GBP',
                        '8015': 'USD', '8016': 'USD', '8017': 'USD', '8018': 'USD', '8019': 'USD', '8021': 'USD', '8022': 'USD', '8023': 'USD', '8024': 'USD',
                        '8025': 'USD', '8026': 'USD', '8027': 'USD', '8038': 'USD', '8042': 'USD', '8795': 'USD', '8796': 'USD', '8797': 'USD', '8798': 'USD', '9403': 'USD',
                        '11170': 'USD', '11173': 'USD', '11176': 'USD', '11177': 'USD', '11178': 'USD', '11179': 'USD', '11180': 'USD', '11182': 'USD', '11185': 'USD', '11192': 'USD', '11196': 'USD', '11197': 'USD',
                        '11224': 'USD', '11238': 'USD', '11246': 'USD', '12151': 'USD', '12153': 'USD', '12154': 'USD', '12155': 'USD', '12156': 'USD', '12157': 'USD', '12158': 'USD', '12159': 'USD',
                        '12160': 'USD', '12206': 'USD', '12218': 'USD', '13546': 'USD', '13547': 'USD', '13548': 'USD', '13549': 'USD', '13550': 'USD', '13551': 'USD', '13553': 'USD',
                        '13554': 'USD', '13555': 'USD', '13556': 'USD', '13557': 'USD', '13558': 'USD', '13559': 'USD', '13560': 'USD', '13561': 'USD', '13562': 'USD', '13563': 'USD', '13564': 'USD',
                        '13565': 'USD', '14445': 'USD', '14446': 'USD', '14447': 'USD', '14448': 'USD', '14449': 'USD', '14450': 'USD', '14451': 'USD', '14452': 'USD', '14453': 'USD', '14459': 'USD',
                        '14463': 'USD', '14465': 'USD', '14466': 'USD', '14467': 'USD', '14468': 'USD', '14469': 'USD', '14470': 'USD', '14491': 'USD', '14492': 'USD', '14493': 'USD',
                        '15334': 'EUR', '15335': 'EUR', '15336': 'EUR', '15337': 'EUR', '15338': 'EUR', '15339': 'EUR', '15340': 'EUR',
                        '15353': 'EUR', '15354': 'EUR', '15355': 'EUR', '15357': 'EUR', '15358': 'EUR', '15359': 'EUR', '15360': 'EUR',
                        '15361': 'EUR', '15362': 'EUR', '15363': 'EUR', '15364': 'EUR', '15365': 'EUR', '15366': 'EUR', '15367': 'EUR',
                        '15368': 'EUR', '15369': 'EUR', '15370': 'EUR', '15371': 'EUR', '15372': 'EUR', '15373': 'EUR', '15374': 'EUR',
                        '15375': 'EUR', '15377': 'EUR', '15378': 'EUR', '15379': 'EUR', '15380': 'EUR', '15381': 'EUR', '15382': 'EUR',
                        '15383': 'EUR', '15384': 'EUR', '15385': 'EUR', '15386': 'EUR', '15387': 'EUR', '15390': 'EUR', '15392': 'EUR',
                        '15393': 'EUR', '15394': 'EUR', '15395': 'EUR', '15396': 'EUR', '15397': 'EUR', '15398': 'EUR', '15399': 'EUR',
                        '15400': 'EUR', '15401': 'EUR', '15402': 'EUR', '15403': 'EUR', '15407': 'EUR', '15408': 'EUR', '15409': 'EUR',
                        '15410': 'EUR', '15411': 'EUR', '15412': 'EUR', '15413': 'EUR', '15415': 'EUR', '15416': 'EUR', '15418': 'EUR',
                        '15420': 'EUR', '15423': 'EUR', '15424': 'EUR', '15425': 'EUR', '15426': 'EUR', '15427': 'EUR', '15428': 'EUR',
                        '15429': 'EUR', '15430': 'EUR', '15431': 'EUR', '15433': 'EUR', '15434': 'EUR', '15435': 'EUR', '15436': 'EUR',
                        '15437': 'EUR', '15438': 'EUR', '15439': 'EUR', '15440': 'EUR', '15441': 'EUR', '15442': 'EUR', '15444': 'EUR',
                        '15445': 'EUR', '15446': 'EUR', '15448': 'EUR', '15450': 'EUR', '15451': 'EUR', '15452': 'EUR', '15456': 'EUR',
                        '15461': 'EUR', '15462': 'EUR', '15463': 'EUR', '15464': 'EUR',
                        '15734': 'USD', '15735': 'USD', '15737': 'USD', '15738': 'USD', '15739': 'USD', '15740': 'USD', '15741': 'USD',
                        '15742': 'USD', '15743': 'USD', '16114': 'USD', '16115': 'USD', '16116': 'USD', '16117': 'USD', '16118': 'USD',
                        '16119': 'USD', '16120': 'USD', '16121': 'USD', '16122': 'USD', '16123': 'USD', '16124': 'USD', '16125': 'USD',
                        '16126': 'USD', '16127': 'USD', '16128': 'USD', '16129': 'USD', '16130': 'USD', '16132': 'USD', '16133': 'USD',
                        '16134': 'USD', '16136': 'USD', '16137': 'USD', '16138': 'USD', '16139': 'USD', '16141': 'USD', '16142': 'USD',
                        '16147': 'USD', '16148': 'USD', '16149': 'USD', '16150': 'USD', '16151': 'USD', '16152': 'USD',
                        // Xetra ETFs (exchange id 38)
                        '3419': 'USD', '8799': 'USD', '14454': 'USD', '14456': 'USD', '14503': 'GBP', '15744': 'USD', '15745': 'USD', '15746': 'USD', '15747': 'USD', '15748': 'USD',
                        // Euronext Amsterdam (exchange id 30)
                        '14455': 'USD', '15631': 'USD', '15705': 'USD', '15706': 'USD', '15707': 'USD', '15708': 'USD', '15709': 'USD', '15710': 'USD', '15711': 'USD', '15712': 'USD',
                        // Digital Currency (exchange id 8), crypto pairs against other currencies and coins
                        '100109': 'EUR', '100110': 'EUR', '100117': 'GBP', '100118': 'GBP', '100119': 'GBP', '100120': 'GBP', '100121': 'JPY', '100122': 'JPY', '100123': 'JPY', '100124': 'JPY',
                        '100125': 'A', '100131': 'XLM', '100133': 'BTC', '100134': 'A', '100140': 'XLM', '100147': 'XLM',
                        '100154': 'AUD', '100155': 'NZD', '100156': 'CAD', '100157': 'CHF', '100158': 'AUD', '100159': 'NZD', '100160': 'CAD', '100161': 'CHF',
                        '100162': 'EUR', '100163': 'AUD', '100164': 'NZD', '100165': 'CAD', '100166': 'CHF',
                        '100168': 'EUR', '100169': 'GBP', '100170': 'AUD', '100171': 'NZD', '100172': 'CAD', '100173': 'CHF', '100174': 'JPY', '100175': 'EUR',
                        '100176': 'GBP', '100177': 'AUD', '100178': 'NZD', '100179': 'CAD', '100180': 'CHF', '100181': 'JPY',
                        '100182': 'EUR', '100183': 'GBP', '100184': 'AUD', '100185': 'NZD', '100186': 'CAD', '100187': 'CHF', '100188': 'JPY', '100189': 'LTC',
                        '100209': 'GBP', '100210': 'JPY', '100211': 'EUR', '100213': 'ETH', '100214': 'LTC', '100215': 'BCH', '100216': 'DASH',
                        '100217': 'GBP', '100218': 'JPY', '100219': 'EUR', '100221': 'XRP', '100222': 'XLM', '100224': 'CNH',
                        '100225': 'NZD', '100229': 'NZD', '100230': 'NZD', '100232': 'AUD', '100237': 'AUD', '100238': 'AUD',
                        '100239': 'CHF', '100243': 'CHF', '100244': 'CHF', '100245': 'DASH', '100254': 'EUR', '100255': 'JPY', '100256': 'GBP', '100263': 'BTC',
                        '100456': 'EUR', '100458': 'EUR', '100460': 'EUR',
                    },
                },
                'fetchTickers': {
                    'limit': 600, // the instrument ids travel in the query string, longer urls are rejected with http 414
                },
                'fetchOHLCV': {
                    'limit': 1000, // the recent candles endpoint returns at most 1000 candles
                    'historicalLimit': 2000, // a page of the historical (delayed) candles endpoint has at most 2000 candles
                },
                'fetchMyTrades': {
                    'days': 30, // the default lookback window, the endpoint accepts at most one year minus one day per request
                },
                'createOrder': {
                    // the lookup endpoint answers 404 until an accepted order becomes visible, about one second
                    'retries': 3,
                    'retryDelay': 500,
                },
                'cancelOrder': {
                    // the lookup endpoint is polled until the cancellation takes effect
                    'retries': 3,
                    'retryDelay': 500,
                },
                'closePosition': {
                    // the close order information is polled until the close order is final
                    'retries': 3,
                    'retryDelay': 500,
                },
            },
            'features': {
                'default': {
                    'sandbox': true, // the demo account, selected with setSandboxMode (true)
                    'createOrder': {
                        'marginMode': false,
                        'triggerPrice': true,
                        'triggerPriceType': undefined,
                        'triggerDirection': false,
                        'stopLossPrice': true,
                        'takeProfitPrice': true,
                        'attachedStopLossTakeProfit': undefined,
                        'timeInForce': {
                            'GTC': false,
                            'IOC': false,
                            'FOK': false,
                            'PO': false,
                            'GTD': false,
                        },
                        'hedged': true,
                        'trailing': true,
                        'leverage': true,
                        'marketBuyRequiresPrice': false,
                        'marketBuyByCost': true,
                        'selfTradePrevention': false,
                        'iceberg': false,
                    },
                    'createOrders': undefined,
                    'fetchMyTrades': {
                        'marginMode': false,
                        'limit': undefined,
                        'daysBack': 364,
                        'untilDays': undefined,
                        'symbolRequired': false,
                    },
                    'fetchOrder': {
                        'marginMode': false,
                        'trigger': true,
                        'trailing': true,
                        'symbolRequired': false,
                    },
                    'fetchOpenOrders': {
                        'marginMode': false,
                        'limit': undefined,
                        'trigger': true,
                        'trailing': true,
                        'symbolRequired': false,
                    },
                    'fetchOrders': {
                        'marginMode': false,
                        'limit': undefined,
                        'daysBack': 0, // the pending orders only, eToro keeps no order history
                        'untilDays': undefined,
                        'trigger': true,
                        'trailing': true,
                        'symbolRequired': false,
                    },
                    'fetchClosedOrders': { // not supported, a closed order is fetched by its id with fetchOrder
                        'marginMode': false,
                        'limit': undefined,
                        'daysBack': 0,
                        'daysBackCanceled': 0,
                        'untilDays': undefined,
                        'trigger': true,
                        'trailing': true,
                        'symbolRequired': false,
                    },
                    'fetchOHLCV': {
                        'limit': 1000,
                    },
                },
                'spot': {
                    'extends': 'default',
                },
                'swap': {
                    'linear': {
                        'extends': 'default',
                    },
                    'inverse': undefined,
                },
            },
            'exceptions': {
                'exact': {
                    // gateway and service envelopes
                    'Unauthorized': AuthenticationError,
                    'InvalidKey': AuthenticationError,
                    'RequestIdRequired': BadRequest,
                    'InsufficientPermissions': PermissionDenied,
                    'Forbidden': PermissionDenied,
                    'TooManyRequests': RateLimitExceeded,
                    // data platform envelopes
                    'INVALID_TIME_RANGE': BadRequest,
                    'INVALID_REQUEST': BadRequest,
                    'INVALID_INSTRUMENT_ID': BadRequest,
                    'GCID_REQUIRED': AuthenticationError,
                },
                'broad': {
                    // "Order not found for OrderId 1", "Close order not found", "Order category for 1 not found", "Position not found", "Transfer not found", "Account not found"
                    'not found': OrderNotFound,
                    'No external operation was found': OrderNotFound,
                },
            },
            'commonCurrencies': {},
        });
    }

    /**
     * @method
     * @name etoro#setSandboxMode
     * @description switches the trading endpoints between the real account and the demo account, the demo account is served by the same host with a "demo" path segment, so the urls are left untouched
     * @param {boolean} enabled true for the demo account
     * @returns {undefined}
     */
    override setSandboxMode (enabled: boolean) {
        this.options['sandboxMode'] = (enabled) ? 'demo' : 'real';
        this.isSandboxModeEnabled = enabled;
        return undefined;
    }

    /**
     * @method
     * @name etoro#etoroTradingRequest
     * @description sends a request to the real or the demo variant of a trading endpoint, selected by options["sandboxMode"]
     * @ignore
     * @param {string} realPath the endpoint path of the real account
     * @param {string} demoPath the endpoint path of the demo account
     * @param {string} method the http method
     * @param {object} [params] the request parameters
     * @param {int} [cost] the rate limiter cost of the endpoint
     * @returns {object} the raw response of the exchange
     */
    async etoroTradingRequest (realPath: string, demoPath: string, method: string, params: Dict = {}, cost: int = 2): Promise<any> {
        const environment = this.safeStringLower (this.options, 'sandboxMode', 'real');
        const path = (environment === 'demo') ? demoPath : realPath;
        return await this.request (path, [ 'private' ], method, params, { 'cost': cost });
    }

    /**
     * @method
     * @name etoro#etoroIsIsoCode
     * @description tells whether the string is a three letter uppercase currency code
     * @ignore
     * @param {string} [code] the string to check
     * @returns {boolean} true for a currency code
     */
    etoroIsIsoCode (code: Str): boolean {
        if ((code === undefined) || (code.length !== 3)) {
            return false;
        }
        for (let i = 0; i < 3; i++) {
            const charCode = code.charCodeAt (i);
            if ((charCode < 65) || (charCode > 90)) { // A-Z
                return false;
            }
        }
        return true;
    }

    /**
     * @method
     * @name etoro#etoroParseDatetime
     * @description parses a timestamp of the exchange into milliseconds, naive timestamps are utc
     * @ignore
     * @param {string} [datetime] the timestamp, e.g. "2026-11-27T12:01:01.283", "2026-11-27T12:01:01.283Z" or "2026-05-02 00:00:00Z"
     * @returns {int|undefined} the timestamp in ms
     */
    etoroParseDatetime (datetime: Str): Int {
        if (datetime === undefined) {
            return undefined;
        }
        let value = datetime.split (' ').join ('T');
        const length = value.length;
        let hasZone = value.endsWith ('Z');
        if (!hasZone && (length > 6)) {
            const tail = value.slice (length - 6);
            const first = tail.charAt (0);
            hasZone = ((first === '+') || (first === '-')) && (tail.charAt (3) === ':');
        }
        if (!hasZone) {
            value = value + 'Z';
        }
        return this.parse8601 (value);
    }

    //  ---------------------------------------------------------------------------

    /**
     * @method
     * @name etoro#fetchMarkets
     * @description retrieves data on all markets, by default only the instruments that are active in the platform, forex pairs, commodities and indices are cfds (swap, e.g. EUR/USD, GOLD/USD, SPX500/USD) and stocks, etfs and crypto are loaded as spot (e.g. AAPL/USD, BTC/USD), the quote is the native currency of the instrument (e.g. SAP.DE/EUR, VOD.L/GBX, UK100/GBP), an api key pair is required, the market id is the numeric instrument id
     * @see https://api-portal.etoro.com/api-reference/market-data/search-for-instruments
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {boolean} [params.activeOnly] default true, set to false to also load the inactive instruments (e.g. delisted) with active set to false, overrides options["fetchMarkets"]["activeOnly"]
     * @returns {object[]} an array of objects representing market data
     */
    override async fetchMarkets (params: Dict = {}): Promise<Market[]> {
        const request: Dict = {
            'fields': 'instrumentId,displayname,internalSymbolFull,internalAssetClassName,internalExchangeId,internalExchangeName,isInternalInstrument,isHiddenFromClient,isDelisted,isActiveInPlatform,isCurrentlyTradable',
            // the endpoint always answers with the first page, whatever pageNumber is, so the whole index has to fit in a single page
            'pageSize': '20000',
        };
        const [ activeOnly, query ] = this.handleOptionAndParams (params, 'fetchMarkets', 'activeOnly', true);
        if (activeOnly) {
            request['isActiveInPlatform'] = 'true';
        }
        const response = await this.publicGetV1MarketDataSearch (this.extend (request, query));
        //
        //     {
        //         "page": 1,
        //         "pageSize": 20000,
        //         "totalItems": 3349,
        //         "items": [
        //             {
        //                 "instrumentId": 1001,
        //                 "displayname": "Apple",
        //                 "internalSymbolFull": "AAPL",
        //                 "internalAssetClassName": "Stocks",
        //                 "internalExchangeId": 4,
        //                 "internalExchangeName": "Nasdaq",
        //                 "isInternalInstrument": false,
        //                 "isHiddenFromClient": false,
        //                 "isDelisted": false,
        //                 "isActiveInPlatform": true,
        //                 "isCurrentlyTradable": true
        //             },
        //             ...
        //         ]
        //     }
        //
        const items = this.safeList (response, 'items', []);
        return this.parseMarkets (items);
    }

    override parseMarket (market: Dict): Market {
        //
        //     fetchMarkets
        //
        //     {
        //         "instrumentId": 1001,
        //         "displayname": "Apple",
        //         "internalSymbolFull": "AAPL",
        //         "internalAssetClassName": "Stocks",
        //         "internalExchangeId": 4,
        //         "internalExchangeName": "Nasdaq",
        //         "isInternalInstrument": false,
        //         "isHiddenFromClient": false,
        //         "isDelisted": false,
        //         "isActiveInPlatform": true,
        //         "isCurrentlyTradable": true
        //     }
        //
        const marketId = this.safeString2 (market, 'instrumentId', 'instrumentID');
        const exchangeSymbol = this.safeString2 (market, 'internalSymbolFull', 'symbolFull');
        if ((marketId === undefined) || (exchangeSymbol === undefined)) {
            return undefined; // placeholder entries of the index without a symbol
        }
        const isInternal = this.safeBool (market, 'isInternalInstrument', false);
        const isHidden = this.safeBool (market, 'isHiddenFromClient', false);
        const isDelisted = this.safeBool (market, 'isDelisted', false);
        if (isInternal || isHidden || isDelisted) {
            return undefined; // restricted from public access
        }
        const assetClasses: Dict = {
            '1': 'Forex',
            '2': 'Commodity',
            '3': 'CFD',
            '4': 'Indices',
            '5': 'Stocks',
            '6': 'ETF',
            '7': 'Bonds',
            '8': 'TrustFunds',
            '9': 'Options',
            '10': 'Crypto',
        };
        const assetClassId = this.safeString (market, 'internalAssetClassId', this.safeString (market, 'instrumentTypeID'));
        const assetClass = this.safeString (market, 'internalAssetClassName', this.safeString (assetClasses, assetClassId));
        const exchangeId = this.safeString (market, 'internalExchangeId', this.safeString (market, 'exchangeID'));
        const fetchMarketsOptions = this.safeDict (this.options, 'fetchMarkets', {});
        const quoteCurrencies = this.safeDict (fetchMarketsOptions, 'quoteCurrencies', {});
        const exchangeCurrencies = this.safeDict (fetchMarketsOptions, 'exchangeCurrencies', {});
        let baseId: string = exchangeSymbol;
        let quoteId: Str = undefined;
        if (assetClass === 'Forex') {
            // the currencies of a forex pair are in its display name, e.g. "EUR/USD", the forex futures keep their ticker, e.g. EURUSD.DEC26
            const pairParts = this.safeString (market, 'displayname', '').split ('/');
            if (pairParts.length === 2) {
                const forexBase = this.safeString (pairParts, 0);
                const forexQuote = this.safeString (pairParts, 1);
                if ((forexBase !== undefined) && (forexQuote !== undefined) && this.etoroIsIsoCode (forexBase) && this.etoroIsIsoCode (forexQuote)) {
                    baseId = forexBase;
                    quoteId = forexQuote;
                }
            }
        }
        if (quoteId === undefined) {
            quoteId = this.safeString (quoteCurrencies, marketId, this.safeString (exchangeCurrencies, exchangeId, 'USD'));
        }
        if ((assetClass === 'Crypto') && (quoteId !== undefined) && (quoteId !== 'USD')) {
            // crypto pairs against other currencies and coins are listed with a compressed ticker, e.g. BTCEUR is BTC/EUR and ETHBTC is ETH/BTC
            const quoteLength = quoteId.length;
            const baseLength = exchangeSymbol.length - quoteLength;
            if ((baseLength > 0) && exchangeSymbol.endsWith (quoteId)) {
                baseId = exchangeSymbol.slice (0, baseLength);
            }
        }
        // class tickers with a slash, e.g. "MKC/V", and names with spaces get a unified base code
        baseId = baseId.split (' ').join ('-');
        baseId = baseId.split ('/').join ('.');
        const base = this.safeCurrencyCode (baseId);
        const quote = this.safeCurrencyCode (quoteId);
        const symbol = base + '/' + quote;
        const activeInPlatform = this.safeBool (market, 'isActiveInPlatform');
        const isTradable = this.safeBool (market, 'isCurrentlyTradable');
        let active: Bool = undefined;
        if (activeInPlatform !== undefined) {
            active = activeInPlatform && (isTradable !== false);
        }
        // forex pairs, commodities and indices are traded as cfds, stocks, etfs and crypto as the real asset or as a cfd
        const isContract = this.inArray (assetClass, [ 'Forex', 'Commodity', 'CFD', 'Indices' ]);
        return this.safeMarketStructure ({
            'id': marketId,
            'lowercaseId': undefined,
            'symbol': symbol,
            'base': base,
            'quote': quote,
            'settle': (isContract) ? 'USD' : undefined,
            'baseId': baseId,
            'quoteId': quoteId,
            'settleId': (isContract) ? 'USD' : undefined,
            'type': (isContract) ? 'swap' : 'spot',
            'spot': !isContract,
            'margin': undefined,
            'swap': isContract,
            'future': false,
            'option': false,
            'index': false,
            'active': active,
            'contract': isContract,
            'linear': (isContract) ? true : undefined,
            'inverse': (isContract) ? false : undefined,
            'subType': undefined,
            'contractSize': (isContract) ? 1 : undefined,
            'expiry': undefined,
            'expiryDatetime': undefined,
            'strike': undefined,
            'optionType': undefined,
            'precision': {
                'amount': undefined, // the tick sizes are not published, they are validated by the exchange on a per order basis
                'price': undefined,
            },
            'limits': {
                'leverage': { 'min': undefined, 'max': undefined },
                'amount': { 'min': undefined, 'max': undefined },
                'price': { 'min': undefined, 'max': undefined },
                'cost': { 'min': undefined, 'max': undefined }, // the minimum exposure is per instrument and account, see fetchTradingEligibility
            },
            'marginModes': {
                'cross': undefined,
                'isolated': undefined,
            },
            'created': undefined,
            'info': market,
        });
    }

    //  ---------------------------------------------------------------------------

    /**
     * @method
     * @name etoro#fetchTicker
     * @description fetches a price ticker, a snapshot of the current best bid and ask prices, last price, etc for a market, prices are in the native currency of the instrument
     * @see https://api-portal.etoro.com/api-reference/market-data/get-instrument-market-rates
     * @param {string} symbol unified symbol of the market to fetch the ticker for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [ticker structure](https://docs.ccxt.com/#/?id=ticker-structure)
     */
    override async fetchTicker (symbol: string, params: Dict = {}): Promise<Ticker> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'instrumentIds': market['id'],
        };
        const response = await this.publicGetV1MarketDataInstrumentsRates (this.extend (request, params));
        const rates = this.safeList (response, 'rates', []);
        // the endpoint silently omits the unknown instrument ids
        const rate = this.safeDict (rates, 0);
        if (rate === undefined) {
            throw new BadSymbol (this.id + ' fetchTicker() could not load the rate of ' + symbol);
        }
        return this.parseTicker (rate, market);
    }

    /**
     * @method
     * @name etoro#fetchTickers
     * @description fetches price tickers for multiple markets, prices are in the native currency of the instruments
     * @see https://api-portal.etoro.com/api-reference/market-data/get-instrument-market-rates
     * @param {string[]} [symbols] unified symbols of the markets to fetch the tickers for, all markets are fetched when omitted
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a dictionary of [ticker structures](https://docs.ccxt.com/#/?id=ticker-structure)
     */
    override async fetchTickers (symbols: Strings = undefined, params: Dict = {}): Promise<Tickers> {
        await this.loadMarkets ();
        let ids: Strings = this.ids;
        if (symbols !== undefined) {
            ids = this.marketIds (this.marketSymbols (symbols));
        }
        const result: Dict = {};
        if ((ids === undefined) || (ids.length === 0)) {
            return result;
        }
        const limit = this.safeInteger (this.safeDict (this.options, 'fetchTickers', {}), 'limit', 600);
        const numIds = ids.length;
        for (let i = 0; i < numIds; i = i + limit) {
            const end = Math.min (i + limit, numIds);
            const chunk = ids.slice (i, end);
            const request: Dict = {
                'instrumentIds': chunk.join (','),
            };
            const response = await this.publicGetV1MarketDataInstrumentsRates (this.extend (request, params));
            const rates = this.safeList (response, 'rates', []);
            const tickers = this.parseTickers (rates, symbols, params);
            const tickerSymbols = Object.keys (tickers);
            for (let j = 0; j < tickerSymbols.length; j++) {
                const tickerSymbol = tickerSymbols[j];
                result[tickerSymbol] = tickers[tickerSymbol];
            }
        }
        return result;
    }

    /**
     * @method
     * @name etoro#fetchBidsAsks
     * @description fetches the bid and ask prices of multiple markets, prices are in the native currency of the instruments
     * @see https://api-portal.etoro.com/api-reference/market-data/get-instrument-market-rates
     * @param {string[]} [symbols] unified symbols of the markets to fetch the bids and asks for, all markets are fetched when omitted
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a dictionary of [ticker structures](https://docs.ccxt.com/#/?id=ticker-structure)
     */
    override async fetchBidsAsks (symbols: Strings = undefined, params: Dict = {}): Promise<Tickers> {
        const tickers = await this.fetchTickers (symbols, params);
        const result: Dict = {};
        const tickerSymbols = Object.keys (tickers);
        for (let i = 0; i < tickerSymbols.length; i++) {
            const tickerSymbol = tickerSymbols[i];
            const ticker = this.safeDict (tickers, tickerSymbol, {});
            result[tickerSymbol] = {
                'symbol': tickerSymbol,
                'timestamp': this.safeInteger (ticker, 'timestamp'),
                'datetime': this.safeString (ticker, 'datetime'),
                'bid': this.safeNumber (ticker, 'bid'),
                'ask': this.safeNumber (ticker, 'ask'),
                'info': ticker,
            };
        }
        return result;
    }

    override parseTicker (ticker: Dict, market: Market = undefined): Ticker {
        //
        //     fetchTicker, fetchTickers
        //
        //     {
        //         "instrumentID": 14254,
        //         "ask": 326.3,
        //         "bid": 325.8,
        //         "lastExecution": 325.8,
        //         "conversionRateAsk": 1.09643,
        //         "conversionRateBid": 1.09642,
        //         "date": "2026-11-27T11:56:17.8232248Z",
        //         "unitMargin": 357.213636,
        //         "unitMarginAsk": 357.765109,
        //         "unitMarginBid": 357.213636,
        //         "priceRateID": 166382456467,
        //         ...
        //     }
        //
        //     websocket "instrument:{instrumentId}" topic, the content is parsed by the ws handler and gets its instrumentId added
        //
        //     { "Ask": "84917.73", "Bid": "83232.21", "LastExecution": "84072.94", "Date": "2025-04-01T08:36:02.8305456Z", "PriceRateID": "106439224591", "instrumentId": 100000 }
        //
        const marketId = this.safeString2 (ticker, 'instrumentID', 'instrumentId');
        const resolved = this.safeMarket (marketId, market);
        let timestamp = this.safeInteger (ticker, 'timestamp');
        if (timestamp === undefined) {
            timestamp = this.etoroParseDatetime (this.safeString2 (ticker, 'date', 'Date'));
        }
        const last = this.safeString2 (ticker, 'lastExecution', 'LastExecution');
        return this.safeTicker ({
            'symbol': resolved['symbol'],
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': undefined,
            'low': undefined,
            'bid': this.safeString2 (ticker, 'bid', 'Bid'),
            'bidVolume': undefined,
            'ask': this.safeString2 (ticker, 'ask', 'Ask'),
            'askVolume': undefined,
            'vwap': undefined,
            'open': undefined,
            'close': last,
            'last': last,
            'previousClose': undefined,
            'change': undefined,
            'percentage': undefined,
            'average': undefined,
            'baseVolume': undefined,
            'quoteVolume': undefined,
            'markPrice': undefined,
            'indexPrice': undefined,
            'info': ticker,
        }, resolved);
    }

    //  ---------------------------------------------------------------------------

    /**
     * @method
     * @name etoro#fetchOHLCV
     * @description fetches historical candlestick data containing the open, high, low, and close price, and the volume of a market, the recent 1000 candles come from a live endpoint and older ranges from a delayed one (hours behind), prices are in the native currency of the instrument
     * @see https://api-portal.etoro.com/api-reference/market-data/get-instrument-candle-history
     * @see https://api-portal.etoro.com/api-reference/data/get-price-candles-for-an-instrument
     * @param {string} symbol unified symbol of the market to fetch OHLCV data for
     * @param {string} [timeframe] the length of time each candle represents, 1m, 5m, 10m, 15m, 30m, 1h, 4h, 1d or 1w
     * @param {int} [since] timestamp in ms of the earliest candle to fetch
     * @param {int} [limit] the maximum amount of candles to fetch, 1000 for the recent candles and 2000 per page of the delayed ones
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {int} [params.until] timestamp in ms of the latest candle to fetch
     * @param {boolean} [params.historical] set to true to force the delayed endpoint, it is used automatically for ranges older than the recent 1000 candles
     * @param {string} [params.side] the price side of the delayed endpoint, bid, ask or both
     * @returns {int[][]} a list of candles ordered as timestamp, open, high, low, close, volume
     */
    override async fetchOHLCV (symbol: string, timeframe: string = '1m', since: Int = undefined, limit: Int = undefined, params: Dict = {}): Promise<OHLCV[]> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const duration = this.parseTimeframe (timeframe);
        const options = this.safeDict (this.options, 'fetchOHLCV', {});
        const recentLimit = this.safeInteger (options, 'limit', 1000);
        const historicalLimit = this.safeInteger (options, 'historicalLimit', 2000);
        const request: Dict = {
            'instrumentId': market['id'],
        };
        const requestParams = this.extend (request, params);
        const until = this.safeInteger2 (requestParams, 'until', 'till');
        const durationMs = duration * 1000;
        const windowStart = this.milliseconds () - recentLimit * durationMs;
        let olderThanRecentWindow = false;
        if ((since !== undefined) && (since < windowStart)) {
            olderThanRecentWindow = true;
        }
        if ((until !== undefined) && (until < windowStart)) {
            olderThanRecentWindow = true;
        }
        const [ historical, query ] = this.handleOptionAndParams (requestParams, 'fetchOHLCV', 'historical', olderThanRecentWindow);
        const requestQuery = this.omit (query, [ 'until', 'till' ]);
        let ohlcvs: OHLCV[] = [];
        if (historical) {
            let count = historicalLimit;
            if (limit !== undefined) {
                count = Math.min (limit, historicalLimit);
            }
            // the endpoint answers with the newest candles of the [from, to) window, so the window is narrowed to the requested ones
            const historicalRequest: Dict = {
                'interval': timeframe,
                'limit': this.numberToString (count),
            };
            if (since !== undefined) {
                historicalRequest['from'] = this.iso8601 (since);
            }
            if (until !== undefined) {
                historicalRequest['to'] = this.iso8601 (until);
            } else if (since !== undefined) {
                historicalRequest['to'] = this.iso8601 (since + count * durationMs);
            }
            const response = await this.publicGetV1DataInstrumentsInstrumentIdCandles (this.extend (historicalRequest, requestQuery));
            //
            //     {
            //         "instrumentId": 1001,
            //         "symbol": "AAPL/USD",
            //         "interval": "1d",
            //         "side": "bid",
            //         "window": { "from": "2026-09-01T00:00:00Z", "to": "2026-09-28T00:00:00Z" },
            //         "pagination": { "limit": 100, "hasNext": false, "nextCursor": null },
            //         "results": [ { "time": "2026-09-27T21:00:00Z", "open": "228.5", "high": "231.2", "low": "227.9", "close": "230.1", "volume": "1234567" } ]
            //     }
            //
            // the results are newest first, they are reversed into the candle shape of the recent endpoint
            const results = this.safeList (response, 'results', []);
            const candles: Dict[] = [];
            for (let i = results.length - 1; i >= 0; i--) {
                const result = this.safeDict (results, i, {});
                candles.push ({
                    'fromDate': this.safeString (result, 'time'),
                    'open': this.safeString (result, 'open'),
                    'high': this.safeString (result, 'high'),
                    'low': this.safeString (result, 'low'),
                    'close': this.safeString (result, 'close'),
                    'volume': this.safeString (result, 'volume'),
                });
            }
            ohlcvs = this.parseOHLCVs (candles, market, timeframe, since, limit);
        } else {
            const interval = this.safeString (this.timeframes, timeframe);
            if (interval === undefined) {
                throw new NotSupported (this.id + ' fetchOHLCV() does not support the ' + timeframe + ' timeframe, use one of ' + Object.keys (this.timeframes).join (', '));
            }
            let count = recentLimit;
            if (since !== undefined) {
                // enough candles to reach back to since
                const needed = this.parseToInt (Math.ceil ((this.milliseconds () - since) / durationMs)) + 2;
                count = Math.min (recentLimit, needed);
            } else if (limit !== undefined) {
                count = Math.min (limit, recentLimit);
            }
            const recentRequest: Dict = {
                'instrumentId': market['id'],
                'direction': 'asc',
                'interval': interval,
                'candlesCount': this.numberToString (count),
            };
            const response = await this.publicGetV1MarketDataInstrumentsInstrumentIdHistoryCandlesDirectionIntervalCandlesCount (this.extend (recentRequest, requestQuery));
            //
            //     {
            //         "interval": "FiveMinutes",
            //         "candles": [
            //             {
            //                 "instrumentId": 1001,
            //                 "candles": [ { "instrumentID": 1001, "fromDate": "2026-11-27T11:45:00Z", "open": 357.78, "high": 357.78, "low": 357.54, "close": 357.54, "volume": 2373.0 } ],
            //                 "rangeOpen": 357.78,
            //                 "rangeClose": 357.2,
            //                 "rangeHigh": 357.78,
            //                 "rangeLow": 356.82,
            //                 "volume": 8202.0
            //             }
            //         ]
            //     }
            //
            const candleGroups = this.safeList (response, 'candles', []);
            const candles: List = [];
            for (let i = 0; i < candleGroups.length; i++) {
                const group = this.safeDict (candleGroups, i, {});
                const groupCandles = this.safeList (group, 'candles', []);
                for (let j = 0; j < groupCandles.length; j++) {
                    candles.push (this.safeDict (groupCandles, j, {}));
                }
            }
            ohlcvs = this.parseOHLCVs (candles, market, timeframe, since, limit);
        }
        if (until !== undefined) {
            const filtered: OHLCV[] = [];
            for (let i = 0; i < ohlcvs.length; i++) {
                const ohlcv = ohlcvs[i];
                const candleTimestamp = ohlcv[0];
                if ((candleTimestamp !== undefined) && (candleTimestamp < until)) {
                    filtered.push (ohlcv);
                }
            }
            ohlcvs = filtered;
        }
        return ohlcvs;
    }

    override parseOHLCV (ohlcv: any, market: Market = undefined): OHLCV {
        //
        //     { "instrumentID": 1001, "fromDate": "2026-11-27T11:45:00Z", "open": 357.78, "high": 357.78, "low": 357.54, "close": 357.54, "volume": 2373.0 }
        //
        return [
            this.etoroParseDatetime (this.safeString (ohlcv, 'fromDate')),
            this.safeNumber (ohlcv, 'open'),
            this.safeNumber (ohlcv, 'high'),
            this.safeNumber (ohlcv, 'low'),
            this.safeNumber (ohlcv, 'close'),
            this.safeNumber (ohlcv, 'volume'),
        ];
    }

    //  ---------------------------------------------------------------------------

    /**
     * @method
     * @name etoro#sign
     * @description builds the request, every endpoint carries the x-api-key, x-user-key and x-request-id headers
     * @ignore
     * @param {string} path the endpoint path
     * @param {string[]} api the api group
     * @param {string} method the http method
     * @param {object} params the request parameters
     * @returns {object} the signed request
     */
    override sign (path: string, api: string[] = [ 'public' ], method: string = 'GET', params: Dict = {}): Dict {
        const apiName = api[0];
        const baseApiUrl = this.safeString (this.urls['api'], apiName);
        if (baseApiUrl === undefined) {
            throw new ExchangeError (this.id + ' sign() has no API URL for this endpoint');
        }
        // the market data endpoints are authenticated with the key pair as well
        this.checkRequiredCredentials ();
        let endpoint = '/' + this.implodeParams (path, params);
        let query: Dict = {};
        if (!Array.isArray (params)) {
            query = this.omit (params, this.extractParams (path));
        }
        // the x-request-id header is the idempotency key of the trading endpoints, it is echoed back as the referenceId of the order
        const requestId = this.safeString (query, 'x-request-id');
        // a list body of an endpoint with a path parameter, e.g. the items of a watchlist, travels in the x-body param
        const listBody = this.safeList (query, 'x-body');
        const requestParams = this.omit (query, [ 'x-request-id', 'x-body' ]);
        const headers: NullableDict = {
            'x-request-id': (requestId !== undefined) ? requestId : this.uuid (),
            'x-api-key': this.apiKey,
            'x-user-key': this.secret,
        };
        let body: Str = undefined;
        if (Array.isArray (params)) {
            // list bodies, e.g. the items of a watchlist
            body = this.json (params);
            headers['Content-Type'] = 'application/json';
        } else if (listBody !== undefined) {
            body = this.json (listBody);
            headers['Content-Type'] = 'application/json';
        } else if ((method === 'POST') && (path === 'v1/watchlists')) {
            // the watchlist creation takes its name from the query string of the POST request
            endpoint += '?' + this.urlencode (requestParams);
        } else if (Object.keys (requestParams).length > 0) {
            if ((method === 'GET') || (method === 'DELETE')) {
                endpoint += '?' + this.urlencode (requestParams);
            } else {
                body = this.json (requestParams);
                headers['Content-Type'] = 'application/json';
            }
        }
        const url = baseApiUrl + endpoint;
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    /**
     * @method
     * @name etoro#handleErrors
     * @description maps the error envelopes of the exchange to ccxt exceptions
     * @ignore
     * @param {int} code the http status code
     * @param {string} reason the http status text
     * @param {string} url the request url
     * @param {string} method the http method
     * @param {object} headers the response headers
     * @param {string} body the response body
     * @param {object} response the parsed response body
     * @param {object} requestHeaders the request headers
     * @param {string} requestBody the request body
     * @returns {undefined}
     */
    override handleErrors (code: int, reason: string, url: string, method: string, headers: Dict, body: string, response: any, requestHeaders: NullableDict, requestBody: Str) {
        if ((code >= 200) && (code < 300)) {
            return undefined;
        }
        if ((response === undefined) || (code >= 500)) {
            // no body (e.g. http 414 of a too long url) or a server failure, the default http status handler applies
            return undefined;
        }
        //
        //     { "errorCode": "Unauthorized", "errorMessage": "Unauthorized" }                                             401
        //     { "errorCode": "RequestIdRequired", "errorMessage": "X-Request-Id header is required" }                       422
        //     { "errorCode": "InsufficientPermissions", "errorMessage": "UserToken does not have permission to access" }   403
        //     { "errorCode": "TooManyRequests", "errorMessage": "Too many requests" }                                     429
        //     { "message": "Order not found for OrderId 1" }                                                             404
        //     { "message": "Validation failed: \n -- : Either orderId or referenceId must be provided. Severity: Error" }  400
        //     { "type": "...ValidationProblemDetails", "title": "One or more validation errors occurred.", "status": 400, "errors": { ... } }  400
        //     { "success": false, "error": { "code": "INVALID_TIME_RANGE", "message": "`from` must be earlier than `to`" } }              400
        //
        const feedback = this.id + ' ' + body;
        const errorCode = this.safeString (response, 'errorCode');
        const message = this.safeString2 (response, 'errorMessage', 'message');
        const nestedError = this.safeDict (response, 'error', {});
        const nestedCode = this.safeString (nestedError, 'code');
        const nestedMessage = this.safeString (nestedError, 'message');
        this.throwExactlyMatchedException (this.exceptions['exact'], errorCode, feedback);
        this.throwExactlyMatchedException (this.exceptions['exact'], nestedCode, feedback);
        this.throwBroadlyMatchedException (this.exceptions['broad'], message, feedback);
        this.throwBroadlyMatchedException (this.exceptions['broad'], nestedMessage, feedback);
        const hasEnvelope = (errorCode !== undefined) || (message !== undefined) || (nestedCode !== undefined);
        if (hasEnvelope) {
            const isValidation = (message !== undefined) && (message.indexOf ('Validation failed') > -1);
            const isTradingRequest = (url.indexOf ('/trading/') > -1) || (url.indexOf ('/money/transfers') > -1);
            if (isValidation && isTradingRequest) {
                throw new InvalidOrder (feedback);
            }
            throw new ExchangeError (feedback);
        }
        // a status without an envelope, the client errors are not an outage of the exchange
        if (code === 400) {
            throw new BadRequest (feedback);
        }
        if (code === 403) {
            throw new PermissionDenied (feedback);
        }
        if (code === 404) {
            throw new ExchangeError (feedback);
        }
        return undefined; // the remaining statuses fall through to the default http status handler
    }

    //  ---------------------------------------------------------------------------

    /**
     * @method
     * @name etoro#fetchBalance
     * @description fetches the balance of the trading account of the selected environment (the demo one with setSandboxMode (true)), the free balance is the available cash, the used balance is the margin of the open positions with the amounts frozen by the pending orders and their unrealized profit and loss, the total balance is the equity of the account, in the currency of the account
     * @see https://api-portal.etoro.com/api-reference/trading--real/get-aggregated-portfolio-snapshot
     * @see https://api-portal.etoro.com/api-reference/trading--demo/get-aggregated-portfolio-snapshot
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [balance structure](https://docs.ccxt.com/#/?id=balance-structure)
     */
    override async fetchBalance (params: Dict = {}): Promise<Balances> {
        const response = await this.etoroTradingRequest ('v1/trading/info/aggregate-portfolio', 'v1/trading/info/demo/aggregate-portfolio', 'GET', params);
        //
        //     {
        //         "cid": 34374239,
        //         "timestamp": "2026-11-27T12:01:31.893",
        //         "accountCurrency": "USD",
        //         "tradingFundingType": "cash",
        //         "accountTotals": {
        //             "accountAvailableCash": 99971.02,
        //             "accountAvailableMargin": 99971.02,
        //             "cryptoAvailableMargin": 99971.02,
        //             "accountFrozenCash": 0.0,
        //             "accountCurrentPnl": 0,
        //             "accountTotalValue": 99981.02,
        //             "accountTotalUsedMargin": 10.0,
        //             "accountBalance": 99971.02
        //         },
        //         "instrumentAggregates": [ ... ],
        //         "mirrors": []
        //     }
        //
        return this.parseBalance (response);
    }

    override parseBalance (response: Dict): Balances {
        const accountTotals = this.safeDict (response, 'accountTotals', {});
        const currencyId = this.safeString (response, 'accountCurrency', 'USD');
        const code = this.safeCurrencyCode (currencyId);
        const result: Dict = {
            'info': response,
        };
        if (code !== undefined) {
            const account = this.account ();
            account['free'] = this.safeString (accountTotals, 'accountAvailableCash');
            // the used margin already contains the amounts frozen by the pending orders, together with the unrealized profit and loss it adds up to the equity
            const usedMargin = this.safeString (accountTotals, 'accountTotalUsedMargin');
            const unrealizedPnl = this.safeString (accountTotals, 'accountCurrentPnl');
            account['used'] = Precise.stringAdd (usedMargin, unrealizedPnl);
            account['total'] = this.safeString (accountTotals, 'accountTotalValue');
            result[code] = account;
        }
        const timestamp = this.etoroParseDatetime (this.safeString (response, 'timestamp'));
        result['timestamp'] = timestamp;
        result['datetime'] = this.iso8601 (timestamp);
        return this.safeBalance (result);
    }

    /**
     * @method
     * @name etoro#fetchAccounts
     * @description fetches the accounts of the user of the real environment, trading, cash, options, crypto, ... with their balances and equity details, the demo account is not listed by the balances endpoint
     * @see https://api-portal.etoro.com/api-reference/balances/get-aggregated-balances
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of [account structures](https://docs.ccxt.com/#/?id=account-structure), the balance details are in the info of each account
     */
    override async fetchAccounts (params: Dict = {}): Promise<Account[]> {
        const request: Dict = {
            'expand': 'equityDetails',
            'includeZeroBalances': 'true',
        };
        const response = await this.privateGetV1Balances (this.extend (request, params));
        //
        //     {
        //         "gcid": 33171043,
        //         "totalBalance": 0.0,
        //         "displayCurrency": "USD",
        //         "balances": [
        //             {
        //                 "accountId": "32932628",
        //                 "accountType": "Trading",
        //                 "subType": null,
        //                 "balance": 0.0,
        //                 "currency": "USD",
        //                 "displayBalance": 0.0,
        //                 "displayCurrency": "USD",
        //                 "exchangeRate": 1,
        //                 "equityDetails": { "available": 0.0, "frozenCash": 0.0, "currentPNL": 0, "totalUsedMargin": 0.0 }
        //             }
        //         ]
        //     }
        //
        const balances = this.safeList (response, 'balances', []);
        const result: Account[] = [];
        for (let i = 0; i < balances.length; i++) {
            const balance = this.safeDict (balances, i, {});
            if (this.safeString (balance, 'accountId') !== undefined) {
                result.push (this.parseAccount (balance));
            }
        }
        return result;
    }

    override parseAccount (account: Dict): Account {
        //
        //     { "accountId": "32932628", "accountType": "Trading", "subType": null, "balance": 0.0, "currency": "USD", ... }
        //
        const currencyId = this.safeString (account, 'currency', 'USD');
        return {
            'id': this.safeString (account, 'accountId'),
            'type': this.safeStringLower (account, 'accountType'),
            'code': this.safeCurrencyCode (currencyId),
            'info': account,
        };
    }

    //  ---------------------------------------------------------------------------

    /**
     * @method
     * @name etoro#fetchPositions
     * @description fetches the open positions of the trading account of the selected environment (the demo one with setSandboxMode (true)), the positions opened by the copy trading (mirrors) are included with params["mirrorLevel"] set to "Details", prices are in the native currency of the instruments
     * @see https://api-portal.etoro.com/api-reference/trading--real/get-instrument-breakdown
     * @see https://api-portal.etoro.com/api-reference/trading--demo/get-instrument-breakdown-demo
     * @param {string[]} [symbols] unified symbols of the markets to fetch the positions for, all markets are fetched when omitted
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.mirrorLevel] 'None' (default) for the manually opened positions only or 'Details' to also include the positions of the copy trading
     * @returns {object[]} a list of [position structures](https://docs.ccxt.com/#/?id=position-structure)
     */
    override async fetchPositions (symbols: Strings = undefined, params: Dict = {}): Promise<Position[]> {
        const entries = await this.etoroFetchPositionEntries (symbols, params);
        return this.parsePositions (entries, symbols);
    }

    /**
     * @method
     * @name etoro#etoroFetchPositionEntries
     * @description fetches the raw open positions of the portfolio breakdown, see fetchPositions
     * @ignore
     * @param {string[]} [symbols] unified symbols of the markets to fetch the positions for, all markets are fetched when omitted
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {Array} the raw positions of the exchange
     */
    async etoroFetchPositionEntries (symbols: Strings, params: Dict = {}): Promise<List> {
        await this.loadMarkets ();
        const request: Dict = {
            'positionLevel': 'Normal',
            'orderLevel': 'None',
        };
        if (symbols !== undefined) {
            const ids = this.marketIds (this.marketSymbols (symbols));
            // at most 100 instrument ids are accepted
            if (ids.length > 0) {
                request['instrumentIds'] = ids.slice (0, 100).join (',');
            }
        }
        const response = await this.etoroTradingRequest ('v2/trading/info/instrument-breakdown', 'v2/trading/info/demo/instrument-breakdown', 'GET', this.extend (request, params));
        //
        //     {
        //         "accountCurrency": "USD",
        //         "timestamp": "2026-11-27T12:01:30.2930843Z",
        //         "instruments": [ { "instrumentId": 1001, "symbol": "AAPL", "positions": [ { ... } ] } ],
        //         "mirrors": []
        //     }
        //
        return this.etoroInstrumentEntries (response, 'positions');
    }

    /**
     * @method
     * @name etoro#fetchPositionsForSymbol
     * @description fetches the open positions of a market of the trading account of the selected environment (the demo one with setSandboxMode (true)), a long and a short position of the same market can be open at the same time
     * @see https://api-portal.etoro.com/api-reference/trading--real/get-instrument-breakdown
     * @see https://api-portal.etoro.com/api-reference/trading--demo/get-instrument-breakdown-demo
     * @param {string} symbol unified symbol of the market to fetch the positions for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of [position structures](https://docs.ccxt.com/#/?id=position-structure)
     */
    override async fetchPositionsForSymbol (symbol: string, params: Dict = {}): Promise<Position[]> {
        const symbols: string[] = [ symbol ];
        return await this.fetchPositions (symbols, params);
    }

    /**
     * @method
     * @name etoro#fetchPosition
     * @description fetches the first open position of a market of the trading account of the selected environment (the demo one with setSandboxMode (true)), an empty position with no contracts is returned when the market has none, see fetchPositionsForSymbol for all of them
     * @see https://api-portal.etoro.com/api-reference/trading--real/get-instrument-breakdown
     * @see https://api-portal.etoro.com/api-reference/trading--demo/get-instrument-breakdown-demo
     * @param {string} symbol unified symbol of the market to fetch the position for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [position structure](https://docs.ccxt.com/#/?id=position-structure)
     */
    override async fetchPosition (symbol: string, params: Dict = {}): Promise<Position> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const symbols: string[] = [ symbol ];
        const entries = await this.etoroFetchPositionEntries (symbols, params);
        const first = this.safeDict (entries, 0, {});
        return this.parsePosition (first, market);
    }

    /**
     * @method
     * @name etoro#etoroInstrumentEntries
     * @description flattens the positions or the orders of the instruments of a portfolio breakdown response, including the ones of the copy trading mirrors
     * @ignore
     * @param {object} response the portfolio breakdown response
     * @param {string} key 'positions' or 'orders'
     * @returns {Array} the flattened entries
     */
    etoroInstrumentEntries (response: Dict, key: string): List {
        const instrumentGroups: List = [];
        const instruments = this.safeList (response, 'instruments', []);
        for (let i = 0; i < instruments.length; i++) {
            instrumentGroups.push (this.safeDict (instruments, i, {}));
        }
        // the instruments of the copy trading mirrors are listed with mirrorLevel=Details
        const mirrors = this.safeList (response, 'mirrors', []);
        for (let i = 0; i < mirrors.length; i++) {
            const mirror = this.safeDict (mirrors, i, {});
            const mirrorInstruments = this.safeList (mirror, 'instruments', []);
            for (let j = 0; j < mirrorInstruments.length; j++) {
                instrumentGroups.push (this.safeDict (mirrorInstruments, j, {}));
            }
        }
        const entries: List = [];
        for (let i = 0; i < instrumentGroups.length; i++) {
            const instrumentGroup = this.safeDict (instrumentGroups, i, {});
            const instrumentEntries = this.safeList (instrumentGroup, key, []);
            for (let j = 0; j < instrumentEntries.length; j++) {
                entries.push (this.safeDict (instrumentEntries, j, {}));
            }
        }
        return entries;
    }

    override parsePosition (position: Dict, market: Market = undefined): Position {
        //
        //     fetchPositions
        //
        //     {
        //         "positionId": 3650871436,
        //         "symbol": "AAPL",
        //         "instrumentId": 1001,
        //         "assetCurrency": "USD",
        //         "settlementType": "real",
        //         "direction": "long",
        //         "leverage": 1,
        //         "isSettled": true,
        //         "openTime": "2026-11-27T12:01:01.283",
        //         "openRate": 357.64,
        //         "openConversionRate": 1.0,
        //         "totalFeesAcctCcy": 1.0,
        //         "totalTaxesAcctCcy": 0.0,
        //         "takeProfitRate": 400.0,
        //         "stopLossRate": 330.0,
        //         "stopLossType": "fixed",
        //         "units": 0.027959,
        //         "contracts": 0.027959,
        //         "marginAcctCcy": 10.0,
        //         "margin": 10,
        //         "addedFundsAcctCcy": 0.01,
        //         "addedFunds": 0.01,
        //         "overnightFeesAndDividends": 0.0,
        //         "currentRate": 357.39,
        //         "currentConversionRate": 1,
        //         "rateTimestamp": "2026-11-27T12:01:29.8902808",
        //         "currentExposure": 10,
        //         "currentExposureAcctCcy": 10,
        //         "acctCcyReturn": -0.01,
        //         "acctCcyRoePercent": -0.1,
        //         "liquidationValueAcctCcy": 9.99,
        //         "liquidationValue": 10,
        //         "pnl": 0,
        //         "pnlPercent": -0.06,
        //         "fxValueImpact": 0,
        //         "roePercent": -0.07
        //     }
        //
        const marketId = this.safeString (position, 'instrumentId');
        const resolved = this.safeMarket (marketId, market);
        const timestamp = this.etoroParseDatetime (this.safeString (position, 'openTime'));
        // the current exposure is signed, negative for a short position
        const notional = Precise.stringAbs (this.omitZero (this.safeString (position, 'currentExposure')));
        const margin = this.safeString (position, 'margin');
        // the exchange does not publish its maintenance margin, the invested margin is reported for both
        const marginPercentage = Precise.stringDiv (margin, notional);
        return this.safePosition ({
            'info': position,
            'id': this.safeString (position, 'positionId'),
            'symbol': resolved['symbol'],
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'isolated': false, // the positions are margined from the balance of the account
            'hedged': true, // a long and a short position of the same market can be open at the same time
            'side': this.safeString (position, 'direction'),
            'contracts': this.parseNumber (this.omitZero (this.safeString (position, 'units'))),
            'contractSize': 1, // one unit of the instrument, also for the real assets
            'entryPrice': this.safeString (position, 'openRate'),
            'markPrice': this.safeString (position, 'currentRate'),
            'lastPrice': this.safeString (position, 'currentRate'),
            'notional': notional,
            'leverage': this.safeString (position, 'leverage'),
            'unrealizedPnl': this.safeString (position, 'pnl'), // in the native currency of the instrument
            'percentage': this.safeString (position, 'roePercent'),
            'positionMargin': margin,
            'initialMargin': margin,
            'initialMarginPercentage': marginPercentage,
            'maintenanceMargin': margin,
            'maintenanceMarginPercentage': marginPercentage,
            'collateral': this.safeString (position, 'liquidationValue'), // the margin with the unrealized profit and loss
            'marginMode': 'cross',
            'marginRatio': undefined,
            'liquidationPrice': undefined,
            'stopLossPrice': this.parseNumber (this.etoroParseStopRate (this.safeString (position, 'stopLossRate'))),
            'takeProfitPrice': this.parseNumber (this.etoroParseStopRate (this.safeString (position, 'takeProfitRate'))),
            'lastUpdateTimestamp': this.etoroParseDatetime (this.safeString (position, 'rateTimestamp')),
        });
    }

    /**
     * @method
     * @name etoro#etoroParseStopRate
     * @description parses the stop-loss or the take-profit rate of an order or a position, the exchange reports a technical sentinel near zero when none is set
     * @ignore
     * @param {string} [rate] the raw rate
     * @returns {string|undefined} the rate, undefined when none is set
     */
    etoroParseStopRate (rate: Str): Str {
        const value = this.omitZero (rate);
        if ((value === '0.0001') || (value === '0.00001') || (value === '0.000001')) {
            return undefined;
        }
        return value;
    }

    //  ---------------------------------------------------------------------------

    /**
     * @method
     * @name etoro#parseOrderStatus
     * @description maps an order status of the exchange to a unified one, the orders lookup returns an object with an id, the close orders an id and the portfolio breakdown a word or an unset "0"
     * @ignore
     * @param {string} [status] the raw status
     * @returns {string|undefined} the unified status
     */
    parseOrderStatus (status: Str): Str {
        //
        //     { "id": 12, "name": "PendingTriggeredRate", "errorCode": 0, "errorMessage": "" }
        //     "PendingTriggeredRate"
        //     1
        //
        if (status === undefined) {
            return undefined;
        }
        const statusesById: Dict = {
            '1': 'open', // Received
            '2': 'open', // Placed
            '3': 'closed', // Filled
            '4': 'rejected', // Rejected
            '5': 'open', // PartiallyFilled
            '6': 'open', // PendingCancel
            '7': 'canceled', // Canceled
            '8': 'expired', // Expired
            '9': 'canceled', // CanceledPartiallyFilled
            '10': 'rejected', // RejectedPartiallyFilled
            '11': 'open', // WaitingForMarket
            '12': 'open', // PendingTriggeredRate
        };
        const statusesByName: Dict = {
            'Received': 'open',
            'Placed': 'open',
            'Filled': 'closed',
            'Rejected': 'rejected',
            'PartiallyFilled': 'open',
            'PendingCancel': 'open',
            'Canceled': 'canceled',
            'Expired': 'expired',
            'CanceledPartiallyFilled': 'canceled',
            'RejectedPartiallyFilled': 'rejected',
            'WaitingForMarket': 'open',
            'PendingTriggeredRate': 'open',
            'pendingTriggerRate': 'open',
        };
        let result = this.safeString (statusesById, status);
        if (result === undefined) {
            result = this.safeString (statusesByName, status);
        }
        if (result === undefined) {
            result = 'open'; // the portfolio breakdown lists the pending orders only
        }
        return result;
    }

    override parseOrder (order: Dict, market: Market = undefined): Order {
        //
        //     fetchOrder, createOrder, cancelOrder
        //
        //     {
        //         "accountId": 34374239,
        //         "gcid": 33171043,
        //         "orderId": 396945782,
        //         "action": "open",
        //         "transaction": "buy",
        //         "type": "mkt",
        //         "etoroOrderTypeId": 17,
        //         "status": { "id": 3, "name": "Filled", "errorCode": 0 },
        //         "asset": { "symbol": "AAPL", "instrumentId": 1001, "currency": "USD", "settlementType": "REAL", "leverage": 1, "side": "long" },
        //         "orderCurrency": "usd",
        //         "requestedAmount": 10.0,
        //         "requestedUnits": 0.027959,
        //         "requestedContracts": 0.027959,
        //         "frozenAmount": 11.0,
        //         "openStopLossRate": 0.0001,
        //         "openTakeProfitRate": 0.0,
        //         "stopLossType": "fixed",
        //         "totalCosts": 1.0,
        //         "positionsToClose": [],
        //         "positionExecutions": [
        //             {
        //                 "positionId": 3650871436,
        //                 "state": "open",
        //                 "remainingUnits": 0.027959,
        //                 "openingData": { "openTime": "2026-11-27T12:01:01.177Z", "orderId": 396945782, "executionTime": "2026-11-27T12:01:01.273Z", "units": 0.027959, "avgPrice": 357.64, "fees": 1.0, "taxes": 0.0 }
        //             }
        //         ],
        //         "requestTime": "2026-11-27T12:01:01.177Z",
        //         "lastUpdate": "2026-11-27T12:01:01.33Z",
        //         "openActionType": "customer",
        //         "requestType": "byAmount"
        //     }
        //
        //     fetchOrders, the pending orders of the portfolio breakdown
        //
        //     {
        //         "orderId": 396951654,
        //         "requestTime": "2026-11-27T12:02:06.673",
        //         "transaction": "buy",
        //         "action": "open",
        //         "status": "0",
        //         "type": "mit",
        //         "eToroOrderTypeId": 0,
        //         "requestType": "byAmount",
        //         "openActionType": "customer",
        //         "closeActionType": "",
        //         "orderCurrency": "USD",
        //         "requestedTriggerRate": 300.0,
        //         "requestedUnits": 0.033333,
        //         "requestedContracts": 0.033333,
        //         "requestedAmountAcctCcy": 10.0,
        //         "openStopLossAmount": 0,
        //         "openTakeProfitAmount": 0,
        //         "asset": { "instrumentId": 1001, "symbol": "AAPL", "direction": "long", "settlementType": "real", "leverage": 1, "currency": "USD" }
        //     }
        //
        //     closePosition, fetchCloseOrder
        //
        //     {
        //         "orderID": 396975138,
        //         "CID": 34374239,
        //         "statusID": 3,
        //         "referenceID": "",
        //         "orderType": 19,
        //         "instrumentID": 1001,
        //         "requestOccurred": "2026-11-27T12:03:14.494819Z",
        //         "proceeds": 9.04,
        //         "positions": [ { "positionID": 3650871436, "occurred": "2026-11-27T12:03:14.6Z", "rate": 357.39, "units": 0.027959, "conversionRate": 1.0, "amount": 9.04 } ]
        //     }
        //
        const asset = this.safeDict (order, 'asset', {});
        let marketId = this.safeString (asset, 'instrumentId');
        if (marketId === undefined) {
            marketId = this.safeString (order, 'instrumentID');
        }
        const resolved = this.safeMarket (marketId, market);
        let referenceId = this.safeString2 (order, 'referenceId', 'referenceID');
        if (referenceId === '') {
            referenceId = undefined;
        }
        const transaction = this.safeString (order, 'transaction');
        let side: Str = undefined;
        if ((transaction === 'buy') || (transaction === 'buyToCover')) {
            side = 'buy';
        } else if ((transaction === 'sell') || (transaction === 'sellShort')) {
            side = 'sell';
        }
        const rawType = this.safeStringLower (order, 'type');
        let orderType: Str = undefined;
        if (rawType === 'mkt') {
            orderType = 'market';
        } else if ((rawType === 'mit') || (rawType === 'limitioc')) {
            orderType = 'limit'; // a market-if-touched order rests until its trigger rate is touched and executes at the market
        }
        const statusObject = this.safeDict (order, 'status', {});
        let statusCode = this.safeString (statusObject, 'id');
        if (statusCode === undefined) {
            statusCode = this.safeString (statusObject, 'name');
        }
        if (statusCode === undefined) {
            statusCode = this.safeString2 (order, 'status', 'statusID');
        }
        const status = this.parseOrderStatus (statusCode);
        const timestamp = this.etoroParseDatetime (this.safeStringN (order, [ 'requestTime', 'openDateTime', 'requestOccurred' ]));
        const requestType = this.safeStringLower (order, 'requestType');
        let amount = this.omitZero (this.safeString2 (order, 'requestedUnits', 'units'));
        if (amount === undefined) {
            amount = this.omitZero (this.safeString (order, 'requestedContracts'));
        }
        const feeCurrency = this.safeStringUpper (order, 'orderCurrency', this.safeStringUpper (asset, 'currency', resolved['quote']));
        // the executions of the opened positions (orders lookup) or of the closed positions (close orders)
        const positionExecutions = this.safeList (order, 'positionExecutions', []);
        const closedPositions = this.safeList (order, 'positions', []);
        const executionCount = positionExecutions.length + closedPositions.length;
        let filled: Str = undefined;
        let cost: Str = undefined;
        let feeCost: Str = undefined;
        let lastTradeTimestamp: Int = undefined;
        if (executionCount > 0) {
            filled = '0';
            cost = '0';
            feeCost = '0';
            for (let i = 0; i < executionCount; i++) {
                let execution: Dict | undefined = undefined;
                if (i < positionExecutions.length) {
                    execution = this.safeDict (this.safeDict (positionExecutions, i, {}), 'openingData', {});
                } else {
                    execution = this.safeDict (closedPositions, i - positionExecutions.length, {});
                }
                const executionUnits = this.omitZero (this.safeString2 (execution, 'units', 'contracts'));
                const executionPrice = this.safeString2 (execution, 'avgPrice', 'rate');
                if (executionUnits !== undefined) {
                    filled = Precise.stringAdd (filled, executionUnits);
                    if (executionPrice !== undefined) {
                        cost = Precise.stringAdd (cost, Precise.stringMul (executionUnits, executionPrice));
                    }
                }
                const executionFee = this.omitZero (this.safeString (execution, 'fees'));
                if (executionFee !== undefined) {
                    feeCost = Precise.stringAdd (feeCost, executionFee);
                }
                const executionTime = this.etoroParseDatetime (this.safeString2 (execution, 'executionTime', 'occurred'));
                if ((executionTime !== undefined) && ((lastTradeTimestamp === undefined) || (executionTime > lastTradeTimestamp))) {
                    lastTradeTimestamp = executionTime;
                }
            }
        }
        if (Precise.stringEq (filled, '0')) {
            // nothing was executed yet
            filled = undefined;
            cost = undefined;
        }
        if (Precise.stringEq (feeCost, '0')) {
            feeCost = undefined;
        }
        if ((filled === undefined) && (requestType === 'byamount')) {
            // the requested amount in usd of an order that has not executed yet
            cost = this.omitZero (this.safeString2 (order, 'requestedAmount', 'requestedAmountAcctCcy'));
        }
        if ((filled === undefined) && (status !== 'closed') && (status !== 'expired')) {
            filled = '0';
        }
        // the requested units of an order by amount are an estimate, the executed units are the amount of the filled order
        if ((requestType === 'byamount') && (status === 'closed') && (filled !== undefined)) {
            amount = filled;
        }
        let timeInForce: Str = undefined;
        if (rawType === 'mit') {
            timeInForce = 'GTC'; // it rests until its trigger rate is touched
        } else if (rawType === 'limitioc') {
            timeInForce = 'IOC';
        }
        return this.safeOrder ({
            'info': order,
            'id': this.safeString2 (order, 'orderId', 'orderID'),
            'clientOrderId': referenceId,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': lastTradeTimestamp,
            'lastUpdateTimestamp': this.etoroParseDatetime (this.safeString (order, 'lastUpdate')),
            'symbol': resolved['symbol'],
            'type': orderType,
            'timeInForce': timeInForce,
            'postOnly': undefined,
            'reduceOnly': undefined,
            'side': side,
            'price': undefined,
            'triggerPrice': this.omitZero (this.safeString2 (order, 'requestedTriggerRate', 'rate')),
            'stopLossPrice': this.parseNumber (this.etoroParseStopRate (this.safeString (order, 'openStopLossRate'))),
            'takeProfitPrice': this.parseNumber (this.etoroParseStopRate (this.safeString (order, 'openTakeProfitRate'))),
            'amount': amount,
            'filled': filled,
            'remaining': undefined,
            'cost': cost,
            'average': undefined,
            'fee': (feeCost !== undefined) ? { 'cost': feeCost, 'currency': feeCurrency } : undefined,
            'fees': undefined,
            'trades': undefined,
            'status': status,
        }, resolved);
    }

    /**
     * @method
     * @name etoro#fetchOrder
     * @description fetches an order by its id, the open and the closed orders of the selected environment (the demo one with setSandboxMode (true)) are found by their id, also with params["referenceId"] in place of the id, which was not answered for the orders of the v2 execution endpoints in a live test
     * @see https://api-portal.etoro.com/api-reference/trading--real/get-order-information-and-position-details
     * @see https://api-portal.etoro.com/api-reference/trading--demo/get-order-information-and-position-details
     * @param {string} id the order id, or the reference id with params["referenceId"] set to true
     * @param {string} [symbol] unified symbol of the market the order was made in
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {boolean} [params.referenceId] set to true to look the order up by its reference id (the x-request-id it was created with) instead of its order id, the exchange answered "No external operation was found" for such an order in a live test (2026-11-27)
     * @returns {object} an [order structure](https://docs.ccxt.com/#/?id=order-structure)
     */
    override async fetchOrder (id: string, symbol: Str = undefined, params: Dict = {}): Promise<Order> {
        await this.loadMarkets ();
        let market: Market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
        }
        const [ byReferenceId, query ] = this.handleOptionAndParams (params, 'fetchOrder', 'referenceId', false);
        const request: Dict = {};
        if (byReferenceId) {
            request['referenceId'] = id;
        } else {
            request['orderId'] = id;
        }
        const response = await this.etoroTradingRequest ('v2/trading/info/orders:lookup', 'v2/trading/info/demo/orders:lookup', 'GET', this.extend (request, query));
        return this.parseOrder (response, market);
    }

    /**
     * @method
     * @name etoro#etoroWaitForOrder
     * @description polls the orders lookup endpoint until an accepted order leaves the given in-flight statuses, the lookup endpoint answers 404 until an accepted order becomes visible
     * @ignore
     * @param {string} orderId the order id
     * @param {object} market the market of the order
     * @param {string} methodName the calling method, its options hold the retries and the delay
     * @param {string[]} inFlightStatuses the status ids that are polled again
     * @returns {object} the last parsed [order structure](https://docs.ccxt.com/#/?id=order-structure), throws OrderNotFound when the order never became visible
     */
    async etoroWaitForOrder (orderId: string, market: Market, methodName: string, inFlightStatuses: string[]): Promise<Order> {
        const options = this.safeDict (this.options, methodName, {});
        const retries = this.safeInteger (options, 'retries', 3);
        const retryDelay = this.safeInteger (options, 'retryDelay', 500);
        const request: Dict = { 'orderId': orderId };
        let order: Order | undefined = undefined;
        for (let i = 0; i <= retries; i++) {
            try {
                const response = await this.etoroTradingRequest ('v2/trading/info/orders:lookup', 'v2/trading/info/demo/orders:lookup', 'GET', request);
                order = this.parseOrder (response, market);
                const statusId = this.safeString (this.safeDict (response, 'status', {}), 'id');
                if (!this.inArray (statusId, inFlightStatuses)) {
                    return order;
                }
            } catch (e) {
                if (!(e instanceof OrderNotFound) || (i === retries)) {
                    throw e;
                }
            }
            await this.sleep (retryDelay);
        }
        if (order === undefined) {
            throw new OrderNotFound (this.id + ' ' + methodName + '() could not load the order ' + orderId + ' from the orders lookup');
        }
        return order;
    }

    /**
     * @method
     * @name etoro#fetchOrders
     * @description fetches the pending orders of the trading account of the selected environment (the demo one with setSandboxMode (true)), eToro keeps no order history, a filled, canceled or rejected order is retrieved with fetchOrder by its id
     * @see https://api-portal.etoro.com/api-reference/trading--real/get-instrument-breakdown
     * @see https://api-portal.etoro.com/api-reference/trading--demo/get-instrument-breakdown-demo
     * @param {string} [symbol] unified symbol of the market the orders were made in, all markets are fetched when omitted
     * @param {int} [since] the earliest time in ms to fetch orders for
     * @param {int} [limit] the maximum number of order structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {Order[]} a list of [order structures](https://docs.ccxt.com/#/?id=order-structure)
     */
    override async fetchOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params: Dict = {}): Promise<Order[]> {
        await this.loadMarkets ();
        const request: Dict = {
            'positionLevel': 'None',
            'orderLevel': 'Normal',
        };
        let market: Market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['instrumentIds'] = market['id'];
        }
        const response = await this.etoroTradingRequest ('v2/trading/info/instrument-breakdown', 'v2/trading/info/demo/instrument-breakdown', 'GET', this.extend (request, params));
        const orders = this.etoroInstrumentEntries (response, 'orders');
        return this.parseOrders (orders, market, since, limit);
    }

    /**
     * @method
     * @name etoro#fetchOpenOrders
     * @description fetches the pending orders of the trading account of the selected environment (the demo one with setSandboxMode (true)), the market-if-touched orders that wait for their trigger rate or for the market to open
     * @see https://api-portal.etoro.com/api-reference/trading--real/get-instrument-breakdown
     * @see https://api-portal.etoro.com/api-reference/trading--demo/get-instrument-breakdown-demo
     * @param {string} [symbol] unified symbol of the market the orders were made in, all markets are fetched when omitted
     * @param {int} [since] the earliest time in ms to fetch orders for
     * @param {int} [limit] the maximum number of order structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {Order[]} a list of [order structures](https://docs.ccxt.com/#/?id=order-structure)
     */
    override async fetchOpenOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params: Dict = {}): Promise<Order[]> {
        return await this.fetchOrders (symbol, since, limit, params);
    }

    /**
     * @method
     * @name etoro#createOrder
     * @description creates an order that opens a position, a market order, an immediate-or-cancel limit order or a market-if-touched order, a buy opens a long position and a sell a short one, positions are closed with closePosition, the size is exactly one of the amount in units of the instrument, params["cost"] in usd or params["contracts"], the returned status is polled from the orders lookup, a 200 from the exchange only means the order was accepted
     * @see https://api-portal.etoro.com/api-reference/trading--real/create-an-order
     * @see https://api-portal.etoro.com/api-reference/trading--demo/create-an-order
     * @param {string} symbol unified symbol of the market to create an order in
     * @param {string} type 'market' or 'limit', a limit order is immediate-or-cancel
     * @param {string} side 'buy' or 'sell'
     * @param {float} amount how many units of the instrument to trade, ignored with params["cost"], params["units"] or params["contracts"]
     * @param {float} [price] the price at which the order is to be fulfilled, in units of the quote currency, ignored in market orders and when params["triggerPrice"] is set
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {float} [params.cost] how much to spend in usd, the native sizing of the exchange
     * @param {float} [params.units] the number of units to trade
     * @param {int} [params.contracts] the number of contracts to trade, real futures only
     * @param {float} [params.triggerPrice] the rate at which a market-if-touched order executes at the market, it rests until the rate is touched, ignores the type and the price
     * @param {int} [params.leverage] the leverage multiplier, 1 or more, defaults to 1
     * @param {string} [params.settlementType] 'real', 'cfd', 'realFutures' or 'marginTrade', defaults to 'real' for a long position of a spot market at the leverage of one and to 'cfd' otherwise
     * @param {float} [params.stopLossPrice] the rate at which the position closes at a loss, required by the exchange for a short position, a leverage above one and a trailing stop loss
     * @param {float} [params.takeProfitPrice] the rate at which the position closes at a profit
     * @param {boolean} [params.trailing] set to true for a trailing stop loss
     * @param {string} [params.clientOrderId] a unique guid for the order, sent as the x-request-id header and echoed back as the clientOrderId
     * @returns {object} an [order structure](https://docs.ccxt.com/#/?id=order-structure)
     */
    override async createOrder (symbol: string, type: OrderType, side: OrderSide, amount: number, price: Num = undefined, params: Dict = {}): Promise<Order> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        if ((side !== 'buy') && (side !== 'sell')) {
            throw new InvalidOrder (this.id + ' createOrder() only supports the buy and sell sides, a position is closed with closePosition ()');
        }
        if (this.safeString (params, 'stopPrice') !== undefined) {
            throw new InvalidOrder (this.id + ' createOrder() has no stop orders, use params["triggerPrice"] for a market-if-touched order');
        }
        const leverage = this.safeInteger (params, 'leverage', 1);
        const transaction = (side === 'buy') ? 'buy' : 'sellShort'; // a sell opens a short position
        const request: Dict = {
            'action': 'open',
            'transaction': transaction,
            'instrumentId': this.parseToInt (market['id']),
            'leverage': leverage,
            'orderCurrency': 'usd',
            'settlementType': this.etoroSettlementType (market, side, leverage, params),
        };
        // exactly one of the amount in usd, the units or the contracts
        const cost = this.safeString2 (params, 'cost', 'notional');
        const units = this.safeString (params, 'units');
        const contracts = this.safeString (params, 'contracts');
        let requestType: Str = 'byUnits';
        if (cost !== undefined) {
            if ((units !== undefined) || (contracts !== undefined)) {
                throw new InvalidOrder (this.id + ' createOrder() takes exactly one of params["cost"], params["units"] or params["contracts"]');
            }
            request['amount'] = this.parseNumber (cost);
            requestType = 'byAmount';
        } else if (units !== undefined) {
            if (contracts !== undefined) {
                throw new InvalidOrder (this.id + ' createOrder() takes exactly one of params["cost"], params["units"] or params["contracts"]');
            }
            request['units'] = this.parseNumber (units);
        } else if (contracts !== undefined) {
            request['contracts'] = this.parseNumber (contracts);
            requestType = 'byContracts';
        } else {
            if (amount === undefined) {
                throw new ArgumentsRequired (this.id + ' createOrder() requires an amount argument, or one of params["cost"], params["units"] or params["contracts"]');
            }
            request['units'] = amount;
        }
        // the order type, a market-if-touched order rests until its trigger rate is touched
        let orderType: Str = 'mkt';
        let triggerRate: Num = undefined;
        const triggerPrice = this.safeString (params, 'triggerPrice');
        if (triggerPrice !== undefined) {
            orderType = 'mit';
            triggerRate = this.parseNumber (triggerPrice);
            request['triggerRate'] = triggerRate;
        } else if ((type === 'market') || (type === 'margin')) {
            orderType = 'mkt';
        } else if (type === 'limit') {
            if (price === undefined) {
                throw new InvalidOrder (this.id + ' createOrder() requires a price argument for limit orders');
            }
            orderType = 'limitIOC'; // immediate-or-cancel
            request['limitRate'] = this.parseNumber (price);
        } else {
            throw new InvalidOrder (this.id + ' createOrder() does not support the ' + type + ' order type, use market, limit or a triggerPrice');
        }
        request['orderType'] = orderType;
        // the stop loss and the take profit of the position that the order opens
        const stopLossPrice = this.safeString2 (params, 'stopLossPrice', 'stopLossRate');
        const takeProfitPrice = this.safeString2 (params, 'takeProfitPrice', 'takeProfitRate');
        if (stopLossPrice !== undefined) {
            request['stopLossRate'] = this.parseNumber (stopLossPrice);
        }
        if (takeProfitPrice !== undefined) {
            request['takeProfitRate'] = this.parseNumber (takeProfitPrice);
        }
        const isTrailing = this.safeBool (params, 'trailing', false);
        const stopLossType = this.safeStringLower (params, 'stopLossType', (isTrailing) ? 'trailing' : undefined);
        if (stopLossType !== undefined) {
            request['stopLossType'] = stopLossType;
        }
        const clientOrderId = this.safeString (params, 'clientOrderId');
        const query = this.omit (params, [ 'cost', 'notional', 'units', 'contracts', 'leverage', 'settlementType', 'stopLossPrice', 'stopLossRate', 'takeProfitPrice', 'takeProfitRate', 'triggerPrice', 'trailing', 'stopLossType', 'clientOrderId' ]);
        const body = this.extend (request, query);
        if (clientOrderId !== undefined) {
            // sent as the x-request-id header, it is echoed back as the referenceId of the order
            body['x-request-id'] = clientOrderId;
        }
        const response = await this.etoroTradingRequest ('v2/trading/execution/orders', 'v2/trading/execution/demo/orders', 'POST', body, 6);
        //
        //     { "token": "39fdeef9-a967-4f3d-8143-13619da37253", "orderId": 396945782, "referenceId": "41b77adf-1ffc-4e4f-9a08-3e4d7393a8b3" }
        //
        // a 200 response means the order was accepted for processing, not that it was executed, the outcome is polled from the orders lookup
        const orderId = this.safeString (response, 'orderId');
        if (orderId === undefined) {
            throw new ExchangeError (this.id + ' createOrder() got no order id back: ' + this.json (response));
        }
        let order: Order | undefined = undefined;
        try {
            order = await this.etoroWaitForOrder (orderId, market, 'createOrder', [ '1', '2' ]);
        } catch (e) {
            if (!(e instanceof OrderNotFound)) {
                throw e;
            }
        }
        if (order === undefined) {
            // the lookup endpoint did not list the accepted order in time
            const now = this.milliseconds ();
            const accepted: Dict = this.extend ({}, response, {
                'asset': { 'symbol': market['baseId'], 'instrumentId': market['id'], 'currency': market['quote'], 'leverage': leverage, 'side': (side === 'buy') ? 'long' : 'short' },
                'transaction': transaction,
                'type': orderType,
                'status': { 'id': 1, 'name': 'Received' },
                'requestType': requestType,
                'requestedAmount': this.safeString (request, 'amount'),
                'requestedUnits': this.safeString2 (request, 'units', 'contracts'),
                'requestedTriggerRate': triggerRate,
                'openStopLossRate': this.safeString (request, 'stopLossRate'),
                'openTakeProfitRate': this.safeString (request, 'takeProfitRate'),
                'requestTime': this.iso8601 (now),
            });
            order = this.parseOrder (accepted, market);
        }
        // only the submission response echoes the x-request-id of the order
        order['clientOrderId'] = this.safeString (response, 'referenceId');
        return order;
    }

    /**
     * @method
     * @name etoro#etoroSettlementType
     * @description resolves the settlement type of an order, the real asset is held by a long position at the leverage of one, the short positions, the leveraged ones and the cfds of the forex, commodity and index markets are cfds
     * @ignore
     * @param {object} market the market of the order
     * @param {string} side the side of the order
     * @param {int} leverage the leverage of the order
     * @param {object} params the params of the order, params["settlementType"] overrides the default
     * @returns {string} the settlement type
     */
    etoroSettlementType (market: Market, side: string, leverage: Int, params: Dict): string {
        const settlementType = this.safeStringLower (params, 'settlementType');
        if (settlementType !== undefined) {
            return settlementType;
        }
        const isContract = this.safeBool (market, 'contract', false);
        if (isContract || ((leverage !== undefined) && (leverage > 1)) || (side === 'sell')) {
            return 'cfd';
        }
        return 'real';
    }

    /**
     * @method
     * @name etoro#createMarketOrderWithCost
     * @description create a market order by providing the symbol, side and cost, the cost is in usd
     * @see https://api-portal.etoro.com/api-reference/trading--real/create-an-order
     * @param {string} symbol unified symbol of the market to create an order in
     * @param {string} side 'buy' or 'sell'
     * @param {float} cost how much to spend in usd
     * @param {object} [params] extra parameters specific to the exchange API endpoint, see createOrder
     * @returns {object} an [order structure](https://docs.ccxt.com/#/?id=order-structure)
     */
    override async createMarketOrderWithCost (symbol: string, side: OrderSide, cost: number, params: Dict = {}): Promise<Order> {
        // the cost travels in the params, the amount argument is ignored with it
        return await this.createOrder (symbol, 'market', side, cost, undefined, this.extend ({}, params, { 'cost': cost }));
    }

    /**
     * @method
     * @name etoro#createMarketBuyOrderWithCost
     * @description create a market buy order by providing the symbol and cost, the cost is in usd
     * @see https://api-portal.etoro.com/api-reference/trading--real/create-an-order
     * @param {string} symbol unified symbol of the market to create an order in
     * @param {float} cost how much to spend in usd
     * @param {object} [params] extra parameters specific to the exchange API endpoint, see createOrder
     * @returns {object} an [order structure](https://docs.ccxt.com/#/?id=order-structure)
     */
    override async createMarketBuyOrderWithCost (symbol: string, cost: number, params: Dict = {}): Promise<Order> {
        return await this.createMarketOrderWithCost (symbol, 'buy', cost, params);
    }

    /**
     * @method
     * @name etoro#createMarketSellOrderWithCost
     * @description create a market sell order by providing the symbol and cost, the cost is in usd, it opens a short position
     * @see https://api-portal.etoro.com/api-reference/trading--real/create-an-order
     * @param {string} symbol unified symbol of the market to create an order in
     * @param {float} cost how much to spend in usd
     * @param {object} [params] extra parameters specific to the exchange API endpoint, see createOrder
     * @returns {object} an [order structure](https://docs.ccxt.com/#/?id=order-structure)
     */
    override async createMarketSellOrderWithCost (symbol: string, cost: number, params: Dict = {}): Promise<Order> {
        return await this.createMarketOrderWithCost (symbol, 'sell', cost, params);
    }

    /**
     * @method
     * @name etoro#cancelOrder
     * @description cancels a pending order, a market-if-touched order that waits for its trigger rate or for the market to open, the resulting status is polled from the orders lookup
     * @see https://api-portal.etoro.com/api-reference/trading--real/cancels-an-order-before-it-is-executed
     * @see https://api-portal.etoro.com/api-reference/trading--demo/cancels-an-order-before-it-is-executed
     * @param {string} id order id
     * @param {string} [symbol] unified symbol of the market the order was made in
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} an [order structure](https://docs.ccxt.com/#/?id=order-structure)
     */
    override async cancelOrder (id: string, symbol: Str = undefined, params: Dict = {}): Promise<Order> {
        await this.loadMarkets ();
        let market: Market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
        }
        const response = await this.etoroTradingRequest ('v2/trading/execution/orders/{orderId}', 'v2/trading/execution/demo/orders/{orderId}', 'DELETE', this.extend ({ 'orderId': id }, params), 6);
        //
        //     { "orderId": 396951654, "referenceId": "" }
        //
        // a 200 response confirms the cancellation request was accepted, the resulting status is polled from the orders lookup
        try {
            return await this.etoroWaitForOrder (id, market, 'cancelOrder', [ '1', '2', '6' ]);
        } catch (e) {
            if (!(e instanceof OrderNotFound)) {
                throw e;
            }
        }
        // the lookup endpoint did not list the order in time, the cancellation request was accepted nonetheless
        return this.parseOrder (this.extend ({}, response, { 'status': { 'id': 6, 'name': 'PendingCancel' }}), market);
    }

    /**
     * @method
     * @name etoro#editOrder
     * @description edits the stop loss and the take profit of an open position, the id is the position id, the price and the amount of an order cannot be edited
     * @see https://api-portal.etoro.com/api-reference/trading--real/modify-stop-loss-and-take-profit-settings-on-an-open-position
     * @see https://api-portal.etoro.com/api-reference/trading--demo/modify-stop-loss-and-take-profit-settings-on-an-open-position
     * @param {string} id the position id
     * @param {string} symbol unified symbol of the market of the position
     * @param {string} type not used by etoro, the type is kept from the creation of the position
     * @param {string} side not used by etoro, the side is kept from the creation of the position
     * @param {float} [amount] not used by etoro, a position is closed partially with closePosition
     * @param {float} [price] not used by etoro
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {float} [params.stopLossPrice] the new rate at which the position closes at a loss
     * @param {float} [params.takeProfitPrice] the new rate at which the position closes at a profit
     * @param {boolean} [params.trailing] set to true for a trailing stop loss
     * @param {string} [params.stopLossType] 'fixed' or 'trailing'
     * @param {boolean} [params.clearStopLoss] set to true to remove the stop loss
     * @param {boolean} [params.clearTakeProfit] set to true to remove the take profit
     * @returns {object} an [order structure](https://docs.ccxt.com/#/?id=order-structure) representing the position
     */
    override async editOrder (id: string, symbol: string, type: OrderType, side: OrderSide, amount: Num = undefined, price: Num = undefined, params: Dict = {}): Promise<Order> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {};
        const stopLossPrice = this.safeString2 (params, 'stopLossPrice', 'stopLossRate');
        const takeProfitPrice = this.safeString2 (params, 'takeProfitPrice', 'takeProfitRate');
        const clearStopLoss = this.safeBool (params, 'clearStopLoss', false);
        const clearTakeProfit = this.safeBool (params, 'clearTakeProfit', false);
        if (stopLossPrice !== undefined) {
            request['stopLossRate'] = this.parseNumber (stopLossPrice);
        }
        if (takeProfitPrice !== undefined) {
            request['takeProfitRate'] = this.parseNumber (takeProfitPrice);
        }
        const isTrailing = this.safeBool (params, 'trailing', false);
        const stopLossType = this.safeStringLower (params, 'stopLossType', (isTrailing) ? 'trailing' : undefined);
        if (stopLossType !== undefined) {
            request['stopLossType'] = stopLossType;
        }
        if (clearStopLoss) {
            request['clearStopLoss'] = true;
        }
        if (clearTakeProfit) {
            request['clearTakeProfit'] = true;
        }
        const keys = Object.keys (request);
        if (keys.length === 0) {
            throw new ArgumentsRequired (this.id + ' editOrder() edits the stop loss and the take profit of an open position, it requires a stopLossPrice, a takeProfitPrice, a trailing, a clearStopLoss or a clearTakeProfit param');
        }
        const query = this.omit (params, [ 'stopLossPrice', 'stopLossRate', 'takeProfitPrice', 'takeProfitRate', 'trailing', 'stopLossType', 'clearStopLoss', 'clearTakeProfit' ]);
        const response = await this.etoroTradingRequest ('v2/trading/positions/{positionId}', 'v2/trading/demo/positions/{positionId}', 'PATCH', this.extend ({ 'positionId': id }, request, query));
        //
        //     { "operationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "positionId": 3650871436, "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6" }
        //
        // the request is accepted for asynchronous processing, the reported rates are the requested ones
        const timestamp = this.milliseconds ();
        return this.safeOrder ({
            'info': response,
            'id': this.safeString2 (response, 'positionId', 'operationId'),
            'clientOrderId': this.safeString (response, 'referenceId'),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': undefined,
            'lastUpdateTimestamp': undefined,
            'symbol': market['symbol'],
            'type': 'market',
            'timeInForce': undefined,
            'postOnly': undefined,
            'reduceOnly': undefined,
            'side': (side === undefined) ? undefined : side.toLowerCase (),
            'price': undefined,
            'triggerPrice': undefined,
            'stopLossPrice': this.parseNumber (stopLossPrice),
            'takeProfitPrice': this.parseNumber (takeProfitPrice),
            'amount': undefined,
            'filled': undefined,
            'remaining': undefined,
            'cost': undefined,
            'average': undefined,
            'fee': undefined,
            'fees': undefined,
            'trades': undefined,
            'status': 'open',
        }, market);
    }

    /**
     * @method
     * @name etoro#fetchCloseOrder
     * @description fetches a market order that closes a position by its id, with the positions it closed and their execution rates, the direction of the order is not reported by the exchange and is left undefined, closePosition reports it
     * @ignore
     * @see https://api-portal.etoro.com/api-reference/trading--real/get-close-order-information-and-closed-position-details
     * @see https://api-portal.etoro.com/api-reference/trading--demo/get-close-order-information-and-closed-position-details
     * @param {string} id the close order id
     * @param {string} [symbol] unified symbol of the market the order was made in
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} an [order structure](https://docs.ccxt.com/#/?id=order-structure)
     */
    async fetchCloseOrder (id: string, symbol: Str = undefined, params: Dict = {}): Promise<Order> {
        await this.loadMarkets ();
        let market: Market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
        }
        const response = await this.etoroTradingRequest ('v1/trading/info/real/close-orders/{orderId}', 'v1/trading/info/demo/close-orders/{orderId}', 'GET', this.extend ({ 'orderId': id }, params));
        return this.parseOrder (this.extend ({ 'type': 'mkt' }, response), market);
    }

    /**
     * @method
     * @name etoro#closePosition
     * @description closes the open positions of a market at the market price, the optional side closes the long or the short ones only and params["units"] closes a portion of them, the positions of the trading account of the selected environment (the demo one with setSandboxMode (true)) are closed, eToro has no reduce-only orders
     * @see https://api-portal.etoro.com/api-reference/trading--real/close-position-by-units
     * @see https://api-portal.etoro.com/api-reference/trading--demo/close-demo-position-by-units
     * @param {string} symbol unified symbol of the market to close the positions of
     * @param {string} [side] 'long' or 'short' to close the positions of that side only, all of them are closed when omitted
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {float} [params.units] the number of units to close, the whole position is closed when omitted
     * @returns {object} an [order structure](https://docs.ccxt.com/#/?id=order-structure), the close order of the last closed position
     */
    override async closePosition (symbol: string, side: Str = undefined, params: Dict = {}): Promise<Order> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const units = this.safeString (params, 'units');
        const query = this.omit (params, [ 'units' ]);
        const positions = await this.fetchPositions ([ symbol ], query);
        let order: Order | undefined = undefined;
        for (let i = 0; i < positions.length; i++) {
            const position = positions[i];
            if ((side !== undefined) && (position['side'] !== side)) {
                continue;
            }
            const positionId = this.safeString (position, 'id');
            const request: Dict = {
                'positionId': positionId,
                'InstrumentId': this.parseToInt (market['id']),
            };
            if (units !== undefined) {
                request['UnitsToDeduct'] = this.parseNumber (units);
            }
            const response = await this.etoroTradingRequest ('v1/trading/execution/market-close-orders/positions/{positionId}', 'v1/trading/execution/demo/market-close-orders/positions/{positionId}', 'POST', this.extend (request, query), 6);
            //
            //     { "orderForClose": { "positionID": 2150941015, "instrumentID": 1001, "unitsToDeduct": 2, "orderID": 13904638, "orderType": 19, "statusID": 1, "CID": 34374239, "openDateTime": "2025-04-02T16:07:54.0880338Z", "lastUpdate": "2025-04-02T16:07:54.0880338Z" }, "token": "5fe065bc-f6f9-4897-a2ce-c4fccef73ff8" }
            //
            // a 200 response means the close order was submitted, the outcome is polled from the close order information
            const orderForClose = this.safeDict (response, 'orderForClose', {});
            const orderId = this.safeString (orderForClose, 'orderID');
            // a position is closed with the opposite side of the one it was opened with
            const closingSide = (this.safeString (position, 'side') === 'long') ? 'sell' : 'buy';
            const requestSize = this.safeString2 (orderForClose, 'unitsToDeduct', this.safeString (position, 'contracts'));
            const submitted = this.extend ({}, orderForClose, { 'transaction': closingSide, 'type': 'mkt', 'requestedUnits': requestSize });
            const options = this.safeDict (this.options, 'closePosition', {});
            const retries = this.safeInteger (options, 'retries', 3);
            const retryDelay = this.safeInteger (options, 'retryDelay', 500);
            order = this.parseOrder (submitted, market);
            for (let j = 0; j <= retries; j++) {
                try {
                    const closeOrder = await this.etoroTradingRequest ('v1/trading/info/real/close-orders/{orderId}', 'v1/trading/info/demo/close-orders/{orderId}', 'GET', this.extend ({ 'orderId': orderId }, query));
                    order = this.parseOrder (this.extend ({ 'transaction': closingSide, 'type': 'mkt' }, closeOrder), market);
                    const statusId = this.safeString (closeOrder, 'statusID');
                    if (!this.inArray (statusId, [ '1', '2', '5', '6', '11' ])) {
                        break;
                    }
                } catch (e) {
                    if (!(e instanceof OrderNotFound) || (j === retries)) {
                        throw e;
                    }
                }
                await this.sleep (retryDelay);
            }
            order['reduceOnly'] = true;
        }
        if (order === undefined) {
            throw new OrderNotFound (this.id + ' closePosition() found no open position to close in ' + symbol);
        }
        return order;
    }

    //  ---------------------------------------------------------------------------

    /**
     * @method
     * @name etoro#fetchMyTrades
     * @description fetches the trades of the trading account of the selected environment (the demo one with setSandboxMode (true)), the exchange keeps the history of the closed positions and each one is reported as its closing execution followed by its opening one, newest first, a window of one year at most is fetched
     * @see https://api-portal.etoro.com/api-reference/trading--real/list-trading-history
     * @see https://api-portal.etoro.com/api-reference/trading--demo/list-trading-history
     * @param {string} [symbol] unified symbol of the market to fetch the trades for, all markets are fetched when omitted
     * @param {int} [since] the earliest time in ms to fetch trades for, at most one year back
     * @param {int} [limit] the maximum number of closed positions to fetch, each one is two trades
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {Trade[]} a list of [trade structures](https://docs.ccxt.com/#/?id=trade-structure)
     */
    override async fetchMyTrades (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params: Dict = {}): Promise<Trade[]> {
        await this.loadMarkets ();
        let market: Market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
        }
        const options = this.safeDict (this.options, 'fetchMyTrades', {});
        const now = this.milliseconds ();
        // the exchange accepts a lookback of one year minus one day at most
        const oldest = now - 364 * 86400000;
        let from = now - this.safeInteger (options, 'days', 30) * 86400000;
        if (since !== undefined) {
            from = Math.max (since, oldest);
        }
        const request: Dict = {
            'minDate': this.ymd (from, '-'),
        };
        if (limit !== undefined) {
            request['pageSize'] = limit;
        }
        const response = await this.etoroTradingRequest ('v1/trading/info/trade/history', 'v1/trading/info/trade/demo/history', 'GET', this.extend (request, params));
        //
        //     [
        //         {
        //             "netProfit": 0.01,
        //             "closeRate": 194.29,
        //             "closeTimestamp": "2026-11-27T10:58:35.043Z",
        //             "positionId": 3650867027,
        //             "instrumentId": 1202,
        //             "isBuy": true,
        //             "leverage": 1,
        //             "openRate": 194.1,
        //             "openTimestamp": "2026-11-27T10:58:21.293Z",
        //             "stopLossRate": 0.01,
        //             "takeProfitRate": 0.0,
        //             "trailingStopLoss": false,
        //             "orderId": 396951463,
        //             "socialTradeId": 0,
        //             "parentPositionId": 0,
        //             "investment": 14.98,
        //             "initialInvestment": 14.98,
        //             "fees": 0.0,
        //             "units": 0.070408
        //         },
        //         ...
        //     ]
        //
        // the history lists the closed positions, each one becomes its closing execution followed by its opening one
        const history = this.toArray (response);
        const trades: List = [];
        for (let i = 0; i < history.length; i++) {
            const closedPosition = this.safeDict (history, i, {});
            trades.push (this.extend ({ 'leg': 'close' }, closedPosition));
            trades.push (this.extend ({ 'leg': 'open' }, closedPosition));
        }
        return this.parseTrades (trades, market, since, limit);
    }

    override parseTrade (trade: Dict, market: Market = undefined): Trade {
        //
        //     fetchMyTrades, a closed position of the history with the leg added by fetchMyTrades
        //
        //     {
        //         "leg": "close",
        //         "netProfit": 0.01,
        //         "closeRate": 194.29,
        //         "closeTimestamp": "2026-11-27T10:58:35.043Z",
        //         "positionId": 3650867027,
        //         "instrumentId": 1202,
        //         "isBuy": true,
        //         "openRate": 194.1,
        //         "openTimestamp": "2026-11-27T10:58:21.293Z",
        //         "orderId": 396951463,
        //         "fees": 0.0,
        //         "units": 0.070408
        //     }
        //
        const leg = this.safeString (trade, 'leg', 'close');
        const isClosing = (leg === 'close');
        const marketId = this.safeString (trade, 'instrumentId');
        const resolved = this.safeMarket (marketId, market);
        const isBuy = this.safeBool (trade, 'isBuy', false);
        // the closing execution has the opposite direction of the position
        let side: Str = undefined;
        if (isBuy) {
            side = (isClosing) ? 'sell' : 'buy';
        } else {
            side = (isClosing) ? 'buy' : 'sell';
        }
        let price = this.safeString (trade, 'openRate');
        let datetime = this.safeString (trade, 'openTimestamp');
        let fee: Dict | undefined = undefined;
        if (isClosing) {
            price = this.safeString (trade, 'closeRate');
            datetime = this.safeString (trade, 'closeTimestamp');
            const feeCost = this.omitZero (this.safeString (trade, 'fees'));
            if (feeCost !== undefined) {
                fee = { 'cost': feeCost, 'currency': resolved['quote'] };
            }
        }
        const timestamp = this.etoroParseDatetime (datetime);
        const amount = this.safeString (trade, 'units');
        const positionId = this.safeString (trade, 'positionId');
        return this.safeTrade ({
            'info': trade,
            'id': positionId + '-' + leg,
            'order': (isClosing) ? undefined : this.safeString (trade, 'orderId'),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': resolved['symbol'],
            'type': 'market',
            'side': side,
            'takerOrMaker': 'taker',
            'price': price,
            'amount': amount,
            'cost': Precise.stringMul (amount, price),
            'fee': fee,
        }, resolved);
    }

    //  ---------------------------------------------------------------------------
    //  ---------------------------------------------------------------------------

    /**
     * @method
     * @name etoro#fetchLedger
     * @description fetches the transactions of a cash account of the real environment, the account is the first cash account of the user or the one of params["accountId"], the exchange does not filter them by date, the since and the limit are applied client side
     * @see https://api-portal.etoro.com/api-reference/cash-accounts/list-cash-account-transactions-paginated
     * @param {string} [code] unified currency code, the transactions of that currency only
     * @param {int} [since] the earliest time in ms to fetch the transactions for
     * @param {int} [limit] the maximum number of transactions to fetch, 500 at most
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.accountId] the id of the cash account, defaults to the first cash account of the user
     * @returns {object[]} a list of [ledger structures](https://docs.ccxt.com/#/?id=ledger-structure)
     */
    override async fetchLedger (code: Str = undefined, since: Int = undefined, limit: Int = undefined, params: Dict = {}): Promise<LedgerEntry[]> {
        let accountId = this.safeString (params, 'accountId');
        if (accountId === undefined) {
            const accounts = await this.fetchAccounts ();
            for (let i = 0; i < accounts.length; i++) {
                const account = accounts[i];
                if (this.safeStringLower (account, 'type') === 'cash') {
                    accountId = account['id'];
                    break;
                }
            }
            if (accountId === undefined) {
                throw new ExchangeError (this.id + ' fetchLedger() requires params["accountId"] with the id of a cash account, the user has none');
            }
        }
        let currency: Currency = undefined;
        if (code !== undefined) {
            currency = this.safeCurrency (code);
        }
        const request: Dict = { 'accountId': accountId };
        if (limit !== undefined) {
            request['pageSize'] = Math.min (limit, 500);
        }
        const query = this.omit (params, [ 'accountId' ]);
        const response = await this.privateGetV1MoneyAccountsCashAccountIdTransactions (this.extend (request, query));
        //
        //     {
        //         "results": [
        //             {
        //                 "id": "12345",
        //                 "accountId": "f0995efc-25a1-465e-bec3-d309aaf00ede",
        //                 "transactionType": "card",
        //                 "transactionSubtype": "cardPayment",
        //                 "direction": "debit",
        //                 "status": "settled",
        //                 "amount": "100.00",
        //                 "currency": "USD",
        //                 "originalAmount": "90.00",
        //                 "originalCurrency": "EUR",
        //                 "conversionRate": "1.1111",
        //                 "postedAt": "2026-05-03T10:16:12Z",
        //                 "counterparty": { "name": "Acme Store", "type": "merchant" }
        //             }
        //         ],
        //         "pagination": { "pageSize": 50, "nextPageToken": "eyJsYXN0SWQiOjEyMzk1fQ==", "hasNext": true }
        //     }
        //
        const results = this.safeList (response, 'results', []);
        return this.parseLedger (results, currency, since, limit);
    }

    override parseLedgerEntry (item: Dict, currency: Currency = undefined): LedgerEntry {
        //
        //     {
        //         "id": "12345",
        //         "accountId": "f0995efc-25a1-465e-bec3-d309aaf00ede",
        //         "transactionType": "card",
        //         "transactionSubtype": "cardPayment",
        //         "direction": "debit",
        //         "status": "settled",
        //         "amount": "100.00",
        //         "currency": "USD",
        //         "postedAt": "2026-05-03T10:16:12Z",
        //         "internalTransferTransactionDetails": { "transferId": "..." }
        //     }
        //
        const currencyId = this.safeString (item, 'currency');
        const currencyResolved: Currency = this.safeCurrency (currencyId, currency);
        const timestamp = this.etoroParseDatetime (this.safeString (item, 'postedAt'));
        const internalTransfer = this.safeDict (item, 'internalTransferTransactionDetails', {});
        const direction = this.safeStringLower (item, 'direction');
        return this.safeLedgerEntry ({
            'info': item,
            'id': this.safeString (item, 'id'),
            'account': this.safeString (item, 'accountId'),
            'referenceId': this.safeString2 (internalTransfer, 'transferId', this.safeString (item, 'id')),
            'referenceAccount': undefined,
            'type': this.parseLedgerEntryType (this.safeString2 (item, 'transactionSubtype', 'transactionType')),
            'currency': currencyResolved['code'],
            'amount': this.safeString (item, 'amount'),
            'before': undefined,
            'after': undefined,
            'status': this.parseLedgerEntryStatus (this.safeStringLower (item, 'status')),
            'fee': undefined,
            'direction': (direction === 'credit') ? 'in' : 'out',
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
        }, currencyResolved);
    }

    /**
     * @method
     * @name etoro#parseLedgerEntryType
     * @description maps a transaction subtype of a cash account to a unified ledger type
     * @ignore
     * @param {string} [transactionType] the raw transaction subtype
     * @returns {string|undefined} the unified ledger type
     */
    parseLedgerEntryType (transactionType: Str): Str {
        const types: Dict = {
            'fee': 'fee',
            'internalTransfer': 'transfer',
            'transfer': 'transfer',
            'transferReceived': 'transfer',
            'refund': 'transaction',
            'card': 'transaction',
            'bankTransfer': 'transaction',
            'balanceAdjustment': 'transaction',
        };
        return this.safeString (types, transactionType, 'transaction');
    }

    /**
     * @method
     * @name etoro#parseLedgerEntryStatus
     * @description maps a transaction status of a cash account to a unified one
     * @ignore
     * @param {string} [status] the raw status
     * @returns {string|undefined} the unified status
     */
    parseLedgerEntryStatus (status: Str): Str {
        const statuses: Dict = {
            'settled': 'ok',
            'authorized': 'pending',
            'failed': 'failed',
            'rejected': 'failed',
            'returned': 'failed',
            'expired': 'failed',
        };
        return this.safeString (statuses, status);
    }

    //  ---------------------------------------------------------------------------

    /**
     * @method
     * @name etoro#transfer
     * @description transfers funds between two accounts of the user of the real environment, a trading, options or cash one, a successful response means the transfer was accepted, not completed, poll fetchTransfer for its final status
     * @see https://api-portal.etoro.com/api-reference/transfer/execute-an-internal-account-to-account-transfer
     * @param {string} code unified currency code, the currency of the source account
     * @param {float} amount how much of currency you want to send in units of the currency
     * @param {string} fromAccount the source account as "accountType:accountId", e.g. "trading:1001", or an account id with params["fromAccountType"]
     * @param {string} toAccount the destination account as "accountType:accountId" or an account id with params["toAccountType"]
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.fromAccountType] 'trading', 'options', 'cash' or 'moneyFarm', when fromAccount is an account id
     * @param {string} [params.toAccountType] 'trading', 'options', 'cash' or 'moneyFarm', when toAccount is an account id
     * @param {string} [params.requestReferenceId] the idempotency key of the transfer, defaults to a new guid
     * @returns {object} a [transfer structure](https://docs.ccxt.com/#/?id=transfer-structure)
     */
    override async transfer (code: string, amount: number, fromAccount: string, toAccount: string, params: Dict = {}): Promise<TransferEntry> {
        if (fromAccount === undefined) {
            throw new ArgumentsRequired (this.id + ' transfer() requires a fromAccount argument, "accountType:accountId", e.g. "trading:1001"');
        }
        if (toAccount === undefined) {
            throw new ArgumentsRequired (this.id + ' transfer() requires a toAccount argument, "accountType:accountId", e.g. "cash:x-5501"');
        }
        const sourceParts = this.etoroSplitAccount (fromAccount, this.safeStringLower (params, 'fromAccountType'), 'fromAccount');
        const destinationParts = this.etoroSplitAccount (toAccount, this.safeStringLower (params, 'toAccountType'), 'toAccount');
        const request: Dict = {
            'requestReferenceId': this.safeString2 (params, 'requestReferenceId', 'clientOrderId', this.uuid ()),
            'sourceAccount': { 'accountType': sourceParts[0], 'accountId': sourceParts[1] },
            'destinationAccount': { 'accountType': destinationParts[0], 'accountId': destinationParts[1] },
            'amount': amount,
            'currency': code,
        };
        const query = this.omit (params, [ 'requestReferenceId', 'clientOrderId', 'fromAccountType', 'toAccountType' ]);
        const response = await this.privatePostV1MoneyTransfers (this.extend (request, query));
        //
        //     { "transferId": 123456789, "requestReferenceId": "client-ref-8f3a-001" }
        //
        const timestamp = this.milliseconds ();
        return {
            'info': response,
            'id': this.safeString (response, 'transferId'),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'currency': this.safeCurrencyCode (code),
            'amount': this.parseNumber (amount),
            'fromAccount': sourceParts[0],
            'toAccount': destinationParts[0],
            'status': 'pending',
        };
    }

    /**
     * @method
     * @name etoro#etoroSplitAccount
     * @description splits an account of a transfer into its type and its id, an account is "accountType:accountId" or an account id with its type passed separately
     * @ignore
     * @param {string} account the account as "accountType:accountId" or an account id
     * @param {string} [accountType] the type of the account, when the account is an id
     * @param {string} argumentName the name of the argument the account came from
     * @returns {Array} the account type and the account id
     */
    etoroSplitAccount (account: string, accountType: Str, argumentName: string): [ Str, Str ] {
        const separator = account.indexOf (':');
        if (separator > -1) {
            return [ this.etoroAccountType (account.slice (0, separator)), account.slice (separator + 1) ];
        }
        if (accountType === undefined) {
            throw new ArgumentsRequired (this.id + ' transfer() requires the type of the ' + argumentName + ', pass it as "accountType:accountId" or in params["' + argumentName + 'Type"]');
        }
        return [ this.etoroAccountType (accountType), account ];
    }

    /**
     * @method
     * @name etoro#etoroAccountType
     * @description lowercases an account type of a transfer, the camelCase moneyFarm of the exchange is kept
     * @ignore
     * @param {string} accountType the account type
     * @returns {string} the account type of the exchange
     */
    etoroAccountType (accountType: Str): Str {
        const types: Dict = {
            'moneyfarm': 'moneyFarm',
        };
        return this.safeString (types, accountType, accountType);
    }

    /**
     * @method
     * @name etoro#fetchTransfer
     * @description fetches a transfer by its id, the transfers of the real environment
     * @see https://api-portal.etoro.com/api-reference/transfer/get-transfer-by-id
     * @param {string} id the transfer id
     * @param {string} [code] unified currency code of the transfer
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [transfer structure](https://docs.ccxt.com/#/?id=transfer-structure)
     */
    override async fetchTransfer (id: string, code: Str = undefined, params: Dict = {}): Promise<TransferEntry> {
        let currency: Currency = undefined;
        if (code !== undefined) {
            currency = this.safeCurrency (code);
        }
        const response = await this.privateGetV1MoneyTransfersTransferId (this.extend ({ 'transferId': id }, params));
        //
        //     {
        //         "results": [
        //             {
        //                 "id": 9876543210,
        //                 "status": "InProcess",
        //                 "statusReason": "",
        //                 "referenceId": "client-ref-8f3a-001",
        //                 "amount": 250.0,
        //                 "currency": "USD",
        //                 "created": "2026-11-27T12:00:00Z",
        //                 "modified": "2026-11-27T12:00:01Z",
        //                 "destination": { "destinationAccount": { "accountType": "cash", "accountId": "x-5501" }, "accountCurrency": "USD", "exchangeRate": 1 },
        //                 "source": { "sourceAccount": { "accountType": "trading", "accountId": "1001" }, "accountCurrency": "USD", "exchangeRate": 1 }
        //             }
        //         ]
        //     }
        //
        const results = this.safeList (response, 'results', []);
        const transfer = this.safeDict (results, 0);
        if (transfer === undefined) {
            throw new OrderNotFound (this.id + ' fetchTransfer() could not find the transfer ' + id);
        }
        return this.parseTransfer (transfer, currency);
    }

    /**
     * @method
     * @name etoro#fetchTransfers
     * @description fetches the transfers of the real environment by their client reference id, the exchange keeps no transfer history
     * @see https://api-portal.etoro.com/api-reference/transfer/list-transfers-by-reference-id
     * @param {string} [code] unified currency code of the transfers
     * @param {int} [since] the earliest time in ms to fetch the transfers for
     * @param {int} [limit] the maximum number of transfer structures to retrieve
     * @param {object} params extra parameters specific to the exchange API endpoint
     * @param {string} params.requestReferenceId the reference the transfers were created with
     * @returns {object[]} a list of [transfer structures](https://docs.ccxt.com/#/?id=transfer-structure)
     */
    override async fetchTransfers (code: Str = undefined, since: Int = undefined, limit: Int = undefined, params: Dict = {}): Promise<TransferEntry[]> {
        const referenceId = this.safeString (params, 'requestReferenceId');
        if (referenceId === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchTransfers() requires params["requestReferenceId"], eToro lists the transfers of a client reference only');
        }
        let currency: Currency = undefined;
        if (code !== undefined) {
            currency = this.safeCurrency (code);
        }
        const query = this.omit (params, [ 'requestReferenceId' ]);
        const response = await this.privateGetV1MoneyTransfersLookup (this.extend ({ 'requestReferenceId': referenceId }, query));
        const results = this.safeList (response, 'results', []);
        return this.parseTransfers (results, currency, since, limit, query);
    }

    override parseTransfer (transfer: Dict, currency: Currency = undefined): TransferEntry {
        //
        //     {
        //         "id": 9876543210,
        //         "status": "InProcess",
        //         "statusReason": "",
        //         "referenceId": "client-ref-8f3a-001",
        //         "amount": 250.0,
        //         "currency": "USD",
        //         "created": "2026-11-27T12:00:00Z",
        //         "modified": "2026-11-27T12:00:01Z",
        //         "destination": { "destinationAccount": { "accountType": "cash", "accountId": "x-5501" } },
        //         "source": { "sourceAccount": { "accountType": "trading", "accountId": "1001" } }
        //     }
        //
        const currencyId = this.safeString (transfer, 'currency');
        const currencyResolved: Currency = this.safeCurrency (currencyId, currency);
        const timestamp = this.etoroParseDatetime (this.safeString (transfer, 'created'));
        const source = this.safeDict (this.safeDict (transfer, 'source', {}), 'sourceAccount', {});
        const destination = this.safeDict (this.safeDict (transfer, 'destination', {}), 'destinationAccount', {});
        return {
            'info': transfer,
            'id': this.safeString (transfer, 'id'),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'currency': currencyResolved['code'],
            'amount': this.safeNumber (transfer, 'amount'),
            'fromAccount': this.safeStringLower (source, 'accountType'),
            'toAccount': this.safeStringLower (destination, 'accountType'),
            'status': this.parseTransferStatus (this.safeStringLower (transfer, 'status')),
        };
    }

    /**
     * @method
     * @name etoro#parseTransferStatus
     * @description maps a transfer status of the exchange to a unified one, an unknown status is not final
     * @ignore
     * @param {string} [status] the raw status
     * @returns {string} the unified status
     */
    parseTransferStatus (status: Str): Str {
        const statuses: Dict = {
            'inprocess': 'pending',
            'pending': 'pending',
            'success': 'ok',
            'completed': 'ok',
            'decline': 'failed',
            'technical': 'failed',
            'canceled': 'failed',
            'cancelled': 'failed',
            'failed': 'failed',
        };
        return this.safeString (statuses, status, 'pending');
    }

    //  ---------------------------------------------------------------------------

    /**
     * @method
     * @name etoro#fetchMyProfile
     * @description fetches the profile of the authenticated user with the account ids and the scopes of the key pair
     * @ignore
     * @see https://api-portal.etoro.com/api-reference/identity/get-authenticated-user-profile
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} the raw response from the exchange
     */
    async fetchMyProfile (params: Dict = {}): Promise<Dict> {
        //
        //     { "gcid": 123456, "realCid": 789012, "demoCid": 345678, "username": "johndoe", "scopes": [ "etoro-public:real:read", ... ] }
        //
        return await this.privateGetV1Me (params);
    }

    /**
     * @method
     * @name etoro#fetchInstrumentTypes
     * @description fetches the types of the instruments, forex, commodities, cfds, indices, stocks, etfs, ...
     * @ignore
     * @see https://api-portal.etoro.com/api-reference/market-data/list-instrument-types
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} the raw instrument types from the exchange
     */
    async fetchInstrumentTypes (params: Dict = {}): Promise<List> {
        //
        //     [ { "instrumentTypeID": 1, "instrumentTypeDescription": "Forex" }, ... ]
        //
        const response = await this.publicGetV1MarketDataInstrumentTypes (params);
        return this.safeList (response, 'instrumentTypes', []);
    }

    /**
     * @method
     * @name etoro#fetchInstrumentExchanges
     * @description fetches the exchanges the instruments are listed on, the listing venues of the stocks and the groups of the cfds
     * @ignore
     * @see https://api-portal.etoro.com/api-reference/market-data/list-supported-exchanges
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} the raw exchanges from the exchange
     */
    async fetchInstrumentExchanges (params: Dict = {}): Promise<List> {
        //
        //     [ { "exchangeID": 1, "exchangeDescription": "FX" }, ... ]
        //
        const response = await this.publicGetV1MarketDataExchanges (params);
        return this.safeList (response, 'exchangeInfo', []);
    }

    /**
     * @method
     * @name etoro#fetchStocksIndustries
     * @description fetches the industries the stocks are grouped by
     * @ignore
     * @see https://api-portal.etoro.com/api-reference/market-data/get-stocks-industries
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} the raw industries from the exchange
     */
    async fetchStocksIndustries (params: Dict = {}): Promise<List> {
        //
        //     [ { "industryID": 1, "industryName": "Basic Materials" }, ... ]
        //
        const response = await this.publicGetV1MarketDataStocksIndustries (params);
        return this.safeList (response, 'stocksIndustries', []);
    }

    /**
     * @method
     * @name etoro#fetchClosingPrices
     * @description fetches the official daily, weekly and monthly closing prices of every instrument, a price of -1 with a date in the year 1 means that there is no data
     * @ignore
     * @see https://api-portal.etoro.com/api-reference/market-data/get-historical-closing-prices
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} the raw closing prices from the exchange
     */
    async fetchClosingPrices (params: Dict = {}): Promise<List> {
        //
        //     [ { "instrumentId": 1002, "officialClosingPrice": 175.75, "closingPrices": { "daily": { "price": 175.75, "date": "2025-03-07 00:00:00Z" }, "weekly": { ... }, "monthly": { "price": -1, "date": "0001-01-01 00:00:00Z" } } }, ... ]
        //
        const response = await this.publicGetV1MarketDataInstrumentsHistoryClosingPrice (params);
        return this.toArray (response);
    }

    /**
     * @method
     * @name etoro#fetchCandleCoverage
     * @description fetches the oldest and the newest candle of every interval of a market, to pick an interval and a range that has data before fetching candles, the symbol of the response carries the native currency of the instrument, e.g. "AAPL.EUR/EUR"
     * @ignore
     * @see https://api-portal.etoro.com/api-reference/data/get-where-price-candles-exist-for-an-instrument
     * @param {string} symbol unified symbol of the market
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} the raw response from the exchange
     */
    async fetchCandleCoverage (symbol: string, params: Dict = {}): Promise<Dict> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = { 'instrumentId': market['id'] };
        //
        //     { "instrumentId": 1001, "symbol": "AAPL/USD", "intervals": [ { "interval": "1d", "firstCandle": "2006-03-21T00:00:00Z", "lastCandle": "2026-09-27T21:00:00Z", "candles": 5123, "loadedAt": "2026-09-28T07:30:00Z" } ] }
        //
        return await this.publicGetV1DataInstrumentsInstrumentIdCandlesCoverage (this.extend (request, params));
    }

    /**
     * @method
     * @name etoro#fetchInstrumentMetadata
     * @description fetches the metadata of instruments by their unified symbols, or lists them page by page when no symbol is passed (params["pageToken"] continues a listing)
     * @ignore
     * @see https://api-portal.etoro.com/api-reference/market-data/search-for-securities-instruments-by-id-or-symbol
     * @param {string[]} [symbols] unified symbols of the markets to fetch the metadata of
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} the raw instruments from the exchange
     */
    async fetchInstrumentMetadata (symbols: Strings = undefined, params: Dict = {}): Promise<List> {
        const request: Dict = {};
        if (symbols !== undefined) {
            await this.loadMarkets ();
            request['instrumentsIds'] = this.marketIds (this.marketSymbols (symbols)).join (',');
        }
        const response = await this.publicGetV2MarketDataInstruments (this.extend (request, params));
        //
        //     { "results": [ { "instrumentId": 1001, "displayName": "Apple", "type": "Stocks", "symbol": "AAPL", "exchangeId": 4, "image": { ... } } ], "pagination": { "pageSize": 100, "nextPageToken": "NQ==", "hasNext": false } }
        //
        return this.safeList (response, 'results', []);
    }

    /**
     * @method
     * @name etoro#searchInstruments
     * @description searches instruments by a free text query, ranked by relevance, the results carry the exchange symbol (e.g. AAPL) that resolves to a unified symbol once the markets are loaded
     * @ignore
     * @see https://api-portal.etoro.com/api-reference/market-data/search-instruments-by-free-text-query
     * @param {string} query the free text to match against the names and the symbols of the instruments, 1 to 100 characters
     * @param {int} [limit] the maximum number of instruments to return, 50 at most
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} the raw instruments from the exchange
     */
    async searchInstruments (query: string, limit: Int = undefined, params: Dict = {}): Promise<List> {
        const request: Dict = { 'query': query };
        if (limit !== undefined) {
            request['limit'] = Math.min (limit, 50);
        }
        const response = await this.publicGetV2MarketDataInstrumentsSearch (this.extend (request, params));
        //
        //     { "results": [ { "instrumentId": 1001, "displayName": "Apple", "type": "Stocks", "symbol": "AAPL", "exchangeId": 4, "image": { ... } } ] }
        //
        return this.safeList (response, 'results', []);
    }

    /**
     * @method
     * @name etoro#fetchTradingEligibility
     * @description fetches the trading configuration of instruments for the selected environment (the demo one with setSandboxMode (true)), the minimum exposure, the maximum units, the allowed order types and the leverage configurations with their settlement types, at most 100 instruments per request, it rarely changes and can be cached for a session
     * @ignore
     * @see https://api-portal.etoro.com/api-reference/trading--real/check-instrument-trading-eligibility
     * @see https://api-portal.etoro.com/api-reference/trading--demo/check-instrument-trading-eligibility
     * @param {string[]} [symbols] unified symbols of the markets to fetch the eligibility of, exchange tickers with params["symbols"] when omitted
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} the raw response from the exchange, the eligibilities with their leverageConfigs and the instruments that were not found
     */
    async fetchTradingEligibility (symbols: Strings = undefined, params: Dict = {}): Promise<Dict> {
        const request: Dict = {};
        if (symbols !== undefined) {
            await this.loadMarkets ();
            const marketIdentifiers = this.marketIds (this.marketSymbols (symbols));
            const instrumentIds: int[] = [];
            for (let i = 0; i < marketIdentifiers.length; i++) {
                instrumentIds.push (this.parseToInt (marketIdentifiers[i]));
            }
            request['instrumentIds'] = instrumentIds;
        }
        const response = await this.etoroTradingRequest ('v2/trading/info/eligibility', 'v2/trading/info/demo/eligibility', 'POST', this.extend (request, params), 6);
        //
        //     {
        //         "currency": "usd",
        //         "eligibilities": [
        //             {
        //                 "instrumentId": 1001,
        //                 "symbol": "AAPL",
        //                 "minPositionExposure": 10.0,
        //                 "maxUnitsPerOrder": 5841.0,
        //                 "allowOpenPosition": true,
        //                 "allowMitOrders": true,
        //                 "unitsQuantityType": "fractional",
        //                 "allowedOrderQuantityType": "all",
        //                 "leverageConfigs": [ { "settlementType": "real", "direction": "long", "leverageValues": [ 1 ], "minPositionAmount": 10, "allowEditStopLoss": true, "maxStopLossPercentage": 100 } ]
        //             }
        //         ],
        //         "notFoundInstrumentIds": [],
        //         "notFoundSymbols": []
        //     }
        //
        return response;
    }

    /**
     * @method
     * @name etoro#fetchTradingCosts
     * @description fetches the costs that a market order would incur now, the markup, the market spread, the transaction fee, the overnight and the weekend fees and the taxes, for the selected environment (the demo one with setSandboxMode (true)), the response carries the raw cost components and their total
     * @ignore
     * @see https://api-portal.etoro.com/api-reference/trading--real/get-what-if-trading-cost-breakdown
     * @see https://api-portal.etoro.com/api-reference/trading--demo/get-what-if-trading-cost-breakdown
     * @param {string} symbol unified symbol of the market
     * @param {string} [side] 'buy' or 'sell'
     * @param {float} [amount] the cost of the hypothetical order in usd
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {int} [params.leverage] the leverage multiplier, defaults to 1
     * @param {string} [params.settlementType] 'real', 'cfd', 'realFutures' or 'marginTrade', see createOrder for the default
     * @param {float} [params.units] the size of the hypothetical order in units of the instrument, in place of the amount
     * @param {int} [params.contracts] the size of the hypothetical order in contracts, in place of the amount
     * @returns {object} the raw response from the exchange with an added total
     */
    async fetchTradingCosts (symbol: string, side: OrderSide = 'buy', amount: number = 100, params: Dict = {}): Promise<Dict> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const leverage = this.safeInteger (params, 'leverage', 1);
        const transaction = (side.toLowerCase () === 'sell') ? 'sellShort' : 'buy';
        const request: Dict = {
            'action': 'open',
            'transaction': transaction,
            'instrumentId': this.parseToInt (market['id']),
            'settlementType': this.etoroSettlementType (market, transaction, leverage, params),
            'orderType': 'mkt',
            'leverage': leverage,
            'orderCurrency': 'usd',
        };
        // exactly one of the amount in usd, the units or the contracts
        const units = this.safeString (params, 'units');
        const contracts = this.safeString (params, 'contracts');
        if (units !== undefined) {
            request['units'] = this.parseNumber (units);
        } else if (contracts !== undefined) {
            request['contracts'] = this.parseNumber (contracts);
        } else {
            request['amount'] = amount;
        }
        const query = this.omit (params, [ 'leverage', 'units', 'contracts' ]);
        const response = await this.etoroTradingRequest ('v2/trading/info/costs', 'v2/trading/info/demo/costs', 'POST', this.extend (request, query), 6);
        //
        //     { "instrumentId": 1001, "symbol": "AAPL", "costs": [ { "costType": "transactionFee", "currency": "USD", "value": 1.0 }, { "costType": "markup", "currency": "USD", "value": 0.0 }, { "costType": "marketSpread", "currency": "USD", "value": 0.01 }, { "costType": "overnightFee", "currency": "USD", "value": 0.0 } ], "lastUpdated": "2026-11-27T12:00:22.3829854Z" }
        //
        const result: Dict = this.extend ({}, response);
        const costs = this.safeList (response, 'costs', []);
        let total: Str = '0';
        for (let i = 0; i < costs.length; i++) {
            const cost = this.safeDict (costs, i, {});
            total = Precise.stringAdd (total, this.safeString2 (cost, 'value', 'amount')); // earlier versions of the docs named the value "amount"
        }
        result['total'] = this.parseNumber (total);
        return result;
    }

    //  ---------------------------------------------------------------------------

    /**
     * @method
     * @name etoro#fetchWatchlists
     * @description fetches the watchlists of the user with their items, the watchlists are shared with the eToro platform
     * @ignore
     * @see https://api-portal.etoro.com/api-reference/watchlists/get-user-watchlists
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} the raw response from the exchange, the watchlists are in its "watchlists" list
     */
    async fetchWatchlists (params: Dict = {}): Promise<Dict> {
        //
        //     { "status": 200, "watchlists": [ { "watchlistId": "021a1036-9b76-476c-ac05-ad6db2095463", "name": "Recently Invested", "watchlistType": "RecentlyInvested", "totalItems": 0, "items": [] } ], "meta": { ... } }
        //
        return await this.privateGetV1Watchlists (params);
    }

    /**
     * @method
     * @name etoro#etoroWatchlistItems
     * @description builds the item list that the watchlist endpoints of the exchange take
     * @ignore
     * @param {string[]} symbols unified symbols of the markets
     * @returns {Array} the items
     */
    etoroWatchlistItems (symbols: Strings): List {
        const items: List = [];
        if (symbols === undefined) {
            return items;
        }
        for (let i = 0; i < symbols.length; i++) {
            const market = this.market (symbols[i]);
            items.push ({ 'itemId': this.parseToInt (market['id']), 'itemType': 'Instrument' });
        }
        return items;
    }

    /**
     * @method
     * @name etoro#createWatchlist
     * @description creates a watchlist with an optional list of markets in it, the watchlist is shared with the eToro platform
     * @ignore
     * @see https://api-portal.etoro.com/api-reference/watchlists/create-a-new-watchlist
     * @see https://api-portal.etoro.com/api-reference/watchlists/add-items-to-watchlist
     * @param {string} name the name of the watchlist
     * @param {string[]} [symbols] unified symbols of the markets to add to the watchlist
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} the raw watchlist from the exchange
     */
    async createWatchlist (name: string, symbols: Strings = undefined, params: Dict = {}): Promise<Dict> {
        await this.loadMarkets ();
        const request: Dict = this.extend ({ 'name': name }, params);
        const response = await this.privatePostV1Watchlists (request);
        //
        //     { "status": 201, "watchlists": [ { "watchlistId": "021a1036-9b76-476c-ac05-ad6db2095463", "name": "Tech Watchlist", "watchlistType": "Static", "totalItems": 0, "items": [] } ] }
        //
        const watchlists = this.safeList (response, 'watchlists', []);
        const watchlist = this.safeDict (watchlists, 0, {});
        const watchlistId = this.safeString (watchlist, 'watchlistId');
        if ((symbols !== undefined) && (watchlistId !== undefined)) {
            const items = this.etoroWatchlistItems (symbols);
            if (items.length > 0) {
                const itemsRequest: Dict = { 'watchlistId': watchlistId, 'x-body': items };
                await this.privatePostV1WatchlistsWatchlistIdItems (itemsRequest);
            }
        }
        return watchlist;
    }

    /**
     * @method
     * @name etoro#deleteWatchlist
     * @description deletes a watchlist
     * @ignore
     * @see https://api-portal.etoro.com/api-reference/watchlists/delete-watchlist
     * @param {string} watchlistId the id of the watchlist
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} the raw response from the exchange, an empty body for a 204
     */
    async deleteWatchlist (watchlistId: string, params: Dict = {}): Promise<any> {
        return await this.privateDeleteV1WatchlistsWatchlistId (this.extend ({ 'watchlistId': watchlistId }, params));
    }

    /**
     * @method
     * @name etoro#addWatchlistSymbols
     * @description adds markets to a watchlist
     * @ignore
     * @see https://api-portal.etoro.com/api-reference/watchlists/add-items-to-watchlist
     * @param {string} watchlistId the id of the watchlist
     * @param {string[]} symbols unified symbols of the markets to add
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} the raw response from the exchange, an empty body for a 204
     */
    async addWatchlistSymbols (watchlistId: string, symbols: Strings, params: Dict = {}): Promise<any> {
        await this.loadMarkets ();
        const request: Dict = this.extend ({ 'watchlistId': watchlistId, 'x-body': this.etoroWatchlistItems (symbols) }, params);
        return await this.privatePostV1WatchlistsWatchlistIdItems (request);
    }

    /**
     * @method
     * @name etoro#removeWatchlistSymbols
     * @description removes markets from a watchlist
     * @ignore
     * @see https://api-portal.etoro.com/api-reference/watchlists/remove-items-from-watchlist
     * @param {string} watchlistId the id of the watchlist
     * @param {string[]} symbols unified symbols of the markets to remove
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} the raw response from the exchange, an empty body for a 204
     */
    async removeWatchlistSymbols (watchlistId: string, symbols: Strings, params: Dict = {}): Promise<any> {
        await this.loadMarkets ();
        const request: Dict = this.extend ({ 'watchlistId': watchlistId, 'x-body': this.etoroWatchlistItems (symbols) }, params);
        return await this.privateDeleteV1WatchlistsWatchlistIdItems (request);
    }
}
