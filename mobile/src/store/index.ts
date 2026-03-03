import { combineReducers, configureStore } from '@reduxjs/toolkit'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore
} from 'redux-persist'
import authReducer from '../slices/authSlice'
import userReducer from '../slices/userSlice'
import organizationReducer from '../slices/organizationSlice'
import propertyReducer from '../slices/propertySlice'
import unitReducer from '../slices/unitSlice'
import requestReducer from '../slices/requestSlice'
import vendorReducer from '../slices/vendorSlice'
import uiReducer from '../slices/uiSlice'

const storage = AsyncStorage

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user']
}

const userPersistConfig = {
  key: 'user',
  storage
}

const organizationPersistConfig = {
  key: 'organization',
  storage
}

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  user: persistReducer(userPersistConfig, userReducer),
  organization: persistReducer(organizationPersistConfig, organizationReducer),
  property: propertyReducer,
  unit: unitReducer,
  request: requestReducer,
  vendor: vendorReducer,
  ui: uiReducer,
  requests: requestReducer
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    })
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
