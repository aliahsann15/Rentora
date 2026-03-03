import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IFcmToken extends Document {
  userId: mongoose.Types.ObjectId
  token: string
  device?: string
  createdAt: Date
}

const fcmTokenSchema = new Schema<IFcmToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    device: { type: String }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
)

export const FcmToken: Model<IFcmToken> =
  mongoose.models.FcmToken || mongoose.model<IFcmToken>('FcmToken', fcmTokenSchema)
