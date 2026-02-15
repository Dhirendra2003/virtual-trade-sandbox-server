const errorHandler = (err, req, resp, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "internal server error";
  err.message = err.message || "internal server error";
  return resp
    .status(err.statusCode)
    .json({ message: err.message, status: err.status, success: false });
};
export default errorHandler;
