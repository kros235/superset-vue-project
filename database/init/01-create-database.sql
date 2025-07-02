-- database/init/01-create-database.sql
CREATE DATABASE IF NOT EXISTS sample_dashboard;
USE sample_dashboard;

-- 1. 사용자 테이블
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    department VARCHAR(50),
    hire_date DATE,
    salary DECIMAL(10,2),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 판매 데이터 테이블
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    quantity INT,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    sale_date DATE,
    region VARCHAR(50),
    salesperson VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 웹사이트 트래픽 테이블
CREATE TABLE web_traffic (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE,
    page_views INT,
    unique_visitors INT,
    bounce_rate DECIMAL(5,2),
    avg_session_duration INT, -- seconds
    traffic_source VARCHAR(50),
    device_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 고객 만족도 테이블
CREATE TABLE customer_satisfaction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_date DATE,
    rating INT, -- 1-5 scale
    category VARCHAR(50),
    feedback TEXT,
    customer_age_group VARCHAR(20),
    response_time_hours INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 샘플 데이터 삽입
INSERT INTO users (username, email, department, hire_date, salary, status) VALUES
('john_doe', 'john@company.com', 'Engineering', '2023-01-15', 75000.00, 'Active'),
('jane_smith', 'jane@company.com', 'Marketing', '2023-02-20', 65000.00, 'Active'),
('mike_wilson', 'mike@company.com', 'Sales', '2023-03-10', 55000.00, 'Active'),
('sarah_brown', 'sarah@company.com', 'HR', '2023-04-05', 60000.00, 'Active'),
('david_jones', 'david@company.com', 'Finance', '2023-05-12', 70000.00, 'Active'),
('lisa_davis', 'lisa@company.com', 'Engineering', '2023-06-18', 80000.00, 'Active'),
('tom_miller', 'tom@company.com', 'Marketing', '2023-07-22', 58000.00, 'Active'),
('amy_taylor', 'amy@company.com', 'Sales', '2023-08-30', 52000.00, 'Active'),
('chris_white', 'chris@company.com', 'Engineering', '2023-09-15', 77000.00, 'Active'),
('emma_clark', 'emma@company.com', 'HR', '2023-10-20', 62000.00, 'Active'),
('alex_martin', 'alex@company.com', 'Finance', '2023-11-25', 68000.00, 'Active'),
('olivia_hall', 'olivia@company.com', 'Marketing', '2023-12-10', 61000.00, 'Active'),
('ryan_young', 'ryan@company.com', 'Sales', '2024-01-08', 54000.00, 'Active'),
('sophia_king', 'sophia@company.com', 'Engineering', '2024-02-14', 79000.00, 'Active'),
('nathan_lee', 'nathan@company.com', 'HR', '2024-03-20', 59000.00, 'Active'),
('grace_adams', 'grace@company.com', 'Finance', '2024-04-25', 72000.00, 'Active'),
('ethan_scott', 'ethan@company.com', 'Marketing', '2024-05-30', 63000.00, 'Active'),
('chloe_green', 'chloe@company.com', 'Sales', '2024-06-15', 56000.00, 'Active'),
('lucas_hill', 'lucas@company.com', 'Engineering', '2024-07-10', 81000.00, 'Active'),
('mia_baker', 'mia@company.com', 'HR', '2024-08-05', 61000.00, 'Active'),
('jacob_nelson', 'jacob@company.com', 'Finance', '2024-09-12', 69000.00, 'Active'),
('ava_carter', 'ava@company.com', 'Marketing', '2024-10-18', 64000.00, 'Active'),
('william_perez', 'william@company.com', 'Sales', '2024-11-22', 57000.00, 'Active'),
('isabella_roberts', 'isabella@company.com', 'Engineering', '2024-12-01', 83000.00, 'Active'),
('mason_turner', 'mason@company.com', 'HR', '2024-12-15', 58000.00, 'Active'),
('charlotte_phillips', 'charlotte@company.com', 'Finance', '2025-01-10', 71000.00, 'Active'),
('james_campbell', 'james@company.com', 'Marketing', '2025-02-05', 66000.00, 'Active'),
('harper_parker', 'harper@company.com', 'Sales', '2025-03-12', 55000.00, 'Active'),
('benjamin_evans', 'benjamin@company.com', 'Engineering', '2025-04-18', 78000.00, 'Active'),
('evelyn_edwards', 'evelyn@company.com', 'HR', '2025-05-25', 63000.00, 'Active');

-- 판매 데이터 샘플 삽입
INSERT INTO sales (product_name, category, quantity, unit_price, total_amount, sale_date, region, salesperson) VALUES
('Laptop Pro', 'Electronics', 5, 1200.00, 6000.00, '2025-01-05', 'North', 'mike_wilson'),
('Wireless Mouse', 'Electronics', 15, 25.00, 375.00, '2025-01-06', 'South', 'amy_taylor'),
('Office Chair', 'Furniture', 8, 150.00, 1200.00, '2025-01-07', 'East', 'ryan_young'),
('Smartphone', 'Electronics', 12, 800.00, 9600.00, '2025-01-08', 'West', 'chloe_green'),
('Desk Lamp', 'Furniture', 20, 35.00, 700.00, '2025-01-09', 'North', 'william_perez'),
('Tablet', 'Electronics', 7, 400.00, 2800.00, '2025-01-10', 'South', 'harper_parker'),
('Bookshelf', 'Furniture', 4, 200.00, 800.00, '2025-01-11', 'East', 'mike_wilson'),
('Headphones', 'Electronics', 25, 80.00, 2000.00, '2025-01-12', 'West', 'amy_taylor'),
('Standing Desk', 'Furniture', 6, 300.00, 1800.00, '2025-01-13', 'North', 'ryan_young'),
('Monitor', 'Electronics', 10, 250.00, 2500.00, '2025-01-14', 'South', 'chloe_green'),
('Coffee Table', 'Furniture', 12, 120.00, 1440.00, '2025-01-15', 'East', 'william_perez'),
('Keyboard', 'Electronics', 18, 45.00, 810.00, '2025-01-16', 'West', 'harper_parker'),
('Filing Cabinet', 'Furniture', 5, 180.00, 900.00, '2025-01-17', 'North', 'mike_wilson'),
('Webcam', 'Electronics', 22, 60.00, 1320.00, '2025-01-18', 'South', 'amy_taylor'),
('Ergonomic Chair', 'Furniture', 9, 220.00, 1980.00, '2025-01-19', 'East', 'ryan_young'),
('Printer', 'Electronics', 3, 150.00, 450.00, '2025-01-20', 'West', 'chloe_green'),
('Side Table', 'Furniture', 14, 80.00, 1120.00, '2025-01-21', 'North', 'william_perez'),
('Speaker', 'Electronics', 16, 90.00, 1440.00, '2025-01-22', 'South', 'harper_parker'),
('Wall Shelf', 'Furniture', 20, 40.00, 800.00, '2025-01-23', 'East', 'mike_wilson'),
('Router', 'Electronics', 8, 70.00, 560.00, '2025-01-24', 'West', 'amy_taylor'),
('Dining Table', 'Furniture', 2, 400.00, 800.00, '2025-01-25', 'North', 'ryan_young'),
('Gaming Console', 'Electronics', 6, 500.00, 3000.00, '2025-01-26', 'South', 'chloe_green'),
('Wardrobe', 'Furniture', 3, 350.00, 1050.00, '2025-01-27', 'East', 'william_perez'),
('Smart Watch', 'Electronics', 11, 300.00, 3300.00, '2025-01-28', 'West', 'harper_parker'),
('Sofa', 'Furniture', 1, 800.00, 800.00, '2025-01-29', 'North', 'mike_wilson'),
('External Drive', 'Electronics', 13, 100.00, 1300.00, '2025-01-30', 'South', 'amy_taylor'),
('Bed Frame', 'Furniture', 4, 250.00, 1000.00, '2025-01-31', 'East', 'ryan_young'),
('Projector', 'Electronics', 2, 600.00, 1200.00, '2025-02-01', 'West', 'chloe_green'),
('Nightstand', 'Furniture', 8, 90.00, 720.00, '2025-02-02', 'North', 'william_perez'),
('Tablet Stand', 'Electronics', 17, 30.00, 510.00, '2025-02-03', 'South', 'harper_parker');

-- 웹 트래픽 샘플 데이터 삽입
INSERT INTO web_traffic (date, page_views, unique_visitors, bounce_rate, avg_session_duration, traffic_source, device_type) VALUES
('2025-01-01', 1250, 980, 45.2, 180, 'Organic Search', 'Desktop'),
('2025-01-02', 1380, 1120, 42.8, 195, 'Direct', 'Mobile'),
('2025-01-03', 1420, 1180, 38.5, 220, 'Social Media', 'Desktop'),
('2025-01-04', 1180, 950, 48.3, 165, 'Email', 'Tablet'),
('2025-01-05', 1650, 1350, 35.7, 240, 'Paid Search', 'Mobile'),
('2025-01-06', 1320, 1080, 41.2, 205, 'Organic Search', 'Desktop'),
('2025-01-07', 1540, 1280, 39.8, 215, 'Referral', 'Mobile'),
('2025-01-08', 1720, 1420, 33.4, 250, 'Social Media', 'Desktop'),
('2025-01-09', 1290, 1050, 44.7, 175, 'Direct', 'Tablet'),
('2025-01-10', 1480, 1220, 37.9, 230, 'Email', 'Mobile'),
('2025-01-11', 1620, 1340, 36.2, 235, 'Paid Search', 'Desktop'),
('2025-01-12', 1350, 1100, 43.1, 190, 'Organic Search', 'Mobile'),
('2025-01-13', 1580, 1300, 38.6, 210, 'Referral', 'Desktop'),
('2025-01-14', 1450, 1180, 40.3, 200, 'Social Media', 'Tablet'),
('2025-01-15', 1680, 1380, 34.8, 245, 'Direct', 'Mobile'),
('2025-01-16', 1520, 1250, 39.1, 220, 'Email', 'Desktop'),
('2025-01-17', 1720, 1420, 33.7, 255, 'Paid Search', 'Mobile'),
('2025-01-18', 1380, 1130, 42.4, 185, 'Organic Search', 'Desktop'),
('2025-01-19', 1640, 1350, 36.5, 240, 'Referral', 'Tablet'),
('2025-01-20', 1550, 1280, 38.2, 225, 'Social Media', 'Mobile'),
('2025-01-21', 1720, 1420, 33.9, 250, 'Direct', 'Desktop'),
('2025-01-22', 1430, 1170, 41.6, 195, 'Email', 'Mobile'),
('2025-01-23', 1590, 1310, 37.4, 235, 'Paid Search', 'Desktop'),
('2025-01-24', 1670, 1380, 35.1, 245, 'Organic Search', 'Tablet'),
('2025-01-25', 1510, 1240, 39.7, 215, 'Referral', 'Mobile'),
('2025-01-26', 1620, 1340, 36.8, 240, 'Social Media', 'Desktop'),
('2025-01-27', 1480, 1210, 40.2, 205, 'Direct', 'Mobile'),
('2025-01-28', 1750, 1450, 32.6, 260, 'Email', 'Desktop'),
('2025-01-29', 1580, 1300, 38.3, 230, 'Paid Search', 'Tablet'),
('2025-01-30', 1690, 1390, 34.7, 250, 'Organic Search', 'Mobile');

-- 고객 만족도 샘플 데이터 삽입
INSERT INTO customer_satisfaction (survey_date, rating, category, feedback, customer_age_group, response_time_hours) VALUES
('2025-01-01', 4, 'Product Quality', 'Very satisfied with the build quality', '25-34', 2),
('2025-01-02', 5, 'Customer Service', 'Excellent support team', '35-44', 1),
('2025-01-03', 3, 'Shipping', 'Delivery was slower than expected', '18-24', 48),
('2025-01-04', 4, 'Product Quality', 'Good value for money', '45-54', 4),
('2025-01-05', 5, 'User Experience', 'Interface is very intuitive', '25-34', 2),
('2025-01-06', 2, 'Customer Service', 'Long wait time for response', '35-44', 72),
('2025-01-07', 4, 'Shipping', 'Package arrived in good condition', '18-24', 6),
('2025-01-08', 5, 'Product Quality', 'Exceeded my expectations', '55+', 1),
('2025-01-09', 3, 'User Experience', 'Some features are confusing', '25-34', 24),
('2025-01-10', 4, 'Customer Service', 'Helpful and professional', '35-44', 3),
('2025-01-11', 5, 'Shipping', 'Fast and reliable delivery', '45-54', 1),
('2025-01-12', 4, 'Product Quality', 'Good quality materials', '18-24', 5),
('2025-01-13', 3, 'User Experience', 'Could be more user-friendly', '25-34', 36),
('2025-01-14', 5, 'Customer Service', 'Quick resolution of issues', '35-44', 2),
('2025-01-15', 4, 'Shipping', 'Well packaged and secure', '55+', 4),
('2025-01-16', 2, 'Product Quality', 'Not as described', '18-24', 96),
('2025-01-17', 5, 'User Experience', 'Love the new features', '25-34', 1),
('2025-01-18', 4, 'Customer Service', 'Knowledgeable staff', '45-54', 3),
('2025-01-19', 3, 'Shipping', 'Packaging could be improved', '35-44', 18),
('2025-01-20', 5, 'Product Quality', 'Outstanding performance', '25-34', 1),
('2025-01-21', 4, 'User Experience', 'Easy to use and navigate', '18-24', 4),
('2025-01-22', 3, 'Customer Service', 'Average response time', '55+', 48),
('2025-01-23', 5, 'Shipping', 'Arrived ahead of schedule', '35-44', 2),
('2025-01-24', 4, 'Product Quality', 'Solid construction', '25-34', 3),
('2025-01-25', 2, 'User Experience', 'Too many bugs', '45-54', 120),
('2025-01-26', 5, 'Customer Service', 'Went above and beyond', '18-24', 1),
('2025-01-27', 4, 'Shipping', 'Good tracking information', '35-44', 6),
('2025-01-28', 3, 'Product Quality', 'Decent but not great', '25-34', 24),
('2025-01-29', 5, 'User Experience', 'Perfect for my needs', '55+', 2),
('2025-01-30', 4, 'Customer Service', 'Friendly and helpful', '45-54', 4);
