-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'empleado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    company VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Contacts table (Activities)
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- call, email, meeting
    description TEXT,
    contact_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    product VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendiente', -- pendiente, ganado, perdido
    estimated_close_date DATE,
    interactions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Create Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    deadline TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'Media', -- Alta, Media, Baja
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Data
INSERT INTO users (name, email, password, role) 
VALUES ('Administrador', 'admin@pycrm.com', '$2b$10$qQQ8azbeUr4Os75oviGjweuJlt20WAkluirbxI75xjofbARZSnDYu', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO clients (name, company, email, phone, status) VALUES
('Ana García', 'Digital Flow SL', 'ana.garcia@digitalflow.es', '+34 600 123 456', 'activo'),
('Carlos Ruiz', 'Tech Solutions SL', 'cruiz@techsolutions.com', '+34 611 987 654', 'lead'),
('Maria López', 'Green Energy', 'm.lopez@greenenergy.com', '+34 622 333 444', 'activo')
ON CONFLICT DO NOTHING;

INSERT INTO opportunities (client_id, product, amount, status, estimated_close_date) VALUES
(1, 'Consuloría Digital', 5000.00, 'ganado', '2024-02-15'),
(1, 'Mantenimiento Anual', 1200.00, 'pendiente', '2024-04-01'),
(2, 'Pack Cloud Pro', 7500.00, 'pendiente', '2024-03-20'),
(3, 'Auditoría Energética', 3000.00, 'ganado', '2024-01-10')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, client_id, title, deadline, priority, completed) VALUES
(1, 1, 'Llamada de seguimiento Ana', CURRENT_TIMESTAMP + interval '2 hours', 'Alta', false),
(1, 2, 'Enviar contrato Carlos', CURRENT_TIMESTAMP + interval '1 day', 'Media', false),
(1, 3, 'Revisión técnica Maria', CURRENT_TIMESTAMP - interval '1 day', 'Baja', true)
ON CONFLICT DO NOTHING;
-- Indexes for production performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_opportunities_client_id ON opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_assigned_to ON opportunities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON contacts(client_id);

-- Create Refresh Tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Password Reset Tokens table
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);

-- Create Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Events table (Calendar)
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    color TEXT DEFAULT '#4f46e5',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Documents table (Quotes/Files metadata)
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'quote', 'invoice', 'contract'
    status TEXT DEFAULT 'draft',
    amount DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
