SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recovery_profiles' AND column_name = 'user_id';