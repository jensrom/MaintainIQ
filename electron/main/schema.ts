// DDL statements — each runs independently in a try-catch so existing tables are skipped
export const SCHEMA_STATEMENTS: string[] = [
  `IF OBJECT_ID(N'user_groups', N'U') IS NULL
  CREATE TABLE user_groups (
    id            NVARCHAR(50)  NOT NULL PRIMARY KEY,
    name          NVARCHAR(200) NOT NULL,
    description   NVARCHAR(MAX) NULL,
    color         NVARCHAR(50)  NOT NULL DEFAULT 'blue',
    is_system     BIT           NOT NULL DEFAULT 0
  )`,

  `IF OBJECT_ID(N'user_group_permissions', N'U') IS NULL
  CREATE TABLE user_group_permissions (
    group_id    NVARCHAR(50)  NOT NULL,
    permission  NVARCHAR(100) NOT NULL,
    PRIMARY KEY (group_id, permission)
  )`,

  `IF OBJECT_ID(N'users', N'U') IS NULL
  CREATE TABLE users (
    id             NVARCHAR(50)  NOT NULL PRIMARY KEY,
    name           NVARCHAR(200) NOT NULL,
    initials       NVARCHAR(10)  NOT NULL,
    title          NVARCHAR(200) NOT NULL,
    email          NVARCHAR(200) NOT NULL,
    phone          NVARCHAR(50)  NULL,
    role           NVARCHAR(100) NOT NULL,
    hourly_rate    DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active      BIT           NOT NULL DEFAULT 1,
    last_login     NVARCHAR(50)  NULL,
    mfa_enabled    BIT           NOT NULL DEFAULT 0,
    entra_id       NVARCHAR(200) NULL,
    password_hash  NVARCHAR(200) NULL
  )`,

  `IF OBJECT_ID(N'user_group_members', N'U') IS NULL
  CREATE TABLE user_group_members (
    user_id   NVARCHAR(50) NOT NULL,
    group_id  NVARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, group_id)
  )`,

  `IF OBJECT_ID(N'asset_categories', N'U') IS NULL
  CREATE TABLE asset_categories (
    id         NVARCHAR(50)  NOT NULL PRIMARY KEY,
    name       NVARCHAR(200) NOT NULL,
    base_type  NVARCHAR(50)  NOT NULL,
    color      NVARCHAR(50)  NOT NULL DEFAULT 'blue',
    icon       NVARCHAR(50)  NOT NULL DEFAULT 'box',
    is_system  BIT           NOT NULL DEFAULT 0,
    parent_id  NVARCHAR(50)  NULL,
    sort_order INT           NOT NULL DEFAULT 0
  )`,

  `IF OBJECT_ID(N'assets', N'U') IS NULL
  CREATE TABLE assets (
    id                  NVARCHAR(50)  NOT NULL PRIMARY KEY,
    name                NVARCHAR(200) NOT NULL,
    type                NVARCHAR(50)  NOT NULL,
    category_id         NVARCHAR(50)  NULL,
    parent_id           NVARCHAR(50)  NULL,
    criticality         NVARCHAR(50)  NOT NULL DEFAULT 'Normal',
    location            NVARCHAR(500) NULL,
    description         NVARCHAR(MAX) NULL,
    code                NVARCHAR(100) NOT NULL,
    status              NVARCHAR(50)  NOT NULL DEFAULT 'online',
    image               NVARCHAR(MAX) NULL,
    address             NVARCHAR(500) NULL,
    city                NVARCHAR(200) NULL,
    province            NVARCHAR(200) NULL,
    zip                 NVARCHAR(20)  NULL,
    country             NVARCHAR(100) NULL,
    brand               NVARCHAR(200) NULL,
    model               NVARCHAR(200) NULL,
    year_of_manufacture NVARCHAR(10)  NULL,
    barcode             NVARCHAR(200) NULL,
    unspsc_code         NVARCHAR(50)  NULL,
    gang                NVARCHAR(50)  NULL,
    row_num             NVARCHAR(50)  NULL,
    shelf               NVARCHAR(50)  NULL,
    supplier_id         NVARCHAR(50)  NULL,
    account             NVARCHAR(200) NULL,
    department          NVARCHAR(200) NULL,
    notes               NVARCHAR(MAX) NULL,
    created_at          NVARCHAR(20)  NOT NULL,
    updated_at          NVARCHAR(20)  NULL
  )`,

  `IF OBJECT_ID(N'suppliers', N'U') IS NULL
  CREATE TABLE suppliers (
    id             NVARCHAR(50)  NOT NULL PRIMARY KEY,
    name           NVARCHAR(200) NOT NULL,
    contact_person NVARCHAR(200) NULL,
    email          NVARCHAR(200) NULL,
    phone          NVARCHAR(50)  NULL,
    category       NVARCHAR(200) NULL
  )`,

  `IF OBJECT_ID(N'spare_parts', N'U') IS NULL
  CREATE TABLE spare_parts (
    id           NVARCHAR(50)  NOT NULL PRIMARY KEY,
    name         NVARCHAR(200) NOT NULL,
    part_number  NVARCHAR(100) NULL,
    quantity     INT           NOT NULL DEFAULT 0,
    min_quantity INT           NOT NULL DEFAULT 0,
    location     NVARCHAR(500) NULL,
    price        DECIMAL(10,2) NOT NULL DEFAULT 0,
    supplier_id  NVARCHAR(50)  NULL
  )`,

  `IF OBJECT_ID(N'spare_part_history', N'U') IS NULL
  CREATE TABLE spare_part_history (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    spare_part_id NVARCHAR(50)  NOT NULL,
    date          NVARCHAR(20)  NOT NULL,
    change_delta  INT           NOT NULL,
    note          NVARCHAR(500) NULL
  )`,

  `IF OBJECT_ID(N'work_orders', N'U') IS NULL
  CREATE TABLE work_orders (
    id               NVARCHAR(50)  NOT NULL PRIMARY KEY,
    title            NVARCHAR(500) NOT NULL,
    asset_id         NVARCHAR(50)  NULL,
    assignee_id      NVARCHAR(50)  NULL,
    status           NVARCHAR(50)  NOT NULL,
    priority         NVARCHAR(50)  NOT NULL,
    category         NVARCHAR(100) NOT NULL,
    due_date         NVARCHAR(20)  NOT NULL,
    description      NVARCHAR(MAX) NULL,
    is_pharma        BIT           NOT NULL DEFAULT 0,
    created_at       NVARCHAR(20)  NOT NULL,
    requester_name   NVARCHAR(200) NULL,
    requester_email  NVARCHAR(200) NULL,
    requester_phone  NVARCHAR(50)  NULL
  )`,

  `IF OBJECT_ID(N'wo_tasks', N'U') IS NULL
  CREATE TABLE wo_tasks (
    id         NVARCHAR(50)  NOT NULL PRIMARY KEY,
    wo_id      NVARCHAR(50)  NOT NULL,
    text       NVARCHAR(MAX) NOT NULL,
    done       BIT           NOT NULL DEFAULT 0,
    sort_order INT           NOT NULL DEFAULT 0
  )`,

  `IF OBJECT_ID(N'wo_comments', N'U') IS NULL
  CREATE TABLE wo_comments (
    id         NVARCHAR(50)  NOT NULL PRIMARY KEY,
    wo_id      NVARCHAR(50)  NOT NULL,
    user_id    NVARCHAR(50)  NOT NULL,
    text       NVARCHAR(MAX) NOT NULL,
    created_at NVARCHAR(20)  NOT NULL
  )`,

  `IF OBJECT_ID(N'wo_time_log', N'U') IS NULL
  CREATE TABLE wo_time_log (
    id      NVARCHAR(50)  NOT NULL PRIMARY KEY,
    wo_id   NVARCHAR(50)  NOT NULL,
    user_id NVARCHAR(50)  NOT NULL,
    hours   DECIMAL(5,2)  NOT NULL,
    note    NVARCHAR(500) NULL,
    date    NVARCHAR(20)  NOT NULL
  )`,

  `IF OBJECT_ID(N'wo_spare_parts_usage', N'U') IS NULL
  CREATE TABLE wo_spare_parts_usage (
    id            NVARCHAR(50) NOT NULL PRIMARY KEY,
    wo_id         NVARCHAR(50) NOT NULL,
    spare_part_id NVARCHAR(50) NOT NULL,
    quantity      INT          NOT NULL
  )`,

  `IF OBJECT_ID(N'wo_history', N'U') IS NULL
  CREATE TABLE wo_history (
    id        NVARCHAR(50)  NOT NULL PRIMARY KEY,
    wo_id     NVARCHAR(50)  NOT NULL,
    field     NVARCHAR(100) NOT NULL,
    old_value NVARCHAR(500) NULL,
    new_value NVARCHAR(500) NULL,
    user_id   NVARCHAR(50)  NOT NULL,
    date      NVARCHAR(20)  NOT NULL
  )`,

  `IF OBJECT_ID(N'pm_tasks', N'U') IS NULL
  CREATE TABLE pm_tasks (
    id              NVARCHAR(50)  NOT NULL PRIMARY KEY,
    title           NVARCHAR(500) NOT NULL,
    interval_type   NVARCHAR(100) NOT NULL,
    frequency_days  INT           NOT NULL DEFAULT 30,
    frequency_label NVARCHAR(100) NULL,
    last_done       NVARCHAR(20)  NULL,
    next_due        NVARCHAR(20)  NOT NULL,
    status          NVARCHAR(50)  NOT NULL DEFAULT 'Kommende',
    estimated_hours DECIMAL(5,2)  NOT NULL DEFAULT 0,
    assignee_id     NVARCHAR(50)  NULL,
    is_pharma       BIT           NOT NULL DEFAULT 0
  )`,

  `IF OBJECT_ID(N'pm_task_assets', N'U') IS NULL
  CREATE TABLE pm_task_assets (
    pm_id    NVARCHAR(50) NOT NULL,
    asset_id NVARCHAR(50) NOT NULL,
    PRIMARY KEY (pm_id, asset_id)
  )`,

  `IF OBJECT_ID(N'pm_task_steps', N'U') IS NULL
  CREATE TABLE pm_task_steps (
    id         NVARCHAR(50)  NOT NULL PRIMARY KEY,
    pm_id      NVARCHAR(50)  NOT NULL,
    text       NVARCHAR(MAX) NOT NULL,
    done       BIT           NOT NULL DEFAULT 0,
    sort_order INT           NOT NULL DEFAULT 0
  )`,

  `IF OBJECT_ID(N'log_entries', N'U') IS NULL
  CREATE TABLE log_entries (
    id         NVARCHAR(50)  NOT NULL PRIMARY KEY,
    type       NVARCHAR(50)  NOT NULL,
    severity   NVARCHAR(50)  NOT NULL,
    text       NVARCHAR(MAX) NOT NULL,
    follow_up  BIT           NOT NULL DEFAULT 0,
    created_at NVARCHAR(20)  NOT NULL,
    user_id    NVARCHAR(50)  NOT NULL,
    tags       NVARCHAR(MAX) NULL
  )`,

  `IF OBJECT_ID(N'log_entry_assets', N'U') IS NULL
  CREATE TABLE log_entry_assets (
    log_id   NVARCHAR(50) NOT NULL,
    asset_id NVARCHAR(50) NOT NULL,
    PRIMARY KEY (log_id, asset_id)
  )`,

  `IF OBJECT_ID(N'audit_log', N'U') IS NULL
  CREATE TABLE audit_log (
    id          NVARCHAR(50)  NOT NULL PRIMARY KEY,
    timestamp   NVARCHAR(50)  NOT NULL,
    user_id     NVARCHAR(50)  NOT NULL,
    action      NVARCHAR(100) NOT NULL,
    entity_type NVARCHAR(100) NOT NULL,
    entity_id   NVARCHAR(50)  NOT NULL,
    entity_name NVARCHAR(500) NULL,
    details     NVARCHAR(MAX) NULL
  )`,

  `IF OBJECT_ID(N'app_settings', N'U') IS NULL
  CREATE TABLE app_settings (
    id                    INT  NOT NULL DEFAULT 1 PRIMARY KEY,
    dark_mode             BIT  NOT NULL DEFAULT 0,
    pharma_mode           BIT  NOT NULL DEFAULT 1,
    notif_overdue_wo      BIT  NOT NULL DEFAULT 1,
    notif_new_requests    BIT  NOT NULL DEFAULT 1,
    notif_low_stock       BIT  NOT NULL DEFAULT 1,
    notif_empty_stock     BIT  NOT NULL DEFAULT 1,
    notif_overdue_pm      BIT  NOT NULL DEFAULT 1,
    notif_open_deviations BIT  NOT NULL DEFAULT 1,
    notif_overdue_capa    BIT  NOT NULL DEFAULT 1,
    notif_pending_changes BIT  NOT NULL DEFAULT 1
  )`,

  `IF NOT EXISTS (SELECT 1 FROM app_settings WHERE id = 1)
  INSERT INTO app_settings (id) VALUES (1)`,

  `IF OBJECT_ID(N'company_settings', N'U') IS NULL
  CREATE TABLE company_settings (
    id           INT           NOT NULL DEFAULT 1 PRIMARY KEY,
    name         NVARCHAR(200) NOT NULL DEFAULT 'MaintainIQ',
    logo         NVARCHAR(MAX) NULL,
    logo_on_print BIT          NOT NULL DEFAULT 1,
    logo_on_qr   BIT           NOT NULL DEFAULT 0,
    address      NVARCHAR(500) NULL,
    city         NVARCHAR(200) NULL,
    zip          NVARCHAR(20)  NULL,
    country      NVARCHAR(100) NULL,
    phone        NVARCHAR(50)  NULL,
    email        NVARCHAR(200) NULL,
    vat_number   NVARCHAR(50)  NULL,
    website      NVARCHAR(200) NULL
  )`,

  `IF NOT EXISTS (SELECT 1 FROM company_settings WHERE id = 1)
  INSERT INTO company_settings (id, name) VALUES (1, 'Horsens Pharma A/S')`,

  `IF OBJECT_ID(N'widget_configs', N'U') IS NULL
  CREATE TABLE widget_configs (
    id           NVARCHAR(50) NOT NULL PRIMARY KEY,
    display_type NVARCHAR(50) NOT NULL DEFAULT 'count'
  )`,

  `IF OBJECT_ID(N'lookup_tables', N'U') IS NULL
  CREATE TABLE lookup_tables (
    id          NVARCHAR(50)  NOT NULL PRIMARY KEY,
    key_name    NVARCHAR(100) NOT NULL,
    name        NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX) NULL
  )`,

  `IF OBJECT_ID(N'lookup_items', N'U') IS NULL
  CREATE TABLE lookup_items (
    id          NVARCHAR(50)  NOT NULL PRIMARY KEY,
    table_id    NVARCHAR(50)  NOT NULL,
    name        NVARCHAR(200) NOT NULL,
    color       NVARCHAR(50)  NULL,
    sort_order  INT           NOT NULL DEFAULT 0,
    is_system   BIT           NOT NULL DEFAULT 0,
    description NVARCHAR(MAX) NULL
  )`,

  `IF OBJECT_ID(N'deviations', N'U') IS NULL
  CREATE TABLE deviations (
    id          NVARCHAR(50)  NOT NULL PRIMARY KEY,
    title       NVARCHAR(500) NOT NULL,
    type        NVARCHAR(100) NOT NULL,
    severity    NVARCHAR(50)  NOT NULL,
    status      NVARCHAR(100) NOT NULL,
    reported_by NVARCHAR(200) NOT NULL,
    reported_at NVARCHAR(20)  NOT NULL,
    asset_name  NVARCHAR(500) NULL,
    description NVARCHAR(MAX) NULL,
    root_cause  NVARCHAR(MAX) NULL
  )`,

  `IF OBJECT_ID(N'deviation_capa_links', N'U') IS NULL
  CREATE TABLE deviation_capa_links (
    deviation_id NVARCHAR(50) NOT NULL,
    capa_id      NVARCHAR(50) NOT NULL,
    PRIMARY KEY (deviation_id, capa_id)
  )`,

  `IF OBJECT_ID(N'capa_records', N'U') IS NULL
  CREATE TABLE capa_records (
    id           NVARCHAR(50)  NOT NULL PRIMARY KEY,
    title        NVARCHAR(500) NOT NULL,
    type         NVARCHAR(100) NOT NULL,
    deviation_id NVARCHAR(50)  NULL,
    assignee     NVARCHAR(200) NOT NULL,
    due_date     NVARCHAR(20)  NOT NULL,
    status       NVARCHAR(100) NOT NULL,
    description  NVARCHAR(MAX) NULL,
    completed_at NVARCHAR(20)  NULL
  )`,

  `IF OBJECT_ID(N'capa_actions', N'U') IS NULL
  CREATE TABLE capa_actions (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    capa_id    NVARCHAR(50)  NOT NULL,
    text       NVARCHAR(MAX) NOT NULL,
    done       BIT           NOT NULL DEFAULT 0,
    sort_order INT           NOT NULL DEFAULT 0
  )`,

  `IF OBJECT_ID(N'change_requests', N'U') IS NULL
  CREATE TABLE change_requests (
    id                NVARCHAR(50)  NOT NULL PRIMARY KEY,
    title             NVARCHAR(500) NOT NULL,
    type              NVARCHAR(100) NOT NULL,
    priority          NVARCHAR(50)  NOT NULL,
    status            NVARCHAR(100) NOT NULL,
    requested_by      NVARCHAR(200) NOT NULL,
    requested_at      NVARCHAR(20)  NOT NULL,
    target_date       NVARCHAR(20)  NOT NULL,
    description       NVARCHAR(MAX) NULL,
    reason            NVARCHAR(MAX) NULL,
    impact_assessment NVARCHAR(MAX) NULL,
    approved_by       NVARCHAR(200) NULL,
    approved_at       NVARCHAR(20)  NULL,
    implemented_at    NVARCHAR(20)  NULL,
    verified_at       NVARCHAR(20)  NULL
  )`,

  `IF OBJECT_ID(N'change_affected_assets', N'U') IS NULL
  CREATE TABLE change_affected_assets (
    change_id  NVARCHAR(50)  NOT NULL,
    asset_code NVARCHAR(100) NOT NULL,
    PRIMARY KEY (change_id, asset_code)
  )`,

  `IF OBJECT_ID(N'change_affected_sops', N'U') IS NULL
  CREATE TABLE change_affected_sops (
    change_id NVARCHAR(50)  NOT NULL,
    sop_code  NVARCHAR(100) NOT NULL,
    PRIMARY KEY (change_id, sop_code)
  )`,
]
