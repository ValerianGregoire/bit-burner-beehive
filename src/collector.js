import { cmdRead } from "interpreter.js"

/** @param {NS} ns */
export async function main(ns) {
    while (true) {
        await ns.hack(ns.args[0]);
        cmdRead(ns, ns.args[0]);
    }
}
