-- ShortCat Platform Database Schema - Dual Role Companies (Buyer and Supplier)
-- Created: 2025-05-13, dambert.munoz

-- 1. Company Relationships and Dual Role Support

-- 2. Company Relationships (for B2B relationships tracking)
CREATE TABLE company_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    related_company_id UUID NOT NULL REFERENCES companies(id),
    relationship_type VARCHAR(50) NOT NULL, -- 'buyer_to_supplier', 'supplier_to_buyer', 'partner', 'competitor'
    is_preferred BOOLEAN DEFAULT FALSE,
    credit_limit DECIMAL(15, 2),
    payment_terms VARCHAR(100),
    special_conditions TEXT,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'suspended', 'blocked'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (company_id, related_company_id)
);

-- 3. Role-Specific Settings
CREATE TABLE company_role_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    role_type VARCHAR(50) NOT NULL, -- 'buyer', 'supplier'
    settings JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (company_id, role_type)
);

-- 4. Role Switching History
CREATE TABLE role_switch_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    previous_role VARCHAR(50) NOT NULL,
    new_role VARCHAR(50) NOT NULL,
    switch_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id UUID REFERENCES user_sessions(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Cross-Role Activity Tracking
CREATE TABLE cross_role_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    user_id UUID NOT NULL REFERENCES users(id),
    activity_type VARCHAR(100) NOT NULL, -- 'self_quote', 'self_order', 'role_conflict'
    buyer_entity_type VARCHAR(100),
    buyer_entity_id UUID,
    supplier_entity_type VARCHAR(100),
    supplier_entity_id UUID,
    resolution VARCHAR(50), -- 'allowed', 'blocked', 'flagged', 'escalated'
    resolution_reason TEXT,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Marketplace Settings
CREATE TABLE marketplace_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default marketplace settings
INSERT INTO marketplace_settings (setting_key, setting_value, description)
VALUES 
('allow_self_trading', 'true', 'Allow companies to quote and order from themselves'),
('role_conflict_handling', '{"mode": "flag", "require_approval": true}', 'How to handle potential role conflicts'),
('default_company_roles', '{"can_buy": true, "can_sell": true}', 'Default role capabilities for new companies');

-- 7. Views for easier querying

-- View for companies that can buy
CREATE VIEW buyer_companies AS
SELECT * FROM companies WHERE can_buy = TRUE;

-- View for companies that can sell
CREATE VIEW supplier_companies AS
SELECT * FROM companies WHERE can_sell = TRUE;

-- View for dual-role companies
CREATE VIEW dual_role_companies AS
SELECT * FROM companies WHERE can_buy = TRUE AND can_sell = TRUE;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_company_relationships_modtime BEFORE UPDATE ON company_relationships FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_company_role_settings_modtime BEFORE UPDATE ON company_role_settings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_cross_role_activities_modtime BEFORE UPDATE ON cross_role_activities FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_marketplace_settings_modtime BEFORE UPDATE ON marketplace_settings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Create indexes for performance
CREATE INDEX idx_company_relationships_company_id ON company_relationships(company_id);
CREATE INDEX idx_company_relationships_related_company_id ON company_relationships(related_company_id);
CREATE INDEX idx_company_role_settings_company_id ON company_role_settings(company_id);
CREATE INDEX idx_role_switch_history_user_id ON role_switch_history(user_id);
CREATE INDEX idx_cross_role_activities_company_id ON cross_role_activities(company_id);
CREATE INDEX idx_cross_role_activities_user_id ON cross_role_activities(user_id);
