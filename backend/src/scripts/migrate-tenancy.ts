
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Recipe from '../models/Recipe';

dotenv.config();

const migrateTenancy = async () => {
    try {
        console.log("🚀 Starting Multi-Tenant Migration...");

        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to Database");

        // 1. Migrate USERS
        // Strategy: All existing users become their own 'Owner' (Self-Hosted SaaS)
        const users = await User.find({ ownerId: { $exists: false } });
        console.log(`Found ${users.length} users to migrate.`);

        for (const user of users) {
            user.ownerId = user._id; // Point to self
            user.parentId = user._id; // Point to self
            await user.save();
            console.log(`   - Migrated User: ${user.username}`);
        }

        // 2. Migrate RECIPES
        // Strategy: Recipe.ownerId = Recipe.userId (Since all legacy users are owners)
        const recipes = await Recipe.find({ ownerId: { $exists: false } });
        console.log(`Found ${recipes.length} recipes to migrate.`);

        for (const recipe of recipes) {
            // Find the owner of this recipe
            // Ideally should be recipe.userId, passing ownership to that user
            // But we must assume that user is fully migrated first.
            const user = await User.findById(recipe.userId);
            if (user) {
                // If ownerId is missing (legacy), use user._id (Self-Hosted)
                recipe.ownerId = user.ownerId || user._id;
                await recipe.save();
                console.log(`   - Migrated Recipe: ${recipe.name}`);
            } else {
                console.warn(`   ⚠️ Orphaned Recipe Found: ${recipe._id}`);
            }
        }

        console.log("✅ Migration Complete!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Migration Failed:", error);
        process.exit(1);
    }
};

migrateTenancy();
