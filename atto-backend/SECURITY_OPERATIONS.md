# Security Operations Checklist

## 1) Secret Rotation (Immediate)
- Rotate `AUTH_TOKEN_SECRET` (64+ random chars)
- Rotate `DB_PASSWORD`
- Rotate Kakao secrets
- Restart backend after rotation

Generate secrets example:

```bash
openssl rand -base64 48
```

## 2) HTTPS and Cookie Policy
- Set `NODE_ENV=production`
- Set `FORCE_HTTPS=true`
- Set `AUTH_COOKIE_SECURE=true`
- Set `AUTH_COOKIE_SAME_SITE=lax` (or `none` only when cross-site cookie is required)

This backend now fails to boot in production if secure cookie conditions are unsafe.

## 3) Input Validation
- Login, signup, and profile update now enforce server-side schema validation.
- Invalid input is rejected with `400`.

## 4) Error Message Minimization
- Internal error details are hidden in production by default.
- To debug temporarily, set `EXPOSE_INTERNAL_ERRORS=true` in non-production only.

## 5) Rate Limit (Redis-backed)
- Configure:
  - `RATE_LIMIT_REDIS_REST_URL`
  - `RATE_LIMIT_REDIS_REST_TOKEN`
- When set, auth rate limit uses Redis REST.
- If Redis REST is unavailable, it falls back to in-memory limiter.

## 6) DB Least Privilege
- Use `sql/security-hardening.sql`
- Migrate app DB user to least privilege account (`atto_app`)

## 7) Backup & Audit
- Example daily backup cron:

```bash
0 3 * * * mysqldump -h <db-host> -u <backup-user> -p'<password>' atto_prod | gzip > /var/backups/atto_prod_$(date +\%F).sql.gz
```

- App-level audit logging can be enabled with:
  - `AUDIT_LOG_PATH=/var/log/atto/audit.log`

## 8) Security Scanning
- Dependency scan:

```bash
npm run security:audit
```

- OWASP ZAP baseline (Docker required):

```bash
npm run security:zap:baseline
```
