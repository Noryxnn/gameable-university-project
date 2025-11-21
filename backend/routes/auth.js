import express from 'express';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

//Register Route
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        if (!username || !email || !password) {
            return res.status(400).json({message: "Please fill all the fields"})
        }

        const userExists = await User.findOne({emal});
        if (userExists) {
            return res
            .status(400)
            .json({message: "User already exists"})
        }

        const user = await User.create({username, email, password});
        const token = generateToken(user._id);
            res.status(201).json({
                id: user._id,
                username: user.username,
                email: user.email,
                token, 
            })
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

// Login Route
router.post('/Login', async (req, res) => {
    const { email, password } = req.body;
    try{
        if (!email || !password) {
            return res.status(400).json({message: "Please fill all the fields"});
        }
        const user = await User.findOne({email});


        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({message: "Invalid Credentials"});
        }
        const token = generateToken(user._id);
        res.status(200).json({
            id: user._id,
            username: user.username,
            email: user.email,
            token,
        });

    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }

})

// Me 
router.get("/me", protect, async (req, res) => {
    res.status(200).json(req.user);
});

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "100d"})  
}


export default router;