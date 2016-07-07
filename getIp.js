var interfaces = require('os').networkInterfaces(),
    interface_addresses = interfaces['en0'],
    targetIp,
    errorMsg;
    
if (interface_addresses) {
    interface_addresses.forEach(function(ip) {
        console.log(ip)
        if (ip.family === 'IPv4' && ip.address !== '127.0.0.1') {
            targetIp = ip.address;
            console.log(targetIp)
        }
    });
} else {
    errorMsg = 'Can not get interface address. Please make sure your specified interface name is avaliable.';
}