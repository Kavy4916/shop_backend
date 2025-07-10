import jwt from "jsonwebtoken";
import Token from "../models/token.js";

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const { tokenId, userId, username } = decoded;

    // Check if the refresh token corresponding to uid and username is still valid
    const refreshToken = await Token.findOne({
      _id: tokenId,
      userId,
      username,
      expiresAt: { $gt: new Date() },
    });

    if (!refreshToken) {
      await Token.deleteMany({
        $or: [{ _id: tokenId }, { userId }, { username }],
      });
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      });
      return res
        .status(403)
        .json({ message: "Access token invalid. Logged out." });
    }

    // Attach user info to request
    req.username = username;
    req.userId = userId;
    next();
  } catch (err) {
  if (err.name === "JsonWebTokenError") {
    // Try to decode safely just for cleanup
    const decoded = jwt.decode(token);
    const _id = decoded?.tokenId;
    const userId = decoded?.userId;
    const username = decoded?.username;

    if (_id || userId || username) {
      await Token.deleteMany({ $or: [{ _id }, { userId }, { username }] });
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
    });

    return res
      .status(403)
      .json({ message: "Access token is invalid. Logged out." });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Access token expired" });
  }

  console.error("Unexpected error in token verification:", err);
  res.status(500).json({ message: "Token verification failed" });
}
};

export default authenticateToken;
