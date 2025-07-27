-- database/init/01-create-database.sql
-- 권한 분리를 위한 데이터베이스 스키마 및 샘플 데이터

USE sample_dashboard;

-- 기존 테이블이 있다면 삭제
DROP TABLE IF EXISTS employee_data;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS web_traffic;
DROP TABLE IF EXISTS customer_satisfaction;

-- 직원 데이터 테이블 (권한 분리용)
CREATE TABLE employee_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    company VARCHAR(100) NOT NULL,
    team VARCHAR(100) NOT NULL,
    position VARCHAR(50) NOT NULL, -- 책임, 선임, 전임
    salary DECIMAL(15,2), -- 15자리로 증가하여 더 큰 급여 값 허용
    join_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 영업 데이터 테이블
CREATE TABLE sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sale_date DATE NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    salesperson VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    customer_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 웹 트래픽 데이터 테이블
CREATE TABLE web_traffic (
    id INT PRIMARY KEY AUTO_INCREMENT,
    visit_date DATE NOT NULL,
    unique_visitors INT NOT NULL,
    page_views INT NOT NULL,
    bounce_rate DECIMAL(5,2) NOT NULL,
    session_duration DECIMAL(8,2) NOT NULL,
    traffic_source VARCHAR(50) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 고객 만족도 데이터 테이블
CREATE TABLE customer_satisfaction (
    id INT PRIMARY KEY AUTO_INCREMENT,
    survey_date DATE NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    category VARCHAR(50) NOT NULL,
    feedback TEXT,
    customer_age_group VARCHAR(30) NOT NULL,
    response_time_hours INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 직원 데이터 삽입 (KT DS와 알앤비소프트)
INSERT INTO employee_data (name, email, company, team, position, salary, join_date, status) VALUES
-- KT DS 직원들 (급여를 현실적인 수준으로 조정)
('김회장', 'ceo@ktds.com', 'KT DS', '경영진', '회장', 15000000, '2010-01-01', 'active'),
('박CRM팀장', 'crm.manager@ktds.com', 'KT DS', 'CRM서비스팀', '책임', 8500000, '2015-03-15', 'active'),
('이선임개발자', 'senior.dev1@ktds.com', 'KT DS', 'CRM서비스팀', '선임', 6500000, '2018-06-01', 'active'),
('최전임개발자', 'junior.dev1@ktds.com', 'KT DS', 'CRM서비스팀', '전임', 4500000, '2021-09-01', 'active'),
('정선임분석가', 'analyst1@ktds.com', 'KT DS', 'CRM서비스팀', '선임', 6200000, '2019-02-14', 'active'),
('김전임마케터', 'marketer1@ktds.com', 'KT DS', 'CRM서비스팀', '전임', 4200000, '2022-05-01', 'active'),
('송책임기획자', 'planner1@ktds.com', 'KT DS', '데이터전략팀', '책임', 7800000, '2016-11-20', 'active'),
('윤선임엔지니어', 'engineer1@ktds.com', 'KT DS', '데이터전략팀', '선임', 6800000, '2017-08-10', 'active'),
('장전임디자이너', 'designer1@ktds.com', 'KT DS', '데이터전략팀', '전임', 4400000, '2021-12-01', 'active'),
('한선임컨설턴트', 'consultant1@ktds.com', 'KT DS', '비즈니스팀', '선임', 6600000, '2018-04-25', 'active'),
('조전임영업사원', 'sales1@ktds.com', 'KT DS', '비즈니스팀', '전임', 4100000, '2022-08-15', 'active'),
('강책임운영자', 'operator1@ktds.com', 'KT DS', '운영팀', '책임', 7200000, '2017-01-12', 'active'),
('오선임운영자', 'operator2@ktds.com', 'KT DS', '운영팀', '선임', 5800000, '2019-10-30', 'active'),
('신전임운영자', 'operator3@ktds.com', 'KT DS', '운영팀', '전임', 4000000, '2023-01-10', 'active'),
('문선임보안담당', 'security1@ktds.com', 'KT DS', '보안팀', '선임', 7000000, '2018-12-05', 'active'),

-- 알앤비소프트 직원들
('김알앤비이사', 'director@rnbsoft.com', '알앤비소프트', '개발팀', '이사', 12000000, '2012-03-01', 'active'),
('박선임개발자', 'senior.dev@rnbsoft.com', '알앤비소프트', '개발팀', '선임', 7200000, '2017-05-15', 'active'),
('이전임개발자', 'junior.dev@rnbsoft.com', '알앤비소프트', '개발팀', '전임', 4800000, '2020-09-01', 'active'),
('최책임QA', 'qa.lead@rnbsoft.com', '알앤비소프트', 'QA팀', '책임', 6800000, '2016-08-20', 'active'),
('정선임QA', 'qa.senior@rnbsoft.com', '알앤비소프트', 'QA팀', '선임', 5500000, '2019-03-10', 'active'),
('김전임QA', 'qa.junior@rnbsoft.com', '알앤비소프트', 'QA팀', '전임', 3800000, '2022-11-01', 'active'),
('송책임기획자', 'pm.lead@rnbsoft.com', '알앤비소프트', '기획팀', '책임', 7500000, '2015-07-14', 'active'),
('윤선임기획자', 'pm.senior@rnbsoft.com', '알앤비소프트', '기획팀', '선임', 6000000, '2018-11-25', 'active'),
('장전임기획자', 'pm.junior@rnbsoft.com', '알앤비소프트', '기획팀', '전임', 4200000, '2021-06-18', 'active'),
('한선임영업사원', 'sales.senior@rnbsoft.com', '알앤비소프트', '영업팀', '선임', 5800000, '2019-01-08', 'active'),
('조전임영업사원', 'sales.junior@rnbsoft.com', '알앤비소프트', '영업팀', '전임', 3900000, '2022-04-01', 'active'),
('강책임운영자', 'ops.lead@rnbsoft.com', '알앤비소프트', '운영팀', '책임', 6900000, '2016-12-03', 'active'),
('오선임운영자', 'ops.senior@rnbsoft.com', '알앤비소프트', '운영팀', '선임', 5400000, '2019-08-14', 'active'),
('신전임운영자', 'ops.junior@rnbsoft.com', '알앤비소프트', '운영팀', '전임', 3700000, '2023-02-20', 'active'),
('문선임회계담당', 'accounting@rnbsoft.com', '알앤비소프트', '관리팀', '선임', 5200000, '2018-10-12', 'active');

-- 영업 데이터 삽입 (기본 샘플)
INSERT INTO sales (sale_date, product_name, quantity, unit_price, total_amount, salesperson, region, customer_type) VALUES
('2024-01-15', 'CRM 솔루션 Pro', 5, 2000000, 10000000, '김영업1', '서울', '대기업'),
('2024-01-20', 'ERP 시스템', 3, 5000000, 15000000, '박영업2', '경기', '중견기업'),
('2024-01-25', '데이터 분석 플랫폼', 2, 8000000, 16000000, '이영업3', '부산', '대기업'),
('2024-02-01', '모바일 앱 개발', 1, 12000000, 12000000, '최영업4', '대구', '스타트업'),
('2024-02-05', 'AI 챗봇 솔루션', 4, 3000000, 12000000, '정영업5', '서울', '중소기업'),
('2024-02-10', '클라우드 인프라', 6, 1500000, 9000000, '김영업1', '인천', '중견기업'),
('2024-02-15', '보안 솔루션', 2, 7000000, 14000000, '박영업2', '광주', '대기업'),
('2024-02-20', 'BI 도구', 3, 4000000, 12000000, '이영업3', '대전', '중소기업'),
('2024-02-25', '웹 개발 서비스', 1, 8000000, 8000000, '최영업4', '울산', '스타트업'),
('2024-03-01', '데이터베이스 최적화', 2, 6000000, 12000000, '정영업5', '서울', '대기업'),
('2024-03-05', 'IoT 플랫폼', 5, 2500000, 12500000, '김영업1', '경기', '중견기업'),
('2024-03-10', '블록체인 솔루션', 1, 15000000, 15000000, '박영업2', '부산', '대기업'),
('2024-03-15', '머신러닝 모델', 3, 5500000, 16500000, '이영업3', '대구', '중소기업'),
('2024-03-20', 'VR/AR 앱', 2, 9000000, 18000000, '최영업4', '서울', '스타트업'),
('2024-03-25', '디지털 트윈', 1, 20000000, 20000000, '정영업5', '인천', '대기업'),
('2024-04-01', '자동화 솔루션', 4, 3500000, 14000000, '김영업1', '광주', '중견기업'),
('2024-04-05', '예측 분석 도구', 2, 7500000, 15000000, '박영업2', '대전', '중소기업'),
('2024-04-10', '소셜 미디어 분석', 3, 4500000, 13500000, '이영업3', '울산', '스타트업'),
('2024-04-15', '음성 인식 시스템', 1, 11000000, 11000000, '최영업4', '서울', '대기업'),
('2024-04-20', '추천 엔진', 5, 2800000, 14000000, '정영업5', '경기', '중견기업'),
('2024-04-25', '실시간 모니터링', 2, 6500000, 13000000, '김영업1', '부산', '중소기업'),
('2024-05-01', '컴퓨터 비전', 1, 13000000, 13000000, '박영업2', '대구', '스타트업'),
('2024-05-05', '자연어 처리', 3, 5000000, 15000000, '이영업3', '서울', '대기업'),
('2024-05-10', '엣지 컴퓨팅', 4, 3200000, 12800000, '최영업4', '인천', '중견기업'),
('2024-05-15', '양자 컴퓨팅', 1, 25000000, 25000000, '정영업5', '광주', '대기업'),
('2024-05-20', 'NFT 플랫폼', 2, 8500000, 17000000, '김영업1', '대전', '스타트업'),
('2024-05-25', '메타버스 솔루션', 3, 6000000, 18000000, '박영업2', '울산', '중소기업'),
('2024-06-01', '디지털 마케팅', 5, 2200000, 11000000, '이영업3', '서울', '중견기업'),
('2024-06-05', '로보틱스 제어', 1, 18000000, 18000000, '최영업4', '경기', '대기업'),
('2024-06-10', '스마트 팩토리', 2, 12000000, 24000000, '정영업5', '부산', '대기업');

-- 웹 트래픽 데이터 삽입 (기본 샘플)
INSERT INTO web_traffic (visit_date, unique_visitors, page_views, bounce_rate, session_duration, traffic_source, device_type) VALUES
('2024-01-01', 1250, 3200, 45.2, 185.5, 'Organic Search', 'Desktop'),
('2024-01-02', 980, 2100, 52.1, 142.3, 'Direct', 'Mobile'),
('2024-01-03', 1450, 4100, 38.9, 220.1, 'Social Media', 'Desktop'),
('2024-01-04', 1100, 2800, 48.5, 165.8, 'Paid Search', 'Tablet'),
('2024-01-05', 1350, 3500, 42.3, 195.2, 'Email', 'Mobile'),
('2024-01-06', 890, 1900, 55.7, 125.4, 'Referral', 'Desktop'),
('2024-01-07', 1600, 4800, 35.1, 245.6, 'Organic Search', 'Mobile'),
('2024-01-08', 1200, 3100, 46.8, 178.9, 'Direct', 'Desktop'),
('2024-01-09', 1050, 2400, 50.2, 155.7, 'Social Media', 'Tablet'),
('2024-01-10', 1380, 3700, 41.6, 202.3, 'Paid Search', 'Mobile'),
('2024-01-11', 1150, 2900, 47.9, 168.5, 'Email', 'Desktop'),
('2024-01-12', 920, 2000, 54.3, 138.2, 'Referral', 'Mobile'),
('2024-01-13', 1520, 4300, 37.4, 235.8, 'Organic Search', 'Desktop'),
('2024-01-14', 1280, 3300, 44.7, 188.6, 'Direct', 'Tablet'),
('2024-01-15', 1080, 2600, 49.1, 159.3, 'Social Media', 'Mobile'),
('2024-01-16', 1420, 3900, 40.2, 210.7, 'Paid Search', 'Desktop'),
('2024-01-17', 1180, 3000, 46.5, 172.4, 'Email', 'Mobile'),
('2024-01-18', 950, 2200, 53.6, 145.1, 'Referral', 'Tablet'),
('2024-01-19', 1550, 4500, 36.8, 248.3, 'Organic Search', 'Desktop'),
('2024-01-20', 1320, 3400, 43.9, 192.5, 'Direct', 'Mobile'),
('2024-01-21', 1090, 2700, 48.8, 162.8, 'Social Media', 'Desktop'),
('2024-01-22', 1460, 4000, 39.5, 215.9, 'Paid Search', 'Tablet'),
('2024-01-23', 1210, 3200, 45.8, 182.1, 'Email', 'Mobile'),
('2024-01-24', 980, 2300, 52.4, 148.7, 'Referral', 'Desktop'),
('2024-01-25', 1580, 4600, 35.7, 252.6, 'Organic Search', 'Mobile'),
('2024-01-26', 1340, 3600, 42.1, 198.4, 'Direct', 'Desktop'),
('2024-01-27', 1120, 2800, 47.3, 166.2, 'Social Media', 'Tablet'),
('2024-01-28', 1480, 4100, 38.6, 225.8, 'Paid Search', 'Mobile'),
('2024-01-29', 1230, 3100, 44.2, 185.3, 'Email', 'Desktop'),
('2024-01-30', 1010, 2500, 51.9, 152.6, 'Referral', 'Mobile');

-- 고객 만족도 데이터 삽입 (기본 샘플)
INSERT INTO customer_satisfaction (survey_date, rating, category, feedback, customer_age_group, response_time_hours) VALUES
('2024-01-15', 5, '제품 품질', '매우 만족합니다. 기대 이상의 성능입니다.', '30-39', 24),
('2024-01-16', 4, '고객 서비스', '친절하고 빠른 응답이 좋았습니다.', '40-49', 12),
('2024-01-17', 3, '배송 서비스', '배송이 조금 늦었지만 제품은 만족합니다.', '20-29', 48),
('2024-01-18', 5, '사용 편의성', '사용하기 매우 쉽고 직관적입니다.', '50-59', 6),
('2024-01-19', 2, '가격 대비 성능', '가격에 비해 성능이 아쉽습니다.', '30-39', 72),
('2024-01-20', 4, '제품 품질', '전반적으로 만족하지만 개선할 점이 있습니다.', '40-49', 18),
('2024-01-21', 5, '고객 서비스', '문제 해결이 신속하고 정확했습니다.', '20-29', 3),
('2024-01-22', 3, '배송 서비스', '포장이 꼼꼼하지만 배송 추적이 어려웠습니다.', '60+', 36),
('2024-01-23', 4, '사용 편의성', '처음엔 어려웠지만 익숙해지니 좋습니다.', '30-39', 24),
('2024-01-24', 1, '가격 대비 성능', '너무 비싸고 기능도 부족합니다.', '50-59', 96),
('2024-01-25', 5, '제품 품질', '품질이 뛰어나고 내구성이 좋습니다.', '40-49', 12),
('2024-01-26', 4, '고객 서비스', '상담원이 전문적이고 도움이 되었습니다.', '20-29', 8),
('2024-01-27', 3, '배송 서비스', '배송비가 부담스럽지만 안전하게 도착했습니다.', '30-39', 48),
('2024-01-28', 5, '사용 편의성', '메뉴얼이 친절하고 설치가 쉬웠습니다.', '60+', 2),
('2024-01-29', 2, '가격 대비 성능', '경쟁사 대비 가격이 높습니다.', '50-59', 84),
('2024-01-30', 4, '제품 품질', '안정적이고 신뢰할 수 있는 제품입니다.', '40-49', 16),
('2024-02-01', 5, '고객 서비스', 'A/S 서비스가 훌륭합니다.', '30-39', 4),
('2024-02-02', 3, '배송 서비스', '배송 일정 변경 안내가 늦었습니다.', '20-29', 60),
('2024-02-03', 4, '사용 편의성', '인터페이스가 깔끔하고 사용하기 좋습니다.', '50-59', 20),
('2024-02-04', 1, '가격 대비 성능', '기능에 비해 가격이 너무 비쌉니다.', '60+', 120),
('2024-02-05', 5, '제품 품질', '기대했던 것보다 훨씬 좋습니다.', '30-39', 8),
('2024-02-06', 4, '고객 서비스', '친절하고 신속한 응대에 감사합니다.', '40-49', 14),
('2024-02-07', 3, '배송 서비스', '포장재가 친환경적이어서 좋았습니다.', '20-29', 42),
('2024-02-08', 5, '사용 편의성', '초보자도 쉽게 사용할 수 있습니다.', '50-59', 6),
('2024-02-09', 2, '가격 대비 성능', '할인 혜택이 부족합니다.', '30-39', 78),
('2024-02-10', 4, '제품 품질', '견고하고 실용적인 제품입니다.', '60+', 22),
('2024-02-11', 5, '고객 서비스', '문의사항에 대한 답변이 정확했습니다.', '40-49', 5),
('2024-02-12', 3, '배송 서비스', '배송 시간대 선택 옵션이 많아서 좋습니다.', '20-29', 54),
('2024-02-13', 4, '사용 편의성', '업데이트가 자동으로 되어 편리합니다.', '30-39', 18),
('2024-02-14', 5, '가격 대비 성능', '가격 대비 매우 만족스러운 성능입니다.', '50-59', 10);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_employee_company_team ON employee_data(company, team);
CREATE INDEX idx_employee_position ON employee_data(position);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_traffic_date ON web_traffic(visit_date);
CREATE INDEX idx_satisfaction_date ON customer_satisfaction(survey_date);

-- 권한 확인용 뷰 생성
CREATE VIEW v_ktds_all_employees AS
SELECT * FROM employee_data WHERE company = 'KT DS';

CREATE VIEW v_ktds_crm_team AS
SELECT * FROM employee_data WHERE company = 'KT DS' AND team = 'CRM서비스팀';

CREATE VIEW v_rnbsoft_employees AS
SELECT * FROM employee_data WHERE company = '알앤비소프트';

-- 통계 확인 쿼리
SELECT 
    company,
    team,
    position,
    COUNT(*) as employee_count
FROM employee_data 
GROUP BY company, team, position 
ORDER BY company, team, position;

-- 전체 테이블 데이터 수 확인
SELECT 'employee_data' as table_name, COUNT(*) as count FROM employee_data
UNION ALL
SELECT 'sales' as table_name, COUNT(*) as count FROM sales
UNION ALL
SELECT 'web_traffic' as table_name, COUNT(*) as count FROM web_traffic  
UNION ALL
SELECT 'customer_satisfaction' as table_name, COUNT(*) as count FROM customer_satisfaction;

-- 데이터베이스 설정 완료 메시지
SELECT 'Database setup completed successfully! 권한 분리용 데이터베이스가 생성되었습니다.' as status;