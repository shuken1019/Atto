import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

dotenv.config();

// 1. 앱을 먼저 생성합니다! (이게 위로 와야 에러가 안 납니다)
const app = express(); 
const port = Number(process.env.PORT ?? 4000);
const host = String(process.env.HOST ?? "0.0.0.0");
const IS_PROD = String(process.env.NODE_ENV ?? "").toLowerCase() === "production";
const FORCE_HTTPS = String(process.env.FORCE_HTTPS ?? (IS_PROD ? "true" : "false")).toLowerCase() === "true";
const AUTH_TOKEN_SECRET = String(process.env.AUTH_TOKEN_SECRET ?? "").trim();
const AUTH_TOKEN_TTL_SEC = Number(process.env.AUTH_TOKEN_TTL_SEC ?? 60 * 60 * 24 * 7);
const AUTH_COOKIE_NAME = String(process.env.AUTH_COOKIE_NAME ?? "atto_auth");
const COOKIE_SECURE = String(process.env.AUTH_COOKIE_SECURE ?? (IS_PROD ? "true" : "false")).toLowerCase() === "true";
const COOKIE_SAME_SITE = String(process.env.AUTH_COOKIE_SAME_SITE ?? (IS_PROD ? "lax" : "lax")).toLowerCase();
const EXPOSE_INTERNAL_ERRORS = String(process.env.EXPOSE_INTERNAL_ERRORS ?? "false").toLowerCase() === "true";
const AUDIT_LOG_PATH = String(process.env.AUDIT_LOG_PATH ?? "").trim();
const RATE_LIMIT_REDIS_REST_URL = String(process.env.RATE_LIMIT_REDIS_REST_URL ?? "").trim().replace(/\/+$/, "");
const RATE_LIMIT_REDIS_REST_TOKEN = String(process.env.RATE_LIMIT_REDIS_REST_TOKEN ?? "").trim();
const RATE_LIMIT_USE_REDIS = Boolean(RATE_LIMIT_REDIS_REST_URL && RATE_LIMIT_REDIS_REST_TOKEN);
const DB_HOST = String(process.env.DB_HOST ?? "127.0.0.1").trim();
const DB_PORT = Number(process.env.DB_PORT ?? 3306);
const DB_USER = String(process.env.DB_USER ?? "atto_app").trim();
const DB_PASSWORD = String(process.env.DB_PASSWORD ?? "");
const DB_NAME = String(process.env.DB_NAME ?? "atto").trim();
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? `${FORCE_HTTPS ? "https" : "http"}://3.37.232.202:${port}`;

if (!AUTH_TOKEN_SECRET || AUTH_TOKEN_SECRET.length < 32) {
  throw new Error("AUTH_TOKEN_SECRET must be set to at least 32 characters.");
}
if (IS_PROD && !COOKIE_SECURE) {
  throw new Error("AUTH_COOKIE_SECURE must be true in production.");
}
if (!["lax", "strict", "none"].includes(COOKIE_SAME_SITE)) {
  throw new Error("AUTH_COOKIE_SAME_SITE must be one of: lax, strict, none.");
}
if (COOKIE_SAME_SITE === "none" && !COOKIE_SECURE) {
  throw new Error("sameSite=none requires AUTH_COOKIE_SECURE=true.");
}
if (IS_PROD && (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME)) {
  throw new Error("DB_HOST/DB_USER/DB_PASSWORD/DB_NAME are required in production.");
}

// 2. DB 연결 정보 (비밀번호 확인 필수!)
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// 3. CORS 설정 (배열/콤마 구분, http/https 변형 허용)
const rawOrigins = [
  process.env.CORS_ORIGIN,
  process.env.CORS_ORIGINS,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://3.37.232.202',
  'https://3.37.232.202',
];

const allowedOrigins = rawOrigins
  .filter(Boolean)
  .flatMap((value) => String(value).split(','))
  .map((value) => value.trim())
  .filter((value) => value.length > 0);

const allowAllOrigins = allowedOrigins.length === 0 || allowedOrigins.includes('*');

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // same-origin or server-to-server
  if (allowAllOrigins) return true;

  const normalize = (value) => {
    try {
      const withProtocol = value.startsWith('http') ? value : `https://${value}`;
      const url = new URL(withProtocol);
      return `${url.protocol}//${url.hostname}`; // ignore port when matching
    } catch {
      return value;
    }
  };

  const normalizedOrigin = normalize(origin);

  return allowedOrigins.some((allowed) => {
    if (allowed === '*') return true;
    const normalizedAllowed = normalize(allowed);
    return normalizedAllowed === normalizedOrigin;
  });
};

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.set("trust proxy", 1);

if (FORCE_HTTPS) {
  app.use((req, res, next) => {
    const xfProto = String(req.headers["x-forwarded-proto"] ?? "").toLowerCase();
    const isHttps = req.secure || xfProto === "https";
    if (!isHttps) {
      const targetHost = String(req.headers.host ?? "");
      return res.redirect(308, `https://${targetHost}${req.originalUrl}`);
    }
    return next();
  });
}

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  if (IS_PROD) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// --- 이 아래부터는 기존의 CATEGORY_ID_FALLBACK 등 로직을 그대로 두시면 됩니다 ---
const CATEGORY_ID_FALLBACK = {
  outer: 1,
  top: 2,
  bottom: 3,
  acc: 4,
};

const PRODUCT_STATUS = new Set(["ON_SALE", "SOLD_OUT", "HIDDEN"]);
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const BANNER_JSON_PATH = path.join(UPLOADS_DIR, "banner-settings.json");
const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const toSafeErrorBody = (message, error) => {
  if (EXPOSE_INTERNAL_ERRORS || !IS_PROD) {
    return { ok: false, message, error: String(error?.message ?? error) };
  }
  return { ok: false, message };
};

const writeAuditLog = async (payload) => {
  if (!AUDIT_LOG_PATH) return;
  const line = `${JSON.stringify({ ts: new Date().toISOString(), ...payload })}\n`;
  try {
    await fs.appendFile(AUDIT_LOG_PATH, line, "utf8");
  } catch {
    // ignore audit log failures
  }
};

app.use((req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    const pathName = String(req.path ?? "");
    const method = String(req.method ?? "").toUpperCase();
    const shouldLog = pathName.startsWith("/api/auth/") || pathName.startsWith("/api/admin/");
    if (!shouldLog) return;
    void writeAuditLog({
      method,
      path: pathName,
      status: res.statusCode,
      ip: String(req.ip ?? ""),
      ua: String(req.headers["user-agent"] ?? ""),
      ms: Date.now() - started,
    });
  });
  next();
});

const parseCookies = (req) => {
  const raw = String(req.headers?.cookie ?? "");
  const out = {};
  if (!raw) return out;
  const pairs = raw.split(";");
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx <= 0) continue;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (!k) continue;
    out[k] = decodeURIComponent(v);
  }
  return out;
};

const createRateLimiter = ({ windowMs, max, keyPrefix }) => {
  const bucket = new Map();

  const updateInMemoryBucket = (key, nowMs) => {
    const current = bucket.get(key);

    if (!current || nowMs > current.resetAt) {
      const resetAt = nowMs + windowMs;
      bucket.set(key, { count: 1, resetAt });
      return { count: 1, resetAt };
    }

    current.count += 1;
    bucket.set(key, current);
    return { count: current.count, resetAt: current.resetAt };
  };

  const redisCommand = async (pathName) => {
    const response = await fetch(`${RATE_LIMIT_REDIS_REST_URL}${pathName}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RATE_LIMIT_REDIS_REST_TOKEN}`,
      },
    });
    if (!response.ok) throw new Error(`redis rest request failed: ${response.status}`);
    return response.json();
  };

  return async (req, res, next) => {
    const ip = String(req.ip ?? req.headers["x-forwarded-for"] ?? "unknown");
    const now = Date.now();
    const key = `${keyPrefix}:${ip}`;

    let count = 0;
    let retryAfterSec = 0;

    if (RATE_LIMIT_USE_REDIS) {
      try {
        const encoded = encodeURIComponent(key);
        const incrResult = await redisCommand(`/incr/${encoded}`);
        count = Number(incrResult?.result ?? 0);

        if (count === 1) {
          await redisCommand(`/expire/${encoded}/${Math.max(1, Math.ceil(windowMs / 1000))}`);
        }

        const ttlResult = await redisCommand(`/ttl/${encoded}`);
        const ttl = Number(ttlResult?.result ?? 0);
        retryAfterSec = ttl > 0 ? ttl : Math.max(1, Math.ceil(windowMs / 1000));
      } catch {
        const local = updateInMemoryBucket(key, now);
        count = local.count;
        retryAfterSec = Math.max(1, Math.ceil((local.resetAt - now) / 1000));
      }
    } else {
      const local = updateInMemoryBucket(key, now);
      count = local.count;
      retryAfterSec = Math.max(1, Math.ceil((local.resetAt - now) / 1000));
    }

    if (count > max) {
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({ ok: false, message: "too many requests" });
    }

    return next();
  };
};

const signupRateLimitWindowMs = toPositiveInt(
  process.env.SIGNUP_RATE_LIMIT_WINDOW_MS,
  IS_PROD ? 60 * 60 * 1000 : 5 * 60 * 1000
);
const signupRateLimitMax = toPositiveInt(
  process.env.SIGNUP_RATE_LIMIT_MAX,
  IS_PROD ? 5 : 50
);

const loginRateLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "auth:login" });
const signupRateLimit = createRateLimiter({
  windowMs: signupRateLimitWindowMs,
  max: signupRateLimitMax,
  keyPrefix: "auth:signup",
});
const kakaoRateLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: "auth:kakao" });

const base64UrlEncode = (value) =>
  Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const base64UrlDecode = (value) => {
  const normalized = String(value ?? "").replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
};

