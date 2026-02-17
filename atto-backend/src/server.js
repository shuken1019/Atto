import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "atto.cn602qo04clr.ap-northeast-2.rds.amazonaws.com",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "admin",
  password: process.env.DB_PASSWORD ?? "atto12345",
  database: process.env.DB_NAME ?? "atto",
  waitForConnections: true,
  connectionLimit: 10,
});

const allowedOrigins = String(
  process.env.CORS_ORIGIN ?? "http://3.37.232.202:3001,http://http://3.37.232.202"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const CATEGORY_ID_FALLBACK = {
  outer: 1,
  top: 2,
  bottom: 3,
  acc: 4,
};

const PRODUCT_STATUS = new Set(["ON_SALE", "SOLD_OUT", "HIDDEN"]);
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? `http://127.0.0.1:${port}`;

const toIntOrNull = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n)) return null;
  return n;
};
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
  const filePath = path.join(UPLOADS_DIR, fileName);

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(filePath, Buffer.from(base64Data, "base64"));

  return `${PUBLIC_BASE_URL}/uploads/${fileName}`;
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

app.post("/api/auth/login", async (req, res) => {
  const { loginId, email, password } = req.body ?? {};
  const account = String(loginId ?? email ?? "").trim();

  if (!account || !password) {
    return res.status(400).json({ ok: false, message: "loginId/password required" });
  }

  try {
    const [users] = await pool.query(
      "SELECT userId, id, mail, password, name, COALESCE(role, 'USER') AS role FROM `user` WHERE mail = ? OR id = ? LIMIT 1",
      [account, account]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    const user = users[0];
    const dbPassword = String(user.password ?? "");
    const isHash = dbPassword.startsWith("$2a$") || dbPassword.startsWith("$2b$") || dbPassword.startsWith("$2y$");
    const passwordMatched = isHash ? await bcrypt.compare(password, dbPassword) : password === dbPassword;

    if (!passwordMatched) {
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    return res.json({
      ok: true,
      user: {
        userId: user.userId,
        id: user.id,
        email: user.mail,
        name: user.name,
        role: String(user.role ?? "USER").toUpperCase(),
      },
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Login failed", error: String(error?.message ?? error) });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  const { id, name, phone, mail, password, recipientName, zipcode, address1, address2 } = req.body ?? {};

  if (!id || !name || !phone || !mail || !password) {
    return res.status(400).json({ ok: false, message: "id/name/phone/mail/password required" });
  }

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

    const [duplicates] = await conn.query(
      "SELECT id, mail FROM `user` WHERE id = ? OR mail = ? LIMIT 1",
      [id, mail]
    );

    if (Array.isArray(duplicates) && duplicates.length > 0) {
      const dup = duplicates[0];
      if (dup.id === id) {
        return res.status(409).json({ ok: false, message: "?대? ?ъ슜 以묒씤 ?꾩씠?붿엯?덈떎." });
      }
      if (dup.mail === mail) {
        return res.status(409).json({ ok: false, message: "?대? ?ъ슜 以묒씤 ?대찓?쇱엯?덈떎." });
      }
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const [insertResult] = await conn.query(
      "INSERT INTO `user` (id, name, phone, mail, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'USER', NOW(), NOW())",
      [id, name, phone, mail, hashedPassword]
    );

    const newUserId = insertResult.insertId;
    const hasAddress = Boolean(zipcode || address1 || address2);

    if (hasAddress) {
      await conn.query(
        "INSERT INTO address (userId, recipientName, phone, zipcode, address1, address2, isDefault, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())",
        [
          newUserId,
          recipientName || name,
          phone,
          zipcode || "",
          address1 || "",
          address2 || "",
        ]
      );
    }

    await conn.commit();

    return res.status(201).json({
      ok: true,
      message: "?뚯썝媛?낆씠 ?꾨즺?섏뿀?듬땲??",
      userId: newUserId,
      addressSaved: hasAddress,
    });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }
    return res.status(500).json({ ok: false, message: "Signup failed", error: String(error?.message ?? error) });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

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
    return res.status(500).json({ ok: false, message: "profile fetch failed", error: String(error?.message ?? error) });
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

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ ok: false, message: "invalid userId" });
  }
  if (!name || !phone) {
    return res.status(400).json({ ok: false, message: "name/phone required" });
  }

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
    const wantsPasswordChange = Boolean(newPassword && String(newPassword).trim().length > 0);

    if (wantsPasswordChange) {
      if (!currentPassword) {
        await conn.rollback();
        return res.status(400).json({ ok: false, message: "currentPassword required" });
      }
      const dbPassword = String(user.password ?? "");
      const isHash = dbPassword.startsWith("$2a$") || dbPassword.startsWith("$2b$") || dbPassword.startsWith("$2y$");
      const matched = isHash ? await bcrypt.compare(String(currentPassword), dbPassword) : String(currentPassword) === dbPassword;
      if (!matched) {
        await conn.rollback();
        return res.status(401).json({ ok: false, message: "?꾩옱 鍮꾨?踰덊샇媛 ?쇱튂?섏? ?딆뒿?덈떎." });
      }
      passwordToSave = await bcrypt.hash(String(newPassword), 10);
    }

    await conn.query(
      "UPDATE `user` SET name = ?, phone = ?, password = ?, updated_at = NOW() WHERE userId = ?",
      [name, phone, passwordToSave, userId]
    );

    const hasAddress = Boolean(zipcode || address1 || address2 || recipientName);
    if (hasAddress) {
      const [existing] = await conn.query(
        "SELECT addressId FROM address WHERE userId = ? AND isDefault = 1 ORDER BY addressId ASC LIMIT 1",
        [userId]
      );

      if (Array.isArray(existing) && existing.length > 0) {
        await conn.query(
          "UPDATE address SET recipientName = ?, phone = ?, zipcode = ?, address1 = ?, address2 = ?, updated_at = NOW() WHERE addressId = ?",
          [
            recipientName || name,
            phone,
            zipcode || "",
            address1 || "",
            address2 || "",
            existing[0].addressId,
          ]
        );
      } else {
        await conn.query(
          "INSERT INTO address (userId, recipientName, phone, zipcode, address1, address2, isDefault, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())",
          [userId, recipientName || name, phone, zipcode || "", address1 || "", address2 || ""]
        );
      }
    }

    await conn.commit();
    return res.json({ ok: true, message: "?뚯썝?뺣낫媛 ?섏젙?섏뿀?듬땲??" });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }
    return res.status(500).json({ ok: false, message: "profile update failed", error: String(error?.message ?? error) });
  } finally {
    if (conn) {
      conn.release();
    }
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
    return res.status(500).json({ ok: false, message: "address list fetch failed", error: String(error?.message ?? error) });
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

    let finalThumbnail = safeThumbnail;
    if (thumbnailDataUrl) {
      finalThumbnail = await saveThumbnailFromDataUrl(thumbnailDataUrl, thumbnailName);
    }
    if (!finalThumbnail) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "thumbnail required" });
    }

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
    return res.status(500).json({ ok: false, message: "address create failed", error: String(error?.message ?? error) });
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

    let finalThumbnail = safeThumbnail;
    if (thumbnailDataUrl) {
      finalThumbnail = await saveThumbnailFromDataUrl(thumbnailDataUrl, thumbnailName);
    }
    if (!finalThumbnail) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "thumbnail required" });
    }

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
    return res.status(500).json({ ok: false, message: "address update failed", error: String(error?.message ?? error) });
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

    let finalThumbnail = safeThumbnail;
    if (thumbnailDataUrl) {
      finalThumbnail = await saveThumbnailFromDataUrl(thumbnailDataUrl, thumbnailName);
    }
    if (!finalThumbnail) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "thumbnail required" });
    }

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
    return res.status(500).json({ ok: false, message: "set default address failed", error: String(error?.message ?? error) });
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

    let finalThumbnail = safeThumbnail;
    if (thumbnailDataUrl) {
      finalThumbnail = await saveThumbnailFromDataUrl(thumbnailDataUrl, thumbnailName);
    }
    if (!finalThumbnail) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "thumbnail required" });
    }

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
    return res.status(500).json({ ok: false, message: "address delete failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "scrap list fetch failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "scrap create failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "scrap delete failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "cart list fetch failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "cart create failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "cart update failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "cart delete failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "admin user list fetch failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "role update failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "admin dashboard fetch failed", error: String(error?.message ?? error) });
  }
});

