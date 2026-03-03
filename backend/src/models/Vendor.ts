import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IVendor extends Document {
  userId: mongoose.Types.ObjectId
  organizationId: mongoose.Types.ObjectId
  services: string[]
  rating?: number
  totalJobs: number
  notes?: string
  isActive: boolean
  createdAt: Date
}

const vendorSchema = new Schema<IVendor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    services: { type: [String], default: [] },
    rating: { type: Number, min: 0, max: 5 },
    totalJobs: { type: Number, default: 0 },
    notes: { type: String },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
)

vendorSchema.index({ organizationId: 1 })
vendorSchema.index({ userId: 1 })

export const Vendor: Model<IVendor> = mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', vendorSchema)