const signAuthToken = (payload) => {
  const header = { alg: "HS256", typ: "ATTO" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", AUTH_TOKEN_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

const verifyAuthToken = (token) => {
  const raw = String(token ?? "").trim();
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", AUTH_TOKEN_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  if (signature !== expectedSignature) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isInteger(Number(payload?.exp)) || Number(payload.exp) < now) return null;
    const userId = Number(payload?.uid);
    const role = String(payload?.role ?? "USER").toUpperCase();
    if (!Number.isInteger(userId) || userId <= 0) return null;
    return {
      userId,
      role,
      iat: Number(payload?.iat ?? 0),
      exp: Number(payload?.exp ?? 0),
    };
  } catch {
    return null;
  }
};

const issueAuthToken = (user) => {
  const userId = Number(user?.userId);
  const role = String(user?.role ?? "USER").toUpperCase();
  const now = Math.floor(Date.now() / 1000);
  return signAuthToken({
    uid: userId,
    role,
    iat: now,
    exp: now + AUTH_TOKEN_TTL_SEC,
  });
};

const extractBearerToken = (req) => {
  const authHeader = String(req.headers?.authorization ?? "").trim();
  if (!authHeader) return "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return "";
  return String(token ?? "").trim();
};

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: "/",
    maxAge: AUTH_TOKEN_TTL_SEC * 1000,
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: "/",
  });
};

const extractAuthToken = (req) => {
  const bearer = extractBearerToken(req);
  if (bearer) return bearer;
  const cookies = parseCookies(req);
  return String(cookies[AUTH_COOKIE_NAME] ?? "").trim();
};

const requireAuth = (req, res, next) => {
  const token = extractAuthToken(req);
  if (!token) {
    return res.status(401).json({ ok: false, message: "auth required" });
  }
  const auth = verifyAuthToken(token);
  if (!auth) {
    return res.status(401).json({ ok: false, message: "invalid or expired token" });
  }
  req.auth = auth;
  return next();
};

const requireAdmin = (req, res, next) => {
  if (!req.auth) {
    return res.status(401).json({ ok: false, message: "auth required" });
  }
  if (String(req.auth.role ?? "").toUpperCase() !== "ADMIN") {
    return res.status(403).json({ ok: false, message: "admin required" });
  }
  return next();
};

const requireSelfOrAdmin = (req, res, next) => {
  if (!req.auth) {
    return res.status(401).json({ ok: false, message: "auth required" });
  }
  const paramUserId = Number(req.params.userId);
  if (!Number.isInteger(paramUserId) || paramUserId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId" });
  }
  if (req.auth.userId !== paramUserId && String(req.auth.role ?? "").toUpperCase() !== "ADMIN") {
    return res.status(403).json({ ok: false, message: "forbidden user scope" });
  }
  return next();
};

const isPublicAdminReadRoute = (req) => {
  if (String(req.method).toUpperCase() !== "GET") return false;
  const p = String(req.path ?? "");
  return p === "/colors" || /^\/products(?:\/\d+)?$/.test(p);
};

const requireAdminForAdminApi = (req, res, next) => {
  if (isPublicAdminReadRoute(req)) {
    return next();
  }
  return requireAuth(req, res, () => requireAdmin(req, res, next));
};

const s3 = process.env.S3_BUCKET
  ? new S3Client({ region: process.env.AWS_REGION || "ap-northeast-2" })
  : null;

const buildS3BaseUrl = () =>
  process.env.S3_BASE_URL ||
  `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION || "ap-northeast-2"}.amazonaws.com`;

const DEFAULT_COLORS = [
  { colorId: 1, name: "Black", code: "#222222" },
  { colorId: 2, name: "Ivory", code: "#efe9de" },
  { colorId: 3, name: "White", code: "#ffffff" },
  { colorId: 4, name: "Gray", code: "#a5a5a5" },
  { colorId: 5, name: "Navy", code: "#1f2c56" },
  { colorId: 6, name: "Charcoal", code: "#3d3d3d" },
  { colorId: 7, name: "Light Gray", code: "#d8d8d8" },
  { colorId: 8, name: "Cream", code: "#f7efd9" },
  { colorId: 9, name: "Beige", code: "#d8c3a5" },
  { colorId: 10, name: "Oatmeal", code: "#c9bba6" },
  { colorId: 11, name: "Camel", code: "#b7834f" },
  { colorId: 12, name: "Brown", code: "#74513b" },
  { colorId: 13, name: "Chocolate", code: "#4a2f25" },
  { colorId: 14, name: "Blue", code: "#3b73c8" },
  { colorId: 15, name: "Sky Blue", code: "#9ec7e8" },
  { colorId: 16, name: "Denim", code: "#466b8f" },
  { colorId: 17, name: "Green", code: "#2f7d53" },
  { colorId: 18, name: "Khaki", code: "#8b8756" },
  { colorId: 19, name: "Olive", code: "#5f6b3d" },
  { colorId: 20, name: "Mint", code: "#a8d8c4" },
  { colorId: 21, name: "Yellow", code: "#f0cf5a" },
  { colorId: 22, name: "Orange", code: "#df8b3a" },
  { colorId: 23, name: "Red", code: "#c9473f" },
  { colorId: 24, name: "Burgundy", code: "#7b2638" },
  { colorId: 25, name: "Pink", code: "#e8a7b8" },
  { colorId: 26, name: "Rose", code: "#c98089" },
  { colorId: 27, name: "Lavender", code: "#b9a7d8" },
  { colorId: 28, name: "Purple", code: "#76559d" },
  { colorId: 29, name: "Silver", code: "#c9cbd0" },
  { colorId: 30, name: "Gold", code: "#c8a64d" },
];

const DEFAULT_BANNER = {
  mainText: "ESSENTIALS",
  seasonText: "SPRING / SUMMER 2024",
  imageUrl: "",
};

const toIntOrNull = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n)) return null;
  return n;
};

const normalizeText = (value) => String(value ?? "").trim();
const digitsOnly = (value) => normalizeText(value).replace(/\D/g, "");
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeText(value));
const isValidLoginId = (value) => /^[a-zA-Z0-9._-]{4,30}$/.test(normalizeText(value));
const isValidName = (value) => {
  const text = normalizeText(value);
  return text.length >= 2 && text.length <= 30;
};
const isValidPhone = (value) => {
  const d = digitsOnly(value);
  return d.length >= 9 && d.length <= 12;
};
const isValidPasswordForSignup = (value) => {
  const text = String(value ?? "");
  return text.length >= 8 && text.length <= 72;
};
const validateWithSchema = (payload, schema) => {
  for (const rule of schema) {
    const value = payload?.[rule.key];
    if (!rule.validate(value, payload)) {
      return rule.message;
    }
  }
  return "";
};

const loginSchema = [
  {
    key: "account",
    validate: (value) => Boolean(normalizeText(value)) && normalizeText(value).length <= 100,
    message: "로그인 아이디를 확인해주세요.",
  },
  {
    key: "password",
    validate: (value) => {
      const text = String(value ?? "");
      return text.length > 0 && text.length <= 128;
    },
    message: "비밀번호를 확인해주세요.",
  },
];

const signupSchema = [
  { key: "id", validate: isValidLoginId, message: "아이디 형식이 올바르지 않습니다. (4~30자, 영문/숫자/._-)" },
  { key: "name", validate: isValidName, message: "이름은 2~30자로 입력해주세요." },
  { key: "phone", validate: isValidPhone, message: "연락처 형식이 올바르지 않습니다." },
  { key: "mail", validate: isValidEmail, message: "이메일 형식이 올바르지 않습니다." },
  { key: "password", validate: isValidPasswordForSignup, message: "비밀번호는 8~72자로 입력해주세요." },
];

const profileSchema = [
  { key: "name", validate: isValidName, message: "이름은 2~30자로 입력해주세요." },
  { key: "phone", validate: isValidPhone, message: "연락처 형식이 올바르지 않습니다." },
  {
    key: "newPassword",
    validate: (value) => !String(value ?? "") || isValidPasswordForSignup(value),
    message: "새 비밀번호는 8~72자로 입력해주세요.",
  },
];

