BEGIN;
    SET LOCAL role = 'authenticated';
    SET LOCAL "request.jwt.claims" = '{"sub": "..."}';

    SELECT count(*) FROM recovery_profiles; 
COMMIT;

SELECT id, email FROM auth.users;