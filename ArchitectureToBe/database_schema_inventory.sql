-- ShortCat Platform Database Schema - Inventory System
-- Created: 2025-05-13, dambert.munoz

-- 1. Inventory Locations
CREATE TABLE inventory_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    location_type VARCHAR(50) NOT NULL, -- 'warehouse', 'store', 'virtual'
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (company_id, name)
);

-- 2. Inventory Products (Supplier Catalog)
CREATE TABLE inventory_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    brand VARCHAR(100),
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    base_unit_id UUID NOT NULL REFERENCES units_of_measure(id),
    dimensions JSONB, -- {"length": 10, "width": 5, "height": 2, "unit": "cm"}
    weight DECIMAL(10, 2),
    weight_unit_id UUID REFERENCES units_of_measure(id),
    attributes JSONB,
    images JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (company_id, sku)
);

-- 3. Product Pricing
CREATE TABLE product_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
    price_type VARCHAR(50) NOT NULL, -- 'retail', 'wholesale', 'special', 'discount'
    min_quantity DECIMAL(15, 2) DEFAULT 1,
    max_quantity DECIMAL(15, 2),
    unit_price DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'PEN',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inventory Stock
CREATE TABLE inventory_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES inventory_locations(id),
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    quantity_on_hand DECIMAL(15, 2) NOT NULL DEFAULT 0,
    quantity_reserved DECIMAL(15, 2) NOT NULL DEFAULT 0,
    quantity_available DECIMAL(15, 2) GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    reorder_point DECIMAL(15, 2),
    reorder_quantity DECIMAL(15, 2),
    expiration_date TIMESTAMP WITH TIME ZONE,
    last_count_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (product_id, location_id, batch_number, lot_number)
);

-- 5. Stock Movements
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES inventory_products(id),
    location_id UUID NOT NULL REFERENCES inventory_locations(id),
    reference_type VARCHAR(50) NOT NULL, -- 'purchase', 'sale', 'transfer', 'adjustment', 'return'
    reference_id UUID,
    movement_type VARCHAR(50) NOT NULL, -- 'in', 'out', 'transfer', 'adjustment'
    quantity DECIMAL(15, 2) NOT NULL,
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    unit_cost DECIMAL(15, 2),
    total_cost DECIMAL(15, 2),
    notes TEXT,
    performed_by UUID REFERENCES users(id),
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enhanced Units of Measure System
-- Note: unit_of_measure_categories is already defined in database_schema_part1.sql

-- 7. Unit Conversions
CREATE TABLE unit_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_unit_id UUID NOT NULL REFERENCES units_of_measure(id),
    to_unit_id UUID NOT NULL REFERENCES units_of_measure(id),
    conversion_factor DECIMAL(15, 6) NOT NULL,
    is_bidirectional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (from_unit_id, to_unit_id)
);

-- 8. Supplier Product Mapping
CREATE TABLE supplier_product_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    product_id UUID NOT NULL REFERENCES inventory_products(id),
    supplier_product_code VARCHAR(100),
    supplier_product_name VARCHAR(255),
    lead_time INTEGER, -- Days
    min_order_quantity DECIMAL(15, 2),
    preferred_supplier BOOLEAN DEFAULT FALSE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (supplier_id, product_id)
);

-- 9. Inventory Adjustments
CREATE TABLE inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES inventory_locations(id),
    adjustment_number VARCHAR(50) UNIQUE NOT NULL,
    adjustment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    adjustment_type VARCHAR(50) NOT NULL, -- 'count', 'damage', 'loss', 'expiry', 'other'
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'pending', 'approved', 'completed'
    approved_by UUID REFERENCES users(id),
    performed_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Inventory Adjustment Items
