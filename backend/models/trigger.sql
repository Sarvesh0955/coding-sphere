CREATE OR REPLACE FUNCTION prevent_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_admin = true THEN
        RAISE EXCEPTION 'Cannot delete admin user';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_admin_delete
    BEFORE DELETE ON PROFILES
    FOR EACH ROW
    EXECUTE FUNCTION prevent_admin_deletion();

-- CREATE OR REPLACE FUNCTION check_password_update()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     IF NEW.password_hash = OLD.password_hash THEN
--         RAISE EXCEPTION 'New password cannot be the same as the old password';
--     END IF;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER before_password_update
-- BEFORE UPDATE OF password_hash ON PROFILES
-- FOR EACH ROW
-- EXECUTE FUNCTION check_password_update();

