-- database/init/02-add-preset-tables.sql
-- 🔥 데이터셋 프리셋 기능을 위한 테이블 추가

USE sample_dashboard;

-- ===== 1️⃣ 프리셋 메타 정보 테이블 =====
CREATE TABLE IF NOT EXISTS chart_presets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dataset_id INT NOT NULL COMMENT '데이터셋 ID (Superset dataset.id)',
    preset_name VARCHAR(200) NOT NULL COMMENT '프리셋 이름',
    preset_description TEXT COMMENT '프리셋 설명',
    chart_type VARCHAR(50) NOT NULL COMMENT '차트 타입 (pie, bar, line 등)',
    use_count INT DEFAULT 0 COMMENT '사용 횟수',
    is_active TINYINT(1) DEFAULT 1 COMMENT '활성화 여부',
    created_by VARCHAR(100) COMMENT '생성자',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dataset_id (dataset_id),
    INDEX idx_chart_type (chart_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='차트 프리셋 메타 정보 테이블';

-- ===== 2️⃣ 프리셋 상세 설정 테이블 =====
CREATE TABLE IF NOT EXISTS preset_configurations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    preset_id INT NOT NULL COMMENT '프리셋 ID (chart_presets.id)',
    config_key VARCHAR(100) NOT NULL COMMENT '설정 키 (metrics, groupby, color_scheme 등)',
    config_value TEXT NOT NULL COMMENT '설정 값 (JSON 형식)',
    config_type VARCHAR(50) NOT NULL COMMENT '설정 타입 (array, string, number 등)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (preset_id) REFERENCES chart_presets(id) ON DELETE CASCADE,
    INDEX idx_preset_id (preset_id),
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='프리셋 상세 설정 정보 테이블';

-- ===== 3️⃣ 프리셋 사용 이력 테이블 =====
CREATE TABLE IF NOT EXISTS preset_usage_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    preset_id INT NOT NULL COMMENT '프리셋 ID',
    user_name VARCHAR(100) COMMENT '사용자명',
    chart_id INT COMMENT '생성된 차트 ID',
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (preset_id) REFERENCES chart_presets(id) ON DELETE CASCADE,
    INDEX idx_preset_id (preset_id),
    INDEX idx_used_at (used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='프리셋 사용 이력 테이블';

-- 확인 쿼리
SELECT '✅ 프리셋 테이블 생성 완료!' as status;
SHOW TABLES LIKE '%preset%';