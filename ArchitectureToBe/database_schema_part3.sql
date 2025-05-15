-- ShortCat Platform Database Schema - Part 3: Auctions, Supplier Evaluation & Help Desk
-- Created: 2025-05-13, dambert.munoz

-- 9. Reverse Auctions
CREATE TABLE auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id),
    creator_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    auction_type auction_type NOT NULL DEFAULT 'reverse',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'active', 'completed', 'cancelled'
    min_suppliers INTEGER DEFAULT 3,
    max_suppliers INTEGER,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    total_estimated_value DECIMAL(15, 2),
    visibility VARCHAR(50) DEFAULT 'private', -- 'private', 'public', 'invited'
    terms_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE auction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(15, 2) NOT NULL,
    unit_id UUID NOT NULL REFERENCES units_of_measure(id),
    reserve_price DECIMAL(15, 2),
    starting_price DECIMAL(15, 2) NOT NULL,
    min_decrement_percentage DECIMAL(5, 2) DEFAULT 0.5,
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE auction_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    invitation_sent_at TIMESTAMP WITH TIME ZONE,
    invitation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    response_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (auction_id, supplier_id)
);

CREATE TABLE auction_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    auction_item_id UUID NOT NULL REFERENCES auction_items(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    user_id UUID NOT NULL REFERENCES users(id),
    bid_amount DECIMAL(15, 2) NOT NULL,
    bid_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_winning BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE auction_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id),
    user_id UUID REFERENCES users(id),
    notification_type notification_type NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Supplier Evaluation
CREATE TABLE evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    weight DECIMAL(5, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (company_id, name)
);

CREATE TABLE supplier_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    evaluator_id UUID NOT NULL REFERENCES users(id),
    purchase_order_id UUID REFERENCES purchase_orders(id),
    evaluation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_score DECIMAL(5, 2) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE evaluation_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID NOT NULL REFERENCES supplier_evaluations(id) ON DELETE CASCADE,
    criteria_id UUID NOT NULL REFERENCES evaluation_criteria(id),
    score DECIMAL(5, 2) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (evaluation_id, criteria_id)
);

-- 11. Help Desk
CREATE TABLE help_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES help_categories(id),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE help_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id),
    user_id UUID NOT NULL REFERENCES users(id),
    category_id UUID REFERENCES help_categories(id),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ticket_status NOT NULL DEFAULT 'open',
    priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    assigned_to UUID REFERENCES users(id),
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES help_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    attachment_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ticket_channel_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES help_tickets(id) ON DELETE CASCADE,
    channel_type VARCHAR(50) NOT NULL, -- 'email', 'whatsapp', 'sms', 'ticketing_system'
    external_reference VARCHAR(255),
    integration_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Notifications and Activity Logs
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type notification_type NOT NULL,
    related_entity_type VARCHAR(100),
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_auctions_modtime BEFORE UPDATE ON auctions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_auction_items_modtime BEFORE UPDATE ON auction_items FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_auction_invitations_modtime BEFORE UPDATE ON auction_invitations FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_evaluation_criteria_modtime BEFORE UPDATE ON evaluation_criteria FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_supplier_evaluations_modtime BEFORE UPDATE ON supplier_evaluations FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_help_categories_modtime BEFORE UPDATE ON help_categories FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_faqs_modtime BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_help_tickets_modtime BEFORE UPDATE ON help_tickets FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_ticket_channel_integrations_modtime BEFORE UPDATE ON ticket_channel_integrations FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Create indexes for performance
CREATE INDEX idx_auctions_company_id ON auctions(company_id);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auction_items_auction_id ON auction_items(auction_id);
CREATE INDEX idx_auction_invitations_auction_id ON auction_invitations(auction_id);
CREATE INDEX idx_auction_invitations_supplier_id ON auction_invitations(supplier_id);
CREATE INDEX idx_auction_bids_auction_id ON auction_bids(auction_id);
CREATE INDEX idx_auction_bids_supplier_id ON auction_bids(supplier_id);
CREATE INDEX idx_auction_notifications_auction_id ON auction_notifications(auction_id);
CREATE INDEX idx_supplier_evaluations_supplier_id ON supplier_evaluations(supplier_id);
CREATE INDEX idx_evaluation_scores_evaluation_id ON evaluation_scores(evaluation_id);
CREATE INDEX idx_help_tickets_company_id ON help_tickets(company_id);
CREATE INDEX idx_help_tickets_user_id ON help_tickets(user_id);
CREATE INDEX idx_help_tickets_status ON help_tickets(status);
CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_company_id ON activity_logs(company_id);
CREATE INDEX idx_activity_logs_entity_type_entity_id ON activity_logs(entity_type, entity_id);
