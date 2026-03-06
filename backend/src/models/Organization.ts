import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IOrganization extends Document {
  name: string
  companyAddress?: string
  ownerId: mongoose.Types.ObjectId
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  subscriptionStatus?: string
  planType?: string
  unitLimit?: number
  trialEndsAt?: Date
  isActive: boolean
  createdAt: Date
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    companyAddress: { type: String, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    subscriptionStatus: { type: String },
    planType: { type: String },
    unitLimit: { type: Number, default: 0 },
    trialEndsAt: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
)

organizationSchema.index({ ownerId: 1 })
organizationSchema.index({ stripeCustomerId: 1 })

export const Organization: Model<IOrganization> =
  mongoose.models.Organization || mongoose.model<IOrganization>('Organization', organizationSchema)
