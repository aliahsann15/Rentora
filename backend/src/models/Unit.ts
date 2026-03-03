import mongoose, { Document, Model, Schema } from 'mongoose'

export type UnitStatus = 'OCCUPIED' | 'VACANT'

export interface IUnit extends Document {
  organizationId: mongoose.Types.ObjectId
  propertyId: mongoose.Types.ObjectId
  unitNumber: string
  tenantId?: mongoose.Types.ObjectId
  rentAmount?: number
  leaseStart?: Date
  leaseEnd?: Date
  status: UnitStatus
  createdAt: Date
}

const unitSchema = new Schema<IUnit>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    unitNumber: { type: String, required: true, trim: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'User' },
    rentAmount: { type: Number },
    leaseStart: { type: Date },
    leaseEnd: { type: Date },
    status: { type: String, enum: ['OCCUPIED', 'VACANT'], default: 'VACANT', required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
)

unitSchema.index({ organizationId: 1 })
unitSchema.index({ propertyId: 1 })
unitSchema.index({ tenantId: 1 })

export const Unit: Model<IUnit> = mongoose.models.Unit || mongoose.model<IUnit>('Unit', unitSchema)
