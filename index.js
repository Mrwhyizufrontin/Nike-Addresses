global.log = require('./utils/log');
const fs = require('fs');
const add = require('./utils/add');
global.request = require('request');


log(`Nike-Addresses V2`, "debug");
log(`Developed by @_zruss_`, "log");


// configure proxy file. thanks to @hunter_bdm for the function 😗 I was too lazy to make
const proxyInput = fs.readFileSync("./config/proxies.txt").toString().split('\n');
const proxyList = [];
for (var p = 0; p < proxyInput.length; p++) {
    proxyInput[p] = proxyInput[p].replace('\r', '').replace('\n', '');
    if (proxyInput[p] !== '')
        proxyList.push(proxyInput[p]);
}
global.proxies = proxyList;
log(`Loaded Proxy Configuration`, "success");


const accountInput = fs.readFileSync("./config/accounts.txt").toString().split('\n');
const accountList = [];
for (var a = 0; a < accountInput.length; a++) {
    accountInput[a] = accountInput[a].replace('\r', '').replace('\n', '');
    if (accountInput[a] !== '')
        accountList.push(accountInput[a]);
}
global.accounts = accountList;
log(`Loaded Account Configuration`, "success");

global.profile = JSON.parse(fs.readFileSync('./config/profile.json', 'utf8'));
log(`Loaded Profile Configuration`, "success");

function start(accounts) {
    for (var i = 0; i < accounts.length; i++) {
        let req = request.defaults({
            jar: request.jar(),
            gzip: true
        });
        add.Login(accounts[i], req);
    }
}

start(accounts);
