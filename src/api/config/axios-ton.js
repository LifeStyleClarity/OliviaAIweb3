import axios from 'axios';
import { API_GATEWAY_JWT } from './endpoints';

const axiosInstanceTonAPI = axios.create({
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_GATEWAY_JWT}`
  },
});


export default axiosInstanceTonAPI;