app.get("/api/admin/products", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT p.productId, p.name, p.description, p.price, p.categoryId, p.status, p.thumbnail, p.created_at, p.isLive, " +
        "COALESCE(SUM(pc.stock), 0) AS totalStock " +
        "FROM product p " +
        "LEFT JOIN product_color pc ON pc.productId = p.productId " +
        "GROUP BY p.productId " +
        "ORDER BY p.created_at DESC, p.productId DESC"
    );
    return res.json({ ok: true, products: rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "product list fetch failed", error: String(error?.message ?? error) });
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
      colors: [
        { colorId: 1, name: "Black", code: "#222222" },
        { colorId: 2, name: "Ivory", code: "#efe9de" },
        { colorId: 3, name: "White", code: "#ffffff" },
        { colorId: 4, name: "Gray", code: "#a5a5a5" },
        { colorId: 5, name: "Navy", code: "#1f2c56" },
      ],
    });
  } catch (_error) {
    return res.json({
      ok: true,
      colors: [
        { colorId: 1, name: "Black", code: "#222222" },
        { colorId: 2, name: "Ivory", code: "#efe9de" },
        { colorId: 3, name: "White", code: "#ffffff" },
        { colorId: 4, name: "Gray", code: "#a5a5a5" },
        { colorId: 5, name: "Navy", code: "#1f2c56" },
      ],
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
      "SELECT productId, name, description, price, categoryId, status, thumbnail, created_at, isLive FROM product WHERE productId = ? LIMIT 1",
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
    return res.status(500).json({ ok: false, message: "product detail fetch failed", error: String(error?.message ?? error) });
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

    const resolvedCategoryId = await resolveCategoryId(conn, categoryId ?? category);
    if (!Number.isInteger(resolvedCategoryId) || resolvedCategoryId <= 0) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "valid categoryId/category required" });
    }

    const [insertProductResult] = await conn.query(
      "INSERT INTO product (name, description, price, categoryId, status, thumbnail, isLive, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
      [safeName, safeDescription, safePrice, resolvedCategoryId, safeStatus, finalThumbnail, safeIsLive]
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
    return res.status(500).json({ ok: false, message: "product create failed", error: String(error?.message ?? error) });
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
      "SELECT productId, thumbnail, COALESCE(isLive, 0) AS isLive FROM product WHERE productId = ? LIMIT 1",
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
      "UPDATE product SET name = ?, description = ?, price = ?, categoryId = ?, status = ?, thumbnail = ?, isLive = ? WHERE productId = ?",
      [safeName, safeDescription, safePrice, resolvedCategoryId, safeStatus, finalThumbnail, safeIsLive, productId]
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
    return res.status(500).json({ ok: false, message: "product update failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "product live update failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "product delete failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "order create failed", error: String(error?.message ?? error) });
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
      "SELECT o.orderId, o.userId, o.paymentId, o.addressId, o.totalAmount, o.status, o.created_at, o.updated_at, " +
      "p.status AS paymentStatus, p.paymentMethod, p.depositorName, p.bankName, p.memo, p.updated_at AS paymentUpdatedAt " +
      "FROM orders o LEFT JOIN payment p ON p.paymentId = o.paymentId " +
      "WHERE o.userId = ? ORDER BY o.created_at DESC, o.orderId DESC",
      [userId]
    );
    const normalized = (Array.isArray(rows) ? rows : []).map((row) => ({
      ...row,
      orderNo: buildOrderNo(row.created_at, row.orderId),
    }));
    return res.json({ ok: true, orders: normalized });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "order list fetch failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "payment create failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "payment complete failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "payment complete failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "payment refund failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "order status update failed", error: String(error?.message ?? error) });
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
    return res.status(500).json({ ok: false, message: "admin order list fetch failed", error: String(error?.message ?? error) });
  }
});

autoAdvancePreparing().catch((error) => {
  console.error("autoAdvancePreparing failed:", error);
});

ensureCartTable().catch((error) => {
  console.error("ensureCartTable failed:", error);
});

setInterval(() => {
  autoAdvancePreparing().catch((error) => {
    console.error("autoAdvancePreparing failed:", error);
  });
}, 5 * 60 * 1000);

app.listen(port, () => {
  console.log(`Backend running on http://atto.cn602qo04clr.ap-northeast-2.rds.amazonaws.com:${port}`);
});
