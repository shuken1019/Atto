import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "12345",
  database: process.env.DB_NAME ?? "atto",
  waitForConnections: true,
  connectionLimit: 10,
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  })
);
app.use(express.json());

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
      "SELECT userId, id, mail, password, name FROM `user` WHERE mail = ? OR id = ? LIMIT 1",
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
      "INSERT INTO `user` (id, name, phone, mail, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
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
    return res.status(201).json({ ok: true, orderId: insertResult.insertId });
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
    return res.json({ ok: true, orders: rows });
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

autoAdvancePreparing().catch((error) => {
  console.error("autoAdvancePreparing failed:", error);
});

setInterval(() => {
  autoAdvancePreparing().catch((error) => {
    console.error("autoAdvancePreparing failed:", error);
  });
}, 5 * 60 * 1000);

app.listen(port, () => {
  console.log(`Backend running on http://127.0.0.1:${port}`);
});