const buildOrderNo = (createdAt, orderId) => {
  const d = new Date(createdAt);
  const id = Number(orderId);
  if (Number.isNaN(d.getTime()) || !Number.isInteger(id) || id <= 0) {
    return String(orderId ?? "");
  }
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${String(id).padStart(6, "0")}`;
};
const mimeToExt = (mimeType) => {
  const mime = String(mimeType ?? "").toLowerCase();
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "bin";
};

const resolveCartTimestampColumns = async () => {
  const [rows] = await pool.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
      "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart' " +
      "AND COLUMN_NAME IN ('createdAt', 'updatedAt', 'created_at', 'updated_at')"
  );

  const names = new Set((Array.isArray(rows) ? rows : []).map((row) => String(row.COLUMN_NAME)));

  const createdCol = names.has("createdAt")
    ? "createdAt"
    : names.has("created_at")
      ? "created_at"
      : "createdAt";
  const updatedCol = names.has("updatedAt")
    ? "updatedAt"
    : names.has("updated_at")
      ? "updated_at"
      : "updatedAt";

  return { createdCol, updatedCol };
};

const ensureCartTable = async () => {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS cart (" +
      "cartId BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, " +
      "userId BIGINT UNSIGNED NOT NULL, " +
      "productId BIGINT UNSIGNED NOT NULL, " +
      "colorId INT NOT NULL, " +
      "sizeId INT NOT NULL, " +
      "quantity INT NOT NULL DEFAULT 1, " +
      "createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
      "updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
      "PRIMARY KEY (cartId), " +
      "KEY idx_cart_userId (userId), " +
      "KEY idx_cart_productId (productId), " +
      "KEY idx_cart_option (userId, productId, colorId, sizeId), " +
      "CONSTRAINT fk_cart_user FOREIGN KEY (userId) REFERENCES `user` (userId) ON DELETE CASCADE ON UPDATE CASCADE" +
      ")"
  );
};

const hasColorTable = async () => {
  const [rows] = await pool.query(
    "SELECT 1 AS ok FROM INFORMATION_SCHEMA.TABLES " +
      "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'color' LIMIT 1"
  );
  return Array.isArray(rows) && rows.length > 0;
};

const resolveColorColumns = async () => {
  const exists = await hasColorTable();
  if (!exists) {
    return { useJoin: false, hasName: false, hasCode: false };
  }

  const [rows] = await pool.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
      "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'color' " +
      "AND COLUMN_NAME IN ('colorId', 'name', 'code')"
  );
  const names = new Set((Array.isArray(rows) ? rows : []).map((row) => String(row.COLUMN_NAME)));
  const hasColorId = names.has("colorId");
  const hasName = names.has("name");
  const hasCode = names.has("code");

  return {
    useJoin: hasColorId && (hasName || hasCode),
    hasName,
    hasCode,
  };
};

const saveThumbnailFromDataUrl = async (thumbnailDataUrl, thumbnailName) => {
  const dataUrl = String(thumbnailDataUrl ?? "").trim();
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("invalid thumbnailDataUrl");
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const extension = mimeToExt(mimeType);
  const originalName = String(thumbnailName ?? "").trim();
  const safeNamePart = originalName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 40);
  const fileName = `${Date.now()}-${safeNamePart || "thumb"}-${crypto.randomUUID()}.${extension}`;
  const key = `uploads/${fileName}`;

  if (s3 && process.env.S3_BUCKET) {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: Buffer.from(base64Data, "base64"),
        ContentType: mimeType,
        // ACL 생략: Bucket ACL 비활성화(Ownership: Bucket owner enforced) 환경에서 오류 방지
      })
    );
    return `${buildS3BaseUrl()}/${key}`;
  }

  // fallback: local filesystem
  const filePath = path.join(UPLOADS_DIR, fileName);
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(filePath, Buffer.from(base64Data, "base64"));

  return `${PUBLIC_BASE_URL}/uploads/${fileName}`;
};

const saveDetailImagesFromDataUrls = async (dataUrls, names, texts) => {
  const blocks = [];
  for (let i = 0; i < dataUrls.length; i++) {
    const dataUrl = String(dataUrls[i] ?? "").trim();
    const name = String(names?.[i] ?? "").trim();
    const text = String(texts?.[i] ?? "").trim();
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) continue;
    const mimeType = match[1];
    const base64Data = match[2];
    const extension = mimeToExt(mimeType);
    const safeNamePart = name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
    const fileName = `${Date.now()}-${safeNamePart || "detail"}-${crypto.randomUUID()}.${extension}`;
    const key = `uploads/${fileName}`;
    let url;
    if (s3 && process.env.S3_BUCKET) {
      await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: Buffer.from(base64Data, "base64"), ContentType: mimeType }));
      url = `${buildS3BaseUrl()}/${key}`;
    } else {
      const filePath = path.join(UPLOADS_DIR, fileName);
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      await fs.writeFile(filePath, Buffer.from(base64Data, "base64"));
      url = `${PUBLIC_BASE_URL}/uploads/${fileName}`;
    }
    blocks.push({ url, text });
  }
  return blocks;
};

const ensureProductDetailColumns = async () => {
  const [columns] = await pool.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
      "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' " +
      "AND COLUMN_NAME IN ('detail_images', 'detail_text')"
  );
  const columnNames = new Set((Array.isArray(columns) ? columns : []).map((row) => String(row.COLUMN_NAME)));

  if (!columnNames.has("detail_images")) {
    await pool.query("ALTER TABLE product ADD COLUMN detail_images TEXT");
  }
  if (!columnNames.has("detail_text")) {
    await pool.query("ALTER TABLE product ADD COLUMN detail_text TEXT");
  }
};

const ensureColorPalette = async () => {
  const [columns] = await pool.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
      "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'color' " +
      "AND COLUMN_NAME IN ('colorId', 'name', 'code')"
  );
  const columnNames = new Set((Array.isArray(columns) ? columns : []).map((row) => String(row.COLUMN_NAME)));
  if (!columnNames.has("colorId") || !columnNames.has("name")) return;
  if (!columnNames.has("code")) {
    await pool.query("ALTER TABLE color ADD COLUMN code VARCHAR(20) NOT NULL DEFAULT '#dddddd'");
  }

  const placeholders = DEFAULT_COLORS.map(() => "(?, ?, ?)").join(", ");
  const values = DEFAULT_COLORS.flatMap((color) => [color.colorId, color.name, color.code]);
  await pool.query(
    `INSERT INTO color (colorId, name, code) VALUES ${placeholders} ` +
      "ON DUPLICATE KEY UPDATE name = VALUES(name), code = VALUES(code)",
    values
  );
};

const readBannerSettings = async () => {
  try {
    const raw = await fs.readFile(BANNER_JSON_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_BANNER,
      ...parsed,
      mainText: String(parsed?.mainText ?? DEFAULT_BANNER.mainText),
      seasonText: String(parsed?.seasonText ?? DEFAULT_BANNER.seasonText),
      imageUrl: String(parsed?.imageUrl ?? DEFAULT_BANNER.imageUrl),
    };
  } catch (_error) {
    return { ...DEFAULT_BANNER };
  }
};

const writeBannerSettings = async (settings) => {
  const payload = {
    ...DEFAULT_BANNER,
    ...settings,
    mainText: String(settings?.mainText ?? DEFAULT_BANNER.mainText),
    seasonText: String(settings?.seasonText ?? DEFAULT_BANNER.seasonText),
    imageUrl: String(settings?.imageUrl ?? DEFAULT_BANNER.imageUrl),
  };

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(BANNER_JSON_PATH, JSON.stringify(payload, null, 2));
  return payload;
};

const saveBannerImageIfNeeded = async (imageDataUrl, imageName) => {
  if (!imageDataUrl) return null;
  const safeName = String(imageName ?? "banner").slice(0, 60);
  return await saveThumbnailFromDataUrl(imageDataUrl, safeName);
};

const resolveCategoryId = async (conn, categoryIdOrName) => {
  const categoryId = toIntOrNull(categoryIdOrName);
  if (categoryId && categoryId > 0) return categoryId;

  const key = String(categoryIdOrName ?? "")
    .trim()
    .toLowerCase();
  if (!key) return null;

  if (CATEGORY_ID_FALLBACK[key]) {
    return CATEGORY_ID_FALLBACK[key];
  }

  try {
    const [rows] = await conn.query(
      "SELECT categoryId FROM category WHERE LOWER(name) = ? OR LOWER(slug) = ? LIMIT 1",
      [key, key]
    );
    if (Array.isArray(rows) && rows.length > 0) {
      return Number(rows[0].categoryId);
    }
  } catch (_error) {
    return null;
  }

  return null;
};

app.get("/api/health", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({ ok: true, db: rows[0]?.ok === 1 });
  } catch (error) {
    res.status(500).json({ ok: false, message: "DB connection failed" });
  }
});

app.get("/api/banner", async (_req, res) => {
  try {
    const banner = await readBannerSettings();
    return res.json({ ok: true, banner });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("banner fetch failed", error));
  }
});

app.post("/api/banner", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { mainText, seasonText, imageDataUrl, imageName, imageUrl: incomingImageUrl } = req.body ?? {};

    let finalImageUrl = String(incomingImageUrl ?? "").trim();
    if (imageDataUrl) {
      finalImageUrl = await saveBannerImageIfNeeded(imageDataUrl, imageName || mainText || "banner");
    }

    const saved = await writeBannerSettings({
      mainText,
      seasonText,
      imageUrl: finalImageUrl,
    });

    return res.json({ ok: true, banner: saved });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("banner save failed", error));
  }
});

app.post("/api/auth/login", loginRateLimit, async (req, res) => {
  const { loginId, email, password } = req.body ?? {};
  const account = normalizeText(loginId ?? email);
  const plainPassword = String(password ?? "");
  const loginValidationMessage = validateWithSchema({ account, password: plainPassword }, loginSchema);

  if (loginValidationMessage) {
    return res.status(400).json({ ok: false, message: loginValidationMessage });
  }

  try {
    const [users] = await pool.query(
      "SELECT userId, id, mail, password, name, COALESCE(role, 'USER') AS role FROM `user` WHERE mail = ? OR id = ? LIMIT 1",
      [account, account]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(401).json({ ok: false, message: "인증 실패" });
    }

    const user = users[0];
    const dbPassword = String(user.password ?? "");
    const isHash = dbPassword.startsWith("$2a$") || dbPassword.startsWith("$2b$") || dbPassword.startsWith("$2y$");
    const passwordMatched = isHash ? await bcrypt.compare(plainPassword, dbPassword) : plainPassword === dbPassword;

    if (!passwordMatched) {
      return res.status(401).json({ ok: false, message: "인증 실패" });
    }

    const userPayload = {
      userId: user.userId,
      id: user.id,
      email: user.mail,
      name: user.name,
      role: String(user.role ?? "USER").toUpperCase(),
    };
    const token = issueAuthToken(userPayload);
    setAuthCookie(res, token);
    return res.json({
      ok: true,
      user: userPayload,
    });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("Login failed", error));
  }
});

const loginOrSyncKakaoUser = async (accessToken) => {
  const token = String(accessToken ?? "").trim();
  if (!token) {
    throw new Error("accessToken required");
  }

  const kakaoResp = await fetch("https://kapi.kakao.com/v2/user/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
  });

  if (!kakaoResp.ok) {
    throw new Error("Invalid Kakao access token");
  }

  const kakaoUser = await kakaoResp.json();
  const kakaoIdRaw = kakaoUser?.id;
  if (!kakaoIdRaw) {
    throw new Error("Kakao user info not found");
  }

  const kakaoId = String(kakaoIdRaw);
  const nickname = String(kakaoUser?.kakao_account?.profile?.nickname ?? "").trim() || "카카오회원";
  const emailFromKakao = String(kakaoUser?.kakao_account?.email ?? "").trim().toLowerCase();
  const loginId = `kakao_${kakaoId}`;
  const email = emailFromKakao || `${loginId}@kakao.local`;

  const [existingRows] = await pool.query(
    "SELECT userId, id, mail, name, COALESCE(role, 'USER') AS role FROM `user` WHERE mail = ? OR id = ? LIMIT 1",
    [email, loginId]
  );

  let user = Array.isArray(existingRows) && existingRows.length > 0 ? existingRows[0] : null;

  if (!user) {
    const randomPassword = crypto.randomBytes(24).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    await pool.query(
      "INSERT INTO `user` (id, name, phone, mail, password, role, created_at, updated_at) " +
        "VALUES (?, ?, ?, ?, ?, 'USER', NOW(), NOW())",
      [loginId, nickname, "", email, hashedPassword]
    );

    const [newRows] = await pool.query(
      "SELECT userId, id, mail, name, COALESCE(role, 'USER') AS role FROM `user` WHERE id = ? LIMIT 1",
      [loginId]
    );
    user = Array.isArray(newRows) && newRows.length > 0 ? newRows[0] : null;
  } else {
    const nextName = nickname || String(user.name ?? "");
    const nextMail = email || String(user.mail ?? "");
    const needsUpdate = nextName !== String(user.name ?? "") || nextMail !== String(user.mail ?? "");

    if (needsUpdate) {
      await pool.query(
        "UPDATE `user` SET name = ?, mail = ?, updated_at = NOW() WHERE userId = ?",
        [nextName, nextMail, user.userId]
      );
      user.name = nextName;
      user.mail = nextMail;
    }
  }

  if (!user?.userId) {
    throw new Error("Kakao login failed (user sync)");
  }

  return {
    userId: user.userId,
    id: user.id,
    email: user.mail,
    name: user.name,
    role: String(user.role ?? "USER").toUpperCase(),
  };
};

app.post("/api/auth/kakao/login", kakaoRateLimit, async (req, res) => {
  const { accessToken } = req.body ?? {};
  const token = String(accessToken ?? "").trim();
  if (!token) {
    return res.status(400).json({ ok: false, message: "accessToken required" });
  }

  try {
    const user = await loginOrSyncKakaoUser(token);
    setAuthCookie(res, issueAuthToken(user));
    return res.json({ ok: true, user });
  } catch (error) {
    const message = String(error?.message ?? error);
    if (message === "Invalid Kakao access token" || message === "Kakao user info not found") {
      return res.status(401).json({ ok: false, message });
    }
    return res.status(500).json(toSafeErrorBody("Kakao login failed", error));
  }
});

app.post("/api/auth/kakao/callback", kakaoRateLimit, async (req, res) => {
  const { code, redirectUri } = req.body ?? {};
  const authCode = String(code ?? "").trim();
  const callbackUrl = String(redirectUri ?? "").trim();
  const restApiKey = String(process.env.KAKAO_REST_API_KEY ?? "").trim();
  const kakaoClientSecret = String(process.env.KAKAO_CLIENT_SECRET ?? "").trim();

  if (!authCode || !callbackUrl) {
    return res.status(400).json({ ok: false, message: "code/redirectUri required" });
  }
  if (!restApiKey) {
    return res.status(500).json({ ok: false, message: "KAKAO_REST_API_KEY missing" });
  }

  try {
    const requestToken = async (withSecret) => {
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: restApiKey,
        redirect_uri: callbackUrl,
        code: authCode,
      });
      if (withSecret && kakaoClientSecret) {
        body.set("client_secret", kakaoClientSecret);
      }

      const resp = await fetch("https://kauth.kakao.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
        body: body.toString(),
      });

      const raw = await resp.text();
      let json = null;
      try {
        json = JSON.parse(raw);
      } catch {
        json = null;
      }
      return { ok: resp.ok, raw, json };
    };

    const firstTryWithSecret = Boolean(kakaoClientSecret);
    let tokenResult = await requestToken(firstTryWithSecret);

    if (!tokenResult.ok && firstTryWithSecret) {
      const errorCode = String(tokenResult?.json?.error ?? "");
      if (errorCode === "invalid_client") {
        tokenResult = await requestToken(false);
      }
    }

    if (!tokenResult.ok) {
      const body = { ok: false, message: "Kakao token exchange failed" };
      if (!IS_PROD) body.detail = tokenResult.raw;
      return res.status(401).json(body);
    }

    const tokenData = tokenResult.json ?? {};
    const accessToken = String(tokenData?.access_token ?? "").trim();
    if (!accessToken) {
      return res.status(401).json({ ok: false, message: "Kakao access_token missing" });
    }

    const user = await loginOrSyncKakaoUser(accessToken);
    setAuthCookie(res, issueAuthToken(user));
    return res.json({ ok: true, user });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("Kakao callback failed", error));
  }
});

app.post("/api/auth/logout", (req, res) => {
  clearAuthCookie(res);
  return res.json({ ok: true });
});

app.post("/api/auth/signup", signupRateLimit, async (req, res) => {
  const { id, name, phone, mail, password, recipientName, zipcode, address1, address2 } = req.body ?? {};
  const safeId = normalizeText(id);
  const safeName = normalizeText(name);
  const safePhone = digitsOnly(phone);
  const safeMail = normalizeText(mail).toLowerCase();
  const plainPassword = String(password ?? "");
  const safeRecipientName = normalizeText(recipientName);
  const safeZipcode = normalizeText(zipcode);
  const safeAddress1 = normalizeText(address1);
  const safeAddress2 = normalizeText(address2);
  const signupValidationMessage = validateWithSchema(
    { id: safeId, name: safeName, phone: safePhone, mail: safeMail, password: plainPassword },
    signupSchema
  );

  if (!safeId || !safeName || !safePhone || !safeMail || !plainPassword) {
    return res.status(400).json({ ok: false, message: "id/name/phone/mail/password required" });
  }
  if (signupValidationMessage) {
    return res.status(400).json({ ok: false, message: signupValidationMessage });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [duplicates] = await conn.query(
      "SELECT id, mail FROM `user` WHERE id = ? OR mail = ? LIMIT 1",
      [safeId, safeMail]
    );

    if (Array.isArray(duplicates) && duplicates.length > 0) {
      const dup = duplicates[0];
      if (dup.id === safeId) {
        return res.status(409).json({ ok: false, message: "이미 사용 중인 아이디입니다." });
      }
      if (dup.mail === safeMail) {
        return res.status(409).json({ ok: false, message: "이미 사용 중인 이메일입니다." });
      }
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const [insertResult] = await conn.query(
      "INSERT INTO `user` (id, name, phone, mail, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'USER', NOW(), NOW())",
      [safeId, safeName, safePhone, safeMail, hashedPassword]
    );

    const newUserId = insertResult.insertId;
    const hasAddress = Boolean(safeZipcode || safeAddress1 || safeAddress2);

    if (hasAddress) {
      await conn.query(
        "INSERT INTO address (userId, recipientName, phone, zipcode, address1, address2, isDefault, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())",
        [
          newUserId,
          safeRecipientName || safeName,
          safePhone,
          safeZipcode,
          safeAddress1,
          safeAddress2,
        ]
      );
    }

    await conn.commit();

    return res.status(201).json({
      ok: true,
      message: "회원가입이 완료되었습니다.",
      userId: newUserId,
      addressSaved: hasAddress,
    });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }
    return res.status(500).json(toSafeErrorBody("Signup failed", error));
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

app.use("/api/users/:userId", requireAuth, requireSelfOrAdmin);
app.use("/api/admin", requireAdminForAdminApi);

app.get("/api/users/:userId/profile", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId" });
  }

  try {
    const [users] = await pool.query(
      "SELECT userId, id, name, phone, mail FROM `user` WHERE userId = ? LIMIT 1",
      [userId]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(404).json({ ok: false, message: "user not found" });
    }

    const [addresses] = await pool.query(
      "SELECT addressId, recipientName, phone, zipcode, address1, address2, isDefault FROM address WHERE userId = ? ORDER BY isDefault DESC, addressId ASC LIMIT 1",
      [userId]
    );

    return res.json({
      ok: true,
      user: users[0],
      address: Array.isArray(addresses) && addresses.length > 0 ? addresses[0] : null,
    });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("profile fetch failed", error));
  }
});

app.put("/api/users/:userId/profile", async (req, res) => {
  const userId = Number(req.params.userId);
  const {
    name,
    phone,
    currentPassword,
    newPassword,
    recipientName,
    zipcode,
    address1,
    address2,
  } = req.body ?? {};
  const safeName = normalizeText(name);
  const safePhone = digitsOnly(phone);
  const safeRecipientName = normalizeText(recipientName);
  const safeZipcode = normalizeText(zipcode);
  const safeAddress1 = normalizeText(address1);
  const safeAddress2 = normalizeText(address2);
  const safeCurrentPassword = String(currentPassword ?? "");
  const safeNewPassword = String(newPassword ?? "");
  const profileValidationMessage = validateWithSchema(
    { name: safeName, phone: safePhone, newPassword: safeNewPassword },
    profileSchema
  );

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId" });
  }
  if (!safeName || !safePhone) {
    return res.status(400).json({ ok: false, message: "name/phone required" });
  }
  if (profileValidationMessage) {
    return res.status(400).json({ ok: false, message: profileValidationMessage });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [users] = await conn.query(
      "SELECT userId, password FROM `user` WHERE userId = ? LIMIT 1",
      [userId]
    );

    if (!Array.isArray(users) || users.length === 0) {
      await conn.rollback();
      return res.status(404).json({ ok: false, message: "user not found" });
    }

    const user = users[0];
    let passwordToSave = user.password;
    const wantsPasswordChange = Boolean(safeNewPassword);

    if (wantsPasswordChange) {
      if (!safeCurrentPassword) {
        await conn.rollback();
        return res.status(400).json({ ok: false, message: "currentPassword required" });
      }
      const dbPassword = String(user.password ?? "");
      const isHash = dbPassword.startsWith("$2a$") || dbPassword.startsWith("$2b$") || dbPassword.startsWith("$2y$");
      const matched = isHash ? await bcrypt.compare(safeCurrentPassword, dbPassword) : safeCurrentPassword === dbPassword;
      if (!matched) {
        await conn.rollback();
        return res.status(401).json({ ok: false, message: "현재 비밀번호가 일치하지 않습니다." });
      }
      passwordToSave = await bcrypt.hash(safeNewPassword, 10);
    }

    await conn.query(
      "UPDATE `user` SET name = ?, phone = ?, password = ?, updated_at = NOW() WHERE userId = ?",
      [safeName, safePhone, passwordToSave, userId]
    );

    const hasAddress = Boolean(safeZipcode || safeAddress1 || safeAddress2 || safeRecipientName);
    if (hasAddress) {
      const [existing] = await conn.query(
        "SELECT addressId FROM address WHERE userId = ? AND isDefault = 1 ORDER BY addressId ASC LIMIT 1",
        [userId]
      );

      if (Array.isArray(existing) && existing.length > 0) {
        await conn.query(
          "UPDATE address SET recipientName = ?, phone = ?, zipcode = ?, address1 = ?, address2 = ?, updated_at = NOW() WHERE addressId = ?",
          [
            safeRecipientName || safeName,
            safePhone,
            safeZipcode,
            safeAddress1,
            safeAddress2,
            existing[0].addressId,
          ]
        );
      } else {
        await conn.query(
          "INSERT INTO address (userId, recipientName, phone, zipcode, address1, address2, isDefault, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())",
          [userId, safeRecipientName || safeName, safePhone, safeZipcode, safeAddress1, safeAddress2]
        );
      }
    }

    await conn.commit();
    return res.json({ ok: true, message: "회원정보가 수정되었습니다." });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }
    return res.status(500).json(toSafeErrorBody("profile update failed", error));
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

app.delete("/api/users/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.query("SELECT userId FROM `user` WHERE userId = ? LIMIT 1", [userId]);
    if (!Array.isArray(rows) || rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ ok: false, message: "user not found" });
    }

    const stamp = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const deletedId = `deleted_${userId}_${stamp}`;
    const deletedMail = `deleted_${userId}_${stamp}@withdrawn.local`;
    const deletedPassword = await bcrypt.hash(`withdrawn_${userId}_${stamp}`, 10);

    await conn.query("DELETE FROM address WHERE userId = ?", [userId]);
    await conn.query("DELETE FROM scrap WHERE userId = ?", [userId]);
    await conn.query("DELETE FROM cart WHERE userId = ?", [userId]);

    await conn.query(
      "UPDATE `user` SET id = ?, mail = ?, name = '탈퇴회원', phone = '00000000000', password = ?, role = 'USER', updated_at = NOW() WHERE userId = ?",
      [deletedId, deletedMail, deletedPassword, userId]
    );

    await conn.commit();
    clearAuthCookie(res);
    return res.json({ ok: true, message: "회원탈퇴가 완료되었습니다." });
  } catch (error) {
    if (conn) await conn.rollback();
    return res.status(500).json(toSafeErrorBody("withdraw failed", error));
  } finally {
    if (conn) conn.release();
  }
});

app.get("/api/users/:userId/addresses", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT addressId, userId, recipientName, phone, zipcode, address1, address2, isDefault, created_at, updated_at FROM address WHERE userId = ? ORDER BY isDefault DESC, updated_at DESC, addressId DESC",
      [userId]
    );
    return res.json({ ok: true, addresses: rows });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("address list fetch failed", error));
  }
});

app.post("/api/users/:userId/addresses", async (req, res) => {
  const userId = Number(req.params.userId);
  const { recipientName, phone, zipcode, address1, address2, isDefault } = req.body ?? {};

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId" });
  }
  if (!recipientName || !phone || !zipcode || !address1) {
    return res.status(400).json({ ok: false, message: "recipientName/phone/zipcode/address1 required" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [userRows] = await conn.query("SELECT userId FROM `user` WHERE userId = ? LIMIT 1", [userId]);
    if (!Array.isArray(userRows) || userRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ ok: false, message: "user not found" });
    }

    const [countRows] = await conn.query("SELECT COUNT(*) AS cnt FROM address WHERE userId = ?", [userId]);
    const addressCount = Number(Array.isArray(countRows) ? countRows[0]?.cnt ?? 0 : 0);
    const shouldBeDefault = Boolean(isDefault) || addressCount === 0;

    if (shouldBeDefault) {
      await conn.query("UPDATE address SET isDefault = 0, updated_at = NOW() WHERE userId = ?", [userId]);
    }

    const [insertResult] = await conn.query(
      "INSERT INTO address (userId, recipientName, phone, zipcode, address1, address2, isDefault, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [userId, recipientName, phone, zipcode, address1, address2 || "", shouldBeDefault ? 1 : 0]
    );

    await conn.commit();
    return res.status(201).json({ ok: true, addressId: insertResult.insertId });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }
    return res.status(500).json(toSafeErrorBody("address create failed", error));
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

app.put("/api/users/:userId/addresses/:addressId", async (req, res) => {
  const userId = Number(req.params.userId);
  const addressId = Number(req.params.addressId);
  const { recipientName, phone, zipcode, address1, address2, isDefault } = req.body ?? {};

  if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(addressId) || addressId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId/addressId" });
  }
  if (!recipientName || !phone || !zipcode || !address1) {
    return res.status(400).json({ ok: false, message: "recipientName/phone/zipcode/address1 required" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [existingRows] = await conn.query(
      "SELECT addressId FROM address WHERE userId = ? AND addressId = ? LIMIT 1",
      [userId, addressId]
    );
    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ ok: false, message: "address not found" });
    }

    if (Boolean(isDefault)) {
      await conn.query("UPDATE address SET isDefault = 0, updated_at = NOW() WHERE userId = ?", [userId]);
    }

    await conn.query(
      "UPDATE address SET recipientName = ?, phone = ?, zipcode = ?, address1 = ?, address2 = ?, isDefault = ?, updated_at = NOW() WHERE userId = ? AND addressId = ?",
      [recipientName, phone, zipcode, address1, address2 || "", Boolean(isDefault) ? 1 : 0, userId, addressId]
    );

    await conn.commit();
    return res.json({ ok: true, message: "諛곗넚吏 ?뺣낫媛 ?섏젙?섏뿀?듬땲??" });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }
    return res.status(500).json(toSafeErrorBody("address update failed", error));
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

app.patch("/api/users/:userId/addresses/:addressId/default", async (req, res) => {
  const userId = Number(req.params.userId);
  const addressId = Number(req.params.addressId);

  if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(addressId) || addressId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId/addressId" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [existingRows] = await conn.query(
      "SELECT addressId FROM address WHERE userId = ? AND addressId = ? LIMIT 1",
      [userId, addressId]
    );
    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ ok: false, message: "address not found" });
    }

    await conn.query("UPDATE address SET isDefault = 0, updated_at = NOW() WHERE userId = ?", [userId]);
    await conn.query("UPDATE address SET isDefault = 1, updated_at = NOW() WHERE userId = ? AND addressId = ?", [userId, addressId]);

    await conn.commit();
    return res.json({ ok: true, message: "湲곕낯 諛곗넚吏濡??ㅼ젙?섏뿀?듬땲??" });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }
    return res.status(500).json(toSafeErrorBody("set default address failed", error));
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

app.delete("/api/users/:userId/addresses/:addressId", async (req, res) => {
  const userId = Number(req.params.userId);
  const addressId = Number(req.params.addressId);

  if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(addressId) || addressId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId/addressId" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.query(
      "SELECT addressId, isDefault FROM address WHERE userId = ? AND addressId = ? LIMIT 1",
      [userId, addressId]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ ok: false, message: "address not found" });
    }

    const wasDefault = Number(rows[0].isDefault) === 1;
    await conn.query("DELETE FROM address WHERE userId = ? AND addressId = ?", [userId, addressId]);

    if (wasDefault) {
      const [remaining] = await conn.query(
        "SELECT addressId FROM address WHERE userId = ? ORDER BY updated_at DESC, addressId DESC LIMIT 1",
        [userId]
      );
      if (Array.isArray(remaining) && remaining.length > 0) {
        await conn.query(
          "UPDATE address SET isDefault = 1, updated_at = NOW() WHERE userId = ? AND addressId = ?",
          [userId, remaining[0].addressId]
        );
      }
    }

    await conn.commit();
    return res.json({ ok: true, message: "諛곗넚吏媛 ??젣?섏뿀?듬땲??" });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }
    return res.status(500).json(toSafeErrorBody("address delete failed", error));
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

app.get("/api/users/:userId/scraps", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT scrapId, userId, productId, created_at FROM scrap WHERE userId = ? ORDER BY created_at DESC, scrapId DESC",
      [userId]
    );
    return res.json({ ok: true, scraps: rows });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("scrap list fetch failed", error));
  }
});

app.post("/api/users/:userId/scraps", async (req, res) => {
  const userId = Number(req.params.userId);
  const productId = Number(req.body?.productId);

  if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId/productId" });
  }

  try {
    const [insertResult] = await pool.query(
      "INSERT INTO scrap (userId, productId, created_at) VALUES (?, ?, NOW()) " +
        "ON DUPLICATE KEY UPDATE created_at = created_at",
      [userId, productId]
    );

    if (insertResult.affectedRows === 1) {
      return res.status(201).json({ ok: true, scrapId: insertResult.insertId, alreadyScrapped: false });
    }

    return res.json({ ok: true, alreadyScrapped: true });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("scrap create failed", error));
  }
});

app.delete("/api/users/:userId/scraps/:productId", async (req, res) => {
  const userId = Number(req.params.userId);
  const productId = Number(req.params.productId);

  if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId/productId" });
  }

  try {
    const [result] = await pool.query(
      "DELETE FROM scrap WHERE userId = ? AND productId = ?",
      [userId, productId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: "scrap not found" });
    }
    return res.json({ ok: true, message: "scrap removed" });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("scrap delete failed", error));
  }
});

app.get("/api/users/:userId/cart", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId" });
  }

  try {
    const { createdCol, updatedCol } = await resolveCartTimestampColumns();
    const colorMeta = await resolveColorColumns();
    const colorNameExpr = colorMeta.useJoin && colorMeta.hasName ? "co.name" : "NULL";
    const colorCodeExpr = colorMeta.useJoin && colorMeta.hasCode ? "co.code" : "NULL";
    const colorSelect = `${colorNameExpr} AS colorName, ${colorCodeExpr} AS colorCode, `;
    const colorJoin = colorMeta.useJoin ? "LEFT JOIN color co ON co.colorId = c.colorId " : "";
    const [rows] = await pool.query(
      `SELECT c.cartId, c.userId, c.productId, c.colorId, c.sizeId, c.quantity, c.${createdCol} AS createdAt, c.${updatedCol} AS updatedAt, ` +
        "p.name AS productName, p.price AS productPrice, p.thumbnail AS productThumbnail, " +
        colorSelect +
        "CASE c.sizeId WHEN 1 THEN 'S' WHEN 2 THEN 'M' WHEN 3 THEN 'L' ELSE CONCAT('SIZE-', c.sizeId) END AS sizeLabel " +
        "FROM cart c " +
        "JOIN product p ON p.productId = c.productId " +
        colorJoin +
        "WHERE c.userId = ? " +
        `ORDER BY c.${updatedCol} DESC, c.cartId DESC`,
      [userId]
    );
    return res.json({ ok: true, cartItems: rows });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("cart list fetch failed", error));
  }
});

app.post("/api/users/:userId/cart", async (req, res) => {
  const userId = Number(req.params.userId);
  const productId = Number(req.body?.productId);
  const colorId = Number(req.body?.colorId);
  const sizeId = Number(req.body?.sizeId);
  const quantity = Number(req.body?.quantity ?? 1);

  if (
    !Number.isInteger(userId) ||
    userId <= 0 ||
    !Number.isInteger(productId) ||
    productId <= 0 ||
    !Number.isInteger(colorId) ||
    colorId <= 0 ||
    !Number.isInteger(sizeId) ||
    sizeId <= 0 ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return res.status(400).json({ ok: false, message: "invalid userId/productId/colorId/sizeId/quantity" });
  }

  let conn;
  try {
    const { createdCol, updatedCol } = await resolveCartTimestampColumns();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [existingRows] = await conn.query(
      "SELECT cartId, quantity FROM cart WHERE userId = ? AND productId = ? AND colorId = ? AND sizeId = ? LIMIT 1",
      [userId, productId, colorId, sizeId]
    );

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      const existing = existingRows[0];
      const mergedQuantity = Number(existing.quantity ?? 0) + quantity;
      await conn.query(
        `UPDATE cart SET quantity = ?, ${updatedCol} = NOW() WHERE cartId = ?`,
        [mergedQuantity, existing.cartId]
      );
      await conn.commit();
      return res.json({ ok: true, cartId: existing.cartId, quantity: mergedQuantity, merged: true });
    }

    const [insertResult] = await conn.query(
      `INSERT INTO cart (userId, productId, colorId, sizeId, quantity, ${createdCol}, ${updatedCol}) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, productId, colorId, sizeId, quantity]
    );

    await conn.commit();
    return res.status(201).json({ ok: true, cartId: insertResult.insertId, quantity, merged: false });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }
    return res.status(500).json(toSafeErrorBody("cart create failed", error));
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

