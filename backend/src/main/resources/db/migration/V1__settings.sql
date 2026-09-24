-- One user, one settings row.
CREATE TABLE settings (
    id                    BIGINT PRIMARY KEY CHECK (id = 1),
    display_name          VARCHAR(100) NOT NULL,
    email                 VARCHAR(254),
    timezone              VARCHAR(64)  NOT NULL,
    notifications_enabled BOOLEAN      NOT NULL,
    default_view          VARCHAR(20)  NOT NULL
);

INSERT INTO settings VALUES (1, 'QuickFlow user', NULL, 'UTC', TRUE, 'DASHBOARD');
