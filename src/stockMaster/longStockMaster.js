/*******************************************************************************
LONGSTOCKMASTER.JS
--

Buys and sells long stock shares by analyzing the market over time
Stores data in ./stocks/
--

Commands are in format:
${average ask}
${average bid}
${average share price}
${number of measures}
${min ask}
${max ask}
${min bid}
${max bid}
${min price}
${max price}

${long shares counts}
${avg long shares price}



*******************************************************************************/
function getData(ns, file) {
    let data = "";
    if (ns.fileExists(file)) {
        data = ns.read(file).split("\n");

        // Format data values
        for (let i = 0; i < data.length; i++) {
            data[i] = Number(data[i]);
        }
    }
    return data;
}

function observeMarket(ns, tix) {
    // Get all stocks names
    let symbols = tix.getSymbols();

    // Get all relevant data
    for (let i = 0; i < symbols.length; i++) {
        let symbol = symbols[i];
        let file = `./stocks/${symbol}.txt`;

        // Data to track over time
        let ask = tix.getAskPrice(symbol);
        let bid = tix.getBidPrice(symbol);
        let price = tix.getPrice(symbol);
        let count = 1;

        // Try to get data from associated file
        let data = getData(ns, file);

        // Compute values averages
        let askAvg, bidAvg, priceAvg;
        let minAsk, maxAsk, minBid, maxBid, minPrice, maxPrice;

        if (data) {
            askAvg = (data[0] * data[3] + ask) / (data[3] + 1);
            bidAvg = (data[1] * data[3] + bid) / (data[3] + 1);
            priceAvg = (data[2] * data[3] + price) / (data[3] + 1);

            minAsk = data[4];
            maxAsk = data[5];
            minBid = data[6];
            maxBid = data[7];
            minPrice = data[8];
            maxPrice = data[9];

            count += data[3];

            if (ask < minAsk) {
                minAsk = ask;
            }
            if (ask > maxAsk) {
                maxAsk = ask;
            }

            if (bid < minBid) {
                minBid = bid;
            }
            if (bid > maxBid) {
                maxBid = bid;
            }

            if (price < minPrice) {
                minPrice = price;
            }
            if (price > maxPrice) {
                maxPrice = price;
            }
        }
        else {
            askAvg = ask;
            bidAvg = bid;
            priceAvg = price;
            minAsk = ask;
            maxAsk = ask;
            minBid = bid;
            maxBid = bid;
            minPrice = price;
            maxPrice = price;
        }

        // Write data to file
        let str = `${askAvg}\n${bidAvg}\n${priceAvg}\n${count}\n\
${minAsk}\n${maxAsk}\n${minBid}\n${maxBid}\n${minPrice}\n${maxPrice}\n`;
        ns.write(file, str, "w");
    }
}

function tradeShares(ns, tix, buyThr, sellThr, buy, sell) {
    // Get all stocks names
    let symbols = tix.getSymbols();

    // Get all relevant data
    for (let i = 0; i < symbols.length; i++) {
        let symbol = symbols[i];
        let file = `./stocks/${symbol}.txt`;

        // Data to track over time
        let ask = tix.getAskPrice(symbol);
        let bid = tix.getBidPrice(symbol);
        let price = tix.getPrice(symbol);

        // Try to get data from associated file
        let data = getData(ns, file);

        if (!data.length) {
            continue;
        }

        let avgAsk = data[0];
        let avgBid = data[1];
        let avgPrice = data[2];
        let minAsk = data[4];
        let maxAsk = data[5];
        let minBid = data[6];
        let maxBid = data[7];
        let minPrice = data[8];
        let maxPrice = data[9];

        // Verify if buying is possible
        if (buy) {
            if (ask <= (minAsk * buyThr + (1 - buyThr) * avgAsk)) {
                tix.buyStock(symbol, 15000);
            }
        }

        // Verify if selling is possible
        if (sell) {
            let pos = tix.getPosition(symbol);
            if (bid > pos[1]) {
                if (bid >= (maxBid * sellThr + (1 - sellThr) * pos[1])) {
                    tix.sellStock(symbol, pos[0]);
                }
            }
        }
    }
}

/** @param {NS} ns */
export async function main(ns) {

    // Get TIX API
    var tix = ns.stock;

    let buy = true;
    let sell = true;

    // If "nobuy" in args
    if (ns.args.includes("nobuy")) {
        buy = false;
        ns.tprint("Buying disabled");
    }

    // If "nosell" in args
    if (ns.args.includes("nosell")) {
        sell = false;
        ns.tprint("Selling disabled");
    }

    while (true) {
        observeMarket(ns, tix);
        tradeShares(ns, tix, 0.95, 0.85, buy, sell);
        await tix.nextUpdate();
    }
}