app.patch("/api/users/:userId/cart/:cartId", async (req, res) => {
  const userId = Number(req.params.userId);
  const cartId = Number(req.params.cartId);
  const quantity = Number(req.body?.quantity);

  if (
    !Number.isInteger(userId) ||
    userId <= 0 ||
    !Number.isInteger(cartId) ||
    cartId <= 0 ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return res.status(400).json({ ok: false, message: "invalid userId/cartId/quantity" });
  }

  try {
    const { updatedCol } = await resolveCartTimestampColumns();
    const [result] = await pool.query(
      `UPDATE cart SET quantity = ?, ${updatedCol} = NOW() WHERE userId = ? AND cartId = ?`,
      [quantity, userId, cartId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: "cart item not found" });
    }
    return res.json({ ok: true, cartId, quantity });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("cart update failed", error));
  }
});

app.delete("/api/users/:userId/cart/:cartId", async (req, res) => {
  const userId = Number(req.params.userId);
  const cartId = Number(req.params.cartId);

  if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(cartId) || cartId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId/cartId" });
  }

  try {
    const [result] = await pool.query("DELETE FROM cart WHERE userId = ? AND cartId = ?", [userId, cartId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: "cart item not found" });
    }
    return res.json({ ok: true, message: "cart item removed" });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("cart delete failed", error));
  }
});

