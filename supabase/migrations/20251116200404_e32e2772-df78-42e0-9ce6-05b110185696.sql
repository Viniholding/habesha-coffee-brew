-- Add explicit RLS denial policies for unauthenticated access

-- Block unauthenticated access to profiles table
CREATE POLICY "Deny all unauthenticated access to profiles" 
ON profiles 
FOR ALL 
TO anon 
USING (false);

-- Block unauthenticated access to addresses table
CREATE POLICY "Deny all unauthenticated access to addresses" 
ON addresses 
FOR ALL 
TO anon 
USING (false);

-- Block direct table manipulation for account_deletion_requests
-- Only RPC functions should be able to modify this table
CREATE POLICY "Block direct inserts to deletion requests" 
ON account_deletion_requests 
FOR INSERT 
TO authenticated 
WITH CHECK (false);

CREATE POLICY "Block direct updates to deletion requests" 
ON account_deletion_requests 
FOR UPDATE 
TO authenticated 
USING (false);

CREATE POLICY "Block direct deletes to deletion requests" 
ON account_deletion_requests 
FOR DELETE 
TO authenticated 
USING (false);