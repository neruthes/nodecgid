#!/usr/bin/node

const fs = require('fs');
const http = require('http');
const sh = require('child_process').execSync;
const spawn = require('child_process').spawn;



// ====================================================
// Library Functions
// ====================================================
const genProgramIdHash = function (cmdline) {
    return cmdline.split('/').reverse()[0] + '@' + sh(`sha1sum`, {
        input: cmdline
    }).toString().slice(0, 20);
};

// ====================================================
// Runtime Memory
// ====================================================
const subprocessList = [];

// ====================================================
// Daemon Startup
// ====================================================

// Load configuration
let CONFIG = {
    port: 9345,
    portFileDir: `/tmp/.nodecgid_port`
};
const configPath = `/etc/nodecgid/config.json`;
if (fs.existsSync(configPath)) {
    realConfig = fs.readFileSync(configPath);
    Object.keys(realConfig).map(function (keyname) {
        CONFIG[keyname] = realConfig[keyname];
    });
};

// Create runtime directories
fs.mkdirSync(CONFIG.portFileDir, {recursive: true});
sh(`chmod 777 '${CONFIG.portFileDir}'`);

const proxy = require('redbird')({ port: CONFIG.port });



// ====================================================
// Start Applets
// ====================================================
const appletsListJsonPath = `/etc/nodecgid/applets.json`;
if (!fs.existsSync(appletsListJsonPath)) {
    console.log(`[FATAL] Cannot find applets list at '${appletsListJsonPath}'`);
    process.exit(1);
};
const rawList = fs.readFileSync(appletsListJsonPath).toString();
const rawListObj = JSON.parse(rawList);
const appletsList = [];
Object.keys(rawListObj).map(function (x) {
    appletsList.push({
        pseudohost: x,
        cmdline: rawListObj[x]
    });
});
console.log(`[INFO] Starting these applets:`);
console.log(appletsList);
console.log(`-----------------------------------------`);

const startAppletDaemon = function (pseudohost) {
    const appletItem = appletsList.filter(x => x.pseudohost === pseudohost)[0];
    const localEnv = JSON.parse(JSON.stringify(process.env));
    localEnv.cgi_pseudohost = appletItem.pseudohost;
    localEnv.cgi_programid = appletItem.cmdline;
    localEnv.cgi_portfile = `${CONFIG.portFileDir}/${appletItem.pseudohost}`;
    const cmdlineArr = appletItem.cmdline.split(' ');

    const subpr = spawn(cmdlineArr[0], cmdlineArr.slice(1), {
        env: localEnv
    });
    subpr._pseudohost = pseudohost;
    subpr.on('exit', function () {
        // Automatically restart an applet daemons if it crashes
        setTimeout(function () {
            startAppletDaemon(subpr._pseudohost);
        }, 6000);
    });
    subprocessList.push(subpr);

    setTimeout(function () {
        // Read applet daemon port after 567ms
        const appletDaemonPort = fs.readFileSync(localEnv.cgi_portfile).toString().trim();
        proxy.register(appletItem.pseudohost, `http://127.0.0.1:${appletDaemonPort}`);
    }, 567);
};
appletsList.map(function (appletItem) {
    startAppletDaemon(appletItem.pseudohost)
});


// Close gracefully
const cleanExit = function () {
    console.log('killing', subprocessList.length, 'child processes');
    subprocessList.forEach(function(subpr) {
        subpr.kill();
    });
    setTimeout(process.exit, 300);
};
process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
// process.on('SIGKILL', cleanExit); // Why does this cause automatic crash on startup???