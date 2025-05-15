-- ShortCat Platform Database Schema - Part 4: Price Comparison, Traceability & Reporting
-- Created: 2025-05-13, dambert.munoz

-- 13. Price Comparison and Scraping
CREATE TABLE price_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'historical', 'scraping', 'manual', 'api'
    url VARCHAR(255),
    api_key VARCHAR(255),
    credentials JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    supplier_id UUID REFERENCES suppliers(id),
    source_id UUID REFERENCES price_sources(id),
    unit_id UUID REFERENCES units_of_measure(id),
    price DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    quantity DECIMAL(15, 2) DEFAULT 1,
    city VARCHAR(100),
    country VARCHAR(100),
    price_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    user_id UUID NOT NULL REFERENCES users(id),
    item_name VARCHAR(255) NOT NULL,
    threshold_type VARCHAR(50) NOT NULL, -- 'above', 'below', 'percent_change'
    threshold_value DECIMAL(15, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE price_alert_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES price_alerts(id) ON DELETE CASCADE,
    triggered_price DECIMAL(15, 2) NOT NULL,
    reference_price DECIMAL(15, 2) NOT NULL,
    difference_percentage DECIMAL(8, 2),
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notification_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Traceability
CREATE TABLE order_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    status VARCHAR(100) NOT NULL,
    status_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE document_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type VARCHAR(100) NOT NULL, -- 'requisition', 'purchase_order', 'invoice', 'delivery_note'
    document_id UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'approved', 'rejected', 'cancelled'
    action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES users(id),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Savings and Cost Optimization
CREATE TABLE savings_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    purchase_order_id UUID REFERENCES purchase_orders(id),
    consolidated_order_id UUID REFERENCES consolidated_orders(id),
    auction_id UUID REFERENCES auctions(id),
    description TEXT NOT NULL,
    original_amount DECIMAL(15, 2) NOT NULL,
    final_amount DECIMAL(15, 2) NOT NULL,
    savings_amount DECIMAL(15, 2) NOT NULL,
    savings_percentage DECIMAL(8, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    calculation_method VARCHAR(100) NOT NULL, -- 'historical_comparison', 'market_average', 'initial_quote'
    verified_by UUID REFERENCES users(id),
    verification_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Reports and Analytics
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(100) NOT NULL, -- 'operational', 'financial', 'supplier', 'savings'
    query_definition JSONB NOT NULL,
    chart_configuration JSONB,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE scheduled_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    template_id UUID NOT NULL REFERENCES report_templates(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    frequency VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
    parameters JSONB,
    recipients JSONB,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE report_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheduled_report_id UUID REFERENCES scheduled_reports(id),
    template_id UUID NOT NULL REFERENCES report_templates(id),
    user_id UUID REFERENCES users(id),
    execution_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parameters JSONB,
    status VARCHAR(50) NOT NULL, -- 'running', 'completed', 'failed'
    result_data JSONB,
    error_message TEXT,
    file_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. System Settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    setting_key VARCHAR(255) NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (company_id, setting_key)
);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_price_sources_modtime BEFORE UPDATE ON price_sources FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_price_alerts_modtime BEFORE UPDATE ON price_alerts FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_savings_records_modtime BEFORE UPDATE ON savings_records FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_report_templates_modtime BEFORE UPDATE ON report_templates FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_scheduled_reports_modtime BEFORE UPDATE ON scheduled_reports FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_report_executions_modtime BEFORE UPDATE ON report_executions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_system_settings_modtime BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Create indexes for performance
CREATE INDEX idx_price_history_item_name ON price_history(item_name);
CREATE INDEX idx_price_history_supplier_id ON price_history(supplier_id);
CREATE INDEX idx_price_history_price_date ON price_history(price_date);
CREATE INDEX idx_price_alerts_company_id ON price_alerts(company_id);
CREATE INDEX idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_price_alert_logs_alert_id ON price_alert_logs(alert_id);
CREATE INDEX idx_order_tracking_purchase_order_id ON order_tracking(purchase_order_id);
CREATE INDEX idx_document_tracking_document_type_document_id ON document_tracking(document_type, document_id);
CREATE INDEX idx_savings_records_company_id ON savings_records(company_id);
CREATE INDEX idx_savings_records_purchase_order_id ON savings_records(purchase_order_id);
CREATE INDEX idx_scheduled_reports_company_id ON scheduled_reports(company_id);
CREATE INDEX idx_scheduled_reports_template_id ON scheduled_reports(template_id);
CREATE INDEX idx_report_executions_scheduled_report_id ON report_executions(scheduled_report_id);
CREATE INDEX idx_system_settings_company_id ON system_settings(company_id);
