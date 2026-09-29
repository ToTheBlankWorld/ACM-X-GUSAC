// Security control API — used exclusively by the local start.py operator
// console. The server binds to 127.0.0.1 only, so these endpoints are
// unreachable from other machines. No secrets are exposed or logged here.
import { Router } from 'express';
import { getSecurityConfig, setSecurityState, STATES } from '../labState.js';
import { logEvent, getLogs, clearLogs } from '../logger.js';
import { DEMO_XSS_PAYLOAD, XSS_PROOF_TEXT } from '../vuln/xss.js';

const router = Router();

// The controlled demonstration inputs for the operator console.
const DEMO_INPUTS = {
  sqli: {
    field: 'Username field on the NovaCart sign-in page',
    payload: "' OR '1'='1' --",
  },
  xss: {
    field: 'Review text box on any NovaCart product page',
    payload: DEMO_XSS_PAYLOAD,
    proof: XSS_PROOF_TEXT,
  },
};

router.get('/status', (_req, res) => {
  const config = getSecurityConfig();
  res.json({
    sqli: config.sqli,
    xss: config.xss,
    defaults: { sqli: STATES.SECURE, xss: STATES.SECURE },
    demoInputs: DEMO_INPUTS,
    scope: ['localhost', '127.0.0.1'],
  });
});

router.post('/sqli', (req, res) => {
  const { state } = req.body || {};
  if (state !== STATES.SECURE && state !== STATES.VULNERABLE) {
    return res.status(400).json({
      error: 'invalid_state',
      message: "State must be 'secure' or 'vulnerable'.",
    });
  }
  const applied = setSecurityState('sqli', state);
  logEvent(applied === STATES.VULNERABLE ? 'WARNING' : 'INFO',
    applied === STATES.VULNERABLE
      ? 'SQL Injection vulnerability ENABLED by operator'
      : 'SQL Injection protection ENABLED by operator',
    { module: 'sqli', state: applied });
  res.json({ module: 'sqli', state: applied });
});

router.post('/xss', (req, res) => {
  const { state } = req.body || {};
  if (state !== STATES.SECURE && state !== STATES.VULNERABLE) {
    return res.status(400).json({
      error: 'invalid_state',
      message: "State must be 'secure' or 'vulnerable'.",
    });
  }
  const applied = setSecurityState('xss', state);
  logEvent(applied === STATES.VULNERABLE ? 'WARNING' : 'INFO',
    applied === STATES.VULNERABLE
      ? 'XSS vulnerability ENABLED by operator'
      : 'XSS protection ENABLED by operator',
    { module: 'xss', state: applied });
  res.json({ module: 'xss', state: applied });
});

router.get('/logs', (req, res) => {
  res.json({ logs: getLogs(req.query.limit || 12) });
});

router.post('/logs/clear', (_req, res) => {
  clearLogs();
  res.json({ ok: true });
});

export default router;
