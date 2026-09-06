-- Role and Status Enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT');
CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'RESCHEDULED');
CREATE TYPE queue_status AS ENUM ('NOT_CHECKED_IN', 'WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW');
CREATE TYPE token_status AS ENUM ('AVAILABLE', 'RESERVED', 'ACTIVE', 'CANCELLED');

-- 1. Identity Management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Patient Profile
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    cnic VARCHAR(20) UNIQUE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT NOT NULL,
    emergency_contact VARCHAR(20) NOT NULL,
    has_whatsapp BOOLEAN DEFAULT FALSE,
    primary_notification_channel VARCHAR(20) DEFAULT 'SMS',
    backup_notification_channel VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_patients_cnic ON patients(cnic);
CREATE INDEX idx_patients_phone ON patients(user_id);

-- 3. Doctor Profile
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    biography TEXT NOT NULL,
    qualifications TEXT[] NOT NULL,
    experience_years INT NOT NULL,
    languages TEXT[] NOT NULL,
    consultation_fee DECIMAL(10, 2) NOT NULL,
    follow_up_fee DECIMAL(10, 2) NOT NULL,
    daily_patient_limit INT DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Operational Receptionists
CREATE TABLE receptionists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Services Catalog
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    base_fee DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE doctor_services (
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (doctor_id, service_id)
);

-- 6. Token Engine Ledger
CREATE TABLE daily_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    date DATE NOT NULL,
    token_number INT NOT NULL,
    status token_status DEFAULT 'RESERVED',
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_doctor_date_token UNIQUE (doctor_id, date, token_number)
);
CREATE INDEX idx_tokens_lookup ON daily_tokens(doctor_id, date, status);

-- 7. Appointments Architecture
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    service_id UUID REFERENCES services(id),
    appointment_date DATE NOT NULL,
    token_id UUID UNIQUE REFERENCES daily_tokens(id),
    status appointment_status DEFAULT 'PENDING',
    booking_source VARCHAR(30) DEFAULT 'PORTAL',
    approved_by_receptionist_id UUID REFERENCES receptionists(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_appointments_patient ON appointments(patient_id, appointment_date);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id, appointment_date, status);

-- 8. Queue Management Ledger
CREATE TABLE queue_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    queue_status queue_status DEFAULT 'NOT_CHECKED_IN',
    check_in_time TIMESTAMP WITH TIME ZONE,
    called_time TIMESTAMP WITH TIME ZONE,
    consultation_start_time TIMESTAMP WITH TIME ZONE,
    consultation_end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_queue_status_active ON queue_entries(queue_status);

-- 9. Clinical Records & Private Notes
CREATE TABLE clinical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID UNIQUE NOT NULL REFERENCES appointments(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    chief_complaint TEXT NOT NULL,
    examination_notes TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    treatment_plan TEXT NOT NULL,
    private_notes TEXT, -- Redacted at API layer from Patient and Receptionist
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Prescription Versioning System
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinical_record_id UUID NOT NULL REFERENCES clinical_records(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prescription_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    medications_json JSONB NOT NULL,
    correction_reason TEXT,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_prescription_version UNIQUE (prescription_id, version_number)
);

-- 11. Doctor-Patient Permitted Access Tracking
CREATE TABLE doctor_patient_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    first_visit_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_visit_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_visits INT DEFAULT 1,
    CONSTRAINT uq_doc_patient UNIQUE (doctor_id, patient_id)
);

-- 12. Billing & Basic Ledger
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    appointment_id UUID REFERENCES appointments(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0.00,
    balance_due DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Immutable System Audit Trail
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    actor_type VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

-- 14. Notification Dispatch & Failover Logs
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    primary_channel VARCHAR(20) NOT NULL,
    backup_channel VARCHAR(20),
    channels_attempted TEXT[] NOT NULL,
    final_status VARCHAR(20) NOT NULL,
    error_trace TEXT,
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