app.get("/api/admin/users", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT userId, id, name, phone, mail, COALESCE(role, 'USER') AS role, created_at, updated_at " +
      "FROM `user` ORDER BY created_at DESC, userId DESC"
    );
    return res.json({ ok: true, users: rows });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("admin user list fetch failed", error));
  }
});

app.patch("/api/admin/users/:userId/role", async (req, res) => {
  const userId = Number(req.params.userId);
  const role = String(req.body?.role ?? "").trim().toUpperCase();

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId" });
  }
  if (role !== "ADMIN" && role !== "USER") {
    return res.status(400).json({ ok: false, message: "invalid role" });
  }

  try {
    const [result] = await pool.query("UPDATE `user` SET role = ?, updated_at = NOW() WHERE userId = ?", [role, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: "user not found" });
    }
    return res.json({ ok: true, userId, role });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("role update failed", error));
  }
});

app.get("/api/admin/dashboard", async (_req, res) => {
  try {
    const [userCountRows] = await pool.query("SELECT COUNT(*) AS cnt FROM `user`");
    const [newUserRows] = await pool.query(
      "SELECT DATE(created_at) AS d, COUNT(*) AS cnt FROM `user` " +
      "WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) " +
      "GROUP BY DATE(created_at)"
    );
    const [orderRows] = await pool.query(
      "SELECT status, COUNT(*) AS cnt FROM orders GROUP BY status"
    );
    const [pendingPaymentRows] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM payment WHERE status = 'PENDING'"
    );
    const [salesRows] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM payment WHERE status = 'COMPLETED'"
    );
    const [sales7Rows] = await pool.query(
      "SELECT DATE(updated_at) AS d, COALESCE(SUM(amount), 0) AS total FROM payment " +
      "WHERE status = 'COMPLETED' AND updated_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) " +
      "GROUP BY DATE(updated_at)"
    );
    const [recentOrdersRows] = await pool.query(
      "SELECT o.orderId, o.created_at, o.totalAmount, o.status, u.name AS userName " +
      "FROM orders o LEFT JOIN `user` u ON u.userId = o.userId " +
      "ORDER BY o.created_at DESC, o.orderId DESC LIMIT 10"
    );

    let lowStockRows = [];
    const colorMeta = await resolveColorColumns();
    const colorNameExpr = colorMeta.useJoin && colorMeta.hasName ? "co.name" : "NULL";
    const colorJoin = colorMeta.useJoin ? "LEFT JOIN color co ON co.colorId = po.colorId " : "";
    try {
      const [rows] = await pool.query(
        "SELECT p.productId, p.name, po.colorId, po.sizeId, " +
        `${colorNameExpr} AS colorName, ` +
        "CASE po.sizeId WHEN 1 THEN 'S' WHEN 2 THEN 'M' WHEN 3 THEN 'L' ELSE CONCAT('SIZE-', po.sizeId) END AS sizeLabel, " +
        "po.stock " +
        "FROM product_option po JOIN product p ON p.productId = po.productId " +
        colorJoin +
        "WHERE po.stock <= 5 ORDER BY po.stock ASC, p.productId DESC LIMIT 10"
      );
      lowStockRows = Array.isArray(rows) ? rows : [];
    } catch (_error) {
      const fallbackColorMeta = await resolveColorColumns();
      const fallbackColorNameExpr = fallbackColorMeta.useJoin && fallbackColorMeta.hasName ? "co.name" : "NULL";
      const fallbackColorJoin = fallbackColorMeta.useJoin ? "LEFT JOIN color co ON co.colorId = pc.colorId " : "";
      const [rows] = await pool.query(
        "SELECT p.productId, p.name, pc.colorId, NULL AS sizeId, " +
        `${fallbackColorNameExpr} AS colorName, ` +
        "NULL AS sizeLabel, " +
        "pc.stock " +
        "FROM product_color pc JOIN product p ON p.productId = pc.productId " +
        fallbackColorJoin +
        "WHERE pc.stock <= 5 ORDER BY pc.stock ASC, p.productId DESC LIMIT 10"
      );
      lowStockRows = Array.isArray(rows) ? rows : [];
    }

    return res.json({
      ok: true,
      summary: {
        totalUsers: Number(userCountRows?.[0]?.cnt ?? 0),
        pendingPayments: Number(pendingPaymentRows?.[0]?.cnt ?? 0),
        completedSalesTotal: Number(salesRows?.[0]?.total ?? 0),
      },
      newUsersByDay: newUserRows,
      ordersByStatus: orderRows,
      salesByDay: sales7Rows,
      recentOrders: recentOrdersRows,
      lowStockItems: lowStockRows,
    });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("admin dashboard fetch failed", error));
  }
});

