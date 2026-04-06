
-- This schema defines the 'subscriptions' table for managing company subscriptions.
--
-- To prevent "errno: 150" (Foreign key constraint is incorrectly formed), we are explicitly setting:
-- 1. ENGINE=InnoDB: Both tables must use a storage engine that supports foreign keys.
-- 2. CHARSET and COLLATE: The character set and collation must match the referenced column.

CREATE TABLE subscriptions (
    id VARCHAR(255) PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    tier VARCHAR(20) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    paystack_reference VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

