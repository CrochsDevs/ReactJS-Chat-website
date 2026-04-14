import express from 'express';

const router = express.Router();

// Test route - para malaman kung gumagana ang SSO routes
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: "SSO routes are working!",
        timestamp: new Date().toISOString()
    });
});

// Verify route - simpleng version muna
router.get('/verify', (req, res) => {
    const token = req.cookies?.bechat_sso;
    res.json({ 
        authenticated: !!token, 
        message: token ? "Token found" : "No token provided",
        hasCookie: !!token
    });
});

// Login route - simpleng version muna
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    res.json({ 
        success: false, 
        message: "SSO login not fully implemented yet. Please use /api/auth/login",
        hint: "Use regular auth endpoint for now"
    });
});

// Logout route
router.post('/logout', (req, res) => {
    res.clearCookie('bechat_sso');
    res.json({ success: true, message: "Logged out" });
});

export default router;