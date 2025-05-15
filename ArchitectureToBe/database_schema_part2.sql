-- ShortCat Platform Database Schema - Part 2: Purchase Orders & Requisitions
-- Created: 2025-05-13, dambert.munoz

-- 5. Requisitions (Requerimientos)
CREATE TABLE requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255),
    company_id UUID NOT NULL REFERENCES companies(id),
    requester_id UUID NOT NULL REFERENCES users(id),
    cost_center_id UUID NOT NULL REFERENCES cost_centers(id),
    status order_status NOT NULL DEFAULT 'draft',
    delivery_city VARCHAR(100),
    general_conditions JSONB,
    payment_method payment_method,
    payment_term INTEGER, -- Days
    warranty_required BOOLEAN DEFAULT FALSE,
    estimated_total_cost DECIMAL(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE requisition_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisition_id UUID NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    general_description TEXT NOT NULL,
    specific_description TEXT NOT NULL,
    quantity DECIMAL(15, 2) NOT NULL,
    unit_id UUID NOT NULL REFERENCES units_of_measure(id),
    cost_center_id UUID NOT NULL REFERENCES cost_centers(id),
    delivery_location TEXT NOT NULL,
    delivery_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    criticality criticality_level NOT NULL,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    specific_conditions TEXT,
    estimated_unit_price DECIMAL(15, 2),
    estimated_total_price DECIMAL(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (requisition_id, code)
);

-- 6. Approval Workflows
CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (company_id, name)
);

CREATE TABLE approval_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    approver_role user_role,
    min_approvers INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (workflow_id, step_number)
);

CREATE TABLE approval_step_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_id UUID NOT NULL REFERENCES approval_steps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (step_id, user_id)
);

CREATE TABLE requisition_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisition_id UUID NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id),
    current_step_id UUID REFERENCES approval_steps(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE approval_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisition_approval_id UUID NOT NULL REFERENCES requisition_approvals(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES approval_steps(id),
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'approved', 'rejected', 'delegated'
    comments TEXT,
    action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Purchase Orders
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    creator_id UUID NOT NULL REFERENCES users(id),
    requisition_id UUID REFERENCES requisitions(id),
    status order_status NOT NULL DEFAULT 'draft',
    issue_date TIMESTAMP WITH TIME ZONE,
    delivery_date TIMESTAMP WITH TIME ZONE,
    delivery_address TEXT,
    delivery_city VARCHAR(100),
    payment_method payment_method,
    payment_term INTEGER, -- Days
    warranty_required BOOLEAN DEFAULT FALSE,
    total_amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    general_conditions JSONB,
    notes TEXT,
    is_consolidated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    requisition_item_id UUID REFERENCES requisition_items(id),
    item_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(15, 2) NOT NULL,
    unit_id UUID NOT NULL REFERENCES units_of_measure(id),
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    delivery_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Order Consolidation
CREATE TABLE consolidated_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id),
    creator_id UUID NOT NULL REFERENCES users(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    status order_status NOT NULL DEFAULT 'draft',
    consolidation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    optimization_score DECIMAL(5, 2),
    optimization_details JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE consolidated_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consolidated_order_id UUID NOT NULL REFERENCES consolidated_orders(id) ON DELETE CASCADE,
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id),
    purchase_order_item_id UUID NOT NULL REFERENCES purchase_order_items(id),
    original_unit_price DECIMAL(15, 2) NOT NULL,
    consolidated_unit_price DECIMAL(15, 2) NOT NULL,
    quantity DECIMAL(15, 2) NOT NULL,
    total_savings DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (consolidated_order_id, purchase_order_item_id)
);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_requisitions_modtime BEFORE UPDATE ON requisitions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_requisition_items_modtime BEFORE UPDATE ON requisition_items FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_approval_workflows_modtime BEFORE UPDATE ON approval_workflows FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_approval_steps_modtime BEFORE UPDATE ON approval_steps FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_requisition_approvals_modtime BEFORE UPDATE ON requisition_approvals FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_purchase_orders_modtime BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_purchase_order_items_modtime BEFORE UPDATE ON purchase_order_items FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_consolidated_orders_modtime BEFORE UPDATE ON consolidated_orders FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_consolidated_order_items_modtime BEFORE UPDATE ON consolidated_order_items FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Create indexes for performance
CREATE INDEX idx_requisitions_company_id ON requisitions(company_id);
CREATE INDEX idx_requisitions_requester_id ON requisitions(requester_id);
CREATE INDEX idx_requisitions_cost_center_id ON requisitions(cost_center_id);
CREATE INDEX idx_requisitions_status ON requisitions(status);
CREATE INDEX idx_requisition_items_requisition_id ON requisition_items(requisition_id);
CREATE INDEX idx_purchase_orders_company_id ON purchase_orders(company_id);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_requisition_id ON purchase_orders(requisition_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_order_items_purchase_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_consolidated_orders_company_id ON consolidated_orders(company_id);
CREATE INDEX idx_consolidated_orders_supplier_id ON consolidated_orders(supplier_id);
CREATE INDEX idx_consolidated_order_items_consolidated_order_id ON consolidated_order_items(consolidated_order_id);
CREATE INDEX idx_consolidated_order_items_purchase_order_id ON consolidated_order_items(purchase_order_id);
