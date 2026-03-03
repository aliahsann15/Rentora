import mongoose, { Document, Model, Schema } from 'mongoose'

export type EntityType = 'REQUEST' | 'UNIT' | 'PROPERTY'

export interface IActivityLog extends Document {
  organizationId: mongoose.Types.ObjectId
  entityType: EntityType
  entityId: mongoose.Types.ObjectId
  action: string
  performedBy: mongoose.Types.ObjectId
  metadata?: Record<string, unknown>
  createdAt: Date
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    entityType: { type: String, enum: ['REQUEST', 'UNIT', 'PROPERTY'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
)

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', activityLogSchema)
