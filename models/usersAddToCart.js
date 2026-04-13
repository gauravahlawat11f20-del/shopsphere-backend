import mongoose from "mongoose";

const dbSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },

  product_id: {
    type: mongoose.Schema.Types.ObjectId,   // ✅ FIX
    required: true,
    ref: "productCreatedByOwner" // the owner product .. mtlab jisne add kiya hai .. means ye product .. official kahan registered hai
  },

  quantity: {
    type: Number,
    required: true
  }
}, { timestamps: true });

dbSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

const usersAddToCartModel = mongoose.model("Cart", dbSchema);

export default usersAddToCartModel;
