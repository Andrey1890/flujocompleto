module.exports = function logger(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      endpoint: req.originalUrl,
      ip: req.ip,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2))
    }));
  });

  next();
};
