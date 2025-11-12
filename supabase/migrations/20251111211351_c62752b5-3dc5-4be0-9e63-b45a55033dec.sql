-- Create function to delete user account and all associated data
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();
  
  -- Ensure user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Delete user's cart items
  DELETE FROM public.cart_items WHERE user_id = current_user_id;
  
  -- Delete user's order issues
  DELETE FROM public.order_issues WHERE user_id = current_user_id;
  
  -- Delete user's order items (via orders)
  DELETE FROM public.order_items WHERE order_id IN (
    SELECT id FROM public.orders WHERE user_id = current_user_id
  );
  
  -- Delete user's orders
  DELETE FROM public.orders WHERE user_id = current_user_id;
  
  -- Delete user's subscriptions
  DELETE FROM public.subscriptions WHERE user_id = current_user_id;
  
  -- Delete user's addresses
  DELETE FROM public.addresses WHERE user_id = current_user_id;
  
  -- Delete user's payment methods
  DELETE FROM public.payment_methods WHERE user_id = current_user_id;
  
  -- Delete user's notification preferences
  DELETE FROM public.notification_preferences WHERE user_id = current_user_id;
  
  -- Delete user's delivery preferences
  DELETE FROM public.delivery_preferences WHERE user_id = current_user_id;
  
  -- Delete user's profile
  DELETE FROM public.profiles WHERE id = current_user_id;
  
  -- Delete user from auth.users (this will cascade to any remaining related data)
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;