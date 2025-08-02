-- Seed API Providers
INSERT INTO api_providers (id, name, display_name, description, base_url, status, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'openai', 'OpenAI', 'OpenAI API for GPT models, embeddings, and more', 'https://api.openai.com/v1', 'active', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'openrouter', 'OpenRouter', 'Unified API gateway for multiple AI models', 'https://openrouter.ai/api/v1', 'active', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'exa', 'Exa API', 'Neural search API for web data', 'https://api.exa.ai', 'active', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'twilio', 'Twilio', 'Communication API for SMS, voice, and email', 'https://api.twilio.com', 'active', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'apollo', 'Apollo', 'Lead generation and sales intelligence platform', 'https://api.apollo.io/v1', 'active', NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  base_url = EXCLUDED.base_url,
  status = EXCLUDED.status,
  updated_at = NOW();