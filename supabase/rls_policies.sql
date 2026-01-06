-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Check if current user is admin (bypasses RLS)
-- ============================================================================
-- This function uses SECURITY DEFINER to bypass RLS when checking admin status
-- This prevents infinite recursion in RLS policies
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.roles r ON u.user_role_id = r.role_id
    WHERE u.user_id = auth.uid()
    AND r.role_name = 'admin'
  );
$$;

-- ============================================================================
-- 1. ROLES TABLE
-- ============================================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.roles;
DROP POLICY IF EXISTS "Only service role can modify roles" ON public.roles;

CREATE POLICY "Roles are viewable by everyone"
ON public.roles FOR SELECT
TO authenticated
USING (true);

-- Only service role can modify roles
CREATE POLICY "Only service role can modify roles"
ON public.roles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Subscriptions are viewable by everyone" ON public.subscriptions;
DROP POLICY IF EXISTS "Only service role can modify subscriptions" ON public.subscriptions;

-- Everyone can read subscriptions
CREATE POLICY "Subscriptions are viewable by everyone"
ON public.subscriptions FOR SELECT
TO authenticated
USING (true);

-- Only service role can modify subscriptions
CREATE POLICY "Only service role can modify subscriptions"
ON public.subscriptions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 3. USERS TABLE
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view company names for bookings" ON public.users;
DROP POLICY IF EXISTS "Only service role can modify users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- Users can view their own data
CREATE POLICY "Users can view their own data"
ON public.users FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- Admins can view all users
-- Uses is_admin() function to avoid infinite recursion
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
TO authenticated
USING (public.is_admin());

-- Allow authenticated users to read company names for booking display
-- This enables the booking calendar to show who has booked each time slot
CREATE POLICY "Users can view company names for bookings"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- Only service role can insert/update/delete users (via admin actions)
CREATE POLICY "Only service role can modify users"
ON public.users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users can update their own data (except role and subscription - admin only)
CREATE POLICY "Users can update their own data"
ON public.users FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- 3b. INVITES TABLE
-- ============================================================================

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only service role can modify invites" ON public.invites;

-- Only service role can read and modify invites
CREATE POLICY "Only service role can modify invites"
ON public.invites FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 4. AMENITIES TABLE
-- ============================================================================

ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Amenities are viewable by everyone" ON public.amenities;
DROP POLICY IF EXISTS "Only service role can modify amenities" ON public.amenities;

-- Everyone can read amenities
CREATE POLICY "Amenities are viewable by everyone"
ON public.amenities FOR SELECT
TO authenticated
USING (true);

-- Only service role can modify amenities
CREATE POLICY "Only service role can modify amenities"
ON public.amenities FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 5. MEETING_ROOMS TABLE
-- ============================================================================

ALTER TABLE public.meeting_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Meeting rooms are viewable by everyone" ON public.meeting_rooms;
DROP POLICY IF EXISTS "Only service role can modify meeting rooms" ON public.meeting_rooms;

-- Everyone can read meeting rooms
CREATE POLICY "Meeting rooms are viewable by everyone"
ON public.meeting_rooms FOR SELECT
TO authenticated
USING (true);

-- Only service role can modify meeting rooms
CREATE POLICY "Only service role can modify meeting rooms"
ON public.meeting_rooms FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 6. BOOKINGS TABLE
-- ============================================================================

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "All authenticated users can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can modify all bookings" ON public.bookings;

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT
TO authenticated
USING ((select auth.uid()) = booking_user_id);

-- Admins can view all bookings
-- Uses is_admin() function to avoid infinite recursion
CREATE POLICY "Admins can view all bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (public.is_admin());

-- All authenticated users can view all bookings (for calendar/availability display)
-- This allows users to see which time slots are already taken
CREATE POLICY "All authenticated users can view all bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (true);

-- Users can create their own bookings
CREATE POLICY "Users can create their own bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = booking_user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update their own bookings"
ON public.bookings FOR UPDATE
TO authenticated
USING ((select auth.uid()) = booking_user_id)
WITH CHECK ((select auth.uid()) = booking_user_id);

