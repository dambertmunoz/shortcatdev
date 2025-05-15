-- ShortCat Platform Database Schema - Quotations
-- Created: 2025-05-13, dambert.munoz

-- Enums for quotation status
CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'received', 'in_review', 'accepted', 'rejected', 'expired');

-- Quotation Request (RFQ - Request for Quotation)
CREATE TABLE quotation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    requisition_id UUID NOT NULL REFERENCES requisitions(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    creator_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status quotation_status NOT NULL DEFAULT 'draft',
    issue_date TIMESTAMP WITH TIME ZONE,
    expiration_date TIMESTAMP WITH TIME ZONE,
    currency VARCHAR(3) NOT NULL DEFAULT 'PEN',
    special_conditions TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotation Request Items (items included in the RFQ)
CREATE TABLE quotation_request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_request_id UUID NOT NULL REFERENCES quotation_requests(id) ON DELETE CASCADE,
    requisition_item_id UUID NOT NULL REFERENCES requisition_items(id),
    quantity DECIMAL(15, 2) NOT NULL,
    remaining_quantity DECIMAL(15, 2),
    original_quantity DECIMAL(15, 2),
    completion_percentage DECIMAL(5, 2) DEFAULT 0,
    unit_id UUID NOT NULL REFERENCES units_of_measure(id),
    estimated_unit_price DECIMAL(15, 2),
    specifications TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (quotation_request_id, requisition_item_id)
);

-- Supplier Invitations for Quotations
CREATE TABLE quotation_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_request_id UUID NOT NULL REFERENCES quotation_requests(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    invitation_sent_at TIMESTAMP WITH TIME ZONE,
    invitation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'viewed', 'accepted', 'declined'
    response_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (quotation_request_id, supplier_id)
);

-- Supplier Quotations (responses from suppliers)
CREATE TABLE supplier_quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    quotation_request_id UUID NOT NULL REFERENCES quotation_requests(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    status quotation_status NOT NULL DEFAULT 'received',
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validity_period INTEGER, -- Days
    delivery_time INTEGER, -- Days
    payment_terms TEXT,
    currency VARCHAR(3) NOT NULL DEFAULT 'PEN',
    total_amount DECIMAL(15, 2) NOT NULL,
    additional_comments TEXT,
    supplier_reference VARCHAR(100),
    attachments JSONB,
    is_selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (quotation_request_id, supplier_id)
);

-- Supplier Quotation Items (detailed items in supplier quotation)
CREATE TABLE supplier_quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_quotation_id UUID NOT NULL REFERENCES supplier_quotations(id) ON DELETE CASCADE,
    quotation_request_item_id UUID REFERENCES quotation_request_items(id),
    original_requisition_item_id UUID REFERENCES requisition_items(id),
    inventory_product_id UUID REFERENCES inventory_products(id),
    is_from_inventory BOOLEAN DEFAULT FALSE,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(15, 2) NOT NULL,
    unit_id UUID NOT NULL REFERENCES units_of_measure(id),
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    delivery_date TIMESTAMP WITH TIME ZONE,
    delivery_location TEXT,
    delivery_instructions TEXT,
    alternative_item BOOLEAN DEFAULT FALSE,
    alternative_description TEXT,
    coverage_percentage DECIMAL(5, 2) DEFAULT 100,
    is_partial BOOLEAN DEFAULT FALSE,
    independent_delivery BOOLEAN DEFAULT FALSE,
    independent_pricing BOOLEAN DEFAULT TRUE,
    requisition_snapshot JSONB,
    inventory_snapshot JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (supplier_quotation_id, quotation_request_item_id)
);

-- Comparative Table (for comparing multiple quotations)
CREATE TABLE comparative_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    quotation_request_id UUID NOT NULL REFERENCES quotation_requests(id),
    creator_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'in_review', 'completed'
    selected_quotation_id UUID REFERENCES supplier_quotations(id),
    selection_criteria TEXT,
    selection_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comparative Table Items (detailed comparison of items across quotations)
CREATE TABLE comparative_table_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comparative_table_id UUID NOT NULL REFERENCES comparative_tables(id) ON DELETE CASCADE,
    requisition_item_id UUID NOT NULL REFERENCES requisition_items(id),
    item_name VARCHAR(255) NOT NULL,
    best_quotation_item_id UUID REFERENCES supplier_quotation_items(id),
    best_price DECIMAL(15, 2),
    price_difference_percentage DECIMAL(8, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (comparative_table_id, requisition_item_id)
);

-- Comparative Table Quotations (quotations included in the comparison)
CREATE TABLE comparative_table_quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comparative_table_id UUID NOT NULL REFERENCES comparative_tables(id) ON DELETE CASCADE,
    supplier_quotation_id UUID NOT NULL REFERENCES supplier_quotations(id),
    rank INTEGER,
    total_score DECIMAL(5, 2),
    price_score DECIMAL(5, 2),
    delivery_score DECIMAL(5, 2),
    quality_score DECIMAL(5, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (comparative_table_id, supplier_quotation_id)
);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_quotation_requests_modtime BEFORE UPDATE ON quotation_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_quotation_request_items_modtime BEFORE UPDATE ON quotation_request_items FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_quotation_invitations_modtime BEFORE UPDATE ON quotation_invitations FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_supplier_quotations_modtime BEFORE UPDATE ON supplier_quotations FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_supplier_quotation_items_modtime BEFORE UPDATE ON supplier_quotation_items FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_comparative_tables_modtime BEFORE UPDATE ON comparative_tables FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_comparative_table_items_modtime BEFORE UPDATE ON comparative_table_items FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_comparative_table_quotations_modtime BEFORE UPDATE ON comparative_table_quotations FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Create indexes for performance
CREATE INDEX idx_quotation_requests_requisition_id ON quotation_requests(requisition_id);
CREATE INDEX idx_quotation_requests_company_id ON quotation_requests(company_id);
CREATE INDEX idx_quotation_requests_status ON quotation_requests(status);
CREATE INDEX idx_quotation_request_items_quotation_request_id ON quotation_request_items(quotation_request_id);
CREATE INDEX idx_quotation_invitations_quotation_request_id ON quotation_invitations(quotation_request_id);
CREATE INDEX idx_quotation_invitations_supplier_id ON quotation_invitations(supplier_id);
CREATE INDEX idx_supplier_quotations_quotation_request_id ON supplier_quotations(quotation_request_id);
CREATE INDEX idx_supplier_quotations_supplier_id ON supplier_quotations(supplier_id);
CREATE INDEX idx_supplier_quotation_items_supplier_quotation_id ON supplier_quotation_items(supplier_quotation_id);
CREATE INDEX idx_comparative_tables_quotation_request_id ON comparative_tables(quotation_request_id);
CREATE INDEX idx_comparative_table_items_comparative_table_id ON comparative_table_items(comparative_table_id);
CREATE INDEX idx_comparative_table_quotations_comparative_table_id ON comparative_table_quotations(comparative_table_id);
CREATE INDEX idx_comparative_table_quotations_supplier_quotation_id ON comparative_table_quotations(supplier_quotation_id);