CREATE TABLE inventory_adjustment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adjustment_id UUID NOT NULL REFERENCES inventory_adjustments(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES inventory_products(id),
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    current_quantity DECIMAL(15, 2) NOT NULL,
    new_quantity DECIMAL(15, 2) NOT NULL,
    adjustment_quantity DECIMAL(15, 2) GENERATED ALWAYS AS (new_quantity - current_quantity) STORED,
    unit_cost DECIMAL(15, 2),
    total_cost DECIMAL(15, 2),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Inventory Transfers
CREATE TABLE inventory_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    from_location_id UUID NOT NULL REFERENCES inventory_locations(id),
    to_location_id UUID NOT NULL REFERENCES inventory_locations(id),
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'in_transit', 'completed', 'cancelled'
    initiated_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    shipped_by UUID REFERENCES users(id),
    received_by UUID REFERENCES users(id),
    initiated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    shipped_date TIMESTAMP WITH TIME ZONE,
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    received_date TIMESTAMP WITH TIME ZONE,
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Inventory Transfer Items
CREATE TABLE inventory_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID NOT NULL REFERENCES inventory_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES inventory_products(id),
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    quantity_sent DECIMAL(15, 2) NOT NULL,
    quantity_received DECIMAL(15, 2),
    unit_cost DECIMAL(15, 2),
    total_cost DECIMAL(15, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Inventory Alerts
CREATE TABLE inventory_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    product_id UUID REFERENCES inventory_products(id),
    location_id UUID REFERENCES inventory_locations(id),
    alert_type VARCHAR(50) NOT NULL, -- 'low_stock', 'overstock', 'expiry', 'price_change'
    threshold_value DECIMAL(15, 2),
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    notification_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Integration with Quotation System - Alternative Products
-- Check if supplier_quotation_items table exists before creating this table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'supplier_quotation_items') THEN
        CREATE TABLE alternative_product_suggestions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            supplier_quotation_item_id UUID NOT NULL REFERENCES supplier_quotation_items(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES inventory_products(id),
            reason VARCHAR(100), -- 'better_price', 'faster_delivery', 'higher_quality', 'more_available'
            price_difference DECIMAL(15, 2),
            delivery_difference INTEGER, -- Days
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE (supplier_quotation_item_id, product_id)
        );
    ELSE
        RAISE NOTICE 'Skipping alternative_product_suggestions table creation as supplier_quotation_items does not exist yet';
    END IF;
END
$$;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_inventory_locations_modtime BEFORE UPDATE ON inventory_locations FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_inventory_products_modtime BEFORE UPDATE ON inventory_products FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_product_pricing_modtime BEFORE UPDATE ON product_pricing FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_inventory_stock_modtime BEFORE UPDATE ON inventory_stock FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_unit_of_measure_categories_modtime BEFORE UPDATE ON unit_of_measure_categories FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_unit_conversions_modtime BEFORE UPDATE ON unit_conversions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_supplier_product_mapping_modtime BEFORE UPDATE ON supplier_product_mapping FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_inventory_adjustments_modtime BEFORE UPDATE ON inventory_adjustments FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_inventory_transfers_modtime BEFORE UPDATE ON inventory_transfers FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_inventory_alerts_modtime BEFORE UPDATE ON inventory_alerts FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Create indexes for performance
CREATE INDEX idx_inventory_locations_company_id ON inventory_locations(company_id);
CREATE INDEX idx_inventory_products_company_id ON inventory_products(company_id);
CREATE INDEX idx_inventory_products_category_id ON inventory_products(category_id);
CREATE INDEX idx_product_pricing_product_id ON product_pricing(product_id);
CREATE INDEX idx_inventory_stock_product_id ON inventory_stock(product_id);
CREATE INDEX idx_inventory_stock_location_id ON inventory_stock(location_id);
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_location_id ON stock_movements(location_id);
CREATE INDEX idx_stock_movements_movement_date ON stock_movements(movement_date);
CREATE INDEX idx_units_of_measure_category_id ON units_of_measure(category_id);
CREATE INDEX idx_supplier_product_mapping_supplier_id ON supplier_product_mapping(supplier_id);
CREATE INDEX idx_supplier_product_mapping_product_id ON supplier_product_mapping(product_id);
CREATE INDEX idx_inventory_adjustments_location_id ON inventory_adjustments(location_id);
CREATE INDEX idx_inventory_adjustment_items_adjustment_id ON inventory_adjustment_items(adjustment_id);
CREATE INDEX idx_inventory_adjustment_items_product_id ON inventory_adjustment_items(product_id);
CREATE INDEX idx_inventory_transfers_from_location_id ON inventory_transfers(from_location_id);
CREATE INDEX idx_inventory_transfers_to_location_id ON inventory_transfers(to_location_id);
CREATE INDEX idx_inventory_transfer_items_transfer_id ON inventory_transfer_items(transfer_id);
CREATE INDEX idx_inventory_transfer_items_product_id ON inventory_transfer_items(product_id);
CREATE INDEX idx_inventory_alerts_company_id ON inventory_alerts(company_id);
CREATE INDEX idx_inventory_alerts_product_id ON inventory_alerts(product_id);

-- Create indexes for alternative_product_suggestions only if the table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'alternative_product_suggestions') THEN
        CREATE INDEX idx_alternative_product_suggestions_supplier_quotation_item_id ON alternative_product_suggestions(supplier_quotation_item_id);
        CREATE INDEX idx_alternative_product_suggestions_product_id ON alternative_product_suggestions(product_id);
    ELSE
        RAISE NOTICE 'Skipping alternative_product_suggestions indexes as the table does not exist yet';
    END IF;
END
$$;
