/*******************************************************************************
SHARER.JS
--

Allocates a server's RAM to allied factions, boosting reputation income rate
*******************************************************************************/

/** @param {NS} ns */
export async function main(ns) {
    while (true) {
        await ns.share();
    }
}
