-- Add new chicken categories to enum
ALTER TYPE chicken_category ADD VALUE 'royal' AFTER 'meat';
ALTER TYPE chicken_category ADD VALUE 'other' AFTER 'royal';