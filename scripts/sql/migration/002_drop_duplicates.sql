-- Keep only the most recent token per user, delete duplicates
DELETE FROM user_tokens
WHERE ctid NOT IN (
    SELECT DISTINCT ON (user_id) ctid
    FROM user_tokens
    ORDER BY user_id, updated_at DESC
);

-- Add unique constraint to prevent this happening again
ALTER TABLE user_tokens DROP CONSTRAINT IF EXISTS user_tokens_pkey;
ALTER TABLE user_tokens ADD PRIMARY KEY (user_id);