const fs = require('fs');

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
    localEnv.cgi_pidfile = `${CONFIG.pidFileDir}/${appletItem.pseudohost}`;
    const cmdlineArr = appletItem.cmdline.split(' ');
    if (fs.existsSync(`/proc/${}`))
});