import io from 'socket.io-client';
import feathers from '@feathersjs/client';
import auth from '@feathersjs/authentication-client';
import localStorage from 'localstorage-memory';

const socket = io('http://localhost:3030');
const app = feathers();

// Set up Socket.io client with the socket
app.configure(feathers.socketio(socket));

// Set up authentication
app.configure(auth({storage: localStorage}));

export default app;
