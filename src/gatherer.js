import { cmdRead } from "interpreter.js"

/** @param {NS} ns */
export async function main(ns) {
    while (true) {
        await ns.grow(ns.args[0]);
        cmdRead(ns, ns.args[0]);
    }
}
