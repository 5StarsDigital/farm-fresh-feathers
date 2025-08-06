-- Clear all user data to reset for new service package system
-- Delete in order to respect foreign key constraints

-- Clear all user-related data
DELETE FROM user_accessories;
DELETE FROM user_chickens;
DELETE FROM eggs_inventory;
DELETE FROM transactions;
DELETE FROM service_packages;
DELETE FROM farm_rentals;
DELETE FROM payment_transactions;
DELETE FROM admin_activities;

-- Reset farm balances to 0
UPDATE farms SET account_balance = 0.00;

-- Clear processed transactions
DELETE FROM processed_transactions;