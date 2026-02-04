-- SQL schema for af_pointredeems
CREATE TABLE IF NOT EXISTS af_pointredeems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mobile VARCHAR(32) NOT NULL,
  redeem_points INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mobile_created_at (mobile, created_at)
);