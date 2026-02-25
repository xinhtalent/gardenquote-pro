-- Step 1: Add user_sequence_number column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_sequence_number INTEGER;

-- Step 2: Assign sequence numbers to existing users (based on created_at)
WITH numbered_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as seq_num
  FROM profiles
)
UPDATE profiles
SET user_sequence_number = numbered_users.seq_num
FROM numbered_users
WHERE profiles.id = numbered_users.id;

-- Step 3: Create sequence for auto-increment
CREATE SEQUENCE IF NOT EXISTS user_sequence_seq START WITH 1;

-- Sync sequence to current max value
SELECT setval('user_sequence_seq', (SELECT COALESCE(MAX(user_sequence_number), 0) + 1 FROM profiles));

-- Step 4: Update handle_new_user() trigger to auto-assign sequence number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, user_sequence_number)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    nextval('user_sequence_seq')
  );
  RETURN new;
END;
$$;

-- Step 5: Update all existing quote_code values to new format XINH-DDMMYY-ZXX
WITH user_quotes AS (
  SELECT 
    q.id,
    q.date,
    q.user_id,
    p.user_sequence_number,
    ROW_NUMBER() OVER (PARTITION BY q.user_id, q.date ORDER BY q.created_at) as daily_seq
  FROM quotes q
  LEFT JOIN profiles p ON p.id = q.user_id
)
UPDATE quotes
SET quote_code = CONCAT(
  'XINH-',
  TO_CHAR(user_quotes.date, 'DDMMYY'),
  '-',
  user_quotes.user_sequence_number::text,
  LPAD(user_quotes.daily_seq::text, 2, '0')
)
FROM user_quotes
WHERE quotes.id = user_quotes.id;