/*
PROCESS:

- Servers scavenging (pathfinder):
    - Scan sub-nodes
    - Push missing sub-nodes to main list

- Root access (infiltrator):
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

- Attacks starting (warlord):
    - Compute the number of threads to start
    - Run muncher.js on the server with target as argument

- Roles planification (profiler):
    - 50% of total cores weaken
    - 35% of total cores grow
    - 15% of total cores hack
    - Set roles for servers

- Attacks monitoring (dispatcher):
    - Monitor target state
    - Make thresholds for SOS calls
    - Make thresholds for reaction to SOS calls 
    - Reposition roles if thresholds are reached
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
function infectServers(ns, servers, script) {

    // Repeat the process for each server
    for (let i = 0; i < servers.length; i++) {
        let server = servers[i];
        
        if (server == "home") {
            continue;
        }
        ns.killall(server);

        // Check for the presence of scripts on server
        if (ns.fileExists(script, server)) {
            ns.rm(script, server);
        }

        // Write scripts to the server
        ns.scp(script, server, "home");
    }
}

// Compute the number of threads a server can run at once
function getThreads(ns, server, script) {
    let serverObj = ns.getServer(server);
    let ram = 0;
    if (server == "home") {
        ram = serverObj.maxRam - ns.getScriptRam("queen-b.js");
    }
    else {
        ram = serverObj.maxRam;
    }
    let val = Math.floor(ram / ns.getScriptRam(script));
    return val;
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

    // Infect servers with the sharer script
    let script = "sharer.js";
    infectServers(ns, nukedSubNodes, script);
    
    // Start scripts on all nuked servers
    for (let i = 0; i < nukedSubNodes.length; i++) {
        let server = nukedSubNodes[i];
        let thr = getThreads(ns, server, script);

        if (!thr) {
            continue;
        }
        ns.exec(script, server, thr);
    }
}