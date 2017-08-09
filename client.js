
var vcclientList = [];

if(process.argv.length != 4){
  console.log('usage: clientA <clientName> <vsserver|vsclient>');
  process.exit(1);
}

var addressOfS = '10.1.10.173'; // replace this with the IP of the server running publicserver.js
var portOfS = 9999;
var clientName = process.argv[2];
var role = process.argv[3];
var socketToSBusy = false;

console.log(clientName, ' starting up ...');

socketToS = require('net').createConnection({host : addressOfS, port : portOfS}, function () {
  console.log(clientName, ': connected to S via', socketToS.localAddress, socketToS.localPort);

  // letting local address and port know to S so it can be can be sent to client B:
    socketToS.write(JSON.stringify(
      { cmd: 'clientinfo',
        payload:
        {
          name: clientName,
          role: role,
          privateAddress: socketToS.localAddress,
          privatePort: socketToS.localPort
        }
      }
    ));
});

socketToS.on('data', function (data) {
  console.log(clientName, ': response from S:', JSON.parse(data));

  // messages to be processed only by vsserver
  if (role === 'vsserver') {
    if(JSON.parse(data).cmd === 'newVSClient'){
      var clientinfo = JSON.parse(data).payload.clientinfo;

      console.log(clientName, ': new vsclient connected to S');

      vcclientList.push(clientinfo);
      //try to punch a hole for new vcclient
      VSClientSocket = require('net').createConnection(
        {host : clientinfo.publicAdress, port : clientinfo.publicPort}, function () {
          console.log(clientName, ': trying to punch a hole ...');
      });

      //tell S to notify vsclient that vsserver is ready to connect
      cmd = { cmd:'NotifyVSClients' };
      socketToS.write(JSON.stringify(cmd));
    }
  } else if (role === 'vsclient') {
    // messages to be processed by vsclient
    if (JSON.parse(data).cmd === 'connectToVSserver') {
      socketToVSserver = require('net').createConnection({host : addressOfS, port : portOfS}, function () {
        console.log(clientName, ': connected to ',JSON.parse(data).payload.clientinfo.name
        ,' via', JSON.parse(data).payload.clientinfo.publicAdress, JSON.parse(data).payload.clientinfo.publicPort);

        cmd = { cmd:'VCClientConnected' };
        socketToVSserver.write(JSON.stringify(cmd));

      });
    }
  }
});

socketToS.on('end', function() {
  console.log(clientName, ': server disconnected.');
});

socketToS.on('error', function (err) {
    console.log(clientName, ': connection closed with err:', err.code);
});

// vsserver or vsclient ?
if( role === 'vsserver'){
  console.log(clientName, ': running as a vsserver');
}
else if( role === 'vsclient'){
  console.log(clientName, ': running as a vsclient');
}
else {
  console.log(clientName, ': unkown role, quitting ...');
  process.exit(1);
}