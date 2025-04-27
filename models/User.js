import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false }, // <-- ✨ NEW FIELD
    lastViewedMap: {
      type: Map,
      of: Date,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
