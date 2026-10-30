CREATE FUNCTION app.preserve_confirmed_command() RETURNS trigger LANGUAGE plpgsql
SET search_path=pg_catalog AS $$
BEGIN
  IF OLD.state='confirmed' AND NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'El resultado confirmado es inmutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER command_result_immutable BEFORE UPDATE ON app.commands
FOR EACH ROW EXECUTE FUNCTION app.preserve_confirmed_command();
