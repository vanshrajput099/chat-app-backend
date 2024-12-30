import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            default: Date.now(),
            expires: 60 * 60 * 24,
        },
        email: {
            type: String,
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

const Token = mongoose.model('Token', tokenSchema);

export default Token;
