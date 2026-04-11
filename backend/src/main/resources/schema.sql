CREATE TABLE IF NOT EXISTS running_record (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(255),
    run_date      DATE          NOT NULL,
    distance_km   DOUBLE        NOT NULL,
    duration_seconds INTEGER,
    coordinates   TEXT,
    created_at    TIMESTAMP     NOT NULL
);

CREATE TABLE IF NOT EXISTS goal (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    monthly_distance_km  DOUBLE    NOT NULL,
    created_at           TIMESTAMP NOT NULL
);
