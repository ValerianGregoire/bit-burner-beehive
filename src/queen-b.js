/*
PROCESS:

- Servers scavenging (pathfinder):
    - Scan sub-nodes
    - Push missing sub-nodes to main list

- Root access (attacker):
    - Hack level ?
    - Open ports ?
    - Backdoor ?

- Scripts laying (infecter):
    - Kill all scripts
    - Write new scripts

- Target finding (strategist):
    - Ignore home/owned_servers
    - Compute the score of each nuked server
    - Formula: (max_money) / (min_security*0.25)
    - The most valuable target (MVT) has the highest score

- Attacks starting

    - Compute the number of threads to start
    - Run muncher.js on the server with target as argument

*/

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
    return subNodes;
}

// Gets root access to servers and returns a list of nuked servers
function nukeServers(ns, servers) {
    var nuked = [];
    var hackLevel = ns.getHackingLevel();

    // Repeat the process for each server
    for (let i = 0; i < servers.length; i++) {
        let server = servers[i];
        let serverObj = ns.getServer(server);

        // Check for root access
        if (serverObj.hasAdminRights) {
            nuked.push(server);
            if (!serverObj.backdoorInstalled) {
                ns.print(`${server} can be backdoored manually`);
            }
            continue;
        }

        // Check for hack level
        if (hackLevel < serverObj.requiredHackingSkill) {
            continue;
        }

        // Open SSH port
        if (ns.fileExists("BruteSSH.exe", "home") && !serverObj.sshPortOpen) {
            ns.brutessh(server);
        }

        // Open FTP port
        if (ns.fileExists("FTPCrack.exe", "home") && !serverObj.ftpPortOpen) {
            ns.ftpcrack(server);
        }

        // Open SQL port
        if (ns.fileExists("SQLInject.exe", "home") && !serverObj.sqlPortOpen) {
            ns.sqlinject(server);
        }

        // Open SMTP port
        if (ns.fileExists("relaySMTP.exe", "home") && !serverObj.smtpPortOpen) {
            ns.relaysmtp(server);
        }

        // Open HTTP port
        if (ns.fileExists("HTTPWorm.exe", "home") && !serverObj.httpPortOpen) {
            ns.httpworm(server);
        }

        // Check for open ports
        if (serverObj.openPortCount >= serverObj.numOpenPortsRequired) {
            ns.nuke(server);
            nuked.push(server);
            continue;
        }
    }
    return nuked;
}

// Write scripts to nuked servers
function infectServers(ns, servers, scripts) {

    // Remove home from infection
    servers = servers.filter(function (e) { return e !== "home" });

    // Repeat the process for each server
    for (let i = 0; i < servers.length; i++) {
        let server = servers[i];
        ns.killall(server);

        // Check for the presence of scripts on server
        for (let j = 0; j < scripts.length; j++) {
            if (ns.fileExists(scripts[j], server)) {
                ns.rm(scripts[j], server);
            }
        }

        // Write scripts to the server
        for (let j = 0; j < scripts.length; j++) {
            ns.scp(scripts[j], server, "home");
        }
    }
}

// Find main server to target and attack it
function targetServer(ns, servers) {

    // Filter out home and owned servers
    let targets = [];
    for (let i = 0; i < servers.length; i++) {
        if (servers[i] == "home" || ns.getServer(servers[i]).purchasedByPlayer) {
            continue;
        }
        targets.push(servers[i]);
    }

    // Compare the max money with the min security level
    let scores = [];
    for (let i = 0; i < targets.length; i++) {
        let target = ns.getServer(targets[i]);
        let max_money = target.moneyMax;
        let min_security = target.minDifficulty;
        scores.push((max_money) / (min_security * 0.25));
    }

    // Find the most valuable target to attack
    var mvt = targets[scores.indexOf(Math.max(...scores))];
    
    // Repeat the process for each server
    let starting_script = "muncher.js";
    for (let i = 0; i < servers.length; i++) {
        let server = servers[i];
        let serverObj = ns.getServer(server);

        // Compute the number of threads to start
        let threads = Math.floor(serverObj.maxRam / ns.getScriptRam(starting_script));

        // Pass the execution of a script in case of errors
        if (!threads || threads == Math.abs(Infinity)) {
            ns.print(`A thread count error was encountered for ${server}`);
            continue;
        }
        
        // Start gatherer.js on the server
        ns.exec(starting_script, server, threads, mvt);
    }
}

/** @param {NS} ns */
export async function main(ns) {

    // Get all servers names
    ns.print("Fetching a list of available servers...\n");
    var subNodes = getServers(ns);

    // Log results
    ns.print(`\nFound servers: ${subNodes}\n`);

    // Nuke all available servers
    ns.print("\nNuking found servers...\n");
    var nukedSubNodes = nukeServers(ns, subNodes);

    // Log results
    ns.print(`\nNuked servers: ${nukedSubNodes}\n`);

    // Write scripts to all nuked servers
    var scripts = ["collector.js", "gatherer.js", "muncher.js",
        "interpreter.js"];
    ns.print("\nInjecting scripts on nuked servers...\n");
    infectServers(ns, nukedSubNodes, scripts);

    // Start scripts on all nuked servers
    ns.print("\nStarting scripts on nuked servers...\n");
    targetServer(ns, nukedSubNodes);

}
