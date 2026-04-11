const User = require('../models/userModel');
const ProviderProfile = require('../models/providerModel');

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'provider') {
            let profile = await ProviderProfile.findByUserId(req.user.id);
            if (!profile) {
                // Auto-create missing profile to heal the account
                await ProviderProfile.create(req.user.id, {});
                profile = await ProviderProfile.findByUserId(req.user.id);
            }
            return res.json({ ...user, profile });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { full_name, phone, location, bio, experience_years, skills, availability } = req.body;
        
        console.log('DEBUG: Updating Profile for User', req.user.id);
        console.log('DEBUG: Received Data:', req.body);
        
        await User.update(req.user.id, { full_name, phone, location });

        const currentRole = (req.user.role || '').toLowerCase();
        console.log('DEBUG: User Role:', currentRole);

        if (currentRole === 'provider') {
            const profile = await ProviderProfile.findByUserId(req.user.id);
            const expYears = experience_years !== undefined ? parseInt(experience_years) : undefined;
            
            console.log('DEBUG: Profile State:', profile ? 'Found' : 'Not Found');
            console.log('DEBUG: Experience to save:', expYears);
            
            if (profile) {
                const updated = await ProviderProfile.update(req.user.id, { 
                    bio, 
                    experience_years: expYears, 
                    skills, 
                    availability 
                });
                console.log('DEBUG: ProviderProfile.update result:', updated);
            } else {
                const created = await ProviderProfile.create(req.user.id, { 
                    bio, 
                    experience_years: expYears, 
                    skills, 
                    availability 
                });
                console.log('DEBUG: ProviderProfile.create result:', created);
            }
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating profile' });
    }
};

const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        
        const avatarUrl = `/uploads/${req.file.filename}`;
        console.log(`Updating avatar for user ${req.user.id} to ${avatarUrl}`);
        await User.update(req.user.id, { avatar: avatarUrl });
        
        res.json({ message: 'Avatar uploaded successfully', avatarUrl });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading avatar' });
    }
};

const getTopProviders = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 5;
        const providers = await ProviderProfile.findTopProviders(limit);
        res.json(providers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching top providers' });
    }
};

const getProviders = async (req, res) => {
    try {
        const providers = await ProviderProfile.findAll(req.query);
        res.json(providers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching providers' });
    }
};

module.exports = { getProfile, updateProfile, uploadAvatar, getTopProviders, getProviders };
