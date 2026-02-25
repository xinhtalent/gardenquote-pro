-- Update quote status values
-- Add 'paid' status alongside existing 'pending' and 'confirmed'
-- Update existing 'confirmed' quotes to 'paid' to maintain consistency

-- First, update all 'confirmed' status to 'paid'
UPDATE quotes SET status = 'paid' WHERE status = 'confirmed';

-- The table already allows any text values for status, so no schema changes needed
-- Status values will now be: 'pending' (Chờ thanh toán) and 'paid' (Đã thanh toán)