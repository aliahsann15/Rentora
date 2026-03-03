import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../slices/authSlice'
import userReducer from '../slices/userSlice'
import organizationReducer from '../slices/organizationSlice'
import propertyReducer from '../slices/propertySlice'
import unitReducer from '../slices/unitSlice'
import requestReducer from '../slices/requestSlice'
import vendorReducer from '../slices/vendorSlice'
import uiReducer from '../slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    organization: organizationReducer,
    property: propertyReducer,
    unit: unitReducer,
    request: requestReducer,
    vendor: vendorReducer,
    ui: uiReducer,
    requests: requestReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
