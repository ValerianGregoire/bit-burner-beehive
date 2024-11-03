/*******************************************************************************
WIDEUPGRADE.JS
--

Buys the maximal amount of RAM upgrades for each owned server on the network.
*******************************************************************************/

// Finds all servers available and returns a list of them
function getServers(ns) {
    // Servers array
    var subNodes = ["home"];
    var again = true; // Indicates if new unanalyzed servers were found

    while (again) {
        again = false;

        // Scans every node from subNodes
        for (let i = 0; i < subNodes.length; i++) {
            let subs = ns.scan(subNodes[i]);

            // Checks if found nodes are already in subNodes
            for (let j = 0; j < subs.length; j++) {
                if (!subNodes.includes(subs[j])) {
                    subNodes.push(subs[j]);
                    again = true; // Loop process if new nodes were found
                }
            }
        }
    }

    var owned = [];
    for (let i = 0; i < subNodes.length; i++) {
        let server = subNodes[i];
        let serverObj = ns.getServer(server);

        if (serverObj.purchasedByPlayer) {
            owned.push(server);
        }

    }
    return owned;
}

// Write scripts to nuked servers
function upgradeServers(ns, servers) {

    // Repeat the process for each server
    for (let i = 0; i < servers.length; i++) {
        let server = servers[i];

        let success = true;
        while (success) {
            let ram = ns.getServerMaxRam(server);
            success = ns.upgradePurchasedServer(server, ram * 2);
        }
    }
}


/** @param {NS} ns */
export async function main(ns) {

    // Get all servers names
    ns.tprint("Fetching a list of upgradable servers...\n");
    var subNodes = getServers(ns);

    // Log results
    upgradeServers(ns, subNodes);
    ns.tprint("Upgraded as many servers as possible.\n");
}
