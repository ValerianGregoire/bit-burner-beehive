/*
Reads commands of format: cmdID[1]-t[2]
ex: 1-16
*/
export function cmdRead(ns, tgt) {
    if (!ns.fileExists("queenBcmd.txt")) {
        return;
    }

    let command = ns.read("queenBcmd.txt");
    var next_script = 0;
    switch (command[0]) {
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
            ns.print(`A wrong command(${command[0]}) was passed through queenBcmd.txt`);
        }
    ns.spawn(next_script,
        {
            threads: Number(command[2]) * 10 + Number(command[3]),
            spawnDelay: 16
        }, tgt);
}
