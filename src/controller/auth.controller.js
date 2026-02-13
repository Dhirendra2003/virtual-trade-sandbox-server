// import service file with db operations
// import authService from "../services/auth.service";

const login = (req, res) => {
    try {
        const {email, password} = req.body;
        console.log(email, password);
        res.status(200).json({message: "Login successful"});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Login failed"});
    }
}

export {
    login
}