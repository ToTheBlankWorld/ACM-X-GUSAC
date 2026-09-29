// WebShield Lab — safety middleware.
// 1) antiTargetGuard: rejects any request body that tries to name an
//    attack target (host, ip, connection string, ...). The lab has no
//    "choose a target" concept — everything is fixed to local fictional data.
// 2) securityHeaders: basic hardening headers on API responses.
// 3) notFoundJson: unknown /api routes return JSON — the API exposes no
//    filesystem, shell, or network tools.

const FORBIDDEN_FIELDS = new Set([
  'target', 'targets', 'host', 'hostname', 'ip', 'address',
  'connectionstring', 'connstring', 'dsn', 'dbhost', 'dbhosturl',
  'url', 'uri', 'endpoint', 'server', 'serveraddr',
]);

function scanForForbidden(obj, path = '') {
  if (!obj || typeof obj !== 'object') return null;
  for (const [key, value] of Object.entries(obj)) {
    const fieldPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_FIELDS.has(key.toLowerCase()) && (typeof value === 'string' || typeof value === 'number')) {
      return { fieldPath, value };
    }
    if (typeof value === 'object' && value !== null) {
      const nested = scanForForbidden(value, fieldPath);
      if (nested) return nested;
    }
  }
  return null;
}

export function antiTargetGuard(req, res, next) {
  const hit = scanForForbidden(req.body);
  if (hit) {
    return res.status(400).json({
      error: 'external_target_rejected',
      message: `Safety guard: this lab accepts no external targets. Field "${hit.fieldPath}" is not allowed. All demonstrations run exclusively against the local fictional database.`,
    });
  }
  next();
}

export function securityHeaders(_req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-WebShield-Lab': 'INTENTIONALLY VULNERABLE - EDUCATIONAL LOCAL LAB (localhost only)',
  });
  next();
}

export function notFoundJson(req, res) {
  res.status(404).json({
    error: 'not_found',
    message: `No endpoint ${req.method} ${req.path}. This API exposes no filesystem, shell, or network-scanning tools.`,
  });
}
