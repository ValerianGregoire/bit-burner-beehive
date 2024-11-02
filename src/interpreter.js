/*
Reads commands of format: cmdID[1]-t[3]
ex: 1-016
*/
export async function cmdRead(ns, server, tgt) {
    let command = ns.read(`./${server}.txt`);

    if (!command) {
        ns.print(`No command for server ${server}`);
        return;
    }

    ns.print(`Command for server ${server}: ${command}`);

    var next_script = 0;
    switch (Number(command[0])) {
        case 0: // Run "collector.js"
            next_script = "collector.js";
            break;
        case 1: // Run "gatherer.js"
            next_script = "gatherer.js";
            break;
        case 2: // Run "muncher.js"
            next_script = "muncher.js";
            break;
        default:
            ns.print(`A wrong command(${command[0]}) was passed through files`);
            return;
    }
    let thr = Number(command[2]) * 100 + Number(command[3]) * 10 + Number(command[4]);

    if (!thr) {
        ns.print(`Thr = 0 for server ${server}`);
        return;
    }
    ns.print(`Spawning ${next_script} for server ${server}`);
    await ns.spawn(next_script,
        {
            threads: thr,
            spawnDelay: 10
        }, tgt, server);
}
