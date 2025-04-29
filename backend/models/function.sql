CREATE OR REPLACE FUNCTION get_platform_by_id(p_platform_id INTEGER)
RETURNS TABLE (
    platform_id INTEGER,
    platform_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.platform_id, p.platform_name
    FROM PLATFORM p
    WHERE p.platform_id = p_platform_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_platform_by_id: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_platform_by_name(p_platform_name VARCHAR)
RETURNS TABLE (
    platform_id INTEGER,
    platform_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.platform_id, p.platform_name
    FROM PLATFORM p
    WHERE p.platform_name = p_platform_name;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_platform_by_name: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_platform(p_platform_name VARCHAR)
RETURNS JSON AS $$
DECLARE
    existing_platform RECORD;
    new_platform RECORD;
    result JSON;
BEGIN
    SELECT * INTO existing_platform
    FROM PLATFORM
    WHERE platform_name = p_platform_name;
    
    IF FOUND THEN
        SELECT json_build_object(
            'exists', true,
            'platform', json_build_object(
                'platform_id', existing_platform.platform_id,
                'platform_name', existing_platform.platform_name
            )
        ) INTO result;
    ELSE

        INSERT INTO PLATFORM (platform_name)
        VALUES (p_platform_name)
        RETURNING * INTO new_platform;
        
        SELECT json_build_object(
            'exists', false,
            'platform', json_build_object(
                'platform_id', new_platform.platform_id,
                'platform_name', new_platform.platform_name
            )
        ) INTO result;
    END IF;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in create_platform: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_platform(p_platform_id INTEGER, p_platform_name VARCHAR)
RETURNS TABLE (
    platform_id INTEGER,
    platform_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    UPDATE PLATFORM
    SET platform_name = p_platform_name
    WHERE platform_id = p_platform_id
    RETURNING platform_id, platform_name;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in update_platform: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE delete_platform(p_platform_id INTEGER)
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM PLATFORM
    WHERE platform_id = p_platform_id;

    IF NOT FOUND THEN
        RAISE NOTICE 'No platform found with ID: %', p_platform_id;
    ELSE
        RAISE NOTICE 'Platform with ID % deleted successfully.', p_platform_id;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in delete_platform: %', SQLERRM;
        RAISE;
END;
$$;

-- 2

CREATE OR REPLACE FUNCTION get_profile_by_email(p_email VARCHAR)
RETURNS TABLE (
    username VARCHAR,
    password_hash VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_pic VARCHAR,
    email VARCHAR,
    is_admin BOOLEAN,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM PROFILES
    WHERE email = p_email;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_profile(
    p_username VARCHAR,
    p_password_hash VARCHAR,
    p_email VARCHAR,
    p_first_name VARCHAR DEFAULT NULL,
    p_last_name VARCHAR DEFAULT NULL,
    p_profile_pic VARCHAR DEFAULT NULL,
    p_is_admin BOOLEAN DEFAULT false
)
RETURNS TABLE (
    username VARCHAR,
    email VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    is_admin BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO PROFILES (
        username,
        password_hash,
        email,
        first_name,
        last_name,
        profile_pic,
        is_admin
    )
    VALUES (
        p_username,
        p_password_hash,
        p_email,
        p_first_name,
        p_last_name,
        p_profile_pic,
        p_is_admin
    )
    RETURNING
        username,
        email,
        first_name,
        last_name,
        is_admin;
END;
$$ LANGUAGE plpgsql;