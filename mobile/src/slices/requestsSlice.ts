import requestReducer, {
  assignVendor,
  clearFilters,
  clearRequestError,
  createRequest,
  fetchRequests,
  setFilters,
  setSelectedRequest,
  updateStatus
} from './requestSlice'

export {
  assignVendor,
  clearFilters,
  clearRequestError,
  createRequest,
  fetchRequests,
  setFilters,
  setSelectedRequest,
  updateStatus
}

export const createMaintenanceRequest = createRequest

export default requestReducer
