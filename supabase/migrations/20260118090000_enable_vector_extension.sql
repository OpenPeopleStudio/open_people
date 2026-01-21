-- Ensure pgvector is available before any migrations that rely on it
create extension if not exists vector;
