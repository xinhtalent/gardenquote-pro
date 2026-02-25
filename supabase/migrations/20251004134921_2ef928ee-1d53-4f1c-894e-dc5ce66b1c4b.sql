-- Create enums
CREATE TYPE public.project_status AS ENUM (
  'PLANNED',
  'SCHEDULED', 
  'DEPOSITED',
  'IN_PROGRESS',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE public.app_role AS ENUM ('admin', 'advisor');

-- Helper function to normalize Vietnamese phone numbers
CREATE OR REPLACE FUNCTION public.normalize_phone(phone_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Remove all non-numeric characters, keep leading zero
  RETURN regexp_replace(phone_input, '[^0-9]', '', 'g');
END;
$$;

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role public.app_role NOT NULL DEFAULT 'advisor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status_display TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(phone)
);

CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_owner ON public.customers(owner_id);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  quote_id UUID,
  title TEXT NOT NULL,
  status public.project_status NOT NULL DEFAULT 'PLANNED',
  scheduled_date TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_customer ON public.projects(customer_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_by ON public.projects(created_by);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Quotes table
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  deposit_required NUMERIC(12,2) NOT NULL DEFAULT 0,
  deposit_received BOOLEAN NOT NULL DEFAULT false,
  deposit_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  deposit_paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotes_project ON public.quotes(project_id);
CREATE UNIQUE INDEX idx_quotes_code ON public.quotes(code);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Project photos table
CREATE TABLE public.project_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('BEFORE', 'DURING', 'AFTER')),
  storage_path TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_photos_project ON public.project_photos(project_id);
CREATE INDEX idx_project_photos_phase ON public.project_photos(phase);

ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

-- Project appointments table
CREATE TABLE public.project_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('SURVEY', 'INSTALL', 'HANDOVER')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  location TEXT,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_appointments_project ON public.project_appointments(project_id);
CREATE INDEX idx_project_appointments_start ON public.project_appointments(start_at);

ALTER TABLE public.project_appointments ENABLE ROW LEVEL SECURITY;

-- Project deposits table (manual confirmation + rollback)
CREATE TABLE public.project_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'VND',
  payment_method TEXT,
  reference_code TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  is_void BOOLEAN NOT NULL DEFAULT false,
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  void_reason TEXT,
  prev_status public.project_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_deposits_project ON public.project_deposits(project_id);
CREATE INDEX idx_project_deposits_quote ON public.project_deposits(quote_id);
CREATE INDEX idx_project_deposits_void ON public.project_deposits(is_void);

ALTER TABLE public.project_deposits ENABLE ROW LEVEL SECURITY;

-- Project activities table (timeline)
CREATE TABLE public.project_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_activities_project ON public.project_activities(project_id);
CREATE INDEX idx_project_activities_created ON public.project_activities(created_at DESC);

ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;

-- Items catalog table
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_items_active ON public.items(is_active);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Add foreign key for projects.quote_id after quotes table exists
ALTER TABLE public.projects 
ADD CONSTRAINT fk_projects_quote 
FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE SET NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trigger_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trigger_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Function to generate quote code
CREATE OR REPLACE FUNCTION public.generate_quote_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
  code TEXT;
BEGIN
  -- Get the highest existing number
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.quotes
  WHERE code ~ '^XQ-[0-9]+$';
  
  -- Format as XQ-000001
  code := 'XQ-' || LPAD(next_num::TEXT, 6, '0');
  RETURN code;
END;
$$;

-- Trigger to auto-generate quote code
CREATE OR REPLACE FUNCTION public.set_quote_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := public.generate_quote_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_quotes_set_code
  BEFORE INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_quote_code();

-- Function to handle deposit confirmation
CREATE OR REPLACE FUNCTION public.handle_deposit_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_quote_id UUID;
  v_current_status project_status;
BEGIN
  -- Only process non-voided deposits
  IF NEW.is_void = false AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.is_void = true)) THEN
    v_project_id := NEW.project_id;
    v_quote_id := NEW.quote_id;
    
    -- Get current project status
    SELECT status INTO v_current_status FROM projects WHERE id = v_project_id;
    
    -- Save previous status if not already set
    IF NEW.prev_status IS NULL THEN
      NEW.prev_status := v_current_status;
    END IF;
    
    -- Update project status to DEPOSITED
    UPDATE projects 
    SET status = 'DEPOSITED'
    WHERE id = v_project_id;
    
    -- Update quote deposit info
    IF v_quote_id IS NOT NULL THEN
      UPDATE quotes
      SET 
        deposit_amount = COALESCE(deposit_amount, 0) + NEW.amount,
        deposit_received = (COALESCE(deposit_amount, 0) + NEW.amount >= deposit_required),
        deposit_paid_at = NEW.received_at
      WHERE id = v_quote_id;
    END IF;
    
    -- Log activity
    INSERT INTO project_activities (project_id, actor_id, event, payload)
    VALUES (
      v_project_id,
      auth.uid(),
      'DEPOSIT_CONFIRMED',
      jsonb_build_object('deposit_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_deposit_confirmation
  BEFORE INSERT OR UPDATE ON public.project_deposits
  FOR EACH ROW EXECUTE FUNCTION public.handle_deposit_confirmation();

-- Function to handle deposit rollback
CREATE OR REPLACE FUNCTION public.handle_deposit_rollback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_quote_id UUID;
  v_other_valid_deposits NUMERIC;
  v_restore_status project_status;
BEGIN
  -- Only process when changing from valid to void
  IF TG_OP = 'UPDATE' AND OLD.is_void = false AND NEW.is_void = true THEN
    v_project_id := NEW.project_id;
    v_quote_id := NEW.quote_id;
    
    -- Set void metadata
    NEW.voided_at := now();
    NEW.voided_by := auth.uid();
    
    -- Check if there are other valid deposits
    SELECT COALESCE(SUM(amount), 0)
    INTO v_other_valid_deposits
    FROM project_deposits
    WHERE project_id = v_project_id 
      AND is_void = false 
      AND id != NEW.id;
    
    -- Determine status to restore
    IF v_other_valid_deposits > 0 THEN
      v_restore_status := 'DEPOSITED';
    ELSE
      v_restore_status := COALESCE(NEW.prev_status, 'PLANNED');
    END IF;
    
    -- Update project status
    UPDATE projects
    SET status = v_restore_status
    WHERE id = v_project_id;
    
    -- Update quote deposit info
    IF v_quote_id IS NOT NULL THEN
      UPDATE quotes
      SET 
        deposit_amount = GREATEST(COALESCE(deposit_amount, 0) - NEW.amount, 0),
        deposit_received = (GREATEST(COALESCE(deposit_amount, 0) - NEW.amount, 0) >= deposit_required)
      WHERE id = v_quote_id;
    END IF;
    
    -- Log activity
    INSERT INTO project_activities (project_id, actor_id, event, payload)
    VALUES (
      v_project_id,
      auth.uid(),
      'DEPOSIT_ROLLEDBACK',
      jsonb_build_object('deposit_id', NEW.id, 'amount', NEW.amount, 'reason', NEW.void_reason)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_deposit_rollback
  BEFORE UPDATE ON public.project_deposits
  FOR EACH ROW EXECUTE FUNCTION public.handle_deposit_rollback();

-- Function to log project creation
CREATE OR REPLACE FUNCTION public.log_project_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO project_activities (project_id, actor_id, event, payload)
  VALUES (
    NEW.id,
    auth.uid(),
    'PROJECT_CREATED',
    jsonb_build_object('title', NEW.title, 'status', NEW.status)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_project_creation
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_project_creation();

-- Function to log quote creation
CREATE OR REPLACE FUNCTION public.log_quote_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO project_activities (project_id, actor_id, event, payload)
  VALUES (
    NEW.project_id,
    auth.uid(),
    'QUOTE_ADDED',
    jsonb_build_object('quote_id', NEW.id, 'code', NEW.code, 'grand_total', NEW.grand_total)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_quote_creation
  AFTER INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.log_quote_creation();

-- Function to log photo upload
CREATE OR REPLACE FUNCTION public.log_photo_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO project_activities (project_id, actor_id, event, payload)
  VALUES (
    NEW.project_id,
    auth.uid(),
    'PHOTO_UPLOADED',
    jsonb_build_object('photo_id', NEW.id, 'phase', NEW.phase)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_photo_upload
  AFTER INSERT ON public.project_photos
  FOR EACH ROW EXECUTE FUNCTION public.log_photo_upload();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper function to check if user owns customer
CREATE OR REPLACE FUNCTION public.owns_customer(customer_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = customer_id AND owner_id = auth.uid()
  ) OR public.is_admin();
$$;

-- RLS Policies for customers
CREATE POLICY "Admins can do everything on customers"
  ON public.customers FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Advisors can view all customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Advisors can create customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Advisors can update own customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- RLS Policies for projects
CREATE POLICY "Admins can do everything on projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Advisors can view projects for their customers"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = projects.customer_id AND owner_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Advisors can create projects for their customers"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = projects.customer_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Advisors can update projects for their customers"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = projects.customer_id AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = projects.customer_id AND owner_id = auth.uid()
    )
  );

-- RLS Policies for quotes
CREATE POLICY "Admins can do everything on quotes"
  ON public.quotes FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Advisors can view quotes for their projects"
  ON public.quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.customers c ON p.customer_id = c.id
      WHERE p.id = quotes.project_id AND (c.owner_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Advisors can create quotes for their projects"
  ON public.quotes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.customers c ON p.customer_id = c.id
      WHERE p.id = quotes.project_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Advisors can update quotes for their projects"
  ON public.quotes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.customers c ON p.customer_id = c.id
      WHERE p.id = quotes.project_id AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.customers c ON p.customer_id = c.id
      WHERE p.id = quotes.project_id AND c.owner_id = auth.uid()
    )
  );

-- RLS Policies for project_photos
CREATE POLICY "Admins can do everything on project_photos"
  ON public.project_photos FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Advisors can view photos for their projects"
  ON public.project_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.customers c ON p.customer_id = c.id
      WHERE p.id = project_photos.project_id AND (c.owner_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Advisors can upload photos for their projects"
  ON public.project_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.customers c ON p.customer_id = c.id
      WHERE p.id = project_photos.project_id AND c.owner_id = auth.uid()
    )
  );

-- RLS Policies for project_appointments
CREATE POLICY "Admins can do everything on project_appointments"
  ON public.project_appointments FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Advisors can view appointments for their projects"
  ON public.project_appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.customers c ON p.customer_id = c.id
      WHERE p.id = project_appointments.project_id AND (c.owner_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Advisors can create appointments for their projects"
  ON public.project_appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.customers c ON p.customer_id = c.id
      WHERE p.id = project_appointments.project_id AND c.owner_id = auth.uid()
    )
  );

-- RLS Policies for project_deposits
CREATE POLICY "Admins can do everything on project_deposits"
  ON public.project_deposits FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Advisors can view deposits for their projects"
  ON public.project_deposits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.customers c ON p.customer_id = c.id
      WHERE p.id = project_deposits.project_id AND (c.owner_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Advisors can create deposits for their projects"
  ON public.project_deposits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.customers c ON p.customer_id = c.id
      WHERE p.id = project_deposits.project_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Advisors can update deposits for their projects"
  ON public.project_deposits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.customers c ON p.customer_id = c.id
      WHERE p.id = project_deposits.project_id AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.customers c ON p.customer_id = c.id
      WHERE p.id = project_deposits.project_id AND c.owner_id = auth.uid()
    )
  );

-- RLS Policies for project_activities
CREATE POLICY "Admins can do everything on project_activities"
  ON public.project_activities FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Advisors can view activities for their projects"
  ON public.project_activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.customers c ON p.customer_id = c.id
      WHERE p.id = project_activities.project_id AND (c.owner_id = auth.uid() OR public.is_admin())
    )
  );

-- RLS Policies for items
CREATE POLICY "Admins can do everything on items"
  ON public.items FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Advisors can view active items"
  ON public.items FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_admin());

-- Seed data: 5 sample items
INSERT INTO public.items (name, unit, unit_price, is_active) VALUES
  ('Bộ bàn ghế ban công gỗ teak', 'bộ', 8500000, true),
  ('Chậu cây composite cao cấp', 'chậu', 450000, true),
  ('Cỏ nhân tạo cao cấp', 'm²', 320000, true),
  ('Hệ thống tưới tự động', 'set', 3200000, true),
  ('Đèn LED trang trí sân vườn', 'bộ', 1200000, true);