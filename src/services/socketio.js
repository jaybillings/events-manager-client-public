import io from 'socket.io-client';
import feathers from '@feathersjs/client';

const socket = io('http://localhost:3030');
const app = feathers();

// Set up Socket.io client with the socket
app.configure(feathers.socketio(socket));

export default app;
