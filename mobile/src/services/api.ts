// src/services/api.ts

import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://192.168.100.141:5000' // Home IP address of the backend server
})