-- ShortCat Platform Database Schema - Split Purchases
-- Created: 2025-05-13, dambert.munoz

-- Tablas para soportar compras divididas

-- 1. Tabla para tracking de compras divididas
CREATE TABLE split_purchase_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisition_id UUID NOT NULL REFERENCES requisitions(id),
    total_items_count INTEGER NOT NULL,
    completed_items_count INTEGER DEFAULT 0,
    overall_completion_percentage DECIMAL(5, 2) DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completion_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla para registrar las aceptaciones parciales
CREATE TABLE partial_acceptance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisition_id UUID NOT NULL REFERENCES requisitions(id),
    supplier_quotation_id UUID NOT NULL REFERENCES supplier_quotations(id),
    acceptance_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_by UUID NOT NULL REFERENCES users(id),
    acceptance_percentage DECIMAL(5, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla para detalles de aceptaciones parciales
CREATE TABLE partial_acceptance_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partial_acceptance_id UUID NOT NULL REFERENCES partial_acceptance(id) ON DELETE CASCADE,
    requisition_item_id UUID NOT NULL REFERENCES requisition_items(id),
    supplier_quotation_item_id UUID NOT NULL REFERENCES supplier_quotation_items(id),
    accepted_quantity DECIMAL(15, 2) NOT NULL,
    original_requested_quantity DECIMAL(15, 2) NOT NULL,
    remaining_quantity DECIMAL(15, 2) NOT NULL,
    acceptance_percentage DECIMAL(5, 2) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla para órdenes de compra parciales
CREATE TABLE partial_purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    partial_acceptance_id UUID NOT NULL REFERENCES partial_acceptance(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    creator_id UUID NOT NULL REFERENCES users(id),
    requisition_id UUID NOT NULL REFERENCES requisitions(id),
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
    is_partial BOOLEAN DEFAULT TRUE,
    completion_percentage DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla para ítems de órdenes de compra parciales
CREATE TABLE partial_purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partial_purchase_order_id UUID NOT NULL REFERENCES partial_purchase_orders(id) ON DELETE CASCADE,
    requisition_item_id UUID NOT NULL REFERENCES requisition_items(id),
    supplier_quotation_item_id UUID NOT NULL REFERENCES supplier_quotation_items(id),
    item_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(15, 2) NOT NULL,
    original_requested_quantity DECIMAL(15, 2) NOT NULL,
    coverage_percentage DECIMAL(5, 2) NOT NULL,
    unit_id UUID NOT NULL REFERENCES units_of_measure(id),
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    delivery_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabla para seguimiento de requerimientos recursivos
CREATE TABLE recursive_requisition_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_requisition_id UUID NOT NULL REFERENCES requisitions(id),
    current_iteration INTEGER NOT NULL DEFAULT 1,
    is_completed BOOLEAN DEFAULT FALSE,
    remaining_percentage DECIMAL(5, 2) NOT NULL DEFAULT 100,
    next_iteration_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabla para nuevas iteraciones de requerimientos parciales
CREATE TABLE requisition_iterations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_requisition_id UUID NOT NULL REFERENCES requisitions(id),
    iteration_requisition_id UUID NOT NULL REFERENCES requisitions(id),
    iteration_number INTEGER NOT NULL,
    previous_iteration_id UUID REFERENCES requisition_iterations(id),
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_percentage DECIMAL(5, 2) DEFAULT 0,
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (original_requisition_id, iteration_number)
);

-- 8. Tabla para mapeo de ítems entre iteraciones
CREATE TABLE requisition_iteration_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisition_iteration_id UUID NOT NULL REFERENCES requisition_iterations(id) ON DELETE CASCADE,
    original_item_id UUID NOT NULL REFERENCES requisition_items(id),
    iteration_item_id UUID NOT NULL REFERENCES requisition_items(id),
    original_quantity DECIMAL(15, 2) NOT NULL,
    remaining_quantity DECIMAL(15, 2) NOT NULL,
    completion_percentage DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear triggers para updated_at timestamps
CREATE TRIGGER update_split_purchase_tracking_modtime BEFORE UPDATE ON split_purchase_tracking FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_partial_acceptance_modtime BEFORE UPDATE ON partial_acceptance FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_partial_purchase_orders_modtime BEFORE UPDATE ON partial_purchase_orders FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_recursive_requisition_tracking_modtime BEFORE UPDATE ON recursive_requisition_tracking FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_requisition_iterations_modtime BEFORE UPDATE ON requisition_iterations FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Crear índices para rendimiento
CREATE INDEX idx_split_purchase_tracking_requisition_id ON split_purchase_tracking(requisition_id);
CREATE INDEX idx_partial_acceptance_requisition_id ON partial_acceptance(requisition_id);
CREATE INDEX idx_partial_acceptance_supplier_quotation_id ON partial_acceptance(supplier_quotation_id);
CREATE INDEX idx_partial_acceptance_items_partial_acceptance_id ON partial_acceptance_items(partial_acceptance_id);
CREATE INDEX idx_partial_acceptance_items_requisition_item_id ON partial_acceptance_items(requisition_item_id);
CREATE INDEX idx_partial_purchase_orders_partial_acceptance_id ON partial_purchase_orders(partial_acceptance_id);
CREATE INDEX idx_partial_purchase_orders_requisition_id ON partial_purchase_orders(requisition_id);
CREATE INDEX idx_partial_purchase_order_items_partial_purchase_order_id ON partial_purchase_order_items(partial_purchase_order_id);
CREATE INDEX idx_recursive_requisition_tracking_original_requisition_id ON recursive_requisition_tracking(original_requisition_id);
CREATE INDEX idx_requisition_iterations_original_requisition_id ON requisition_iterations(original_requisition_id);
CREATE INDEX idx_requisition_iterations_iteration_requisition_id ON requisition_iterations(iteration_requisition_id);
CREATE INDEX idx_requisition_iteration_items_requisition_iteration_id ON requisition_iteration_items(requisition_iteration_id);
CREATE INDEX idx_requisition_iteration_items_original_item_id ON requisition_iteration_items(original_item_id);
