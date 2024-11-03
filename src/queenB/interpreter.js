/*******************************************************************************
INTERPRETER.JS
--

Starts scripts on servers using commands issued through .txt files.
Commands are stored in : ./commands/${server_name}.txt
--

Commands are in format: ${actionID}-${threads}
*******************************************************************************/

export async function cmdRead(ns, server, tgt) {

    // Get the command data string
    let command = ns.read(`./commands/${server}.txt`);

    // Cancel the process if the file wasn't found or if the command is empty
    if (!command) {
        ns.print(`No command for server ${server}`);
        return;
    }

    // Log the found command
    ns.print(`Command for server ${server}: ${command}`);

    // Determine the next script to run
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
        default: // Cancel the process 
            ns.print(`A wrong command(${command[0]}) was passed through files`);
            return;
    }

    // Read the threads number from the command
    let thr = Number(command.substring(2,command.length));

    // Cancel the process if the number of processes will lead to an error
    if (!thr) {
        ns.print(`No threads were allowed for server ${server}`);
        return;
    }

    // Start the next script if the process was successful
    ns.print(`Spawning ${next_script} for server ${server}`);
    await ns.spawn(next_script,
        {
            threads: thr,
            spawnDelay: 10
        }, tgt, server);
}
