/*******************************************************************************
GATHERER.JS
--

Spoofs money on a server to increase its available money value.
Reads the command for the next action stored in : ./commands/${server_name}.txt
--

The script's target is provided as args[0], and the server name as args[1].
*******************************************************************************/

import { cmdRead } from "interpreter.js"

/** @param {NS} ns */
export async function main(ns) {
    while (true) {
        await ns.grow(ns.args[0]);
        await cmdRead(ns, ns.args[1], ns.args[0]);
        await ns.sleep(50);
    }
}
