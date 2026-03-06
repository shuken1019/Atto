-- 1) 앱 전용 최소 권한 계정 생성
CREATE USER IF NOT EXISTS 'atto_app'@'%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';

-- 2) 필요한 DML 권한만 부여 (스키마명은 실제 운영 DB로 변경)
GRANT SELECT, INSERT, UPDATE, DELETE ON `atto_prod`.* TO 'atto_app'@'%';
FLUSH PRIVILEGES;

-- 3) 감사 로그 테이블 (선택)
CREATE TABLE IF NOT EXISTS `atto_prod`.audit_log (
  auditId BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actorUserId BIGINT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  targetType VARCHAR(80) NOT NULL,
  targetId VARCHAR(120) NULL,
  ip VARCHAR(64) NULL,
  userAgent VARCHAR(255) NULL,
  metadata JSON NULL,
  PRIMARY KEY (auditId),
  KEY idx_audit_created_at (created_at),
  KEY idx_audit_actor (actorUserId),
  KEY idx_audit_action (action)
);
