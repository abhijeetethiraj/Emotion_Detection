const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/middleware')
 
const {registeruser,loginUser} = require('../controller/Uercontroller')

router.post('/register', registeruser)
router.post('/login', loginUser)


module.exports = router