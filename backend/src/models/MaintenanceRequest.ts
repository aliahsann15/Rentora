import mongoose, { Document, Model, Schema } from 'mongoose'

export type MaintenanceStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'VERIFIED'
export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface IMaintenanceRequest extends Document {
  organizationId: mongoose.Types.ObjectId
  propertyId: mongoose.Types.ObjectId
  unitId: mongoose.Types.ObjectId
  tenantId: mongoose.Types.ObjectId
  vendorId?: mongoose.Types.ObjectId
  title: string
  description: string
  images: string[]
  status: MaintenanceStatus
  urgency: UrgencyLevel
  assignedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const maintenanceRequestSchema = new Schema<IMaintenanceRequest>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    images: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'DONE', 'VERIFIED'],
      default: 'NEW',
      required: true
    },
    urgency: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM', required: true },
    assignedAt: { type: Date },
    completedAt: { type: Date }
  },
  {
    timestamps: true
  }
)

maintenanceRequestSchema.index({ organizationId: 1 })
maintenanceRequestSchema.index({ status: 1 })
maintenanceRequestSchema.index({ vendorId: 1 })
maintenanceRequestSchema.index({ propertyId: 1 })

export const MaintenanceRequest: Model<IMaintenanceRequest> =
  mongoose.models.MaintenanceRequest ||
  mongoose.model<IMaintenanceRequest>('MaintenanceRequest', maintenanceRequestSchema)
