CREATE OR REPLACE FUNCTION prevent_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_admin = true THEN
        RAISE EXCEPTION 'Cannot delete admin user';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER prevent_admin_delete
    BEFORE DELETE ON PROFILES
    FOR EACH ROW
    EXECUTE FUNCTION prevent_admin_deletion();

CREATE OR REPLACE FUNCTION check_password_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.password_hash = OLD.password_hash THEN
        RAISE EXCEPTION 'New password cannot be the same as the old password';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER before_password_update
BEFORE UPDATE OF password_hash ON PROFILES
FOR EACH ROW
EXECUTE FUNCTION check_password_update();

-- Function to maintain the Dynamic Problemset at 10 questions per user
CREATE OR REPLACE FUNCTION maintain_dynamic_problemset()
RETURNS TRIGGER AS $$
DECLARE
    problem_count INTEGER;
BEGIN
    -- Count the number of problems for this user after inserting the new row
    SELECT COUNT(*) INTO problem_count
    FROM DYNAMIC_PROBLEMS
    WHERE username = NEW.username;
    
    -- If the user has more than 10 problems, remove the oldest ones
    IF problem_count > 10 THEN
        -- Find and delete the oldest entries beyond the 10 limit
        DELETE FROM DYNAMIC_PROBLEMS
        WHERE (username, added_at, platform_id, question_id) IN (
            SELECT username, added_at, platform_id, question_id
            FROM DYNAMIC_PROBLEMS
            WHERE username = NEW.username
            ORDER BY added_at ASC
            LIMIT (problem_count - 10)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS dynamic_problemset_limit_trigger ON DYNAMIC_PROBLEMS;

-- Create the trigger
CREATE OR REPLACE TRIGGER dynamic_problemset_limit_trigger
AFTER INSERT ON DYNAMIC_PROBLEMS
FOR EACH ROW
EXECUTE FUNCTION maintain_dynamic_problemset();