app.get("/api/admin/products", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT p.productId, p.name, p.description, p.price, p.categoryId, p.status, p.thumbnail, p.detail_images, p.detail_text, p.created_at, p.isLive, " +
        "COALESCE(SUM(pc.stock), 0) AS totalStock " +
        "FROM product p " +
        "LEFT JOIN product_color pc ON pc.productId = p.productId " +
        "GROUP BY p.productId " +
        "ORDER BY p.created_at DESC, p.productId DESC"
    );
    return res.json({ ok: true, products: rows });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("product list fetch failed", error));
  }
});

app.get("/api/admin/colors", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT colorId, name, code FROM color ORDER BY colorId ASC"
    );

    if (Array.isArray(rows) && rows.length > 0) {
      return res.json({ ok: true, colors: rows });
    }

    return res.json({
      ok: true,
      colors: DEFAULT_COLORS,
    });
  } catch (_error) {
    return res.json({
      ok: true,
      colors: DEFAULT_COLORS,
    });
  }
});

app.get("/api/admin/products/:productId", async (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid productId" });
  }

  try {
    const [products] = await pool.query(
      "SELECT productId, name, description, price, categoryId, status, thumbnail, detail_images, detail_text, created_at, isLive FROM product WHERE productId = ? LIMIT 1",
      [productId]
    );
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(404).json({ ok: false, message: "product not found" });
    }

    const [productColors] = await pool.query(
      "SELECT productColorId, productId, colorId, stock FROM product_color WHERE productId = ? ORDER BY productColorId ASC",
      [productId]
    );
    const [productOptions] = await pool.query(
      "SELECT optionId, productId, colorId, sizeId, stock, additionalPrice FROM product_option WHERE productId = ? ORDER BY optionId ASC",
      [productId]
    );

    return res.json({
      ok: true,
      product: products[0],
      productColors,
      productOptions,
    });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("product detail fetch failed", error));
  }
});

