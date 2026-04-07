-- This schema defines the 'subscriptions' table for managing company subscriptions.
-- This is the final, robust version that includes indexing, named constraints, and cascade actions.

CREATE TABLE subscriptions (
    id VARCHAR(255) PRIMARY KEY,
    company_id VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
    tier VARCHAR(20) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    paystack_reference VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexing the foreign key is crucial for performance.
    INDEX idx_company_id (company_id),

    -- A named constraint with cascade rules ensures data integrity.
    CONSTRAINT fk_company_subscription
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
