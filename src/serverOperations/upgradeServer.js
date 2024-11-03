/*******************************************************************************
UPGRADESERVER.JS
--

Upgrades a single server's RAM.
The server's name must be provided as argument when calling the script.
*******************************************************************************/

/** @param {NS} ns */
export async function main(ns) {
    // Get the server name and object reference
    let server = ns.args[0];
    let serverObj = ns.getServer(server);

    // Upgrades only affect owned servers
    if (!serverObj.purchasedByPlayer) {
        ns.tprint("The given server cannot be upgraded.");
        return;
    }

    // Ask for permission to upgrade on repeat
    let choice = true;
    while (choice) {

        // Get server's RAM
        let ram = ns.getServerMaxRam(server);

        // Check that the maximal RAM wasn't reached
        if (ram >= 1048576) {
            ns.tprint("The given server cannot be upgraded.");
            return;
        }

        // Check the price to double the RAM
        let price = ns.getPurchasedServerUpgradeCost(server, ram * 2);

        // Ask for permission to proceed
        choice = await ns.prompt(`Would you like to upgrade ${server} from ${ram} GB to ${ram * 2} GB of RAM ?\n\nThis operation will cost \$${price}.`);

        // Upgrade the server's RAM if agreed
        if (choice) {
            var success = ns.upgradePurchasedServer(server, ram * 2);
        }

        // Log the operation's result
        if (success) {
            ns.tprint("The operation was successful.");
            ns.tprint(`${server} upgraded to ${ram * 2} GB RAM.\n`)
        }
        else {
            ns.tprint("The operation failed.");
            return;
        }
    }
}
