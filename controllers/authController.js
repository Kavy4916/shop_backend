import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/user.js";
import Token from "../models/token.js";


const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || username.length > 50 || password.length > 20) {
    return res
      .status(400)
      .json({ message: "Please provide correct username or password" });
  }
  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Please provide correct username or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Please provide correct username or password"});
    }
    await Token.deleteMany({$or: [{username}, { userId: user._id}]}); // Clean up old tokens
    const newToken = new Token({
      username,
      userId: user._id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day expiration
    });
    const token = await newToken.save(); // Save the new token in the database

    // Create access token
    const accessToken = jwt.sign(
      { tokenId: token._id, userId: token.userId, username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "5m" }
    );
    // Create refresh token
    const refreshToken = jwt.sign(
      { tokenId: token._id, userId: token.userId, username },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );
    // Set refresh token in cookies
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    // Send access token in response
    res.status(200).json({
      token: accessToken,
      message: "Login successful",
      username,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};


const refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(403);

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const { tokenId, userId, username } = decoded;

    // Query the refresh token
    const refreshToken = await Token.findOne({
      _id: tokenId,
      username,
      userId,
      expiresAt: { $gt: new Date() },
    });

    // If no valid token, delete it
    if (!refreshToken) {
      await Token.deleteMany({ $or: [{ _id: tokenId }, { userId }, { username }] });
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token" });
    }

    // Token is valid → Issue new access token
    const accessToken = jwt.sign(
      { tokenId, userId, username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "5m" }
    );

    res.status(200).json({
      token: accessToken,
      username,
      message: "Access token refreshed successfully",
    });
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      try {
        const decoded = jwt.decode(token);
        const _id = decoded?.tokenId;
        const userId = decoded?.userId;
        const username = decoded?.username;
        if (_id || userId || username) {
          await Token.deleteMany({ $or: [{ _id }, { userId }, { username }] });
        }
        res.status(403).json({ message: "Invalid or expired refresh token" });
      } catch (_) {
        console.error("Error refreshing token:", error);
        res.status(500).json({ message: "Server side error" });
      }
    }
    console.error("Error refreshing token:", error);
    res.status(500).json({ message: "Server side error" });
  }
};

const logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  const authHeader = req.headers["authorization"];
  const accessToken = authHeader?.split(" ")[1];

  const token = refreshToken || accessToken;

  if (!token) {
    return res.sendStatus(204); // No token present — considered logged out
  }

  // Helper to verify with a given secret
  const verifyWith = (secret) => {
    try {
      return jwt.verify(token, secret);
    } catch {
      return null;
    }
  };

  // Try verifying with both secrets
  const decoded =
    verifyWith(process.env.REFRESH_TOKEN_SECRET) ||
    verifyWith(process.env.ACCESS_TOKEN_SECRET);

  if (decoded) {
    const { tokenId, userId, username } = decoded;
    try {
      await Token.deleteMany({
        $or: [
          tokenId ? { _id: tokenId } : {},
          userId ? { userId } : {},
          username ? { username } : {},
        ],
      });
    } catch (err) {
      console.error("Failed to delete token(s) during logout:", err);
    }
  } else {
    console.warn("Invalid or expired token used for logout");
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
  });

  return res.status(200).json({ message: "Logged out successfully" });
};

export { login, refresh, logout };
