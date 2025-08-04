-- Update user balance to 50 million
UPDATE farms 
SET account_balance = 50000000, 
    updated_at = now()
WHERE user_id = auth.uid();

-- Record this as an admin transaction
INSERT INTO transactions (farm_id, transaction_type, amount, description, user_email, user_name)
SELECT f.id, 'deposit', 50000000, 'Điều chỉnh số dư bởi admin - Cập nhật thành 50 triệu', p.email, p.full_name
FROM farms f
JOIN profiles p ON f.user_id = p.id
WHERE f.user_id = auth.uid();