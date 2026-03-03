import mongoose, { Document, Model, Schema } from 'mongoose'

export type InviteRole = 'TENANT' | 'VENDOR' | 'LANDLORD'

export interface IInvite extends Document {
  email: string
  role: InviteRole
  organizationId: mongoose.Types.ObjectId
  unitId?: mongoose.Types.ObjectId
  token: string
  expiresAt: Date
  accepted: boolean
  createdAt: Date
}

const inviteSchema = new Schema<IInvite>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['LANDLORD', 'TENANT', 'VENDOR'], required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit' },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    accepted: { type: Boolean, default: false }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
)

inviteSchema.index({ token: 1 })
inviteSchema.index({ email: 1 })

export const Invite: Model<IInvite> = mongoose.models.Invite || mongoose.model<IInvite>('Invite', inviteSchema)
