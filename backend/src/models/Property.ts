import mongoose, { Document, Model, Schema } from 'mongoose'

interface IAddress {
  line1: string
  city: string
  state: string
  country: string
  zip: string
}

export interface IProperty extends Document {
  organizationId: mongoose.Types.ObjectId
  name: string
  address: IAddress
  totalUnits: number
  createdAt: Date
}

const addressSchema = new Schema<IAddress>(
  {
    line1: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true }
  },
  { _id: false }
)

const propertySchema = new Schema<IProperty>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
    address: { type: addressSchema, required: true },
    totalUnits: { type: Number, default: 0 }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
)

propertySchema.index({ organizationId: 1 })

export const Property: Model<IProperty> =
  mongoose.models.Property || mongoose.model<IProperty>('Property', propertySchema)
