import io from 'socket.io-client';
import { url } from './api';

export default io(url);
