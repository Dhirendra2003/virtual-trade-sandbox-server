import jwt from "jsonwebtoken";
import { ENV_VARIABLES, DURATIONS } from "./constants.js";

export const getAccessToken = (id, mail) => {
  const accessToken = jwt.sign(
    { id: id, email: mail },
    ENV_VARIABLES.ACC_JWT_SECRET,
    { expiresIn: DURATIONS.ACCESS_TOKEN_DURATION },
  );
  return accessToken;
};

export const getRefreshToken = (id, mail) => {
  const refreshToken = jwt.sign(
    { id: id, email: mail },
    ENV_VARIABLES.REF_JWT_SECRET,
    { expiresIn: DURATIONS.REFRESH_TOKEN_DURATION },
  );
  return refreshToken;
};