-- Users can delete their own bookings
CREATE POLICY "Users can delete their own bookings"
ON public.bookings FOR DELETE
TO authenticated
USING ((select auth.uid()) = booking_user_id);

-- Admins can modify all bookings
-- Uses is_admin() function to avoid infinite recursion
CREATE POLICY "Admins can modify all bookings"
ON public.bookings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- 7. BOOKING_AMENITIES TABLE (Junction Table)
-- ============================================================================

ALTER TABLE public.booking_amenities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view amenities for their own bookings" ON public.booking_amenities;
DROP POLICY IF EXISTS "Users can add amenities to their own bookings" ON public.booking_amenities;
DROP POLICY IF EXISTS "Users can remove amenities from their own bookings" ON public.booking_amenities;
DROP POLICY IF EXISTS "Admins can modify all booking amenities" ON public.booking_amenities;

-- Users can view amenities for their own bookings
CREATE POLICY "Users can view amenities for their own bookings"
ON public.booking_amenities FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.booking_id = booking_amenities.booking_id
    AND b.booking_user_id = (select auth.uid())
  )
);

-- Users can add amenities to their own bookings
CREATE POLICY "Users can add amenities to their own bookings"
ON public.booking_amenities FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.booking_id = booking_amenities.booking_id
    AND b.booking_user_id = (select auth.uid())
  )
);

-- Users can remove amenities from their own bookings
CREATE POLICY "Users can remove amenities from their own bookings"
ON public.booking_amenities FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.booking_id = booking_amenities.booking_id
    AND b.booking_user_id = (select auth.uid())
  )
);

-- Admins can view/modify all booking amenities
-- Uses is_admin() function to avoid infinite recursion
CREATE POLICY "Admins can modify all booking amenities"
ON public.booking_amenities FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- 8. MEETING_ROOM_AMENITIES TABLE (Junction Table)
-- ============================================================================

ALTER TABLE public.meeting_room_amenities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Meeting room amenities are viewable by everyone" ON public.meeting_room_amenities;
DROP POLICY IF EXISTS "Only service role can modify meeting room amenities" ON public.meeting_room_amenities;

-- Everyone can read meeting room amenities
CREATE POLICY "Meeting room amenities are viewable by everyone"
ON public.meeting_room_amenities FOR SELECT
TO authenticated
USING (true);

-- Only service role can modify meeting room amenities
CREATE POLICY "Only service role can modify meeting room amenities"
ON public.meeting_room_amenities FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 9. ROOM_UNAVAILABILITIES TABLE
-- ============================================================================

ALTER TABLE public.room_unavailabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Room unavailabilities are viewable by everyone" ON public.room_unavailabilities;
DROP POLICY IF EXISTS "Only service role can modify room unavailabilities" ON public.room_unavailabilities;

-- Everyone can read room unavailabilities (needed for calendar/availability display)
CREATE POLICY "Room unavailabilities are viewable by everyone"
ON public.room_unavailabilities FOR SELECT
TO authenticated
USING (true);

-- Only service role can modify room unavailabilities
CREATE POLICY "Only service role can modify room unavailabilities"
ON public.room_unavailabilities FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 10. STORAGE: MEETING-ROOM-IMAGES BUCKET
-- ============================================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "All authenticated users can read meeting room images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can mutate meeting room images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can mutate meeting room images" ON storage.objects;

-- All authenticated users can read images from the bucket
CREATE POLICY "All authenticated users can read meeting room images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'meeting-room-images');

-- Only admins can insert/update/delete images in the bucket
-- Uses is_admin() function to avoid infinite recursion
CREATE POLICY "Admins can mutate meeting room images"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'meeting-room-images'
  AND public.is_admin()
)
WITH CHECK (
  bucket_id = 'meeting-room-images'
  AND public.is_admin()
);

-- Service role can create, update, and delete images (for admin actions using supabaseAdmin)
-- FOR ALL covers INSERT (create), UPDATE, DELETE, and SELECT operations
CREATE POLICY "Service role can mutate meeting room images"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'meeting-room-images')
WITH CHECK (bucket_id = 'meeting-room-images');



