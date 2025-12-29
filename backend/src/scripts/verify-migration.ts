
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const verify = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined");
        }

        await mongoose.connect(process.env.MONGO_URI);

        // Fetch one user
        const user = await User.findOne({});

        if (user) {
            const userObj = user.toObject();
            // Censor password
            if (userObj.password) userObj.password = "[REDACTED]";

            console.log("----- USER DOCUMENT DUMP -----");
            console.log(JSON.stringify(userObj, null, 2));
            console.log("------------------------------");

            if (userObj.ownerId) {
                console.log("✅ VERIFICATION PASSED: ownerId exists.");
            } else {
                console.log("❌ VERIFICATION FAILED: ownerId is missing.");
            }
        } else {
            console.log("No users found in the database.");
        }

        process.exit(0);

    } catch (error) {
        console.error("Verification Error:", error);
        process.exit(1);
    }
};

verify();
