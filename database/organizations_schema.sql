-- Phase 5B: Organization Architecture & Trust Boundary

-- 1. Create Organizations Table
CREATE TABLE public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Create Organization Members Table
CREATE TABLE public.organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'interviewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, user_id) -- Prevent duplicate memberships
);

-- 3. Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Organizations
-- Users can only view organizations they are a member of
CREATE POLICY "Users can view organizations they belong to" 
ON public.organizations 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members 
        WHERE organization_id = public.organizations.id 
        AND user_id = auth.uid()
    )
);

-- Note: Organization creation is handled via a secure Server Action using a service role or bypass,
-- ensuring the membership is atomic. For safety, we allow insert if the user is authenticated, 
-- but atomic membership insertion must follow immediately.
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- 5. RLS Policies for Organization Members
-- Users can view memberships for organizations they belong to
CREATE POLICY "Users can view memberships of their organizations"
ON public.organization_members
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members AS my_memberships
        WHERE my_memberships.organization_id = public.organization_members.organization_id
        AND my_memberships.user_id = auth.uid()
    )
);

-- Only owners and admins can manage (insert/update/delete) memberships
CREATE POLICY "Owners and admins can manage memberships"
ON public.organization_members
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members AS admin_check
        WHERE admin_check.organization_id = public.organization_members.organization_id
        AND admin_check.user_id = auth.uid()
        AND admin_check.role IN ('owner', 'admin')
    )
);
