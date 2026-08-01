-- =====================================================================
-- Security regression checks
--
-- Re-verifies the RLS, SECURITY DEFINER and storage permission fixes.
-- Any regression raises an exception, which fails the CI job.
-- Run with:  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f scripts/security-regression.sql
-- =====================================================================

\set ON_ERROR_STOP on

DO $$
DECLARE
  failures text[] := '{}';
  n integer;
  tbl text;
BEGIN
  -- -----------------------------------------------------------------
  -- 1. RLS must be enabled on every public table
  -- -----------------------------------------------------------------
  FOR tbl IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace ns ON ns.oid = c.relnamespace
    WHERE ns.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
  LOOP
    failures := failures || format('RLS disabled on public.%s', tbl);
  END LOOP;

  -- -----------------------------------------------------------------
  -- 2. Every public table with RLS must have at least one policy
  -- -----------------------------------------------------------------
  FOR tbl IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace ns ON ns.oid = c.relnamespace
    WHERE ns.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
      AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname)
  LOOP
    failures := failures || format('Table public.%s has RLS but no policies', tbl);
  END LOOP;

  -- -----------------------------------------------------------------
  -- 3. Roles must never be writable by their own holders
  -- -----------------------------------------------------------------
  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'user_roles'
    AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
    AND coalesce(qual, '') !~ 'is_owner_admin'
    AND coalesce(with_check, '') !~ 'is_owner_admin';
  IF n > 0 THEN
    failures := failures || 'user_roles has write policies that do not require owner-admin';
  END IF;

  -- -----------------------------------------------------------------
  -- 4. Confidential product columns must stay hidden from the public API
  -- -----------------------------------------------------------------
  SELECT count(*) INTO n
  FROM information_schema.column_privileges
  WHERE table_schema = 'public' AND table_name = 'products'
    AND grantee IN ('anon', 'authenticated')
    AND privilege_type = 'SELECT'
    AND column_name IN ('cost_price', 'supplier_name', 'supplier_email', 'supplier_id',
                        'reorder_point', 'avg_daily_sales', 'last_sales_calculation');
  IF n > 0 THEN
    failures := failures || format('%s confidential products column(s) readable by anon/authenticated', n);
  END IF;

  -- -----------------------------------------------------------------
  -- 5. Ownership-scoped tables must bind inserts to auth.uid()
  -- -----------------------------------------------------------------
  FOR tbl IN SELECT unnest(ARRAY['analytics_events', 'abandoned_carts'])
  LOOP
    SELECT count(*) INTO n
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = tbl
      AND cmd IN ('INSERT', 'ALL')
      AND coalesce(with_check, qual, '') !~ 'auth\.uid\(\)'
      AND coalesce(with_check, qual, '') !~ 'has_role';
    IF n > 0 THEN
      failures := failures || format('%s allows inserts without an auth.uid() check', tbl);
    END IF;
  END LOOP;

  -- -----------------------------------------------------------------
  -- 6. stock_notifications must not leak other people's email addresses
  -- -----------------------------------------------------------------
  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'stock_notifications'
    AND cmd IN ('SELECT', 'ALL')
    AND coalesce(qual, '') !~ 'auth\.uid\(\)'
    AND coalesce(qual, '') !~ 'has_role';
  IF n > 0 THEN
    failures := failures || 'stock_notifications has an unscoped read policy';
  END IF;

  -- -----------------------------------------------------------------
  -- 7. Backend-only SECURITY DEFINER functions must not be publicly callable
  -- -----------------------------------------------------------------
  FOR tbl IN
    SELECT p.proname
    FROM pg_proc p
    JOIN pg_namespace ns ON ns.oid = p.pronamespace
    WHERE ns.nspname = 'public'
      AND p.prosecdef
      AND p.proname IN (
        'delete_user', 'decrement_product_stock', 'update_customer_stats',
        'consume_rate_limit', 'log_audit_event',
        'insert_admin_audit_log', 'generate_po_number'
      )
      AND (
        has_function_privilege('anon', p.oid, 'EXECUTE')
        OR (p.proname IN ('delete_user', 'decrement_product_stock', 'update_customer_stats',
                          'consume_rate_limit', 'log_audit_event')
            AND has_function_privilege('authenticated', p.oid, 'EXECUTE'))
      )
  LOOP
    failures := failures || format('SECURITY DEFINER function %s is callable by anon/authenticated', tbl);
  END LOOP;

  -- -----------------------------------------------------------------
  -- 8. Every SECURITY DEFINER function must pin search_path
  -- -----------------------------------------------------------------
  FOR tbl IN
    SELECT p.proname
    FROM pg_proc p
    JOIN pg_namespace ns ON ns.oid = p.pronamespace
    WHERE ns.nspname = 'public' AND p.prosecdef
      AND NOT EXISTS (
        SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) cfg WHERE cfg LIKE 'search_path=%'
      )
  LOOP
    failures := failures || format('SECURITY DEFINER function %s does not pin search_path', tbl);
  END LOOP;

  -- -----------------------------------------------------------------
  -- 9. Storage: write policies must be scoped, listing must not be open
  -- -----------------------------------------------------------------
  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
    AND cmd IN ('INSERT', 'UPDATE', 'ALL')
    AND coalesce(with_check, '') !~ 'bucket_id';
  IF n > 0 THEN
    failures := failures || format('%s storage write policy/policies missing a bucket_id check', n);
  END IF;

  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
    AND cmd IN ('SELECT', 'ALL')
    AND coalesce(qual, '') = 'true';
  IF n > 0 THEN
    failures := failures || 'storage.objects has a fully unrestricted read/list policy';
  END IF;

  -- -----------------------------------------------------------------
  -- 10. Audit trail must remain append-only for clients
  -- -----------------------------------------------------------------
  SELECT count(*) INTO n
  FROM information_schema.table_privileges
  WHERE table_schema = 'public' AND table_name = 'admin_audit_log'
    AND grantee IN ('anon', 'authenticated')
    AND privilege_type IN ('UPDATE', 'DELETE');
  IF n > 0 THEN
    failures := failures || 'admin_audit_log is editable by anon/authenticated';
  END IF;

  -- -----------------------------------------------------------------
  -- 11. Rate limit counters must be backend-only
  -- -----------------------------------------------------------------
  SELECT count(*) INTO n
  FROM information_schema.table_privileges
  WHERE table_schema = 'public' AND table_name = 'rate_limit_counters'
    AND grantee IN ('anon', 'authenticated');
  IF n > 0 THEN
    failures := failures || 'rate_limit_counters is reachable by anon/authenticated';
  END IF;

  -- -----------------------------------------------------------------
  IF array_length(failures, 1) > 0 THEN
    RAISE EXCEPTION E'SECURITY REGRESSIONS DETECTED:\n  - %', array_to_string(failures, E'\n  - ');
  END IF;

  RAISE NOTICE 'All security regression checks passed.';
END;
$$;
