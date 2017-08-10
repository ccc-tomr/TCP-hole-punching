


var serverPort = 9999;
var clientList = [];
var clientID = 0; //ever growing ID of connecting clients

  process.on('uncaughtException', function (err) {
      console.log(err);
  });

// listening for incoming connections
var server = require('net').createServer(function (socket) {

  clientID += 1;
  var client = {socket:socket, clientID:clientID};
  console.log('S: Somebody new connected...', socket.remoteAddress);

  // After server received all necessary clientinfo, store it
  socket.on('data', function (data) {
    console.log('S: Received data : ', JSON.parse(data));
    socket.write(JSON.stringify( {cmd:'ACK'} ));

    if(JSON.parse(data).cmd === 'clientinfo')
    {
      client.clientinfo = JSON.parse(data).payload;
      client.clientinfo.publicAdress = socket.remoteAddress;
      client.clientinfo.publicPort = socket.remotePort;

      clientList.push(client);

      console.log('S: received clientinfo ', client.clientinfo);
      console.log('S: number of currently connected clients : ', clientList.length);

      if(client.clientinfo.role === 'vsclient'){

        //send vsserver info that a vsclient connected
        var idx = clientList.map(function(el) {return el.clientinfo.role; }).indexOf('vsserver');
        if (idx != -1){
          var cmd = {cmd:'newVSClient',
            payload:{
              clientinfo:client.clientinfo
           }
         };
          clientList[idx].socket.write(JSON.stringify(cmd));
        }
        else {
          console.log('S: currently no vsserver available...')
        }
      }
    }
    else if (JSON.parse(data).cmd === 'getVSClientList') {
      var idx = clientList.map(function(el) {return el.clientinfo.role; }).indexOf('vsclient');
      console.log('S: VSserver requesting vsclients : ', idx);
    }
    else if (JSON.parse(data).cmd === 'NotifyVSClients') {
      var idxVSClient = clientList.map(function(el) {return el.clientinfo.role; }).indexOf('vsclient');
      console.log('S: VSserver ready to be connected with vsclients')
       idxVSServer = clientList.map(function(el) {return el.clientinfo.role; }).indexOf('vsserver');
      var cmd = {cmd:'connectToVSserver',
        payload:{
          clientinfo: clientList[idxVSServer].clientinfo
        }
      }
      clientList[idxVSClient].socket.write(JSON.stringify(cmd));
    }
    else
      console.log('unknown server command : ',  JSON.parse(data).cmd);
  });

  socket.on('end', function(){
    console.log('S: client disconnected. ', socket.remoteAddress);
    // delete client from client list
    var idx = clientList.map(function(el) {return el.clientID; }).indexOf(clientID);
    console.log( 'index to be removed = ', idx);
  });

  socket.on('error', function (err) {
      console.log('S: a client connection closed with err (',err,').');
      socketA = null;
  });
});

server.listen(serverPort, function (err) {
	if(err) return console.log(err);

	console.log('S: Listening on', server.address().address + ':' + server.address().port);
});
