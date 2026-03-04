import mongoose, { Document, Model, Schema } from 'mongoose'

export type UserRole = 'LANDLORD' | 'TENANT' | 'VENDOR'

export interface IUser extends Document {
  name: string
  email: string
  passwordHash: string
  role: UserRole
  organizationId?: mongoose.Types.ObjectId
  phone?: string
  avatar?: string
  pushTokens: string[]
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['LANDLORD', 'TENANT', 'VENDOR'],
      required: true,
      default: 'LANDLORD'
    },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    phone: { type: String },
    avatar: { type: String },
    pushTokens: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date }
  },
  {
    timestamps: true
  }
)

userSchema.index({ organizationId: 1 })
userSchema.index({ role: 1 })

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema)
