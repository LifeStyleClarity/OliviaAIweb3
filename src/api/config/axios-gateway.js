import axios from 'axios';
import { API_GATEWAY_JWT } from './endpoints';

const axiosInstanceAPIGateway = axios.create({
  headers: {
    "Content-Type": "application/json",
    ...(API_GATEWAY_JWT && { "Authorization": `Bearer ${API_GATEWAY_JWT}` })
  },
});

export const logError = (error) => {
  if (import.meta.env.VITE_NODE === 'development') {
    console.error(error);
  }
};


export default axiosInstanceAPIGateway;