app.post("/api/admin/products", async (req, res) => {
  const {
    name,
    description,
    price,
    categoryId,
    category,
    status,
    thumbnail,
    thumbnailDataUrl,
    thumbnailName,
    detailImageDataUrls,
    detailImageNames,
    detailImageTexts,
    isLive,
    productColors,
    productOptions,
  } = req.body ?? {};

  const safeName = String(name ?? "").trim();
  const safeDescription = String(description ?? "").trim();
  const safePrice = Number(price);
  const safeStatus = String(status ?? "ON_SALE")
    .trim()
    .toUpperCase();
  const safeThumbnail = String(thumbnail ?? "").trim();
  const safeIsLive = Number(isLive) === 1 ? 1 : 0;

  if (!safeName) {
    return res.status(400).json({ ok: false, message: "name required" });
  }
  if (!Number.isInteger(safePrice) || safePrice < 0) {
    return res.status(400).json({ ok: false, message: "price must be non-negative integer" });
  }
  if (!PRODUCT_STATUS.has(safeStatus)) {
    return res.status(400).json({ ok: false, message: "invalid status" });
  }

  const normalizedColors = Array.isArray(productColors) ? productColors : [];
  const normalizedOptions = Array.isArray(productOptions) ? productOptions : [];

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    let finalThumbnail = safeThumbnail;
    if (thumbnailDataUrl) {
      finalThumbnail = await saveThumbnailFromDataUrl(thumbnailDataUrl, thumbnailName);
    }
    if (!finalThumbnail) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "thumbnail required" });
    }

    const detailBlocks = Array.isArray(detailImageDataUrls) && detailImageDataUrls.length > 0
      ? await saveDetailImagesFromDataUrls(detailImageDataUrls, detailImageNames ?? [], detailImageTexts ?? [])
      : [];
    const finalDetailImages = JSON.stringify(detailBlocks);
    const finalDetailText = "";

    const resolvedCategoryId = await resolveCategoryId(conn, categoryId ?? category);
    if (!Number.isInteger(resolvedCategoryId) || resolvedCategoryId <= 0) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "valid categoryId/category required" });
    }

    const [insertProductResult] = await conn.query(
      "INSERT INTO product (name, description, price, categoryId, status, thumbnail, detail_images, detail_text, isLive, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
      [safeName, safeDescription, safePrice, resolvedCategoryId, safeStatus, finalThumbnail, finalDetailImages, finalDetailText, safeIsLive]
    );
    const newProductId = Number(insertProductResult.insertId);

    for (const row of normalizedColors) {
      const colorIdValue = toIntOrNull(row?.colorId);
      const stockValue = toIntOrNull(row?.stock);

      if (!colorIdValue || colorIdValue <= 0) {
        await conn.rollback();
        return res.status(400).json({ ok: false, message: "productColors[].colorId must be positive integer" });
      }
      if (stockValue === null || stockValue < 0) {
        await conn.rollback();
        return res.status(400).json({ ok: false, message: "productColors[].stock must be non-negative integer" });
      }

      await conn.query(
        "INSERT INTO product_color (productId, colorId, stock) VALUES (?, ?, ?)",
        [newProductId, colorIdValue, stockValue]
      );
    }

    for (const row of normalizedOptions) {
      const colorIdValue = toIntOrNull(row?.colorId);
      const sizeIdValue = toIntOrNull(row?.sizeId);
      const stockValue = toIntOrNull(row?.stock);
      const additionalPriceValue = toIntOrNull(row?.additionalPrice ?? 0);

      if (!colorIdValue || colorIdValue <= 0 || !sizeIdValue || sizeIdValue <= 0) {
        await conn.rollback();
        return res.status(400).json({ ok: false, message: "productOptions[].colorId/sizeId must be positive integer" });
      }
      if (stockValue === null || stockValue < 0) {
        await conn.rollback();
        return res.status(400).json({ ok: false, message: "productOptions[].stock must be non-negative integer" });
      }
      if (additionalPriceValue === null) {
        await conn.rollback();
        return res.status(400).json({ ok: false, message: "productOptions[].additionalPrice must be integer" });
      }

      await conn.query(
        "INSERT INTO product_option (productId, colorId, sizeId, stock, additionalPrice) VALUES (?, ?, ?, ?, ?)",
        [newProductId, colorIdValue, sizeIdValue, stockValue, additionalPriceValue]
      );
    }

    await conn.commit();
    return res.status(201).json({
      ok: true,
      productId: newProductId,
      message: "product created",
    });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }
    return res.status(500).json(toSafeErrorBody("product create failed", error));
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

app.put("/api/admin/products/:productId", async (req, res) => {
  const productId = Number(req.params.productId);
  const {
    name,
    description,
    price,
    categoryId,
    category,
    status,
    thumbnail,
    thumbnailDataUrl,
    thumbnailName,
    detailImageDataUrls,
    detailImageNames,
    detailImageTexts,
    isLive,
    productColors,
    productOptions,
  } = req.body ?? {};

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid productId" });
  }

  const safeName = String(name ?? "").trim();
  const safeDescription = String(description ?? "").trim();
  const safePrice = Number(price);
  const safeStatus = String(status ?? "ON_SALE")
    .trim()
    .toUpperCase();
  const safeThumbnail = String(thumbnail ?? "").trim();

  if (!safeName) {
    return res.status(400).json({ ok: false, message: "name required" });
  }
  if (!Number.isInteger(safePrice) || safePrice < 0) {
    return res.status(400).json({ ok: false, message: "price must be non-negative integer" });
  }
  if (!PRODUCT_STATUS.has(safeStatus)) {
    return res.status(400).json({ ok: false, message: "invalid status" });
  }

  const normalizedColors = Array.isArray(productColors) ? productColors : [];
  const normalizedOptions = Array.isArray(productOptions) ? productOptions : [];

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [existingProducts] = await conn.query(
      "SELECT productId, thumbnail, detail_images, detail_text, COALESCE(isLive, 0) AS isLive FROM product WHERE productId = ? LIMIT 1",
      [productId]
    );
    if (!Array.isArray(existingProducts) || existingProducts.length === 0) {
      await conn.rollback();
      return res.status(404).json({ ok: false, message: "product not found" });
    }
    const existing = existingProducts[0];

    let finalThumbnail = safeThumbnail || String(existing.thumbnail ?? "");
    if (thumbnailDataUrl) {
      finalThumbnail = await saveThumbnailFromDataUrl(thumbnailDataUrl, thumbnailName);
    }
    if (!finalThumbnail) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "thumbnail required" });
    }

    let finalDetailImages;
    if (Array.isArray(detailImageDataUrls) && detailImageDataUrls.length > 0) {
      const uploaded = await saveDetailImagesFromDataUrls(detailImageDataUrls, detailImageNames ?? [], detailImageTexts ?? []);
      finalDetailImages = JSON.stringify(uploaded);
    } else {
      finalDetailImages = String(existing.detail_images ?? "[]");
    }
    const finalDetailText = "";

    const resolvedCategoryId = await resolveCategoryId(conn, categoryId ?? category);
    if (!Number.isInteger(resolvedCategoryId) || resolvedCategoryId <= 0) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "valid categoryId/category required" });
    }

    const safeIsLive =
      typeof isLive === "undefined" || isLive === null
        ? Number(existing.isLive ?? 0) === 1
          ? 1
          : 0
        : Number(isLive) === 1
          ? 1
          : 0;

    await conn.query(
      "UPDATE product SET name = ?, description = ?, price = ?, categoryId = ?, status = ?, thumbnail = ?, detail_images = ?, detail_text = ?, isLive = ? WHERE productId = ?",
      [safeName, safeDescription, safePrice, resolvedCategoryId, safeStatus, finalThumbnail, finalDetailImages, finalDetailText, safeIsLive, productId]
    );

    await conn.query("DELETE FROM product_option WHERE productId = ?", [productId]);
    await conn.query("DELETE FROM product_color WHERE productId = ?", [productId]);

    for (const row of normalizedColors) {
      const colorIdValue = toIntOrNull(row?.colorId);
      const stockValue = toIntOrNull(row?.stock);

      if (!colorIdValue || colorIdValue <= 0) {
        await conn.rollback();
        return res.status(400).json({ ok: false, message: "productColors[].colorId must be positive integer" });
      }
      if (stockValue === null || stockValue < 0) {
        await conn.rollback();
        return res.status(400).json({ ok: false, message: "productColors[].stock must be non-negative integer" });
      }

      await conn.query(
        "INSERT INTO product_color (productId, colorId, stock) VALUES (?, ?, ?)",
        [productId, colorIdValue, stockValue]
      );
    }

    for (const row of normalizedOptions) {
      const colorIdValue = toIntOrNull(row?.colorId);
      const sizeIdValue = toIntOrNull(row?.sizeId);
      const stockValue = toIntOrNull(row?.stock);
      const additionalPriceValue = toIntOrNull(row?.additionalPrice ?? 0);

      if (!colorIdValue || colorIdValue <= 0 || !sizeIdValue || sizeIdValue <= 0) {
        await conn.rollback();
        return res.status(400).json({ ok: false, message: "productOptions[].colorId/sizeId must be positive integer" });
      }
      if (stockValue === null || stockValue < 0) {
        await conn.rollback();
        return res.status(400).json({ ok: false, message: "productOptions[].stock must be non-negative integer" });
      }
      if (additionalPriceValue === null) {
        await conn.rollback();
        return res.status(400).json({ ok: false, message: "productOptions[].additionalPrice must be integer" });
      }

      await conn.query(
        "INSERT INTO product_option (productId, colorId, sizeId, stock, additionalPrice) VALUES (?, ?, ?, ?, ?)",
        [productId, colorIdValue, sizeIdValue, stockValue, additionalPriceValue]
      );
    }

    await conn.commit();
    return res.json({ ok: true, productId, message: "product updated" });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }
    return res.status(500).json(toSafeErrorBody("product update failed", error));
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

app.patch("/api/admin/products/:productId/live", async (req, res) => {
  const productId = Number(req.params.productId);
  const isLive = Number(req.body?.isLive) === 1 ? 1 : 0;

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid productId" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE product SET isLive = ? WHERE productId = ?",
      [isLive, productId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: "product not found" });
    }
    return res.json({ ok: true, productId, isLive });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("product live update failed", error));
  }
});

