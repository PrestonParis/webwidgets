-- Add role column to profiles.
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
        CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));

-- Prevent authenticated users from elevating their own role.
CREATE OR REPLACE FUNCTION public.prevent_role_self_elevation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role
       AND auth.role() <> 'service_role' THEN
        NEW.role := OLD.role;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_role_self_elevation ON public.profiles;
CREATE TRIGGER profiles_prevent_role_self_elevation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_elevation();

-- Service-role-only administrative helper. Invoke with an explicitly supplied
-- email at operation time; migrations must not embed account identities.
CREATE OR REPLACE FUNCTION public.grant_admin(target_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE public.profiles p
    SET role = 'admin'
    FROM auth.users u
    WHERE u.id = p.id
      AND lower(u.email) = lower(target_email);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No user found for the supplied administrative target';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_admin(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin(text) TO service_role;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'profiles'
          AND policyname = 'profiles_select_own'
    ) THEN
        EXECUTE $policy$
            CREATE POLICY profiles_select_own ON public.profiles
                FOR SELECT USING (auth.uid() = id)
        $policy$;
    END IF;
END;
$$;
