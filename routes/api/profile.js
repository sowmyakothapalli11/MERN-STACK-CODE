const express =require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');

const { check, validationResult } = require('express-validator');

//@router Get api/profile/me
//@desc Get current user profile
//@access Private

router.get('/me', auth, async (req, res) => {
    try{
        const profile = await Profile.findOne({ user: req.user.id }).populate('user',['name', 'avatar']);

        if(!profile){
            return res.status(400).json({ msg : 'there is no profile for this user' });
        }

        res.json(profile);

    } catch(err){
        console.log("in catch");
        res.status(500).send(' Error');
    }

});

//@router Post api/profile
//@desc create and update user profile
//@access Private

router.post('/', [auth, [ 
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty(),
 ]
], 
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;

    //Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if(skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    //Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try{
        let profile = await Profile.findOne({ user: req.user.id });

        //console.log("profile is")
        if(profile) {
            //Update
            //console.log("profile is there")
            
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id }, 
                { $set: profileFields }, 
                { new: true }
            );
            
            return res.json(profile);
        }

        //create

        //console.log("to create the profile")
        profile =  new Profile(profileFields);

        await profile.save();

        res.json(profile);

    } catch(err){
        console.error(err.message);
        res.status(500).send('in catch');
    }

});


//@router Get api/profile
//@desc Get all profile
//@access Public

router.get('/', async (req, res) => {
    try{
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


//@router Get api/profile/user/:user_id
//@desc Get profile by user Id
//@access Public

router.get('/user/:user_id', async (req, res) => {
    try{
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
        
        if(!profile){
            return res.status(400).json({ msg: 'profile not found' });
        }
        res.json(profile);
    } catch(err){
        console.error(err.message);
        if(err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'profile not found' });
        }
        res.status(400).json({ msg: 'profile not found' });
        //res.status(500).send('Server Error');
    }
});

//@router Delete api/profile
//@desc Delete profile, user, posts
//@access Private

router.delete('/', auth, async (req, res) => {
    try{
        // Remove users posts

        await Post.deleteMany({ user: req.user.id })

        //Remove Profile
        await Profile.findOneAndRemove({ user: req.user.id });

        //Remove User
        await User.findOneAndRemove({ _id: req.user.id });


        res.json({msg : "user removed"});
    } catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@router Put api/profile/Experience
//@desc Add profile Experience
//@access Private

router.put('/experience', 
[
    auth,
    [
        check('title', 'Title is require').not().isEmpty(),
        check('company', 'Company is require').not().isEmpty(),
        check('from', 'From date is require').not().isEmpty()
    ]
],
async (req, res) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try{
        const profile = await Profile.findOne({ user: req.user.id});
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile)
    } catch (err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }

}

);

//@router Delete api/profile/experience/exp_id
//@desc Delete Experience from profile
//@access Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try{
        const profile = await Profile.findOne({ user: req.user.id});
        
        //Get the remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch(err){
        console.error(err.message)
        res.status(500).send('Server Error');
    }
});


//@router Put api/profile/Education
//@desc Add profile Education
//@access Private

router.put('/education', 
[
    auth,
    [
        check('school', 'School is require').not().isEmpty(),
        check('degree', 'Degree is require').not().isEmpty(),
        check('fieldofstudy', 'Field of study is require').not().isEmpty(),
        check('from', 'From date is require').not().isEmpty()
    ]
],
async (req, res) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try{
        const profile = await Profile.findOne({ user: req.user.id});
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile)
    } catch (err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }

}

);

//@router Delete api/profile/Education/edu_id
//@desc Delete Education from profile
//@access Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try{
        const profile = await Profile.findOne({ user: req.user.id});
        
        //Get the remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch(err){
        console.error(err.message)
        res.status(500).send('Server Error');
    }
});

//@router Get api/profile/github/:username
//@desc Get user repos from Github
//@access Public

router.get('/github/:username', (req, res) => {
    try{
        const options = {
            uri: 'https://api.github.com/users/+${req.params.username}+/repos?per_page=5&sort=created:asc&client_id=${config.get("githubClientId")}&client_secret=${config.get(githubSecret)}',
            method: 'GET',
            headers: {'user-agent' : 'node.js'}
        };
        request(options, (error, response, body) => {
            if(error) console.error(error);

            if(response.statusCode !== 200) {
                return res.status(404).json({ msg: 'No Github profile found'})
            }

            res.json(JSON.parse(body));

        });
    } catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



module.exports = router;