import Formula from '../models/Formula';
import User from '../models/User';
import { SYSTEM_FORMULAS } from '../data/seed-formulas';

export const seedFormulas = async () => {
    try {
        console.log('🌱 Starting Formula Seeding...');

        // 0. PURGE DATABASE (Total Reset)
        await Formula.deleteMany({});
        console.log('🧨 Database Purged: All formulas removed.');

        // 1. Find a valid owner (System User or First Admin)
        const systemOwner = await User.findOne().sort({ createdAt: 1 });

        if (!systemOwner) {
            console.warn('⚠️ Seeding Skipped: No users found in database to assign as owner.');
            return;
        }

        console.log(`👤 Assigning system formulas to user: ${(systemOwner as any).email} (${systemOwner._id})`);

        // 2. Iterate and Upsert
        for (const data of SYSTEM_FORMULAS) {
            const { id, displayName, description, tags, status, version, computeKey, inputSpec, outputSpec, guardrails, logic } = data;

            // Construct the version object according to IFormulaVersion interface
            const versionData = {
                version,
                status: status as 'active' | 'draft' | 'deprecated' | 'archived',
                computeKey,
                logic, // Persist logic string
                inputSpec,
                outputSpec,
                guardrails,
                isLocked: true,
                changeNote: 'System Seeded',
                createdAt: new Date(),
                publishedAt: new Date()
            };

            // 3. Upsert Logic using findOneAndUpdate as requested
            // We verify if formula exists to smartly manage versions array (merge/overwrite strategy)
            const existing = await Formula.findOne({ formulaId: id });
            let versions = existing ? existing.versions : [];

            // Remove existing version entry if it matches the seed version (so we can update it)
            versions = versions.filter(v => v.version !== version);
            // Add the seeded version (freshly updated)
            versions.push(versionData as any);

            await Formula.findOneAndUpdate(
                { formulaId: id },
                {
                    formulaId: id,
                    displayName,
                    description,
                    tags,
                    ownerId: systemOwner._id,
                    versions: versions
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        console.log('✅ System Formulas Seeded Successfully');

    } catch (error) {
        console.error('❌ Formula Seeding Failed:', error);
    }
};
