export const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.name}: ${err.message}`);
    // We can handle specific error types here (e.g., JWT errors, DB errors)
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
