-- Update global_settings table to store multiple payment emojis
-- Remove single payment_emoji column and add array of emojis
ALTER TABLE public.global_settings 
DROP COLUMN IF EXISTS payment_emoji;

ALTER TABLE public.global_settings
ADD COLUMN payment_emojis text[] DEFAULT ARRAY['❤️','🩷','🧡','💛','🍷','🥂','🍾'];