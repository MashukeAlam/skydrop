const express = require('express');
const {ExpressPeerServer} = require('peer');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

const app = express();
var http = require('http').Server(app);
const cors = require('cors');

var io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:5173"
    }
});

app.use(cors());
app.use('/peerjs', ExpressPeerServer(http, {debug: true}))
class PeerSignalling {
    constructor() {
        this.ips = {}
    }

    addPeer(peer) {

        if (!this.ips[peer.ip]) {
            this.ips[peer.ip] = {};
        }

        this.ips[peer.ip][peer.name] = peer;
        this.reportOthers(peer.ip, peer.id);
    }

    reportOthers(ip, except) {
     
        
        let members_list = [];
        for (let obj in this.ips[ip]) {
            members_list.push(obj);
        }
        io.to(except).emit('room_members_list', {list: members_list});
    }

    removePeer(peer) {
        delete this.ips[peer.ip][peer.id];
        console.log(this.ips);
    }
}

class Peer {
    constructor (ip, id, name) {
        this.ip = ip;
        this.id = id;
        this.name = name;
        this.reportSignallingServer();
    }

    reportSignallingServer() {
        console.log(`# Reporting Signalling Server`);
        pss.addPeer(this);
    }

    destroy() {
        pss.removePeer(this);
    }
}

io.on('connection', (socket) => {
    console.info('socket.io connection', socket.request.connection.remoteAddress);
    const request = socket.request;
    let newIP = null;
    if (request.headers['x-forwarded-for']) {
        newIP = request.headers['x-forwarded-for'].split(/\s*,\s*/)[0];
    } else {
        newIP = request.connection.remoteAddress;
    }
    // IPv4 and IPv6 use different values to refer to localhost
    if (newIP == '::1' || newIP == '::ffff:127.0.0.1') {
        newIP = '127.0.0.1';
    }
    let p;
    socket.on('my_name', data => {
        p = new Peer(newIP, socket.id, data.name);
        socket.join(newIP);
        socket.to(newIP).emit("room_update", {sid: socket.id, name: data.name});
    });

    
    socket.on('disconnect', (socket) => {
        console.info('socket.io disconnection', socket.id);
        // p.destroy();
    });
});



const port = process.env.PORT | 3000;

const pss = new PeerSignalling();

http.listen(port, () => console.info(`Listening on ${port}`));