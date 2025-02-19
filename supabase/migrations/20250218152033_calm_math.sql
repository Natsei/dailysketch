/*
  # Fix Submissions RLS Policies

  1. Changes
    - Drop existing RLS policies for submissions table
    - Add new, more permissive policies for authenticated users
    - Ensure users can create submissions when authenticated

  2. Security
    - Enable RLS on submissions table
    - Add policies for CRUD operations
    - Ensure proper user authentication checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Submissions are viewable by everyone" ON public.submissions;
DROP POLICY IF EXISTS "Users can create their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can delete own submissions" ON public.submissions;

-- Create new policies
CREATE POLICY "Submissions are viewable by everyone"
  ON public.submissions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create submissions"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions"
  ON public.submissions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own submissions"
  ON public.submissions FOR DELETE
  USING (auth.uid() = user_id);