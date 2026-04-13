import mongoose from "mongoose";

const deliveryBoyNotificationSchema = new mongoose.Schema(
  {
    deliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      required: true
    },
    message: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ["info", "warning"],
      default: "info"
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const deliveryBoyNotificationModel = mongoose.model(
  "deliveryBoyNotification",
  deliveryBoyNotificationSchema
);

export default deliveryBoyNotificationModel;
