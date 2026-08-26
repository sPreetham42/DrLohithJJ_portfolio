-- Migration: 0007_add_patent_status.sql
-- Adds constrained status column ('published' or 'granted') to patents table.

ALTER TABLE patents ADD COLUMN status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'granted'));

UPDATE patents SET status = 'published' WHERE status IS NULL OR status = '';
