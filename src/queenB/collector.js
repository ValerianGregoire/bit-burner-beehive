import { cmdRead } from "interpreter.js"

/** @param {NS} ns */
export async function main(ns) {
    while (true) {
        await ns.hack(ns.args[0]);
        await cmdRead(ns, ns.args[1], ns.args[0]);
        await ns.sleep(50);
    }
}
