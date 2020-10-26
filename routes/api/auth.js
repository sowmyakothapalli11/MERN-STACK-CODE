const express =require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const config = require('config');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

router.get('/', auth, async (req, res) => {
    try{
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route POST api/auth
//@desc Authenticate user & get token
//@access Public
router.post(
    '/',
    [
        check('email', 'Pkease include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    async (req, res) => {
    //console.log(req.body);
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const {email, password} = req.body;
    try{
        //See if user exists here one is the data base email and another is body email
        let user = await User.findOne({ email: email }); //making request to the data base to get the user and value stores in user variabel

        if(!user){
            return res.status(400).json({ errors: [{ msg: 'In valid credentials' }] })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'In valid credentials' }] })
        }
        
        //Return jsonwebtoken
        //res.send('User registered');
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload, 
            config.get('jwtSecret'),
            { expiresIn: 360000 },
            (err, token) => {
                if(err) throw err;
                res.json({ token });
            });
    }
    catch(err) {
        console.log(err.message);
        res.status(500).send('Server error')
    }
});


module.exports = router;