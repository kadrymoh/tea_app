import { io } from "socket.io-client";
import { API_CONFIG, getApiUrl } from '../config/api.config';

export const socket = io(API_CONFIG.SOCKET_URL);
