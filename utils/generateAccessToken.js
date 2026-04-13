import jwt from "jsonwebtoken";


export const generateAccessToken = (userID, role) => {
  return jwt.sign(
    { ID: userID, role: role },
    process.env.SECRET_KEY,
    { expiresIn: "15m" }
  );
};