import jwt from "jsonwebtoken";
import { ENV_VARIABLES } from "./constants.js";

export const getAccessToken = (id, mail) => {
  const accessToken = jwt.sign(
    { id: id, email: mail },
    ENV_VARIABLES.ACC_JWT_SECRET,
    { expiresIn: "15m" },
  );
  return accessToken;
};

export const getRefreshToken = (id, mail) => {
  const refreshToken = jwt.sign(
    { id: id, email: mail },
    ENV_VARIABLES.REF_JWT_SECRET,
    { expiresIn: "7d" },
  );
  return refreshToken;
};
