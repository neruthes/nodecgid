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
appletsList.map(function (appletItem) {
    const localEnv = JSON.parse(JSON.stringify(process.env));
    localEnv.cgi_pseudohost = appletItem.pseudohost;
    localEnv.cgi_programid = appletItem.cmdline;
    localEnv.cgi_portfile = `${CONFIG.portFileDir}/${appletItem.pseudohost}`;
    const cmdlineArr = appletItem.cmdline.split(' ');

    spawn(cmdlineArr[0], cmdlineArr.slice(1), {
        env: localEnv
    });

    setTimeout(function () {
        // Read applet daemon port after 567ms
        const appletDaemonPort = fs.readFileSync(localEnv.cgi_portfile).toString().trim();
        proxy.register(appletItem.pseudohost, `http://127.0.0.1:${appletDaemonPort}`);
    }, 567);
});

