/*******************************************************************************
QUEEN-B.JS
--

Main attack process to take over a network.
Gains access to the maximal amount of available servers and selects a valuable 
target. Writes attack subscripts on every hacked server and launches them.

The Queen Bee gives roles to each of the servers in the hive before ordering
them to perform the necessary tasks to drain money from the targetted server.
--

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
*******************************************************************************/

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

    // Repeat the process for each server
    for (let i = 0; i < servers.length; i++) {
        let server = servers[i];
        
        if (server == "home") {
            continue;
        }

        // Free the available server's RAM
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
        scores.push((max_money * 0.005) / (min_security * 1));
    }

    // Find the most valuable target to attack
    var mvt = targets[scores.indexOf(Math.max(...scores))];

    return mvt;    
}

// Compute the number of threads a server can run at once
function getThreads(ns, server, script) {

    // Get server's object reference
    let serverObj = ns.getServer(server);

    // Home should always have the queen-b.js script, taking RAM
    if (server == "home") {
        var ram = serverObj.maxRam - ns.getScriptRam("queen-b.js");
    }
    else {
        var ram = serverObj.maxRam;
    }
    return Math.floor(ram / ns.getScriptRam(script));
}

// Start attacks on the target server
function attackServer(ns, servers, target, starting_script) {

    // Repeat the process for each server
    for (let i = 0; i < servers.length; i++) {
        let threads = getThreads(ns, servers[i], starting_script);

        if (!threads) {
            continue;
        }

        // Start base script on the server
        ns.exec(starting_script, servers[i], threads, target, servers[i]);
    }
}

// Gives a role to every nuked server
function profileServers(ns, servers) {
    
    // Servers of each role
    var muncher = [];
    var gatherer = [];
    var collector = [];
    
    // Servers data
    var serversCores = [];
    var servers_ = servers;
    var totCores = 0;
    
    // Get the total number of cores available
    for (let i = 0; i < servers.length; i++) {
        let server = servers[i];
        let serverObj = ns.getServer(server);
        
        serversCores.push(serverObj.cpuCores);
        totCores += serversCores[i];
    }
    
    // Cores attributed to each role counters
    let muncherCores = 0;
    let gathererCores = 0;
    let collectorCores = 0;
    
    
    while (muncherCores < Math.ceil(totCores * 0.5)) {
        // Find the best server for muncher role
        let index = serversCores.indexOf(Math.max(...serversCores));
        
        // Add the server to the role
        muncher.push(servers[index]);
        
        // Keep track of the cores attributed to this role
        muncherCores += serversCores[index];
        
        // Remove server from the arrays
        serversCores.splice(index, 1);
        servers_.splice(index, 1);
    }

    while (gathererCores < Math.ceil(totCores * 0.45)) {
        // Find the best server for gatherer role
        let index = serversCores.indexOf(Math.max(...serversCores));

        // Add the server to the role
        gatherer.push(servers[index]);
        
        // Keep track of the cores attributed to this role
        gathererCores += serversCores[index];
        
        // Remove server from the arrays
        serversCores.splice(index, 1);
        servers_.splice(index, 1);
    }
    
    // Collector roles attribution
    collector = servers_;
    collectorCores = totCores - (muncherCores + gathererCores);
    
    // Terminal feedback
    ns.tprint(`\nRoles attribution: \n${muncherCores} muncher Cores
${gathererCores} gatherer Cores\n${collectorCores} collector Cores
With a total of ${totCores} cores\n`);
    
return [muncher, gatherer, collector];
}

// Send a command to a script
function cmdSend(ns, server, value, threads) {
    let str = "0000000000000000000000000" + threads;
    threads = str.substr(str.length - 25);
    let script = `./commands/${server}.txt`;
    // Write the file in home
    ns.write(script, `${value}-${threads}`, "w");

    // Copy the file to target server
    ns.scp(script, server, "home");
}

