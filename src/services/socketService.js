import { io } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.device = null;
    this.producerTransport = null;
    this.consumerTransport = null;
    this.producer = null; // Local Video/Audio
    this.consumers = new Map(); // Remote Video/Audio
  }

  // 1. Connect to Signal Server
  connect(url) {
    this.socket = io(url);
    
    this.socket.on('connect', () => {
      console.log('✅ Connected to Signal Server:', this.socket.id);
    });

    return new Promise((resolve) => {
      if (this.socket.connected) {
        resolve();
      } else {
        this.socket.on('connect', resolve);
      }
    });
  }

  // 2. Join Room & Initialize MediaSoup Device
  async joinRoom(roomId, name, role) {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject('Socket not connected');
      
      this.socket.emit('joinRoom', { roomId, name, role }, async (response) => {
        if (response.error) return reject(response.error);

        try {
          // Load Device with Router RTP Capabilities
          this.device = new mediasoupClient.Device();
          await this.device.load({ routerRtpCapabilities: response.rtpCapabilities });
          
          // Setup Transports (Send & Receive)
          await this.initTransports();
          
          resolve();
        } catch (error) {
          console.error("Device Load Error:", error);
          reject(error);
        }
      });
    });
  }

  // 3. Initialize Send/Recv Transports
  async initTransports() {
    // --- Send Transport ---
    this.producerTransport = await this.createTransport('producer');
    
    this.producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      this.socket.emit('transport-connect', { dtlsParameters, transportId: this.producerTransport.id });
      callback();
    });

    this.producerTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
      this.socket.emit('transport-produce', { 
        kind, rtpParameters, appData, transportId: this.producerTransport.id 
      }, ({ id }) => {
        callback({ id });
      });
    });

    // --- Recv Transport ---
    this.consumerTransport = await this.createTransport('consumer');
    
    this.consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      this.socket.emit('transport-recv-connect', { dtlsParameters, transportId: this.consumerTransport.id });
      callback();
    });
  }

  async createTransport(direction) {
    return new Promise((resolve) => {
      this.socket.emit('createWebRtcTransport', { consumer: direction === 'consumer' }, async (params) => {
        let transport;
        if (direction === 'producer') {
          transport = this.device.createSendTransport(params);
        } else {
          transport = this.device.createRecvTransport(params);
        }
        resolve(transport);
      });
    });
  }

  // 4. Start Local Video (Produce)
  async produce(track) {
    try {
      if (!this.producerTransport) return;
      const producer = await this.producerTransport.produce({ track });
      this.producer = producer;
      return producer;
    } catch (err) {
      console.error("Produce Error:", err);
    }
  }

  // 5. Subscribe to Remote Video (Consume)
  async consume(producerId) {
    return new Promise((resolve) => {
      this.socket.emit('consume', {
        rtpCapabilities: this.device.rtpCapabilities,
        remoteProducerId: producerId,
        serverConsumerTransportId: this.consumerTransport.id,
      }, async (params) => {
        if (params.error) {
          console.error('Consume error:', params.error);
          return resolve(null);
        }

        const consumer = await this.consumerTransport.consume({
          id: params.id,
          producerId: params.producerId,
          kind: params.kind,
          rtpParameters: params.rtpParameters,
        });

        this.consumers.set(consumer.id, consumer);

        // Resume server-side consumer
        this.socket.emit('consumer-resume', { consumerId: consumer.id });

        resolve(consumer);
      });
    });
  }
}

// Export a single instance to be used across the app
export const socketService = new SocketService();