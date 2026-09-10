CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50),
    email VARCHAR(255),
    password_hash VARCHAR(255)
);
 