// Give orders to roles depending on target's state
async function monitorServers(ns, target, muncher, gatherer, collector) {
    
    // Get server's object reference
    let targetObj = ns.getServer(target);

    // Behavior thresholds
    let gathererSOSThr = targetObj.moneyMax * 0.80;
    let gathererSOSAns = targetObj.moneyMax * 0.95;
    
    let collectorSOSThr = targetObj.moneyMax * 0.95;
    let collectorSOSAns = targetObj.moneyMax * 0.70;
    
    let muncherSOSThr = targetObj.minDifficulty * 3;
    let muncherSOSAns = targetObj.minDifficulty * 1;
    
    while (true) {
        targetObj = ns.getServer(target); // Update server state

        // Check munchers' flags
        let muncherSOS = false;
        let muncherAns = false;
        if (targetObj.hackDifficulty >= muncherSOSThr) {
            muncherSOS = true;
        }
        if (targetObj.hackDifficulty <= muncherSOSAns) {
            muncherAns = true;
        }
        
        // Check gatherers' flags
        let gathererSOS = false;
        let gathererAns = false;
        if (targetObj.moneyAvailable <= gathererSOSThr) {
            gathererSOS = true;
        }
        if (targetObj.moneyAvailable >= gathererSOSAns) {
            gathererAns = true;
        }
        
        // Check collectors' flags
        let collectorSOS = false;
        let collectorAns = false;
        if (targetObj.moneyAvailable >= collectorSOSThr) {
            collectorSOS = true;
        }
        if (targetObj.moneyAvailable <= collectorSOSAns) {
            collectorAns = true;
        }

        // SOS logic to help gatherers
        if (gathererSOS) {
            if (collectorAns) {
                for (let i = 0; i < collector.length; i++) {
                    cmdSend(ns, collector[i], 1,
                        getThreads(ns, collector[i], "gatherer.js"));
                }
            }
            if (muncherAns) {
                for (let i = 0; i < muncher.length; i++) {
                    cmdSend(ns, muncher[i], 1,
                        getThreads(ns, muncher[i], "gatherer.js"));
                }
            }
        }

        // SOS logic to help munchers 
        if (muncherSOS) {
            if (collectorAns) {
                for (let i = 0; i < collector.length; i++) {
                    cmdSend(ns, collector[i], 2,
                        getThreads(ns, collector[i], "muncher.js"));
                }
            }
            if (gathererAns) {
                for (let i = 0; i < gatherer.length; i++) {
                    cmdSend(ns, gatherer[i], 2,
                        getThreads(ns, gatherer[i], "muncher.js"));
                }
            }
        }
        
        // SOS logic to help collectors
        if (collectorSOS) {
            if (muncherAns) {
                for (let i = 0; i < muncher.length; i++) {
                    cmdSend(ns, muncher[i], 0,
                        getThreads(ns, muncher[i], "collector.js"));
                }
            }
            if (gathererAns) {
                for (let i = 0; i < gatherer.length; i++) {
                    cmdSend(ns, gatherer[i], 0,
                        getThreads(ns, gatherer[i], "collector.js"));
                }
            }
        }

        // Collector dispatch if no SOS call
        if ((!gathererSOS && !muncherSOS) || (!collectorAns)) {
            for (let i = 0; i < collector.length; i++) {
                cmdSend(ns, collector[i], 0,
                    getThreads(ns, collector[i], "collector.js"));
                }
            }
            
        // Gatherer dispatch if no SOS call
        if ((!collectorSOS && !muncherSOS) || (!gathererAns)) {
            for (let i = 0; i < gatherer.length; i++) {
                cmdSend(ns, gatherer[i], 1,
                    getThreads(ns, gatherer[i], "gatherer.js"));
                }
            }
            
        // Muncher dispatch if no SOS call
        if ((!collectorSOS && !gathererSOS) || (!muncherAns)) {
            for (let i = 0; i < muncher.length; i++) {
                cmdSend(ns, muncher[i], 2,
                    getThreads(ns, muncher[i], "muncher.js"));
            }
        }
        // Wait 1s before looping
        await ns.asleep(1000);
    }
}

/** @param {NS} ns */
export async function main(ns) {

    // Get all servers names
    ns.tprint("Fetching a list of available servers...\n");
    var subNodes = getServers(ns);

    // Log results
    ns.print(`\nFound servers: ${subNodes}\n`);

    // Nuke all available servers
    ns.tprint("Nuking found servers...\n");
    var nukedSubNodes = nukeServers(ns, subNodes);

    // Log results
    ns.print(`\nNuked servers: ${nukedSubNodes}\n`);

    // Write scripts to all nuked servers
    var scripts = ["collector.js", "gatherer.js", "muncher.js",
        "interpreter.js"];
    ns.tprint("Injecting scripts on nuked servers...\n");
    infectServers(ns, nukedSubNodes, scripts);

    // Select the target to attack
    var target = targetServer(ns, nukedSubNodes);
    if (ns.args[0]) {
        target = ns.args[0];
    }
    ns.tprint(`Commencing attack on target: ${target}\n`);
    
    // Start scripts on all nuked servers
    var starting_script = "collector.js";
    ns.tprint("Starting scripts on nuked servers...\n");
    attackServer(ns, nukedSubNodes, target, starting_script);
    
    // Dispatch servers with roles
    var roles = profileServers(ns, nukedSubNodes);

    // Monitor servers
    await monitorServers(ns, target, ...roles);
}
