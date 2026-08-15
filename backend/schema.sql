CREATE DATABASE IF NOT EXISTS `@@DB_NAME@@`;
USE `@@DB_NAME@@`;

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. categories  (no dependencies)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id   INT          AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 2. admins  (no dependencies)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id            INT          AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(191) NOT NULL UNIQUE,
    email         VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 3. users  (no dependencies)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            INT          AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(255) NOT NULL,
    email         VARCHAR(191) NOT NULL UNIQUE,
    phone         VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('customer','provider','admin') DEFAULT 'customer',
    avatar        VARCHAR(255),
    location      VARCHAR(255),
    latitude      DECIMAL(10,8),
    longitude     DECIMAL(11,8),
    status        ENUM('pending','verified','rejected','blocked') DEFAULT 'pending',
    status_reason VARCHAR(255) DEFAULT NULL,
    otp_code      VARCHAR(10),
    otp_expiry    TIMESTAMP    NULL DEFAULT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 4. refresh_tokens  → users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         INT       AUTO_INCREMENT PRIMARY KEY,
    user_id    INT       NOT NULL,
    token      TEXT      NOT NULL,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 5. provider_profiles  → users, categories, admins
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_profiles (
    user_id               INT           PRIMARY KEY,
    bio                   TEXT,
    experience_years      INT           DEFAULT 0,
    skills                JSON,
    availability          BOOLEAN       DEFAULT TRUE,
    rating                DECIMAL(3,2)  DEFAULT 0.00,
    total_jobs            INT           DEFAULT 0,
    success_rate          DECIMAL(5,2)  DEFAULT 0.00,
    category_id           INT,
    cnic_url              VARCHAR(255),
    certificates_url      VARCHAR(255),
    is_online             BOOLEAN       DEFAULT FALSE,
    ai_confidence_score   INT           DEFAULT NULL,
    ai_verification_notes TEXT          DEFAULT NULL,
    reviewed_by           INT           DEFAULT NULL,
    FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES admins(id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 6. jobs  → users, categories
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
    id                 INT           AUTO_INCREMENT PRIMARY KEY,
    customer_id        INT           NOT NULL,
    title              VARCHAR(255)  NOT NULL,
    description        TEXT,
    category_id        INT,
    budget             DECIMAL(10,2),
    location           VARCHAR(255),
    preferred_date     DATE,
    preferred_time     TIME,
    images             JSON,
    status             ENUM('open','active','completed','cancelled') DEFAULT 'open',
    latitude           DECIMAL(10,8),
    longitude          DECIMAL(11,8),
    is_negotiable      BOOLEAN       DEFAULT FALSE,
    is_emergency       BOOLEAN       DEFAULT FALSE,
    ai_dispute_summary TEXT          DEFAULT NULL,
    created_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id)      ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 7. bids  → jobs, users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS bids (
    id             INT           AUTO_INCREMENT PRIMARY KEY,
    job_id         INT           NOT NULL,
    provider_id    INT           NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    estimated_time VARCHAR(100),
    cover_letter   TEXT,
    status         ENUM('pending','accepted','rejected') DEFAULT 'pending',
    created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id)      REFERENCES jobs(id)  ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 8. bookings  → jobs, bids, users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id                 INT          AUTO_INCREMENT PRIMARY KEY,
    job_id             INT          NOT NULL,
    bid_id             INT          DEFAULT NULL,
    customer_id        INT          NOT NULL,
    provider_id        INT          NOT NULL,
    status             ENUM('confirmed','in_progress','awaiting_confirmation','completed','cancelled') DEFAULT 'confirmed',
    verification_token VARCHAR(255) DEFAULT NULL,
    created_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id)      REFERENCES jobs(id)  ON DELETE CASCADE,
    FOREIGN KEY (bid_id)      REFERENCES bids(id)  ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 9. reviews  → jobs, bookings, users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id          INT       AUTO_INCREMENT PRIMARY KEY,
    job_id      INT       NOT NULL,
    booking_id  INT       NOT NULL,
    customer_id INT       NOT NULL,
    provider_id INT       NOT NULL,
    rating      TINYINT   NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_booking_review (booking_id),
    FOREIGN KEY (job_id)      REFERENCES jobs(id)     ON DELETE CASCADE,
    FOREIGN KEY (booking_id)  REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 10. messages  → jobs, users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    job_id      INT          NOT NULL,
    sender_id   INT          NOT NULL,
    receiver_id INT          NOT NULL,
    content     TEXT,
    image_url   VARCHAR(255) DEFAULT NULL,
    is_read     BOOLEAN      DEFAULT FALSE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id)      REFERENCES jobs(id)  ON DELETE CASCADE,
    FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 11. notifications  → users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id         INT          AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    title      VARCHAR(255) NOT NULL,
    message    TEXT         NOT NULL,
    type       VARCHAR(50)  NOT NULL,
    is_read    BOOLEAN      DEFAULT FALSE,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 12. wallets  → users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallets (
    id         INT           AUTO_INCREMENT PRIMARY KEY,
    user_id    INT           NOT NULL UNIQUE,
    balance    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 13. wallet_transactions  → wallets, users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id             INT           AUTO_INCREMENT PRIMARY KEY,
    user_id        INT           NOT NULL,
    type           ENUM('credit','debit') NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    description    VARCHAR(255)  NOT NULL,
    reference_type ENUM('topup','withdrawal','payment','refund','earning') NOT NULL DEFAULT 'topup',
    reference_id   INT           DEFAULT NULL,
    balance_after  DECIMAL(10,2) NOT NULL,
    status         ENUM('completed','pending','failed') NOT NULL DEFAULT 'completed',
    created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- Safe migration: add escrow_amount to bookings if absent
-- --------------------------------------------------------
DROP PROCEDURE IF EXISTS _kk_add_escrow_col;
CREATE PROCEDURE _kk_add_escrow_col()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'bookings'
          AND COLUMN_NAME  = 'escrow_amount'
    ) THEN
        ALTER TABLE bookings
            ADD COLUMN escrow_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00;
    END IF;
END;
CALL _kk_add_escrow_col();
DROP PROCEDURE IF EXISTS _kk_add_escrow_col;

-- --------------------------------------------------------
-- Seed Categories
-- --------------------------------------------------------
INSERT IGNORE INTO categories (name, icon) VALUES
('Plumber',          'plumber_icon'),
('Electrician',      'electrician_icon'),
('Carpenter',        'carpenter_icon'),
('Painter',          'painter_icon'),
('Cleaner',          'cleaner_icon'),
('Gardener',         'gardener_icon'),
('AC Repair',        'ac_repair_icon'),
('Appliance Repair', 'appliance_repair_icon');
