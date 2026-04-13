import jwt from "jsonwebtoken";
import blacklistedTokenModel from "../models/BlacklistedTokens.js";

const authMiddlewareForAdmin = async (req, res, next) => {
  try {

    let token;

    // check cookie first
    if (req.cookies?.adminToken) {
      token = req.cookies.adminToken;
    }

    // check authorization header
    else if (req.headers?.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized access: No token"
      });
    }

    const isBlacklisted = await blacklistedTokenModel.findOne({
      ExpiredToken: token
    });

    if (isBlacklisted) {
      return res.status(401).json({
        message: "Token is blacklisted"
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    req.user = decoded;
    req.userId = decoded.ID;
    req.tokenExp = decoded.exp;

    next();

  } catch (error) {
    console.error(error);
    return res.status(401).json({
      message: "Invalid token"
    });
  }
};

export default authMiddlewareForAdmin;
