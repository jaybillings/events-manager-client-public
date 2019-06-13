import io from 'socket.io-client';
import feathers from '@feathersjs/client';
import auth from '@feathersjs/authentication-client';

const socket = io(`http://${process.env.REACT_APP_SERVER_URL}`);

const app = feathers();

// Set up Socket.io client with the socket
app.configure(feathers.socketio(socket));

// Set up authentication
app.configure(auth({storage: window.localStorage}));

export default app;
