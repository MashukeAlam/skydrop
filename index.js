const express = require('express');
const { ExpressPeerServer } = require('peer');
const http = require('http');
const cors = require('cors');
const socketIO = require('socket.io');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure CORS and origins
const allowedOrigins = [
  'https://skydrop.onrender.com',
  'https://skydrop.dreamjim.xyz',
  'http://localhost:5173'
];

// Configure Socket.IO with proper CORS
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Enable CORS for Express
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true
}));

// Set up PeerJS server
app.use('/peerjs', ExpressPeerServer(server, { debug: true }));

/**
 * Class to manage peer signaling and room memberships
 */
class PeerSignallingManager {
  constructor() {
    this.networks = new Map(); // Using Map for better key-value handling
    this.logger = console;
  }

  /**
   * Add a peer to the network
   * @param {Peer} peer - The peer to add
   */
  addPeer(peer) {
    if (!peer || !peer.ip || !peer.id || !peer.name) {
      this.logger.warn('Attempted to add invalid peer:', peer);
      return;
    }

    // Initialize network if it doesn't exist
    if (!this.networks.has(peer.ip)) {
      this.networks.set(peer.ip, new Map());
    }

    // Add peer to network
    const network = this.networks.get(peer.ip);
    network.set(peer.name, peer);
    
    this.logger.info(`Peer ${peer.name} (${peer.id}) added to network ${peer.ip}`);
    this.broadcastNetworkUpdate(peer.ip, peer.id);
  }

  /**
   * Broadcast updated member list to all peers in a network
   * @param {string} networkIp - The network IP
   * @param {string} exceptSocketId - The socket ID to exclude from broadcast
   */
  broadcastNetworkUpdate(networkIp, exceptSocketId) {
    if (!this.networks.has(networkIp)) return;

    const network = this.networks.get(networkIp);
    const membersList = Array.from(network.keys());
    
    io.to(exceptSocketId).emit('room_members_list', { list: membersList });
    this.logger.debug(`Sent updated member list to ${exceptSocketId}:`, membersList);
  }

  /**
   * Remove a peer from the network
   * @param {Peer} peer - The peer to remove
   */
  removePeer(peer) {
    if (!peer || !peer.ip || !peer.name) return;
    
    if (this.networks.has(peer.ip)) {
      const network = this.networks.get(peer.ip);
      network.delete(peer.name);
      
      // Clean up empty networks
      if (network.size === 0) {
        this.networks.delete(peer.ip);
      }
      
      this.logger.info(`Peer ${peer.name} removed from network ${peer.ip}`);
      // Broadcast update to remaining peers
      io.to(peer.ip).emit("room_update", { removed: peer.id, name: peer.name });
    }
  }

  /**
   * Get statistics about current networks and peers
   * @returns {Object} Statistics object
   */
  getStats() {
    const stats = {
      networkCount: this.networks.size,
      networks: {}
    };
    
    this.networks.forEach((peers, ip) => {
      stats.networks[ip] = {
        peerCount: peers.size,
        peers: Array.from(peers.keys())
      };
    });
    
    return stats;
  }
}

/**
 * Class representing a connected peer
 */
class Peer {
  /**
   * Create a new peer
   * @param {string} ip - Network IP address
   * @param {string} id - Socket ID
   * @param {string} name - Peer display name
   */
  constructor(ip, id, name) {
    this.ip = ip;
    this.id = id;
    this.name = name;
    this.joinedAt = new Date();
    this.registerWithSignallingServer();
  }

  /**
   * Register this peer with the signalling server
   */
  registerWithSignallingServer() {
    console.log(`Registering peer: ${this.name} (${this.id}) on network ${this.ip}`);
    peerManager.addPeer(this);
  }

  /**
   * Destroy this peer (when disconnected)
   */
  destroy() {
    peerManager.removePeer(this);
  }
}

// Initialize peer signalling manager
const peerManager = new PeerSignallingManager();

// Socket.IO connection handler
io.on('connection', (socket) => {
  // Extract client's IP address
  const clientIp = getClientIpAddress(socket.request);
  console.info(`New connection from ${clientIp} (${socket.id})`);
  
  let currentPeer = null;

  // Handle peer registration
  socket.on('my_name', data => {
    if (!data.name) {
      socket.emit('error', { message: 'Name is required' });
      return;
    }

    // Create and store peer
    currentPeer = new Peer(clientIp, socket.id, data.name);
    
    // Join room based on IP (network)
    socket.join(clientIp);
    
    // Notify other peers in the same network
    socket.to(clientIp).emit("room_update", { 
      sid: socket.id, 
      name: data.name, 
      action: 'joined' 
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.info(`Client disconnected: ${socket.id}`);
    if (currentPeer) {
        console.log(`Destroying peer: ${currentPeer.name} (${currentPeer.id}) on network ${currentPeer.ip}`);
        
      currentPeer.destroy();
      currentPeer = null;
    }
  });

  // Add any custom event handlers here
  socket.on('ping', () => {
    socket.emit('pong', { time: Date.now() });
  });
});

/**
 * Extract client IP address from request
 * @param {Object} request - HTTP request object
 * @returns {string} Client IP address
 */
function getClientIpAddress(request) {
  let clientIp;
  
  // Check for forwarded IP (when behind proxy)
  if (request.headers['x-forwarded-for']) {
    clientIp = request.headers['x-forwarded-for'].split(/\s*,\s*/)[0];
  } else {
    clientIp = request.connection.remoteAddress;
  }
  
  // Normalize localhost addresses
  if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
    clientIp = '127.0.0.1';
  }
  
  return clientIp;
}

// Add basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    networks: peerManager.networks.size
  });
});

// Configure port
const PORT = process.env.PORT || 3000;

// Start server
server.listen(PORT, () => {
  console.info(`SnapDrop clone server running on port ${PORT}`);
  console.info(`PeerJS server available at /peerjs`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.info('Server closed');
    process.exit(0);
  });
});