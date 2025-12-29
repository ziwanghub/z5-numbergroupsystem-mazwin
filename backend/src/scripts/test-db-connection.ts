
import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://127.0.0.1:27018/z5_mazwin_dev?directConnection=true';

const testConnection = async () => {
    console.log(`Testing connection to: ${MONGO_URI}`);
    try {
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Connection SUCCESS!');

        const collections = await mongoose.connection.db!.listCollections().toArray();
        console.log('📂 Collections found:', collections.map(c => c.name));

        const userCount = await mongoose.connection.db!.collection('users').countDocuments();
        console.log(`👤 Users count: ${userCount}`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Connection FAILED:', error.message);
        process.exit(1);
    }
};

testConnection();