app.delete("/api/admin/products/:productId", async (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid productId" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    await conn.query("DELETE FROM product_option WHERE productId = ?", [productId]);
    await conn.query("DELETE FROM product_color WHERE productId = ?", [productId]);
    await conn.query("DELETE FROM scrap WHERE productId = ?", [productId]);
    await conn.query("DELETE FROM cart WHERE productId = ?", [productId]);

    const [result] = await conn.query("DELETE FROM product WHERE productId = ?", [productId]);
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ ok: false, message: "product not found" });
    }

    await conn.commit();
    return res.json({ ok: true, productId });
  } catch (error) {
    if (conn) await conn.rollback();
    return res.status(500).json(toSafeErrorBody("product delete failed", error));
  } finally {
    if (conn) conn.release();
  }
});

const VALID_ORDER_STATUSES = new Set([
  "ORDERED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "EXCHANGED",
]);

const autoAdvancePreparing = async (userId = null) => {
  const sql =
    "UPDATE orders o " +
    "JOIN payment p ON p.paymentId = o.paymentId " +
    "SET o.status = 'PREPARING', o.updated_at = NOW() " +
    "WHERE o.status = 'ORDERED' AND p.status = 'COMPLETED' " +
    "AND p.updated_at <= DATE_SUB(NOW(), INTERVAL 12 HOUR)" +
    (userId ? " AND o.userId = ?" : "");
  await pool.query(sql, userId ? [userId] : []);
};

app.post("/api/users/:userId/orders", async (req, res) => {
  const userId = Number(req.params.userId);
  const { paymentId, addressId, totalAmount } = req.body ?? {};
  const amount = Number(totalAmount);

  if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId/totalAmount" });
  }

  try {
    const [insertResult] = await pool.query(
      "INSERT INTO orders (userId, paymentId, addressId, totalAmount, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'ORDERED', NOW(), NOW())",
      [userId, paymentId ?? null, addressId ?? null, amount]
    );
    const orderId = Number(insertResult.insertId);
    return res.status(201).json({ ok: true, orderId, orderNo: buildOrderNo(new Date(), orderId) });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("order create failed", error));
  }
});

app.get("/api/users/:userId/orders", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId" });
  }

  try {
    await autoAdvancePreparing(userId);

    const [rows] = await pool.query(
      "SELECT " +
        "o.orderId, o.userId, o.paymentId, o.addressId, o.totalAmount, o.status, o.created_at, o.updated_at, " +
        "p.status AS paymentStatus, p.paymentMethod, p.depositorName, p.bankName, p.memo, p.updated_at AS paymentUpdatedAt, " +
        "a.recipientName, a.phone AS recipientPhone, a.address1, a.address2 " +
      "FROM orders o " +
      "LEFT JOIN payment p ON p.paymentId = o.paymentId " +
      "LEFT JOIN address a ON a.addressId = o.addressId " +
      "WHERE o.userId = ? AND o.status <> 'CANCELLED' " +
      "ORDER BY o.created_at DESC, o.orderId DESC",
      [userId]
    );
    const normalized = (Array.isArray(rows) ? rows : []).map((row) => ({
      ...row,
      orderNo: buildOrderNo(row.created_at, row.orderId),
    }));
    return res.json({ ok: true, orders: normalized });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("order list fetch failed", error));
  }
});

app.patch("/api/users/:userId/orders/:orderId/cancel", async (req, res) => {
  const userId = Number(req.params.userId);
  const orderId = Number(req.params.orderId);
  if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId/orderId" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT o.orderId, o.userId, o.status, o.paymentId, p.status AS paymentStatus " +
      "FROM orders o LEFT JOIN payment p ON p.paymentId = o.paymentId " +
      "WHERE o.orderId = ? AND o.userId = ? LIMIT 1",
      [orderId, userId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ ok: false, message: "order not found" });
    }

    const order = rows[0];
    if (order.status !== "ORDERED") {
      return res.status(409).json({ ok: false, message: "이미 처리된 주문은 취소할 수 없습니다." });
    }

    await pool.query("UPDATE orders SET status = 'CANCELLED', updated_at = NOW() WHERE orderId = ?", [orderId]);

    if (Number.isInteger(order.paymentId) && order.paymentId > 0) {
      await pool.query("UPDATE payment SET status = 'REFUNDED', updated_at = NOW() WHERE paymentId = ?", [order.paymentId]);
    }

    return res.json({ ok: true, orderId, status: "CANCELLED" });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("order cancel failed", error));
  }
});

app.post("/api/users/:userId/payments", async (req, res) => {
  const userId = Number(req.params.userId);
  const { amount, paymentMethod, depositorName, bankName, memo } = req.body ?? {};
  const amountNum = Number(amount);
  const method = String(paymentMethod ?? "BANK_TRANSFER").trim().toUpperCase();

  if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(amountNum) || amountNum <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId/amount" });
  }
  if (method !== "BANK_TRANSFER") {
    return res.status(400).json({ ok: false, message: "invalid paymentMethod" });
  }

  try {
    const [insertResult] = await pool.query(
      "INSERT INTO payment (userId, amount, paymentMethod, status, depositorName, bankName, memo, created_at, updated_at) VALUES (?, ?, 'BANK_TRANSFER', 'PENDING', ?, ?, ?, NOW(), NOW())",
      [userId, amountNum, depositorName ?? null, bankName ?? null, memo ?? null]
    );
    return res.status(201).json({ ok: true, paymentId: insertResult.insertId });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("payment create failed", error));
  }
});

app.patch("/api/admin/payments/:paymentId/complete", async (req, res) => {
  const paymentId = Number(req.params.paymentId);
  if (!Number.isInteger(paymentId) || paymentId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid paymentId" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE payment SET status = 'COMPLETED', updated_at = NOW() WHERE paymentId = ?",
      [paymentId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: "payment not found" });
    }
    return res.json({ ok: true, message: "입금완료 처리되었습니다." });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("payment complete failed", error));
  }
});

app.patch("/api/admin/orders/:orderId/payment-complete", async (req, res) => {
  const orderId = Number(req.params.orderId);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid orderId" });
  }

  try {
    const [orders] = await pool.query("SELECT paymentId FROM orders WHERE orderId = ? LIMIT 1", [orderId]);
    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(404).json({ ok: false, message: "order not found" });
    }
    const paymentId = Number(orders[0].paymentId);
    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return res.status(400).json({ ok: false, message: "order has no paymentId" });
    }

    await pool.query("UPDATE payment SET status = 'COMPLETED', updated_at = NOW() WHERE paymentId = ?", [paymentId]);
    return res.json({ ok: true, message: "입금완료 처리되었습니다." });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("payment complete failed", error));
  }
});

app.patch("/api/admin/payments/:paymentId/refund", async (req, res) => {
  const paymentId = Number(req.params.paymentId);
  if (!Number.isInteger(paymentId) || paymentId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid paymentId" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE payment SET status = 'REFUNDED', updated_at = NOW() WHERE paymentId = ?",
      [paymentId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: "payment not found" });
    }
    return res.json({ ok: true, message: "환불 처리되었습니다." });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("payment refund failed", error));
  }
});

app.patch("/api/admin/orders/:orderId/status", async (req, res) => {
  const orderId = Number(req.params.orderId);
  const status = String(req.body?.status ?? "").trim().toUpperCase();

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid orderId" });
  }
  if (!VALID_ORDER_STATUSES.has(status)) {
    return res.status(400).json({ ok: false, message: "invalid status" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE orders SET status = ?, updated_at = NOW() WHERE orderId = ?",
      [status, orderId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: "order not found" });
    }
    return res.json({ ok: true, message: "二쇰Ц ?곹깭媛 蹂寃쎈릺?덉뒿?덈떎." });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("order status update failed", error));
  }
});

app.get("/api/admin/orders", async (_req, res) => {
  try {
    await autoAdvancePreparing();

    const [rows] = await pool.query(
      "SELECT " +
        "o.orderId, o.userId, o.paymentId, o.addressId, o.totalAmount, o.status, o.created_at, o.updated_at, " +
        "u.id AS userLoginId, u.name AS userName, u.phone AS userPhone, u.mail AS userEmail, " +
        "p.status AS paymentStatus, p.paymentMethod, p.depositorName, p.bankName, p.memo, p.updated_at AS paymentUpdatedAt, " +
        "a.recipientName, a.phone AS addressPhone, a.zipcode, a.address1, a.address2, a.isDefault " +
      "FROM orders o " +
      "LEFT JOIN `user` u ON u.userId = o.userId " +
      "LEFT JOIN payment p ON p.paymentId = o.paymentId " +
      "LEFT JOIN address a ON a.addressId = o.addressId " +
      "ORDER BY o.created_at DESC, o.orderId DESC"
    );

    const normalized = (Array.isArray(rows) ? rows : []).map((row) => ({
      ...row,
      orderNo: buildOrderNo(row.created_at, row.orderId),
    }));
    return res.json({ ok: true, orders: normalized });
  } catch (error) {
    return res.status(500).json(toSafeErrorBody("admin order list fetch failed", error));
  }
});

autoAdvancePreparing().catch((error) => {
  console.error("autoAdvancePreparing failed:", error);
});

ensureCartTable().catch((error) => {
  console.error("ensureCartTable failed:", error);
});
ensureProductDetailColumns().catch((error) => {
  console.error("ensureProductDetailColumns failed:", error);
});
ensureColorPalette().catch((error) => {
  console.error("ensureColorPalette failed:", error);
});

setInterval(() => {
  autoAdvancePreparing().catch((error) => {
    console.error("autoAdvancePreparing failed:", error);
  });
}, 5 * 60 * 1000);

const server = app.listen(port, host, () => {
  // Note: if `host` is 0.0.0.0, you can still access it via 127.0.0.1 (local)
  // or the machine's LAN/public IP (external), assuming firewall/security-group allows it.
  console.log(`Backend listening on http://${host}:${port}`);
});

server.on("error", (error) => {
  if (error?.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Stop the existing process or set PORT to a different value.`
    );
    process.exit(1);
  }
});
