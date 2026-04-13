import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "productCreatedByOwner"
    }
  },
  { timestamps: true }
);

wishlistSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

const wishlistModel = mongoose.model("Wishlist", wishlistSchema);

export default wishlistModel;
