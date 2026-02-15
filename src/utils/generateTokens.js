import jwt from "jsonwebtoken";

export const getAccessToken = (id, mail) => {
  const accessToken = jwt.sign(
    { id: id, email: mail },
    process.env.ACC_JWT_SECRET,
    { expiresIn: "1m" },
  );
  return accessToken;
};

export const getRefreshToken = (id, mail) => {
  const refreshToken = jwt.sign(
    { id: id, email: mail },
    process.env.REF_JWT_SECRET,
    { expiresIn: "7d" },
  );
  return refreshToken;
};
