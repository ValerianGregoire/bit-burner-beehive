/*
Reads commands of format: cmdID[1]-t[2]
ex: 1-16
*/
export function cmdRead(ns, tgt) {
    if (!ns.fileExists("queenBcmd.txt")) {
        return;
    }

    let command = ns.read("queenBcmd.txt");
    ns.rm("queenBcmd.txt");

    switch (command[0]) {
        case 0: // Run "collector.js"
            ns.spawn("collector.js",
                {
                    threads: Number(command[2]) * 10 + Number(command[3]),
                    spawnDelay: 16
                }, tgt);
            break;
        case 1: // Run "gatherer.js"
            ns.spawn("gatherer.js",
                {
                    threads: Number(command[2]) * 10 + Number(command[3]),
                    spawnDelay: 16
                }, tgt);
            break;
        case 2: // Run "muncher.js"
            ns.spawn("muncher.js",
                {
                    threads: Number(command[2]) * 10 + Number(command[3]),
                    spawnDelay: 16
                }, tgt);
            break;
        default:
            ns.print(`A wrong command(${command[0]}) was passed through queenBcmd.txt`);
    }
}
