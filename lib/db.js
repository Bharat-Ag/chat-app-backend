import mongoose from "mongoose";

export const connectDb = async () => {
    mongoose.connection.on('connected', () => console.log('db connected'))
    mongoose.connection.on('error', (err) => console.error('db error:', err.message))

    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`)
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message)
        process.exit(1) // fail loudly at startup instead of buffering queries until they time out
    }
}